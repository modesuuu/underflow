import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { PersonDetail } from "../types";

/**
 * Left card of the Profile page. Typography, spacing, colors, and icons
 * follow the Figma frame (414:822) values exactly as read from the
 * design: PP Neue Montreal Medium 20px card titles, Book 14px bio in
 * --uf-subtle, 36px lime social chips with 24px brand glyphs, skill
 * pills with the bracket-curly glyph, Detail Information rows with a
 * 28px lime icon chip + Medium 14/16 label/value. The ••• and edit-alt
 * are presentational — profile editing is out of scope. Sections
 * without data are hidden rather than rendered empty.
 */
export function ProfileDetailCard({ person }: { person: PersonDetail }) {
  return (
    <section
      aria-label="Profile detail"
      className="flex w-full shrink-0 flex-col gap-[42px] rounded-3xl bg-bg p-6 lg:w-[397px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-medium text-ink">Profile Detail</h2>
        <button
          type="button"
          aria-label="Profile options"
          className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
        >
          <Icon name="dots-horizontal-rounded" size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3.5">
        <div className="flex flex-col items-center gap-3">
          <Avatar size={100} alt={person.name} />
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-[20px] font-medium text-ink">{person.name}</p>
            {person.bio && (
              <div className="text-sm font-normal text-subtle">
                <p>Bio.</p>
                <p>{person.bio}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3.5">
          {person.socials && person.socials.length > 0 && (
            <ul className="flex items-center gap-1.5" aria-label="Social links">
              {person.socials.map((social) => (
                <li key={social.label}>
                  <span
                    title={social.label}
                    className="flex size-9 items-center justify-center rounded-full bg-accent text-ink"
                  >
                    <i
                      aria-hidden="true"
                      className={`bx bxl-${social.icon} text-[24px]`}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {person.skills && person.skills.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Skills">
              {person.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink"
                >
                  <Icon name="code-curly" size={16} />
                  {skill.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-medium text-ink">Detail Information</h3>
          <span className="text-ink" title="Editing is not available yet">
            <Icon name="edit-alt" size={24} />
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-[7px]">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
              <Icon name="user" size={16} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-muted">Full Name</span>
              <span className="text-base font-medium text-ink">{person.name}</span>
            </div>
          </div>
          {person.email && (
            <div className="flex items-center gap-[7px]">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
                <Icon name="envelope" size={16} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-muted">Email</span>
                <span className="text-base font-medium text-ink">{person.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
