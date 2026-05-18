import { chrome } from '../../ui/chrome';
import { sectionLabelClass } from '../sectionStyles';

interface ObjectIdSectionProps {
  label: string;
}

export function ObjectIdSection({ label }: ObjectIdSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>Object ID</label>
      <input type="text" readOnly value={label} className={chrome.inputReadonly} />
    </div>
  );
}
