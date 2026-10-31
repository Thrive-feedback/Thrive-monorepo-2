import { memo, useId } from 'react';
import { KudosCardFace } from './kudos-card-face';
import {
  KUDOS_TEMPLATE_KEYS,
  KUDOS_TEMPLATES,
  type KudosTemplateKey,
} from './kudos-template.constant';

export type KudosTemplatePickerProps = {
  templateKey: KudosTemplateKey;
  onTemplateChange: (templateKey: KudosTemplateKey) => void;
};

/**
 * Every template, as a small card, in a row above the bar: pressing one changes the card at once,
 * with no drawer to open. Native radios, so the arrow keys move along the row. Too wide for a
 * phone, it scrolls sideways. Memoised: typing the message changes none of its props.
 */
export const KudosTemplatePicker = memo(function KudosTemplatePicker({
  templateKey,
  onTemplateChange,
}: KudosTemplatePickerProps) {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label="Card template"
      className="flex max-w-full gap-2 overflow-x-auto p-1"
    >
      {KUDOS_TEMPLATE_KEYS.map((key) => (
        <label key={key} className="w-12 shrink-0 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={key}
            checked={key === templateKey}
            aria-label={KUDOS_TEMPLATES[key].label}
            onChange={() => onTemplateChange(key)}
            className="peer sr-only"
          />
          <span className="block rounded-element outline-offset-2 peer-checked:outline-2 peer-checked:outline-action-primary peer-focus-visible:outline-2 peer-focus-visible:outline-focus-ring">
            <KudosCardFace templateKey={key} />
          </span>
        </label>
      ))}
    </div>
  );
});
