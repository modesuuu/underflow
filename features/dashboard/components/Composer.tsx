import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { CURRENT_USER } from "@/components/layout/nav";

export function Composer() {
  return (
    <section className="sheet flex gap-3 p-4">
      <Avatar size={42} alt={CURRENT_USER.name} />
      <div className="flex flex-1 flex-col justify-center gap-3">
        {/* TODO(backend): POST /api/posts on submit */}
        <button
          type="button"
          className="pressable flex w-full cursor-text items-center justify-between border-b border-rule pb-2 text-left"
        >
          <span className="text-sm text-subtle">
            Post something
          </span>
          <Icon name="send" size={20} className="text-ink" />
        </button>
        <div className="flex items-center gap-3">
          {/* TODO(backend): photo/file upload endpoints */}
          <button type="button" className="pressable flex items-center gap-0.5 text-muted transition-colors hover:text-ink">
            <Icon name="image-add" size={16} />
            <span className="text-xs font-medium">Photo</span>
          </button>
          <button type="button" className="pressable flex items-center gap-0.5 text-muted transition-colors hover:text-ink">
            <Icon name="paperclip" size={16} />
            <span className="text-xs font-medium">File</span>
          </button>
        </div>
      </div>
    </section>
  );
}