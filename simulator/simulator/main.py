from __future__ import annotations

import asyncio
import json
import logging
import math
import os
import random
from typing import Any

import aiomqtt
import httpx

from simulator.config import RobotConfig, SimConfig

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

EARTH_RADIUS = 6_371_000


def offset_coords(lat: float, lon: float, dx_m: float, dy_m: float) -> tuple[float, float]:
    """Offset lat/lon by dx (east) and dy (north) in meters."""
    new_lat = lat + (dy_m / EARTH_RADIUS) * (180 / math.pi)
    new_lon = lon + (dx_m / (EARTH_RADIUS * math.cos(math.radians(lat)))) * (180 / math.pi)
    return new_lat, new_lon


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance between two lat/lon points in meters."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return EARTH_RADIUS * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def bearing_between(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Bearing from point 1 to point 2 in degrees (0=north, 90=east)."""
    dlon = math.radians(lon2 - lon1)
    y = math.sin(dlon) * math.cos(math.radians(lat2))
    x = math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) - \
        math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dlon)
    return math.degrees(math.atan2(y, x)) % 360


class NavigationMixin:
    """Shared navigation logic for all robot types."""

    target_lat: float | None
    target_lon: float | None
    target_alt: float | None
    navigating: bool
    current_command_id: str | None

    def set_target(self, lat: float, lon: float, alt: float | None = None, command_id: str | None = None) -> None:
        self.target_lat = lat
        self.target_lon = lon
        self.target_alt = alt
        self.navigating = True
        self.current_command_id = command_id

    def clear_target(self) -> None:
        self.target_lat = None
        self.target_lon = None
        self.target_alt = None
        self.navigating = False
        self.current_command_id = None

    def navigate_toward_target(self, dt: float) -> bool:
        """Move toward target. Returns True if target reached."""
        if self.target_lat is None or self.target_lon is None:
            return False

        dist = haversine_distance(self.lat, self.lon, self.target_lat, self.target_lon)
        arrival_threshold = 5.0  # meters

        if dist < arrival_threshold:
            self.lat = self.target_lat
            self.lon = self.target_lon
            if self.target_alt is not None:
                self.alt = self.target_alt
            return True

        # Move toward target
        brng = bearing_between(self.lat, self.lon, self.target_lat, self.target_lon)
        self.heading = brng
        step = min(self.speed * dt, dist)
        dx = step * math.sin(math.radians(brng))
        dy = step * math.cos(math.radians(brng))
        self.lat, self.lon = offset_coords(self.lat, self.lon, dx, dy)

        # Smoothly adjust altitude if target set
        if self.target_alt is not None:
            alt_diff = self.target_alt - self.alt
            alt_step = min(abs(alt_diff), 2.0 * dt)
            self.alt += math.copysign(alt_step, alt_diff)

        return False


class DroneSim(NavigationMixin):
    """Drone: circular patrol at altitude, fast, moderate battery drain."""

    def __init__(self, config: RobotConfig) -> None:
        self.config = config
        self.lat = config.start_lat
        self.lon = config.start_lon
        self.alt = config.start_alt
        self.heading = config.start_heading
        self.speed = config.max_speed
        self.battery = 100.0
        self.signal = 95.0
        self.status = "idle"
        self._angle = random.uniform(0, 2 * math.pi)
        # Navigation
        self.target_lat: float | None = None
        self.target_lon: float | None = None
        self.target_alt: float | None = None
        self.navigating = False
        self.current_command_id: str | None = None
        self._patrolling = True

    def tick(self, dt: float) -> None:
        if self.navigating:
            reached = self.navigate_toward_target(dt)
            if reached:
                self._arrived = True
        elif self._patrolling:
            angular_speed = self.speed / self.config.patrol_radius
            self._angle += angular_speed * dt
            dx = self.config.patrol_radius * math.cos(self._angle)
            dy = self.config.patrol_radius * math.sin(self._angle)
            self.lat, self.lon = offset_coords(self.config.start_lat, self.config.start_lon, dx, dy)
            self.heading = (-math.degrees(self._angle)) % 360
            self.alt = self.config.start_alt + 3 * math.sin(self._angle * 2)

        # Battery cycles: drain normally, recharge when low (simulates swap)
        if self.battery > 20:
            self.battery = max(20, self.battery - 0.04 * dt)
        else:
            self.battery = min(100, self.battery + 0.5 * dt)
        self.signal = max(50, min(100, self.signal + random.uniform(-1, 1)))
        if self.status == "idle":
            self.status = "active"

    def position_payload(self) -> dict:
        return {
            "latitude": round(self.lat, 7),
            "longitude": round(self.lon, 7),
            "altitude": round(self.alt, 1),
            "heading": round(self.heading, 1),
            "speed": round(self.speed if (self.navigating or self._patrolling) else 0.0, 1),
        }

    def health_payload(self) -> dict:
        return {
            "battery_percent": round(self.battery, 1),
            "signal_strength": round(self.signal, 1),
        }


