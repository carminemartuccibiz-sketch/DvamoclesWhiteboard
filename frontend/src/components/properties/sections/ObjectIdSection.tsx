interface ObjectIdSectionProps {
  label: string;
}

export function ObjectIdSection({ label }: ObjectIdSectionProps) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-2 block font-medium">OBJECT ID</label>
      <input
        type="text"
        readOnly
        value={label}
        className="w-full px-3 py-2.5 bg-white/5 border-2 border-blue-500/50 rounded-lg text-white text-sm font-mono focus:outline-none cursor-default"
      />
    </div>
  );
}
