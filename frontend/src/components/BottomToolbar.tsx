import { useToolbarTools, type ToolbarActionId, type ToolId } from '../hooks/useToolbarTools';
import { glassCard } from './ui/panel';
import { cn } from './ui/utils';

function isEntryActive(
  activeTool: ToolId | ToolbarActionId,
  entry: { kind: 'tool'; id: ToolId } | { kind: 'action'; id: ToolbarActionId },
) {
  if (entry.kind === 'tool') return activeTool === entry.id;
  return false;
}

export function BottomToolbar() {
  const { activeTool, activateTool, entries } = useToolbarTools();

  return (
    <div
      className={cn(glassCard, 'pointer-events-auto flex flex-wrap items-center gap-2 px-3 py-3 rounded-full max-w-[95vw]')}
    >
      {entries.map((entry, index) => {
        const Icon = entry.icon;
        const isActive = isEntryActive(activeTool, entry);
        const isAction = entry.kind === 'action';
        const shortcut = entry.shortcut;
        const digit = entry.kind === 'tool' ? entry.digit : undefined;

        return (
          <button
            key={entry.id}
            type="button"
            onClick={() =>
              activateTool(entry.kind === 'action' ? entry.id : entry.id)
            }
            className={cn(
              'relative group w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0',
              isActive
                ? 'bg-[#2F80ED] text-white shadow-[0_0_16px_rgba(47,128,237,0.35)]'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10',
              isAction && index > 0 && 'ml-0.5',
            )}
            aria-label={`${entry.label} (${shortcut})`}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 2} />

            <div
              className="
                absolute bottom-full mb-2 px-2 py-1
                bg-[#0A0A0A]/95 backdrop-blur-sm
                border border-white/20 rounded-md
                opacity-0 group-hover:opacity-100
                transition-opacity pointer-events-none whitespace-nowrap z-50
              "
            >
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-ui">{entry.label}</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 text-xs font-mono">
                  {shortcut}
                </kbd>
                {digit ? (
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 text-xs font-mono">
                    {digit}
                  </kbd>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
