"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SettingsSection } from "./SettingsSection";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

const FAQ_KEYS: { q: DictKey; a: DictKey }[] = [
  { q: "settings.help.q1", a: "settings.help.a1" },
  { q: "settings.help.q2", a: "settings.help.a2" },
  { q: "settings.help.q3", a: "settings.help.a3" },
  { q: "settings.help.q4", a: "settings.help.a4" },
  { q: "settings.help.q5", a: "settings.help.a5" },
];

/**
 * Help Center — the sidebar's old Help Center item moved here,
 * as planned when it was removed (2026-11-07). Static answers
 * about the flows that actually exist in the app; the accordion
 * keeps the section compact, one answer open at a time.
 */
export function HelpSection() {
  const { t } = useLanguage();
  const FAQS = FAQ_KEYS.map(({ q, a }) => ({ q: t(q), a: t(a) }));
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <SettingsSection
      title={t("settings.help.title")}
      description={t("settings.help.description")}
    >
      <div className="flex flex-col">
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className={i > 0 ? "border-t border-line" : ""}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="pressable flex w-full cursor-pointer items-center gap-3 py-3 text-left"
              >
                <span className="flex-1 text-sm font-medium text-ink">
                  {item.q}
                </span>
                <span
                  className={
                    "text-muted transition-transform duration-200 " +
                    (open ? "rotate-180" : "")
                  }
                >
                  <Icon name="chevron-down" size={18} />
                </span>
              </button>
              {open && (
                <p
                  className="pb-3 text-sm leading-relaxed text-muted"
                  style={{ animation: "uf-fade-in 160ms ease-out" }}
                >
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </SettingsSection>
  );
}
