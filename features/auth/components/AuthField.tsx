"use client";

import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { TextInput } from "@astryxdesign/core/TextInput";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@/components/ui/Icon";

interface AuthFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Label + input + inline error, rebuilt on Astryx's TextInput
 * (redesign 2026-11-13): the field, its label, focus ring and
 * error status are all Astryx's now. The external API is the
 * app's original one (event-based onChange) so the auth forms
 * did not have to change; the adapter lives here. The password
 * eye stays a real toggle: Astryx has no trailing slot inside
 * TextInput, so the toggle rides beside the field as an Astryx
 * ghost IconButton, aligned to the input box under the label.
 */
export function AuthField({ label, error, hint, id, type, onChange, value, ...rest }: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  // Astryx reports the value directly; the forms consume a
  // change event, so adapt at this boundary.
  const handleChange = (value: string) => {
    if (!onChange) return;
    const target = { value } as EventTarget & HTMLInputElement;
    onChange({
      target,
      currentTarget: target,
    } as ChangeEvent<HTMLInputElement>);
  };

  const astryxType: "text" | "password" | "email" | "search" | "tel" | "url" =
    inputType === "email"
      ? "email"
      : inputType === "search"
        ? "search"
        : inputType === "tel"
          ? "tel"
          : inputType === "url"
            ? "url"
            : inputType === "password"
              ? "password"
              : "text";

  const field = (
    <TextInput
      id={id}
      label={label}
      size="lg"
      controlStyle={{ height: 48, fontSize: 15 }}
      type={astryxType}
      description={error ? undefined : hint}
      status={error ? { type: "error", message: error } : undefined}
      value={typeof value === "string" ? value : ""}
      onChange={handleChange}
      {...(rest as Record<string, unknown>)}
    />
  );

  if (!isPassword) return field;

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">{field}</div>
      <IconButton
        label={showPassword ? "Hide password" : "Show password"}
        variant="ghost"
        icon={<Icon name={showPassword ? "hide" : "show"} size={20} />}
        onClick={() => setShowPassword((v) => !v)}
        aria-pressed={showPassword}
        className="shrink-0"
        style={{ marginTop: 46 }}
      />
    </div>
  );
}
