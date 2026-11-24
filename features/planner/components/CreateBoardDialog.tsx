"use client";

// features/planner/components/CreateBoardDialog.tsx
// The New board flow: two kinds, mirroring how Circle works.
// A team board attaches to a collaboration (opt-in — a collab
// may or may not have one, and at most one), a personal board
// belongs to the user alone. Rendered once by the sidebar and
// portaled to <body>, because the sidebar's mobile drawer
// transform would otherwise become the dialog's containing
// block and squash it into the drawer strip.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getSessionUser } from "@/features/auth/session";
import {
  SAMPLE_COLLABS,
  createBoard,
  setCreateBoardOpen,
  useBoards,
  useCreateBoardOpen,
} from "../boards";

export function CreateBoardDialog() {
  const open = useCreateBoardOpen();
  const { t } = useLanguage();
  const router = useRouter();
  const boards = useBoards();
  const [kind, setKind] = useState<"team" | "personal">("team");
  const [collab, setCollab] = useState<string | null>(null);
  const [name, setName] = useState("");

  // Fresh choices every time the dialog opens.
  useEffect(() => {
    if (open) {
      setKind("team");
      setCollab(null);
      setName("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreateBoardOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  if (!open) return null;

  const teamedCollabs = new Set(
    boards
      .filter((b) => b.kind === "team")
      .map((b) => b.collabName)
      .filter((c): c is string => !!c),
  );
  const canCreate =
    kind === "team"
      ? !!collab && !teamedCollabs.has(collab)
      : name.trim().length > 0;

  const submit = () => {
    if (!canCreate) return;
    const ownerName = getSessionUser()?.name ?? "Raka Alfarezi";
    const board = createBoard(
      kind === "team"
        ? { kind, collabName: collab ?? undefined, ownerName }
        : { kind, name: name.trim(), ownerName },
    );
    setCreateBoardOpen(false);
    router.push(`/tasks/${board.id}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[96]">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.32)" }}
        onClick={() => setCreateBoardOpen(false)}
      />
      <div
        className="absolute inset-0 flex overflow-y-auto p-4"
        onClick={() => setCreateBoardOpen(false)}
      >
        <div
          className="m-auto w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">
              {t("nav.newBoard")}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setCreateBoardOpen(false)}
              className="rounded-full p-1.5 text-muted hover:bg-active hover:text-ink"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setKind("team")}
              className={`flex items-start gap-3 rounded-lg border p-3.5 text-left ${
                kind === "team"
                  ? "border-ink bg-active"
                  : "border-line bg-surface"
              }`}
            >
              <Icon name="group" size={20} className="mt-0.5 shrink-0 text-ink" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">
                  {t("planner.boardKindTeam")}
                </span>
                <span className="text-xs text-muted">
                  {t("planner.boardKindTeamDesc")}
                </span>
              </span>
              {kind === "team" && (
                <Icon
                  name="check-circle"
                  size={18}
                  className="ml-auto shrink-0 text-accent"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setKind("personal")}
              className={`flex items-start gap-3 rounded-lg border p-3.5 text-left ${
                kind === "personal"
                  ? "border-ink bg-active"
                  : "border-line bg-surface"
              }`}
            >
              <Icon name="user" size={20} className="mt-0.5 shrink-0 text-ink" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">
                  {t("planner.boardKindPersonal")}
                </span>
                <span className="text-xs text-muted">
                  {t("planner.boardKindPersonalDesc")}
                </span>
              </span>
              {kind === "personal" && (
                <Icon
                  name="check-circle"
                  size={18}
                  className="ml-auto shrink-0 text-accent"
                />
              )}
            </button>
          </div>

          <div className="mt-4">
            {kind === "team" ? (
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                  {t("planner.pickCollab")}
                </span>
                <div className="flex flex-col gap-1">
                  {SAMPLE_COLLABS.map((c) => {
                    const has = teamedCollabs.has(c);
                    const selected = collab === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={has}
                        onClick={() => setCollab(c)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm ${
                          selected
                            ? "border-ink bg-active font-medium text-ink"
                            : "border-line text-ink"
                        } ${has ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${
                            selected ? "bg-accent" : "bg-line"
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate">{c}</span>
                        {has && (
                          <span className="text-xs text-muted">
                            {t("planner.boardExists")}
                          </span>
                        )}
                        {selected && !has && (
                          <Icon
                            name="check"
                            size={16}
                            className="shrink-0 text-accent"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <label className="flex flex-col gap-1">
                <span className="font-mono text-2xs font-medium uppercase tracking-wider text-muted">
                  {t("planner.boardName")}
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("planner.boardNamePlaceholder")}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none"
                />
              </label>
            )}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateBoardOpen(false)}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canCreate}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("planner.createBoard")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
