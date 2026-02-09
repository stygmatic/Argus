import { useUIStore } from "../../stores/useUIStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";
import type { AutonomyTier } from "../../types/robot";

const TIERS: { value: AutonomyTier; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "assisted", label: "Assisted" },
  { value: "supervised", label: "Supervised" },
  { value: "autonomous", label: "Autonomous" },
];

export function SettingsPanel() {
  const isOpen = useUIStore((s) => s.settingsPanelOpen);
  const toggleSettings = useUIStore((s) => s.toggleSettingsPanel);
  const trailsEnabled = useUIStore((s) => s.trailsEnabled);
  const toggleTrails = useUIStore((s) => s.toggleTrails);
  const fleetDefaultTier = useAutonomyStore((s) => s.fleetDefaultTier);
  const setFleetDefault = useAutonomyStore((s) => s.setFleetDefault);

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-[300px] z-30 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-zinc-700/40">
        <div className="text-sm font-semibold text-zinc-200">Settings</div>
        <button
          onClick={toggleSettings}
          className="text-zinc-500 hover:text-zinc-300 text-lg leading-none p-1 transition-colors"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
        {/* Map section */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Map</div>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[13px] text-zinc-300">Robot Trails</span>
            <button
              onClick={toggleTrails}
              className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                trailsEnabled ? "bg-sky-600" : "bg-zinc-700"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 mx-0.5 ${
                  trailsEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        {/* Autonomy section */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Autonomy</div>
          <div>
            <div className="text-[13px] text-zinc-300 mb-2">Fleet Default Tier</div>
            <div className="grid grid-cols-2 gap-1.5">
              {TIERS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFleetDefault(t.value)}
                  className={`text-[11px] py-2 rounded-lg border transition-all duration-150 ${
                    fleetDefaultTier === t.value
                      ? "bg-sky-500/15 border-sky-500/40 text-sky-300"
                      : "border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Display section */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Display</div>
          <div className="space-y-2 text-[13px] text-zinc-400">
            <div className="flex justify-between">
              <span>Theme</span>
              <span className="text-zinc-500">Dark</span>
            </div>
            <div className="flex justify-between">
              <span>Map Style</span>
              <span className="text-zinc-500">CARTO Dark</span>
            </div>
            <div className="flex justify-between">
              <span>Units</span>
              <span className="text-zinc-500">Metric</span>
            </div>
          </div>
        </div>

        {/* Shortcuts section */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Keyboard Shortcuts</div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">Deselect robot</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Esc</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Next/Prev robot</span>
              <div className="flex gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">&darr;</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">&uarr;</kbd>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Toggle trails</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">T</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Toggle alerts</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">A</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Settings</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">S</kbd>
            </div>
          </div>
        </div>

        {/* About section */}
        <div className="pt-3 border-t border-zinc-700/40">
          <div className="text-[11px] text-zinc-600 text-center">
            Argus Ground Station v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