class GroundRobotSim(NavigationMixin):
    """Ground robot: figure-8 patrol on the surface, slower, less battery drain."""

    def __init__(self, config: RobotConfig) -> None:
        self.config = config
        self.lat = config.start_lat
        self.lon = config.start_lon
        self.alt = 0.0
        self.heading = config.start_heading
        self.speed = config.max_speed
        self.battery = 100.0
        self.signal = 90.0
        self.status = "idle"
        self._angle = random.uniform(0, 2 * math.pi)
        self._wheel_speed = 0.0
        # Navigation
        self.target_lat: float | None = None
        self.target_lon: float | None = None
        self.target_alt: float | None = None
        self.navigating = False
        self.current_command_id: str | None = None
        self._patrolling = True

    def tick(self, dt: float) -> None:
        if self.navigating:
            reached = self.navigate_toward_target(dt)
            if reached:
                self._arrived = True
        elif self._patrolling:
            angular_speed = self.speed / self.config.patrol_radius
            self._angle += angular_speed * dt
            r = self.config.patrol_radius * math.cos(2 * self._angle)
            r = abs(r)
            dx = r * math.cos(self._angle)
            dy = r * math.sin(self._angle)
            new_lat, new_lon = offset_coords(self.config.start_lat, self.config.start_lon, dx, dy)
            dlat = new_lat - self.lat
            dlon = new_lon - self.lon
            if abs(dlat) > 1e-10 or abs(dlon) > 1e-10:
                self.heading = math.degrees(math.atan2(dlon, dlat)) % 360
            self.lat = new_lat
            self.lon = new_lon

        self._wheel_speed = self.speed + random.uniform(-0.2, 0.2)
        if self.battery > 20:
            self.battery = max(20, self.battery - 0.02 * dt)
        else:
            self.battery = min(100, self.battery + 0.3 * dt)
        self.signal = max(60, min(100, self.signal + random.uniform(-0.5, 0.5)))
        if self.status == "idle":
            self.status = "active"

    def position_payload(self) -> dict:
        return {
            "latitude": round(self.lat, 7),
            "longitude": round(self.lon, 7),
            "altitude": 0.0,
            "heading": round(self.heading, 1),
            "speed": round(self.speed if (self.navigating or self._patrolling) else 0.0, 1),
        }

    def health_payload(self) -> dict:
        return {
            "battery_percent": round(self.battery, 1),
            "signal_strength": round(self.signal, 1),
            "wheel_speed": round(self._wheel_speed, 1),
        }


