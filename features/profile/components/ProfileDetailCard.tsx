import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { PersonDetail } from "../types";

/**
 * Left card of the Profile page (Figma 414:822): flat light-gray card,
 * centered identity block (avatar 100px, name, Bio.), centered lime
 * social circles and skill pills, then Detail Information rows built as
 * lime icon-circle + stacked label/value. The pencil and ••• are
 * presentational — profile editing is out of scope. Sections without
 * data are hidden rather than rendered empty.
 */
export function ProfileDetailCard({ person }: { person: PersonDetail }) {
  return (
    <section
      aria-label="Profile detail"
      className="flex w-full shrink-0 flex-col rounded-3xl bg-bg p-6 lg:w-[400px] xl:w-[440px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Profile Detail</h2>
        <button
          type="button"
          aria-label="Profile options"
          className="flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
        >
          <Icon name="dots-horizontal-rounded" size={20} />
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <Avatar size={100} alt={person.name} />
        <p className="mt-3 text-[28px] leading-tight font-bold text-ink">
          {person.name}
        </p>
      </div>

      {person.bio && (
        <div className="mt-4 text-center">
          <p className="text-[13px] text-muted">Bio.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{person.bio}</p>
        </div>
      )}

      {person.socials && person.socials.length > 0 && (
        <ul className="mt-6 flex items-center justify-center gap-2.5" aria-label="Social links">
          {person.socials.map((social) => (
            <li key={social.label}>
              <span
                title={social.label}
                className="flex size-11 items-center justify-center rounded-full bg-accent text-ink"
              >
                <i aria-hidden="true" className={`bx bxl-${social.icon} text-[20px]`} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {person.skills && person.skills.length > 0 && (
        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Skills">
          {person.skills.map((skill) => (
            <li
              key={skill.id}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[13px] font-medium text-ink"
            >
              {skill.icon && <Icon name={skill.icon} size={15} />}
              {skill.label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Detail Information</h3>
          <span className="text-ink" title="Editing is not available yet">
            <Icon name="pencil" size={18} />
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
              <Icon name="user" size={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Full Name</span>
              <span className="text-[15px] font-bold text-ink">{person.name}</span>
            </div>
          </div>
          {person.email && (
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
                <Icon name="envelope" size={18} />
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-muted">Email</span>
                <span className="text-[15px] font-bold text-ink">{person.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
