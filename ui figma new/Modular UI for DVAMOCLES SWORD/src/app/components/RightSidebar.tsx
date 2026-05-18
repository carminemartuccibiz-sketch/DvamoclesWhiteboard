import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Slider from '@radix-ui/react-slider';

const colors = [
  '#000000',
  '#6B7280',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#2F80ED',
  '#A855F7',
];

interface PropertyCardProps {
  title: string;
  children: React.ReactNode;
}

function PropertyCard({ title, children }: PropertyCardProps) {
  return (
    <div
      className="
        bg-[#0A0A0A]/80 backdrop-blur-[20px]
        border border-white/10
        rounded-xl p-4 shadow-2xl
      "
      style={{ width: '240px' }}
    >
      <h4 className="text-white/80 text-sm font-medium mb-3">{title}</h4>
      {children}
    </div>
  );
}

export default function RightSidebar() {
  return (
    <div className="fixed right-6 top-24 z-40 flex flex-col gap-4">
      {/* Card A: Selection Info */}
      <PropertyCard title="Selection Info">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs">Shape Type</span>
            <span className="text-white/90 text-xs font-medium">Rectangle</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs">ID</span>
            <span className="text-white/60 text-xs font-mono">#a7f3e2</span>
          </div>
        </div>
      </PropertyCard>

      {/* Card B: Style */}
      <PropertyCard title="Style">
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-white/50 text-xs mb-2">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color, index) => (
                <button
                  key={color}
                  className={`
                    w-10 h-10 rounded-lg border-2 transition-all
                    ${
                      index === 0
                        ? 'border-[#2F80ED] scale-105'
                        : 'border-transparent hover:border-white/20'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-2">Opacity</label>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              defaultValue={[100]}
              max={100}
              step={1}
            >
              <Slider.Track className="bg-white/10 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-[#2F80ED] rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="
                  block w-4 h-4 bg-white rounded-full
                  shadow-lg focus:outline-none focus:ring-2
                  focus:ring-[#2F80ED] cursor-pointer
                "
                aria-label="Opacity"
              />
            </Slider.Root>
            <div className="flex justify-between mt-1">
              <span className="text-white/40 text-xs">0%</span>
              <span className="text-white/40 text-xs">100%</span>
            </div>
          </div>
        </div>
      </PropertyCard>

      {/* Card C: Stroke & Fill */}
      <PropertyCard title="Stroke & Fill">
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-white/50 text-xs mb-2">Fill</label>
            <ToggleGroup.Root
              type="single"
              defaultValue="solid"
              className="flex gap-1 bg-white/5 p-1 rounded-lg"
            >
              <ToggleGroup.Item
                value="none"
                className="
                  flex-1 px-2 py-1.5 rounded-md text-xs
                  data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                  transition-all text-white/60
                "
              >
                None
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="solid"
                className="
                  flex-1 px-2 py-1.5 rounded-md text-xs
                  data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                  transition-all text-white/60
                "
              >
                Solid
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="pattern"
                className="
                  flex-1 px-2 py-1.5 rounded-md text-xs
                  data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                  transition-all text-white/60
                "
              >
                Pattern
              </ToggleGroup.Item>
            </ToggleGroup.Root>
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-2">Stroke</label>
            <ToggleGroup.Root
              type="single"
              defaultValue="solid"
              className="flex gap-1 bg-white/5 p-1 rounded-lg"
            >
              <ToggleGroup.Item
                value="solid"
                className="
                  flex-1 px-2 py-1.5 rounded-md text-xs
                  data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                  transition-all text-white/60
                "
              >
                Solid
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="dashed"
                className="
                  flex-1 px-2 py-1.5 rounded-md text-xs
                  data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                  transition-all text-white/60
                "
              >
                Dashed
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="dotted"
                className="
                  flex-1 px-2 py-1.5 rounded-md text-xs
                  data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                  transition-all text-white/60
                "
              >
                Dotted
              </ToggleGroup.Item>
            </ToggleGroup.Root>
          </div>
        </div>
      </PropertyCard>

      {/* Card D: Sloppiness */}
      <PropertyCard title="Drawing Style">
        <div>
          <label className="block text-white/50 text-xs mb-2">Edge Style</label>
          <ToggleGroup.Root
            type="single"
            defaultValue="straight"
            className="flex gap-2 bg-white/5 p-1 rounded-lg"
          >
            <ToggleGroup.Item
              value="straight"
              className="
                flex-1 px-3 py-2.5 rounded-md text-xs
                data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                transition-all text-white/60 font-medium
              "
            >
              Straight
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="sketchy"
              className="
                flex-1 px-3 py-2.5 rounded-md text-xs
                data-[state=on]:bg-[#2F80ED] data-[state=on]:text-white
                transition-all text-white/60 font-medium
              "
            >
              Sketchy
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>
      </PropertyCard>
    </div>
  );
}