class UnderwaterRobotSim(NavigationMixin):
    """Underwater robot: elliptical patrol at depth, slowest, worst signal."""

    def __init__(self, config: RobotConfig) -> None:
        self.config = config
        self.lat = config.start_lat
        self.lon = config.start_lon
        self.alt = config.start_alt
        self.heading = config.start_heading
        self.speed = config.max_speed
        self.battery = 100.0
        self.signal = 60.0
        self.status = "idle"
        self._angle = random.uniform(0, 2 * math.pi)
        self._depth = abs(config.start_alt)
        self._pressure = 0.0
        # Navigation
        self.target_lat: float | None = None
        self.target_lon: float | None = None
        self.target_alt: float | None = None
        self.navigating = False
        self.current_command_id: str | None = None
        self._patrolling = True

    def tick(self, dt: float) -> None:
        if self.navigating:
            reached = self.navigate_toward_target(dt)
            if reached:
                self._arrived = True
        elif self._patrolling:
            angular_speed = self.speed / self.config.patrol_radius
            self._angle += angular_speed * dt
            dx = self.config.patrol_radius * 1.5 * math.cos(self._angle)
            dy = self.config.patrol_radius * math.sin(self._angle)
            new_lat, new_lon = offset_coords(self.config.start_lat, self.config.start_lon, dx, dy)
            dlat = new_lat - self.lat
            dlon = new_lon - self.lon
            if abs(dlat) > 1e-10 or abs(dlon) > 1e-10:
                self.heading = math.degrees(math.atan2(dlon, dlat)) % 360
            self.lat = new_lat
            self.lon = new_lon
            self._depth = abs(self.config.start_alt) + 5 * math.sin(self._angle * 0.5)
            self.alt = -self._depth

        self._pressure = abs(self.alt) * 0.1
        if self.battery > 20:
            self.battery = max(20, self.battery - 0.03 * dt)
        else:
            self.battery = min(100, self.battery + 0.4 * dt)
        base_signal = max(20, 80 - abs(self.alt) * 0.5)
        self.signal = max(10, min(100, base_signal + random.uniform(-2, 2)))
        if self.status == "idle":
            self.status = "active"

    def position_payload(self) -> dict:
        return {
            "latitude": round(self.lat, 7),
            "longitude": round(self.lon, 7),
            "altitude": round(self.alt, 1),
            "heading": round(self.heading, 1),
            "speed": round(self.speed if (self.navigating or self._patrolling) else 0.0, 1),
        }

    def health_payload(self) -> dict:
        return {
            "battery_percent": round(self.battery, 1),
            "signal_strength": round(self.signal, 1),
            "depth": round(abs(self.alt), 1),
            "pressure_atm": round(self._pressure, 2),
        }


SIM_CLASSES = {
    "drone": DroneSim,
    "ground": GroundRobotSim,
    "underwater": UnderwaterRobotSim,
}


async def register_robot(config: RobotConfig, backend_url: str) -> None:
    for attempt in range(30):
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{backend_url}/api/robots",
                    json={"id": config.id, "name": config.name, "robot_type": config.robot_type},
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    logger.info("Registered robot %s (%s)", config.id, config.robot_type)
                    return
        except httpx.ConnectError:
            logger.info("Backend not ready, retrying in 2s... (attempt %d)", attempt + 1)
            await asyncio.sleep(2)
    logger.warning("Could not register robot %s after 30 attempts", config.id)


async def handle_command(robot: Any, payload: dict[str, Any]) -> str | None:
    """Process a command message for a robot. Returns command_id if handled."""
    command_id = payload.get("command_id", "")
    command_type = payload.get("command_type", "")
    parameters = payload.get("parameters", {})

    logger.info("Robot %s received command: %s (id=%s)", getattr(robot, 'config', None) and robot.config.id, command_type, command_id)

    if command_type == "goto":
        lat = parameters.get("latitude")
        lon = parameters.get("longitude")
        alt = parameters.get("altitude")
        if lat is not None and lon is not None:
            robot.set_target(lat, lon, alt, command_id)
            robot._patrolling = False
            return command_id

    elif command_type == "stop":
        robot.clear_target()
        robot._patrolling = False
        robot.speed = 0
        return command_id

    elif command_type == "return_home":
        robot.set_target(
            robot.config.start_lat,
            robot.config.start_lon,
            robot.config.start_alt if robot.config.robot_type == "drone" else None,
            command_id,
        )
        robot._patrolling = False
        return command_id

    elif command_type == "patrol":
        robot.clear_target()
        robot._patrolling = True
        robot.speed = robot.config.max_speed
        return command_id

    elif command_type == "set_speed":
        new_speed = parameters.get("speed", robot.config.max_speed)
        robot.speed = max(0, min(robot.config.max_speed * 2, new_speed))
        return command_id

    return None


