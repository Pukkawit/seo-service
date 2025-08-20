"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, Plus } from "lucide-react";
import Link from "next/link";
import { ScrollablePopover } from "@/components/scrollable-popover";
import { Button } from "@/components/formElements/Button";
import { cn } from "@/lib/utils";
import { getIndefiniteArticle } from "@/lib/utils";

// Define a type for the option
interface SelectOption {
  label: string;
  value: string; // Value is always a string for HTML compatibility
  color?: string;
}

interface HTMLSelectCustomProps {
  label?: string;
  instruction?: string;
  fieldName?: string; // Used for placeholder generation
  options: Array<SelectOption> | null;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  width?: string;
  maxHeight?: number;
  addButton?: boolean;
  link?: {
    href: string;
    label?: string;
  };
  createNewElement?: boolean;
  enableOthers?: boolean;
  enableSearch?: boolean;
  error?: string;
  newElement?: React.ReactNode;
  newElementTitle?: string;
  popOverClassName?: string;
}

// Combine custom props with standard HTML input attributes for the hidden input
type HTMLSelectProps = HTMLSelectCustomProps &
  Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "onBlur" | "children"
  > & {
    value?: string; // Override value to be string
    onChange?: React.ChangeEventHandler<HTMLInputElement>; // Now correctly typed for HTMLInputElement
    onBlur?: React.FocusEventHandler<HTMLInputElement>; // Now correctly typed for HTMLInputElement
  };

