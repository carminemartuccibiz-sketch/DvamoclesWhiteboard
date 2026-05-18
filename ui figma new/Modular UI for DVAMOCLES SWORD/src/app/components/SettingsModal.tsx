import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const lastSaved = new Date().toLocaleTimeString();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Dialog.Content
          className="
            fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            bg-[#0A0A0A]/95 backdrop-blur-[20px]
            border border-white/10
            rounded-2xl shadow-2xl
            p-6 z-[101]
          "
          style={{ width: '480px', maxWidth: '90vw' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <Dialog.Title className="text-white text-lg font-medium">
              System Preferences
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="
                  w-8 h-8 flex items-center justify-center
                  rounded-lg hover:bg-white/5
                  text-white/60 hover:text-white
                  transition-colors
                "
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Settings Content */}
          <div className="space-y-6">
            {/* Canvas Settings */}
            <div>
              <h3 className="text-white/80 text-sm font-medium mb-3">Canvas</h3>
              <div className="space-y-3">
                <SettingRow
                  label="Show Grid"
                  description="Display grid lines on canvas"
                  defaultChecked={true}
                />
                <SettingRow
                  label="Snap to Grid"
                  description="Align elements to grid automatically"
                  defaultChecked={false}
                />
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="pt-3 border-t border-white/10">
              <h3 className="text-white/80 text-sm font-medium mb-3">Appearance</h3>
              <div className="space-y-3">
                <SettingRow
                  label="Zen Mode"
                  description="Hide UI for distraction-free work"
                  defaultChecked={false}
                />
                <SettingRow
                  label="Dark Mode"
                  description="Use dark theme (currently active)"
                  defaultChecked={true}
                />
              </div>
            </div>

            {/* Persistence Status */}
            <div className="pt-3 border-t border-white/10">
              <h3 className="text-white/80 text-sm font-medium mb-3">Persistence</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Last Saved</span>
                  <span className="text-white/80 text-sm font-mono">{lastSaved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Backend Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                className="
                  px-4 py-2 rounded-lg
                  bg-white/5 hover:bg-white/10
                  border border-white/10
                  text-white/80 text-sm
                  transition-colors
                "
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              className="
                px-4 py-2 rounded-lg
                bg-[#2F80ED] hover:bg-[#2F80ED]/90
                text-white text-sm
                transition-colors
              "
            >
              Save Changes
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  defaultChecked: boolean;
}

function SettingRow({ label, description, defaultChecked }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-white/80 text-sm font-medium block">{label}</label>
        <p className="text-white/40 text-xs mt-0.5">{description}</p>
      </div>
      <Switch.Root
        defaultChecked={defaultChecked}
        className="
          w-11 h-6 bg-white/10 rounded-full
          relative data-[state=checked]:bg-[#2F80ED]
          transition-colors
        "
      >
        <Switch.Thumb
          className="
            block w-5 h-5 bg-white rounded-full
            transition-transform duration-100
            translate-x-0.5 will-change-transform
            data-[state=checked]:translate-x-[22px]
          "
        />
      </Switch.Root>
    </div>
  );
}
