import { enumOptions } from "../../../../config/enumOptions";
import { FieldHelper, FieldLabel, getFieldPresentation } from "../FieldPresentation";
import type { FieldControlProps } from "../types";

export const RadioGroupField = ({ node, value, onChange, invalid = false }: FieldControlProps) => {
  const presentation = getFieldPresentation(node);
  const options = enumOptions[node.dataPath ?? ""] ?? [];
  return (
    <div className="field">
      <FieldLabel node={node} />
      <div className="choice-grid compact" aria-describedby={presentation.describedBy}>
        {options.map((option) => {
          const tooltipId = `${node.id}-${option.value}-description`;
          return (
            <div className="choice-with-help" key={option.value}>
              <label className={`choice ${option.description ? "with-help" : ""}`}>
                <input type="radio" checked={value === option.value} disabled={presentation.disabled} aria-invalid={invalid} onChange={() => onChange(option.value)} />
                {option.label}
              </label>
              {option.description ? (
                <>
                  <button className="choice-help" type="button" aria-label={`About ${option.label}`} aria-describedby={tooltipId}>
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 7.1v4" />
                      <path d="M8 4.7h.01" />
                    </svg>
                  </button>
                  <span className="choice-tooltip" id={tooltipId} role="tooltip">{option.description}</span>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      <FieldHelper presentation={presentation} />
    </div>
  );
};
