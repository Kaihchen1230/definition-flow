import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { DropdownControlProps } from "./types";

export const CustomDropdown = ({ id, labelId, value, options, disabled, invalid, describedBy, onChange }: DropdownControlProps) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id}-listbox`;
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
    }
  }, [options, value]);

  const openMenu = () => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const selectOption = (index: number) => {
    const option = options[index];
    if (!option) {
      return;
    }
    onChange(option.value);
    setActiveIndex(index);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + direction + options.length) % options.length);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      }
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        selectOption(activeIndex);
      } else {
        openMenu();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="custom-dropdown" ref={containerRef}>
      <button
        id={id}
        type="button"
        className={`control custom-dropdown-trigger ${invalid ? "is-invalid" : ""}`}
        role="combobox"
        aria-labelledby={`${labelId} ${id}`}
        aria-describedby={describedBy}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? undefined : "custom-dropdown-placeholder"}>{selectedOption?.label ?? "Select"}</span>
        <svg className="custom-dropdown-chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      {open ? (
        <ul id={listboxId} className="custom-dropdown-menu" role="listbox" aria-labelledby={labelId}>
          {options.map((option, index) => (
            <li
              id={`${id}-option-${index}`}
              key={option.value}
              className={`custom-dropdown-option ${index === activeIndex ? "active" : ""}`}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(index)}
            >
              <span>{option.label}</span>
              {option.value === value ? (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m3.5 8.5 3 3 6-7" />
                </svg>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
