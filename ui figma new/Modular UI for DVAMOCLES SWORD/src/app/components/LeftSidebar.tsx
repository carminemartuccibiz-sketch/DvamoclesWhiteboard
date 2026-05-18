import * as Accordion from '@radix-ui/react-accordion';
import {
  ChevronDown,
  Folder,
  FileText,
  Server,
  Database,
  Cloud,
  Users,
  Lock,
  Globe,
} from 'lucide-react';

const schemas = [
  {
    id: 'schema-1',
    name: 'User Flow Diagrams',
    items: [
      { id: 'item-1', name: 'Login Flow' },
      { id: 'item-2', name: 'Checkout Process' },
      { id: 'item-3', name: 'User Onboarding' },
    ],
  },
  {
    id: 'schema-2',
    name: 'System Architecture',
    items: [
      { id: 'item-4', name: 'Database Schema' },
      { id: 'item-5', name: 'API Architecture' },
      { id: 'item-6', name: 'Microservices Map' },
    ],
  },
  {
    id: 'schema-3',
    name: 'Wireframes',
    items: [
      { id: 'item-7', name: 'Dashboard V2' },
      { id: 'item-8', name: 'Settings Page' },
    ],
  },
];

const assetIcons = [
  { id: 'server', icon: Server, label: 'Server' },
  { id: 'database', icon: Database, label: 'Database' },
  { id: 'cloud', icon: Cloud, label: 'Cloud' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'lock', icon: Lock, label: 'Security' },
  { id: 'globe', icon: Globe, label: 'API' },
];

export default function LeftSidebar() {
  return (
    <div className="fixed left-6 top-24 z-40 flex flex-col gap-4">
      {/* Schemas & Groups Section */}
      <div
        className="
          bg-[#0A0A0A]/80 backdrop-blur-[20px]
          border border-white/10
          rounded-2xl overflow-hidden shadow-2xl
        "
        style={{ width: '280px' }}
      >
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-white/90 text-sm font-medium">Schemas & Groups</h3>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <Accordion.Root type="multiple" defaultValue={['schema-1']} className="px-2 py-2">
            {schemas.map((schema) => (
              <Accordion.Item
                key={schema.id}
                value={schema.id}
                className="border-b border-white/5 last:border-0"
              >
                <Accordion.Header>
                  <Accordion.Trigger
                    className="
                      flex items-center justify-between w-full
                      px-3 py-2 hover:bg-white/5 rounded-lg
                      transition-colors group
                    "
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-white/50" />
                      <span className="text-white/80 text-sm">{schema.name}</span>
                    </div>
                    <ChevronDown
                      className="
                        w-4 h-4 text-white/50
                        transition-transform duration-200
                        group-data-[state=open]:rotate-180
                      "
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content
                  className="
                    overflow-hidden
                    data-[state=open]:animate-accordion-down
                    data-[state=closed]:animate-accordion-up
                  "
                >
                  <div className="pl-6 pr-3 py-1 flex flex-col gap-1">
                    {schema.items.map((item) => (
                      <button
                        key={item.id}
                        className="
                          flex items-center gap-2 w-full
                          px-3 py-2 hover:bg-white/5
                          rounded-md transition-colors
                          text-left
                        "
                      >
                        <FileText className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white/70 text-sm">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </div>

      {/* Asset Library Section */}
      <div
        className="
          bg-[#0A0A0A]/80 backdrop-blur-[20px]
          border border-white/10
          rounded-2xl overflow-hidden shadow-2xl
        "
        style={{ width: '280px' }}
      >
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-white/90 text-sm font-medium">Asset Library</h3>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {assetIcons.map((asset) => {
              const Icon = asset.icon;
              return (
                <button
                  key={asset.id}
                  className="
                    flex flex-col items-center justify-center gap-2
                    p-3 bg-white/5 hover:bg-white/10
                    border border-white/10 rounded-lg
                    transition-colors group
                  "
                  title={asset.label}
                >
                  <Icon className="w-5 h-5 text-white/60 group-hover:text-white/90 transition-colors" />
                  <span className="text-white/50 text-xs">{asset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