async def run_robot(config: RobotConfig, sim_config: SimConfig) -> None:
    sim_cls = SIM_CLASSES.get(config.robot_type, DroneSim)
    robot = sim_cls(config)
    await register_robot(config, sim_config.backend_url)

    command_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

    async def mqtt_listener(client: aiomqtt.Client) -> None:
        """Listen for command messages on this robot's topic."""
        await client.subscribe(f"argus/{config.id}/command/execute")
        async for message in client.messages:
            try:
                payload = json.loads(message.payload)
                await command_queue.put(payload)
            except (json.JSONDecodeError, TypeError):
                logger.warning("Invalid command JSON for %s", config.id)

    async def telemetry_loop(client: aiomqtt.Client) -> None:
        """Publish telemetry at regular intervals and process commands."""
        await client.publish(
            f"argus/{config.id}/status",
            json.dumps({"status": "active", "robot_type": config.robot_type}),
        )
        tick_count = 0
        while True:
            # Process any pending commands
            while not command_queue.empty():
                cmd_payload = command_queue.get_nowait()
                command_id = await handle_command(robot, cmd_payload)
                if command_id:
                    # Send ACK
                    await client.publish(
                        f"argus/{config.id}/command/ack",
                        json.dumps({"command_id": command_id, "status": "acknowledged"}),
                    )

            # Check if navigation target reached
            if hasattr(robot, '_arrived') and robot._arrived:
                robot._arrived = False
                cmd_id = robot.current_command_id
                robot.clear_target()
                if cmd_id:
                    await client.publish(
                        f"argus/{config.id}/command/ack",
                        json.dumps({"command_id": cmd_id, "status": "completed"}),
                    )

            robot.tick(sim_config.publish_interval)
            await client.publish(
                f"argus/{config.id}/telemetry/position",
                json.dumps(robot.position_payload()),
            )
            tick_count += 1
            if tick_count % 5 == 0:
                await client.publish(
                    f"argus/{config.id}/telemetry/health",
                    json.dumps(robot.health_payload()),
                )
            await asyncio.sleep(sim_config.publish_interval)

    while True:
        try:
            # Re-register on each reconnect to handle backend restarts
            await register_robot(config, sim_config.backend_url)
            async with aiomqtt.Client(
                hostname=sim_config.mqtt_broker,
                port=sim_config.mqtt_port,
            ) as client:
                logger.info("Robot %s (%s) connected to MQTT", config.id, config.robot_type)
                # Run listener and telemetry concurrently
                async with asyncio.TaskGroup() as tg:
                    tg.create_task(mqtt_listener(client))
                    tg.create_task(telemetry_loop(client))
        except BaseException as e:
            if isinstance(e, ExceptionGroup):
                for exc in e.exceptions:
                    logger.warning("Robot %s error: %s. Reconnecting in 3s...", config.id, exc)
            else:
                logger.warning("Robot %s error: %s. Reconnecting in 3s...", config.id, e)
            await asyncio.sleep(3)


async def main() -> None:
    config = SimConfig.default()
    config.mqtt_broker = os.environ.get("MQTT_BROKER", config.mqtt_broker)
    config.mqtt_port = int(os.environ.get("MQTT_PORT", str(config.mqtt_port)))
    config.backend_url = os.environ.get("BACKEND_URL", config.backend_url)

    logger.info(
        "Starting simulator with %d robot(s), MQTT=%s:%d",
        len(config.robots), config.mqtt_broker, config.mqtt_port,
    )
    await asyncio.gather(*[run_robot(rc, config) for rc in config.robots])


if __name__ == "__main__":
    asyncio.run(main())
