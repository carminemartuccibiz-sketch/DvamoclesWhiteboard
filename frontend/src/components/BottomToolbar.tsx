import { useToolbarTools, type ActiveToolId, type ToolbarActionId, type ToolId } from '../hooks/useToolbarTools';
import { glassCard } from './ui/panel';
import { cn } from './ui/utils';

type ToolbarEntryRef =
  | { kind: 'tool'; id: ToolId }
  | { kind: 'action'; id: ToolbarActionId }
  | { kind: 'plugin-tool'; id: string };

function isEntryActive(activeTool: ActiveToolId, entry: ToolbarEntryRef) {
  if (entry.kind === 'action') return false;
  return activeTool === entry.id;
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
        const isPlugin = entry.kind === 'plugin-tool';
        const shortcut = entry.kind === 'tool' || entry.kind === 'plugin-tool' ? entry.shortcut : entry.shortcut;
        const digit = entry.kind === 'tool' ? entry.digit : undefined;

        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => activateTool(entry.id)}
            className={cn(
              'relative group w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0',
              isActive
                ? isPlugin
                  ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]'
                  : 'bg-[#2F80ED] text-white shadow-[0_0_16px_rgba(47,128,237,0.35)]'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10',
              isAction && index > 0 && 'ml-0.5',
              isPlugin && !isActive && 'border-violet-500/20',
            )}
            aria-label={shortcut ? `${entry.label} (${shortcut})` : entry.label}
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
                {isPlugin ? (
                  <span className="text-[10px] text-violet-300/80 uppercase tracking-wide">plugin</span>
                ) : null}
                {shortcut ? (
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 text-xs font-mono">
                    {shortcut}
                  </kbd>
                ) : null}
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
