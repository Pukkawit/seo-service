"use client";

import React from "react";
import { useState, useEffect } from "react"; // Import useState and useEffect

import { cn } from "@/lib/utils";

interface TextFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "onBlur" | "value" | "ref"
  > {
  label: string;
  instruction?: string;
  labelClassName?: string;
  inputClassName?: string;
  width?: string;
  error?: string | false | undefined;
  touched?: boolean;
  prefix?: string | undefined;
  value?: string | number | string[] | undefined;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  ref?: React.Ref<HTMLInputElement>;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      instruction,
      id,
      name,
      type = "text",
      value,
      placeholder = "",
      required = false,
      className = "",
      labelClassName = "",
      inputClassName = "",
      disabled = false,
      width = "100%",
      error,
      touched,
      prefix,
      autoFocus,
      onKeyDown,
      onChange, // This is the onChange from RHF or parent
      onBlur, // This is the onBlur from RHF or parent
      min,
      max,
      step,
      ...htmlInputProps
    },
    ref
  ) => {
    // Internal state to manage the input's displayed value
    const [internalValue, setInternalValue] = useState<string | number>(() =>
      Array.isArray(value) ? value.join(",") : value || ""
    );

    // Sync external value prop with internal state
    useEffect(() => {
      setInternalValue(Array.isArray(value) ? value.join(",") : value || "");
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(`[TextField] Input changed: ${e.target.value}`);
      setInternalValue(e.target.value); // Update internal state for display
      if (onChange) {
        onChange(e); // Propagate change to RHF
      }
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      console.log(`[TextField] Input blurred: ${e.target.value}`);
      if (onBlur) {
        onBlur(e); // Propagate blur to RHF
      }
    };

    return (
      <div
        className={cn(
          `flex flex-col gap-[2px]`,
          className,
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{ width }}
      >
        {label && (
          <div className="flex justify-between items-center">
            <label
              htmlFor={id}
              className={cn(
                `block text-sm font-medium text-foreground/90 tracking-wide`,
                labelClassName
              )}
            >
              {label}
            </label>
          </div>
        )}
        {instruction && (
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            {instruction}
          </p>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div
              className={cn(
                "relative text-muted-foreground p-2 bg-muted/20 text-sm",
                internalValue && "bg-secondary"
              )}
            >
              {prefix}
            </div>
          )}
          <input
            {...htmlInputProps}
            type={type}
            ref={ref}
            id={id}
            name={name}
            value={internalValue} // Use internal state for display
            onChange={handleInputChange} // Use internal handler
            onBlur={handleInputBlur} // Use internal handler
            {...(type === "number" ? { min, max, step } : {})}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
            className={cn(
              `block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-sm`,
              prefix ? "pl-3 rounded-l-none" : "pl-3",
              internalValue &&
                "font-medium border-primary bg-background text-primary", // Use internalValue for styling
              "focus:ring-primary focus:border-primary bg-input  border-input",
              inputClassName,
              touched && error ? "border-destructive text-destructive" : ""
            )}
          />
        </div>
        <div>
          {error ? (
            <p className="mt-1 text-sm text-destructive text-left">{error}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

TextField.displayName = "TextField";

export default TextField;
