import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/**
 * True when this Enter keydown is an IME composition confirmation
 * (the user is confirming a character candidate while typing with
 * an Input Method Editor, e.g. Japanese / Chinese / Korean), not
 * an intent to submit. Acting on it would send half-composed text.
 * Safari may already have reset isComposing by the time the
 * handler runs, but it reports the confirming keydown with
 * keyCode 229, so both signals are checked.
 * (modern-web-guidance guide: ime-safe-enter-submit.)
 */
export function isImeConfirmingEnter(e: ReactKeyboardEvent): boolean {
  return e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229;
}
