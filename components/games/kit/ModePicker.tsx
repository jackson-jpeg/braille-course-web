'use client';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** A segmented control built on native radio buttons (fully keyboard and screen-reader friendly). */
export default function ModePicker<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  legend: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="mode-picker" disabled={disabled}>
      <legend>{legend}</legend>
      <div className="mode-picker-options">
        {options.map((o) => (
          <label key={o.value} className={`mode-option${o.value === value ? ' is-checked' : ''}`}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            <span className="mode-option-label">{o.label}</span>
            {o.hint && <span className="mode-option-hint">{o.hint}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
