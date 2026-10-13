import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { PersonDetail } from "../types";

/**
 * Left card of the Profile page (Figma 414:822 "Profile Detail"): identity,
 * bio, socials, skills, then the Detail Information rows. The pencil and
 * the ••• menu are presentational — profile editing is out of scope.
 * Sections without data are hidden rather than rendered empty.
 */
export function ProfileDetailCard({ person }: { person: PersonDetail }) {
  return (
    <section
      aria-label="Profile detail"
      className="flex flex-col rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Profile Detail</h2>
        <button
          type="button"
          aria-label="Profile options"
          className="flex size-8 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-bg hover:text-ink"
        >
          <Icon name="dots-horizontal-rounded" size={20} />
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <Avatar size={80} alt={person.name} />
        <p className="mt-3 text-xl font-bold text-ink">{person.name}</p>
        {person.role && (
          <p className="mt-0.5 text-[13px] text-ink/60">{person.role}</p>
        )}
      </div>

      {person.bio && (
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-ink/60">Bio.</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{person.bio}</p>
        </div>
      )}

      {person.socials && person.socials.length > 0 && (
        <ul className="mt-5 flex items-center gap-2.5" aria-label="Social links">
          {person.socials.map((social) => (
            <li key={social.label}>
              <span
                title={social.label}
                className="flex size-10 items-center justify-center rounded-full bg-accent text-ink"
              >
                <i aria-hidden="true" className={`bx bxl-${social.icon} text-[18px]`} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {person.skills && person.skills.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Skills">
          {person.skills.map((skill) => (
            <li
              key={skill.id}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-ink"
            >
              {skill.icon && <Icon name={skill.icon} size={14} />}
              {skill.label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7 border-t border-line pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Detail Information</h3>
          <span className="text-ink/60" title="Editing is not available yet">
            <Icon name="pencil" size={16} />
          </span>
        </div>
        <dl className="mt-4 flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[13px] text-ink/60">Full Name</dt>
            <dd className="text-sm font-medium text-ink">{person.name}</dd>
          </div>
          {person.email && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[13px] text-ink/60">Email</dt>
              <dd className="text-sm font-medium text-ink">{person.email}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
