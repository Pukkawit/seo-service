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
    const [searchTerm, setSearchTerm] = useState("");
    const selectRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    // Combine the forwarded ref with the internal ref
    React.useImperativeHandle(ref, () => hiddenInputRef.current!, []);

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

    const selectedOption = useMemo(() => {
      if (!value) return null;

      const normalizedValue = String(value);

      // Handle "Others - customValue" format
      if (normalizedValue.startsWith("Others - ")) {
        return { label: "Others", value: "Others" };
      }

      // Find exact match in options
      const foundOption = allOptions?.find(
        (option) => String(option.value) === normalizedValue
      );
      return foundOption || null;
    }, [value, allOptions]);

    // Effect to initialize customValue and isOthersSelected based on the incoming 'value' prop
    useEffect(() => {
      if (!value) {
        setIsOthersSelected(false);
        setCustomValue("");
        return;
      }

      const normalizedValue = String(value);

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
    }, [value]);

    const displayValue = useMemo(() => {
      if (!value || value === "") {
        return placeholder;
      }

      const normalizedValue = String(value);

      if (normalizedValue.startsWith("Others - ")) {
        const customPart = normalizedValue.replace("Others - ", "");
        return `Others - ${customPart}`;
      }

      if (normalizedValue === "Others") {
        const result = customValue ? `Others - ${customValue}` : "Others";
        return result;
      }

      if (selectedOption) {
        return selectedOption.label;
      }

      return normalizedValue;
    }, [value, selectedOption, customValue, placeholder]);

    const updateValue = (newValue: string) => {
      if (hiddenInputRef.current && onChange) {
        // Update the hidden input value
        hiddenInputRef.current.value = newValue;

        // Create a proper synthetic event
        const syntheticEvent = {
          target: hiddenInputRef.current,
          currentTarget: hiddenInputRef.current,
          type: "change",
          bubbles: true,
          cancelable: true,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
      }
    };

    const handleOptionClick = (optionValue: string) => {
      if (disabled) return;

      const isOthers = optionValue === "Others";
      setIsOthersSelected(isOthers);

      const finalValue = isOthers ? "Others" : optionValue;
      updateValue(finalValue);

      if (!isOthers) {
        setCustomValue("");
      }
      setIsOpen(false);
    };

    const handleCustomInputChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newValue = e.target.value;
      setCustomValue(newValue);

      // Check if the typed value matches any existing option
      const matchingOption = options?.find(
        (option) =>
          option.value.toLowerCase() === newValue.toLowerCase() ||
          option.label.toLowerCase() === newValue.toLowerCase()
      );

      if (matchingOption) {
        // If it matches an existing option, use that option's value directly
        updateValue(matchingOption.value);
        setIsOthersSelected(false);
        setCustomValue("");
      } else {
        // Otherwise, treat it as a custom "Others" value
        const finalValue = newValue ? `Others - ${newValue}` : "Others";
        updateValue(finalValue);
      }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    };

    const handleToggle = () => {
      setIsOpen(!isOpen);
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
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen]);

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
            <input
              type="hidden"
              id={id}
              name={name}
              value={value || ""} // Controlled by the value prop
              ref={hiddenInputRef}
              disabled={disabled}
              onBlur={onBlur}
              {...rest} // Pass any other HTML input attributes
            />

            <div
              className={cn(
                `relative w-full flex px-3 py-[9px] text-sm justify-between items-center border shadow-sm focus:outline-none h-[2.4rem]`,
                value && value !== "" && displayValue !== placeholder
                  ? "border-primary bg-background text-primary font-medium"
                  : "border-input bg-input text-foreground",
                disabled
                  ? "focus:ring-muted-foreground focus:border-muted-foreground bg-muted/50 border-muted-foreground/50 cursor-not-allowed text-muted-foreground/40"
                  : "focus:ring-primary focus:border-primary",
                buttonClassName,
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
                  <p
                    className={cn(
                      `line-clamp-1`,
                      isOthersSelected
                        ? "text-transparent"
                        : value && value !== ""
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {displayValue}
                  </p>
                  {isOthersSelected && (
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
                        `absolute top-0 left-0 h-full pr-3 py-[10px] text-primary bg-transparent outline-none text-sm font-medium text-ellipsis overflow-hidden truncate`,
                        `w-[calc(100%-2.5rem)]`
                      )}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
                <div className="flex-shrink-0 w-8 flex items-center justify-end">
                  <ChevronDown
                    className={cn(
                      "text-sm transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
              </div>
            </div>
            {isOpen && (
              <div
                className={cn(
                  `absolute z-50 left-0 right-0 top-[100%] bg-popover border rounded-b-md shadow-lg overflow-hidden border-primary border-t-0 text-left`,
                  "animate-slide-down",
                  dropdownClassName
                )}
                style={
                  {
                    "--dropdown-max-height": `${maxHeight}px`,
                  } as React.CSSProperties
                }
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
                          disabled
                            ? "text-muted-foreground"
                            : "text-foreground",
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
                        key={index}
                        className={cn(
                          `px-4 py-2 cursor-pointer hover:bg-accent/10 hover:text-accent-foreground text-sm border-b border-border last:border-b-0`,
                          optionClassName || "text-foreground",
                          value === option.value ||
                            (isOthersSelected && option.value === "Others")
                            ? `font-medium text-primary bg-primary/10`
                            : ""
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
            )}
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
