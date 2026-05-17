import { MapPin, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createShapeId, useEditor, type TLGroupShape, type TLShapeId } from 'tldraw';

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

  const refreshOutline = useCallback(() => {
    const groups = editor
      .getCurrentPageShapes()
      .filter((shape): shape is TLGroupShape => shape.type === 'group');

    const items = groups
      .map((group) => {
        const name = getSchemaName(group);
        if (!name) return null;
        return { id: group.id, name };
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

    editor.updateShapes([
      {
        id: groupId,
        type: 'group',
        meta: { schemaName: trimmed },
      },
    ]);

    setSchemaName('');
    refreshOutline();
  };

  const handleOutlineSelect = (id: TLShapeId) => {
    editor.select(id);
    editor.zoomToSelection({ animation: { duration: 280 } });
  };

  return (
    <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-5 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-4 font-mono tracking-wide">
        PROJECT NAVIGATION
      </h3>

      <div className="mb-5 pb-5 border-b border-white/10">
        <label className="text-xs text-gray-400 mb-3 block font-medium">
          ELEMENT NAMING TOOLS
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSelection();
            }}
            placeholder="Enter schema name..."
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            type="button"
            onClick={handleNameSelection}
            className="w-full px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Name Selection
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-3 block font-medium">OUTLINE</label>
        <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar">
          {outline.length === 0 ? (
            <p className="text-xs text-gray-500 px-3 py-2">No named schemas yet.</p>
          ) : (
            outline.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOutlineSelect(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 group"
              >
                <MapPin size={16} className="text-blue-400 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{item.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
