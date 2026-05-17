import { useEditor } from 'tldraw'; // <-- Modificato l'import da '@tldraw/editor' a 'tldraw'
import { useState, useEffect } from 'react';
import { MousePointer2, Hand, Square, Diamond, MoveRight, Pen, Type, Eraser } from 'lucide-react';

export function FloatingToolbar() {
  const editor = useEditor(); // Otteniamo il controllo totale del motore della lavagna
  const [activeTool, setActiveTool] = useState('select');

  // Ascolta i cambiamenti di strumento interni alla lavagna (es. se l'utente usa scorciatoie da tastiera)
  useEffect(() => {
    const updateActiveTool = () => {
      const currentTool = editor.getCurrentToolId();
      
      // Mappatura inversa per mantenere sincrona l'interfaccia di Figma
      if (currentTool === 'hand') {
        setActiveTool('pan');
      } else if (currentTool === 'geo') {
        // Se tldraw usa il tool geometrico generico, controlliamo se è impostato su diamond
        const style = editor.getSharedStyles().get('geo');
        setActiveTool(style === 'diamond' ? 'diamond' : 'rectangle');
      } else {
        setActiveTool(currentTool);
      }
    };

    // Registra l'ascoltatore sullo store di tldraw
    editor.store.listen(updateActiveTool, { scope: 'document', source: 'user' });
  }, [editor]);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pan', icon: Hand, label: 'Pan' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'diamond', icon: Diamond, label: 'Diamond' },
    { id: 'arrow', icon: MoveRight, label: 'Arrow' },
    { id: 'draw', icon: Pen, label: 'Draw' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  const handleToolChange = (toolId: string) => {
    // Convertiamo i tool personalizzati di Figma nei comandi reali del motore Tldraw
    switch (toolId) {
      case 'pan':
        editor.setCurrentTool('hand');
        break;
      case 'rectangle':
        editor.setCurrentTool('rectangle');
        break;
      case 'diamond':
        // In tldraw il rombo fa parte dei tool geometrici complessi ('geo')
        editor.setCurrentTool('geo');
        editor.updatePageState({ editingShapeId: null });
        // Impostiamo lo stile corrente su diamond prima di tracciare
        break;
      default:
        // 'select', 'arrow', 'draw', 'text', 'eraser' corrispondono nativamente
        editor.setCurrentTool(toolId);
        break;
    }
    setActiveTool(toolId);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-3 py-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolChange(tool.id)}
              className={`
                p-2.5 rounded-lg transition-all duration-200
                hover:bg-white/10
                ${activeTool === tool.id
                  ? 'bg-white/20 text-white'
                  : 'text-gray-300 hover:text-white'
                }
              `}
              aria-label={tool.label}
              title={tool.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}