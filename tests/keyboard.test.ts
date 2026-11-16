import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { describe, expect, it } from "vitest";
import { isImeConfirmingEnter } from "@/lib/keyboard";

// Regression guard for the IME Enter fix: an Enter that
// confirms an IME composition candidate must not submit.
function enterEvent(isComposing: boolean, keyCode: number): ReactKeyboardEvent {
  return {
    nativeEvent: { isComposing, keyCode },
  } as unknown as ReactKeyboardEvent;
}

describe("isImeConfirmingEnter", () => {
  it("is true while the IME is composing", () => {
    expect(isImeConfirmingEnter(enterEvent(true, 13))).toBe(true);
  });

  it("is true for Safari's keyCode 229 confirmation", () => {
    expect(isImeConfirmingEnter(enterEvent(false, 229))).toBe(true);
  });

  it("is false for a plain Enter", () => {
    expect(isImeConfirmingEnter(enterEvent(false, 13))).toBe(false);
  });
});
