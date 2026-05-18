import { MapPin, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createShapeId, useEditor, type TLGroupShape, type TLShapeId } from 'tldraw';
import { ChromePanel, chrome } from './ui/chrome';
import { cn } from './ui/utils';

interface SchemaOutlineItem {
  id: TLShapeId;
  name: string;
}

function getSchemaName(shape: TLGroupShape) {
  const meta = shape.meta as { schemaName?: string };
  return typeof meta.schemaName === 'string' ? meta.schemaName : null;
}

export function ProjectNavigation() {
  const editor = useEditor();
  const [schemaName, setSchemaName] = useState('');
  const [outline, setOutline] = useState<SchemaOutlineItem[]>([]);
  const [activeId, setActiveId] = useState<TLShapeId | null>(null);

  const refreshOutline = useCallback(() => {
    const items = editor
      .getCurrentPageShapes()
      .filter((shape): shape is TLGroupShape => shape.type === 'group')
      .map((group) => {
        const name = getSchemaName(group);
        return name ? { id: group.id, name } : null;
      })
      .filter((item): item is SchemaOutlineItem => item !== null);

    setOutline(items);
  }, [editor]);

  useEffect(() => {
    refreshOutline();
    const unlisten = editor.store.listen(refreshOutline);
    return () => unlisten();
  }, [editor, refreshOutline]);

  const handleNameSelection = () => {
    const trimmed = schemaName.trim();
    if (!trimmed) return;

    const selectedIds = editor.getSelectedShapeIds();
    if (selectedIds.length < 2) return;

    const groupId = createShapeId();
    editor.groupShapes(selectedIds, { groupId, select: true });
    editor.updateShapes([{ id: groupId, type: 'group', meta: { schemaName: trimmed } }]);
    setSchemaName('');
    refreshOutline();
  };

  const handleOutlineSelect = (id: TLShapeId) => {
    setActiveId(id);
    editor.select(id);
    editor.zoomToSelection({ animation: { duration: 280 } });
  };

  return (
    <ChromePanel title="Project Navigation">
      <div className="mb-5 pb-5 border-b border-white/[0.06]">
        <label className={chrome.sectionLabel}>Element Naming</label>
        <div className="space-y-2.5">
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSelection();
            }}
            placeholder="Schema name…"
            className={chrome.input}
          />
          <button
            type="button"
            onClick={handleNameSelection}
            className={`w-full ${chrome.primaryBtn} flex items-center justify-center gap-2`}
          >
            <Plus size={16} />
            Name Selection
          </button>
        </div>
      </div>

      <div>
        <label className={chrome.sectionLabel}>Outline</label>
        <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
          {outline.length === 0 ? (
            <p className="text-xs text-zinc-600 px-2 py-3 leading-relaxed">
              Select 2+ shapes, name them, and they appear here.
            </p>
          ) : (
            outline.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOutlineSelect(item.id)}
                className={cn(
                  chrome.outlineItem,
                  activeId === item.id && 'bg-white/[0.08] text-white ring-1 ring-white/[0.06]',
                )}
              >
                <MapPin
                  size={15}
                  className={
                    activeId === item.id
                      ? 'text-blue-400'
                      : 'text-zinc-500 group-hover:text-blue-400/80'
                  }
                />
                <span className="flex-1 text-left truncate">{item.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </ChromePanel>
  );
}
