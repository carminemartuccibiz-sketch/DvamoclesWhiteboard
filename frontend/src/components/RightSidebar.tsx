import { usePropertiesPanel } from '../hooks/usePropertiesPanel';
import { PropertyCard } from './ui/panel';
import { ColorPickerSection } from './properties/sections/ColorPickerSection';
import { FillStyleSection } from './properties/sections/FillStyleSection';
import { OpacitySection } from './properties/sections/OpacitySection';
import { SloppinessSection } from './properties/sections/SloppinessSection';
import { StrokeStyleSection } from './properties/sections/StrokeStyleSection';
import { StrokeWidthSection } from './properties/sections/StrokeWidthSection';
import { AlignmentSection } from './properties/sections/AlignmentSection';

const sidebarScrollClass =
  'flex flex-col gap-4 w-[260px] max-w-[min(260px,26vw)] shrink-0 min-h-0 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar pb-6';

export function RightSidebar() {
  const props = usePropertiesPanel();

  return (
    <aside className={sidebarScrollClass}>
      <PropertyCard title="Selection Info">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center gap-2">
            <span className="text-white/50 text-xs font-ui">ID</span>
            <span className="text-white/80 text-xs font-mono truncate max-w-[140px]">
              {props.objectIdLabel}
            </span>
          </div>
        </div>
      </PropertyCard>

      <PropertyCard title="Style">
        <div className="space-y-4">
          <ColorPickerSection
            activeColor={props.activeColor}
            onColorSelect={props.handleColorSelect}
          />
          <OpacitySection value={props.opacity} onChange={props.handleOpacityChange} />
        </div>
      </PropertyCard>

      <PropertyCard title="Stroke & Fill">
        <div className="space-y-4">
          <FillStyleSection value={props.fillStyle} onChange={props.handleFillChange} />
          <StrokeStyleSection
            value={props.strokeStyle}
            disabled={props.sloppiness === 'sketchy'}
            onChange={props.handleStrokeStyleChange}
          />
          <StrokeWidthSection value={props.strokeWidth} onChange={props.handleStrokeWidthChange} />
        </div>
      </PropertyCard>

      <PropertyCard title="Drawing Style">
        <SloppinessSection value={props.sloppiness} onChange={props.handleSloppinessChange} />
      </PropertyCard>

      <AlignmentSection />
    </aside>
  );
}

export function PropertiesPanel() {
  return <RightSidebar />;
}