const HTMLSelect = React.forwardRef<HTMLInputElement, HTMLSelectProps>(
  (
    {
      label,
      instruction,
      id,
      name,
      options = [],
      value, // Controlled value from props
      onChange, // Standard onChange handler from props
      onBlur, // Standard onBlur handler from props
      fieldName,
      disabled = false,
      placeholder = `Select ${
        fieldName
          ? getIndefiniteArticle(fieldName) + " " + fieldName
          : "an option"
      }`,
      className = "",
      labelClassName = "",
      buttonClassName = "",
      dropdownClassName = "",
      optionClassName = "",
      width = "100%",
      maxHeight = 200,
      enableOthers = false,
      enableSearch = false,
      error,
      addButton,
      link,
      createNewElement,
      newElement,
      newElementTitle,
      popOverClassName,
      ...rest // Rest of the HTML input attributes
    },
    ref // Forwarded ref for the hidden input
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customValue, setCustomValue] = useState("");
    const [isOthersSelected, setIsOthersSelected] = useState(false);
    const [hasOpened, setHasOpened] = useState(false); // New state for animation control
    const [searchTerm, setSearchTerm] = useState("");
    const selectRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null); // Internal ref for the hidden input
    const isInitialRender = useRef(true); // New ref to track initial render

    // Combine the forwarded ref with the internal ref
    React.useImperativeHandle(ref, () => hiddenInputRef.current!, []);

    // Set isInitialRender to false after the first render
    useEffect(() => {
      isInitialRender.current = false;
    }, []);

    const allOptions = useMemo(() => {
      return enableOthers
        ? [
            ...(options || []),
            {
              label: "Others",
              value: "Others",
            },
          ]
        : options;
    }, [options, enableOthers]);

    const filteredOptions = useMemo(() => {
      return allOptions?.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [allOptions, searchTerm]);

    // Determine the currently selected option based on the 'value' prop
    const selectedOption = useMemo(() => {
      const normalizedValue = value === null ? "" : value; // Treat null as empty string for comparison

      if (
        normalizedValue &&
        typeof normalizedValue === "string" &&
        normalizedValue.startsWith("Others - ")
      ) {
        return { label: "Others", value: "Others" }; // Treat as "Others" option for display logic
      }
      const foundOption = allOptions?.find(
        (option) => option.value === normalizedValue
      );
      return foundOption;
    }, [value, allOptions]);

    // Effect to initialize customValue and isOthersSelected based on the incoming 'value' prop
    useEffect(() => {
      const normalizedValue = value === null ? "" : value;
      if (normalizedValue && typeof normalizedValue === "string") {
        if (normalizedValue.startsWith("Others - ")) {
          setIsOthersSelected(true);
          setCustomValue(normalizedValue.replace("Others - ", ""));
        } else if (normalizedValue === "Others") {
          setIsOthersSelected(true);
          setCustomValue("");
        } else {
          setIsOthersSelected(false);
          setCustomValue("");
        }
      } else {
        setIsOthersSelected(false);
        setCustomValue("");
      }
    }, [value]);

    // Display logic: always show customValue for "Others"
    const displayValue = useMemo(() => {
      if (isOthersSelected) {
        return `Others - ${customValue}`.trim() === "Others -"
          ? "Others"
          : `Others - ${customValue}`; // Show custom text or "Others" if empty
      }
      return selectedOption?.label || placeholder;
    }, [isOthersSelected, customValue, selectedOption, placeholder]);

    const handleToggle = (e: React.MouseEvent) => {
      if (disabled) return;

      // Prevent opening on the very first render, regardless of e.detail
      if (isInitialRender.current) {
        console.log("HTMLSelect: Preventing toggle on initial render.");
        return;
      }

      // For subsequent interactions, only allow toggle if it's a user-initiated click (e.detail > 0)
      // This helps prevent programmatic clicks (e.detail === 0) from opening the dropdown
      if (e.detail === 0) {
        console.log(
          "HTMLSelect: Programmatic click detected, preventing toggle."
        );
        return;
      }

      setIsOpen((prevState) => {
        if (!prevState) {
          setHasOpened(true); // Mark as opened for animation
        }
        return !prevState;
      });
    };

    const updateHiddenInputAndDispatch = (newValue: string) => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = newValue;
        // Manually dispatch a change event to trigger react-hook-form or other listeners
        const event = new Event("change", { bubbles: true });
        hiddenInputRef.current.dispatchEvent(event);
        console.log(
          "HTMLSelect: Dispatched change event with value:",
          newValue
        );
        // If onChange prop is provided, call it manually as well
        if (onChange) {
          onChange({
            target: hiddenInputRef.current,
            type: "change",
            // Add other properties if needed for a full React.ChangeEvent
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }
    };

    const handleOptionClick = (optionValue: string) => {
      if (disabled) return;

      const isOthers = optionValue === "Others";
      setIsOthersSelected(isOthers);

      const finalValue = isOthers ? "Others - " : optionValue; // Initial "Others - " or actual value

      updateHiddenInputAndDispatch(finalValue);

      setCustomValue("");
      setIsOpen(false);
    };

    const handleCustomInputChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newValue = e.target.value;
      setCustomValue(newValue);
      const finalValue = `Others - ${newValue}`;

      updateHiddenInputAndDispatch(finalValue);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          selectRef.current &&
          !selectRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm("");
          // Trigger onBlur for the hidden input when clicking outside
          if (hiddenInputRef.current && onBlur) {
            // Create a valid FocusEvent for HTMLInputElement
            const focusEvent = new FocusEvent("blur", {
              bubbles: true,
              cancelable: false,
              composed: true,
              relatedTarget: null, // No related target for blur
            }) as unknown as React.FocusEvent<HTMLInputElement>; // Cast to unknown first, then to React.FocusEvent<HTMLInputElement>
            Object.defineProperty(focusEvent, "target", {
              value: hiddenInputRef.current,
              writable: false,
            });
            Object.defineProperty(focusEvent, "currentTarget", {
              value: hiddenInputRef.current,
              writable: false,
            });

            onBlur(focusEvent);
          }
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onBlur]);

    return (
      <div
        ref={selectRef}
        className={cn(
          `relative w-full flex flex-col gap-[2px]`,
          className,
          disabled && "opacity-70 cursor-not-allowed"
        )}
      >
        {label && (
          <label
            htmlFor={id}
            className={cn(
              `flex flex-col text-sm font-medium tracking-wide text-left`,
              disabled && "text-foreground/50",
              labelClassName || "text-foreground"
            )}
          >
            {label}
          </label>
        )}
        {instruction && (
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            {instruction}
          </p>
        )}
        <div
          className={cn(
            `w-full flex gap-2 items-start`,
            disabled && "opacity-70 cursor-not-allowed"
          )}
        >
          <div className="flex-1 relative">
            {/* Hidden input to mimic HTML select for form libraries */}
            <input
              type="hidden"
              id={id}
              name={name}
              value={value || ""} // Controlled by the value prop
              ref={hiddenInputRef}
              onChange={onChange} // Pass the onChange handler from props
              onBlur={onBlur} // Pass the onBlur handler from props
              disabled={disabled}
              {...rest} // Pass any other HTML input attributes
            />

            <div
              className={cn(
                `relative w-full flex px-3 py-[9px] text-sm justify-between items-center border shadow-sm focus:outline-none h-[2.4rem]`,
                displayValue !== placeholder &&
                  "border-primary bg-background text-primary font-medium",
                disabled
                  ? "focus:ring-muted-foreground focus:border-muted-foreground bg-muted/50 border-muted-foreground/50 cursor-not-allowed text-muted-foreground/40"
                  : "focus:ring-primary focus:border-primary bg-input text-foreground",
                buttonClassName || "border-input",
                isOpen ? "rounded-t-md" : "rounded-md",
                error && "border-destructive"
              )}
              onClick={handleToggle}
              tabIndex={0}
              style={{ width }}
            >
              <div
                className={`h-full w-full flex items-center text-sm justify-between cursor-pointer`}
              >
                <div className="overflow-hidden flex-1 relative">
                  {" "}
                  {/* Added flex-1 and relative */}
                  <p
                    className={cn(
                      `line-clamp-1`,
                      isOthersSelected // Always transparent when "Others" is selected
                        ? "text-transparent"
                        : displayValue !== placeholder
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {displayValue}
                  </p>
                  {isOthersSelected && ( // Input for "Others" overlays the transparent text
                    <input
                      name={`${id}-other`}
                      id={`${id}-other`}
                      maxLength={40}
                      type="text"
                      value={customValue}
                      disabled={disabled}
                      onChange={handleCustomInputChange}
                      placeholder="Other (please specify)"
                      className={cn(
                        disabled ? "text-muted-foreground/50" : "",
                        `absolute top-0 left-0 h-full px-3 py-[9px] text-primary bg-transparent outline-none text-sm font-medium text-ellipsis overflow-hidden truncate`, // Added truncate
                        `w-[calc(100%-2.5rem)]` // Adjusted width to leave space for chevron
                      )}
                      onClick={(e) => e.stopPropagation()} // Prevent toggle when typing in this input
                    />
                  )}
                </div>
                <div className="flex-shrink-0 w-8 flex items-center justify-end">
                  {" "}
                  {/* Fixed width for chevron container */}
                  <ChevronDown
                    className={cn(
                      "text-sm transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
              </div>
            </div>
            <div
              className={cn(
                `absolute z-50 left-0 right-0 top-[100%] bg-popover border rounded-b-md shadow-lg overflow-hidden border-primary border-t-0 text-left`,
                hasOpened &&
                  (isOpen ? "animate-slide-down" : "animate-slide-up") // Apply animations
              )}
              style={
                {
                  "--dropdown-max-height": `${maxHeight}px`,
                } as React.CSSProperties
              } // Pass max-height as CSS variable
            >
              {enableSearch && (
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search options..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      disabled={disabled}
                      className={cn(
                        `w-full px-2 py-1 pr-10 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary`,
                        disabled ? "text-muted-foreground" : "text-foreground",
                        "bg-input border-input"
                      )}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              )}
              <ul
                className="overflow-auto"
                style={{ maxHeight: `${maxHeight}px` }}
              >
                {filteredOptions && filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <li
                      key={index} // Using index as key since values might not be unique or stringifiable
                      className={cn(
                        `px-4 py-2 cursor-pointer hover:bg-accent/10 hover:text-accent-foreground text-sm border-b border-border last:border-b-0`,
                        optionClassName || "text-foreground",
                        value === option.value ? `font-medium text-primary` : ""
                      )}
                      onClick={() => handleOptionClick(option.value)}
                      style={{ backgroundColor: option.color }}
                    >
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm text-muted-foreground">
                    No options found.
                  </li>
                )}
              </ul>
            </div>
          </div>
          {addButton &&
            (createNewElement ? (
              <ScrollablePopover
                title={newElementTitle ?? ""}
                className={popOverClassName}
                trigger={
                  <Button
                    type="button"
                    icon={<Plus className="w-4 h-4" />}
                    className="text-sm px-[0.5rem]"
                  >
                    New
                  </Button>
                }
              >
                {newElement}
              </ScrollablePopover>
            ) : (
              link && (
                <Link
                  href={link.href}
                  className="flex items-center justify-center p-3 text-sm text-primary-foreground bg-primary hover:bg-primary-hover rounded-md shrink-0"
                >
                  <Plus className={`w-3 h-3 ${link.label ? "mr-2" : ""}`} />
                  {link.label}
                </Link>
              )
            ))}
        </div>
        {error && (
          <div className="text-destructive text-sm mt-1 text-left">{error}</div>
        )}
      </div>
    );
  }
);

HTMLSelect.displayName = "HTMLSelect";

export { HTMLSelect };
export default HTMLSelect;
