"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SettingsSection } from "./SettingsSection";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I join a project?",
    a: "Open a project on the Collaborations page and press Apply. Add a short message so the owner knows what you bring. The owner reviews your application in their Inbox; once you are accepted, the project appears in your My Collaborations.",
  },
  {
    q: "How do I start a project?",
    a: "Press New Project on the Collaborations page. Describe what you are building, add the roles you need as skills, and set the team size and a due date. Applications land in your Inbox, where you can accept or decline them.",
  },
  {
    q: "What happens after I am accepted?",
    a: "You become a member of the project. From My Collaborations you can open the project's Circle, a private space for the team with an announcements channel and a general channel.",
  },
  {
    q: "Where do I manage applications?",
    a: "In the Inbox. Applications live there as conversations with the applicant, and the application card inside carries the Accept and Decline actions. Your own sent applications show their status in the same place.",
  },
  {
    q: "How do I change my photo or skills?",
    a: "In the Profile section above. A new photo and skill changes apply everywhere right away: your profile, your applications, and the member lists of your projects.",
  },
];

/**
 * Help Center — the sidebar's old Help Center item moved here,
 * as planned when it was removed (2026-11-07). Static answers
 * about the flows that actually exist in the app; the accordion
 * keeps the section compact, one answer open at a time.
 */
export function HelpSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <SettingsSection
      title="Help Center"
      description="How the main flows in Underflow work."
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
