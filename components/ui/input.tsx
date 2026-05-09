"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "./label";

type InputProps = React.ComponentProps<"input"> & {
  label?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, type, id, value, defaultValue, onChange, onScroll, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState((defaultValue ?? "") as string);
    const highlighterRef = React.useRef<HTMLDivElement>(null);
    const internalRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    const isControlled = value !== undefined;
    const displayValue = (isControlled ? value : uncontrolledValue) as string;

    const syncScroll = React.useCallback(() => {
      if (internalRef.current && highlighterRef.current) {
        highlighterRef.current.scrollLeft = internalRef.current.scrollLeft;
      }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setUncontrolledValue(e.target.value);
      }
      onChange?.(e);
      // Sync scroll after a tiny delay to allow the input to update its scroll position
      requestAnimationFrame(syncScroll);
    };

    const handleScroll = (e: React.UIEvent<HTMLInputElement>) => {
      syncScroll();
      onScroll?.(e);
    };

    // Regex for {{variable}}
    const highlightText = (text: string) => {
      if (!text) return null;
      const parts = text.split(/(\{\{[^{}]*\}\})/g);
      return parts.map((part, i) => {
        if (part.startsWith("{{") && part.endsWith("}}")) {
          return (
            <span key={i} className="text-orange-500 font-semibold drop-shadow-[0_0_1px_rgba(249,115,22,0.3)]">
              {part}
            </span>
          );
        }
        return part;
      });
    };

    const isPassword = type === "password";

    return (
      <div className="space-y-0 w-full">
        {label && <Label htmlFor={id}>{label}</Label>}

        <div className="relative w-full group">
          {/* Highlighter Layer */}
          {!isPassword && (
            <div
              ref={highlighterRef}
              aria-hidden="true"
              className={cn(
                "absolute inset-0 h-8 w-full px-2 py-0.5 text-sm md:text-xs/relaxed pointer-events-none flex items-center overflow-hidden whitespace-pre border border-transparent",
                "font-sans tracking-normal leading-normal", // Ensure matching font metrics
                "opacity-100"
              )}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {highlightText(displayValue)}
              {/* Add a transparent character to maintain height if empty */}
              {!displayValue && <span className="opacity-0">P</span>}
            </div>
          )}

          <input
            id={id}
            ref={internalRef}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyUp={syncScroll}
            onKeyDown={syncScroll}
            onMouseUp={syncScroll}
            data-slot="input"
            className={cn(
              "h-8 w-full min-w-0 rounded-md border border-input bg-input/20 px-2 py-0.5 text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs/relaxed file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-xs/relaxed dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
              // Hide the actual text color but keep it for selection and caret
              !isPassword && "text-transparent caret-foreground selection:bg-orange-500/30",
              // Ensure placeholder is still visible
              "placeholder:text-muted-foreground",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };