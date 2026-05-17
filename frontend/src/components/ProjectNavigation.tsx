import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';

export function ProjectNavigation() {
  const [schemaName, setSchemaName] = useState('');
  const [schemas, setSchemas] = useState([
    { id: 1, name: 'Login Screen', icon: '📍' },
    { id: 2, name: 'Dashboard Layout', icon: '📍' },
    { id: 3, name: 'User Profile', icon: '📍' },
  ]);

  const handleAddSchema = () => {
    if (schemaName.trim()) {
      setSchemas([...schemas, {
        id: schemas.length + 1,
        name: schemaName,
        icon: '📍'
      }]);
      setSchemaName('');
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-5 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-4 font-mono tracking-wide">PROJECT NAVIGATION</h3>

      {/* Element Naming Tools */}
      <div className="mb-5 pb-5 border-b border-white/10">
        <label className="text-xs text-gray-400 mb-3 block font-medium">ELEMENT NAMING TOOLS</label>
        <div className="space-y-2">
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSchema();
            }}
            placeholder="Enter schema name..."
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            onClick={handleAddSchema}
            className="w-full px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Name Selection
          </button>
        </div>
      </div>

      {/* Outline List */}
      <div>
        <label className="text-xs text-gray-400 mb-3 block font-medium">OUTLINE</label>
        <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar">
          {schemas.map((schema) => (
            <button
              key={schema.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 group"
            >
              <MapPin size={16} className="text-blue-400 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{schema.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
