"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useSessionUser } from "@/features/auth/store";
import { backendErrorMessage } from "@/features/collaborations/api";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import type { MyCollabProject } from "@/features/my-collaborations/types";
import { createCircle, getCircleDetail, getCircles, markZoneRead } from "../api";
import { setPanelOpen, subscribeZoneMessages, usePanelState } from "../store";
import type { CircleDetail, CircleSummary, CircleZone } from "../types";
import { CirclePanel } from "./CirclePanel";
import { CircleRail } from "./CircleRail";
import { CircleSettingsModal } from "./CircleSettingsModal";
import { CreateCircleModal } from "./CreateCircleModal";
import { CreateZoneModal } from "./CreateZoneModal";
import { ZoneSettingsModal } from "./ZoneSettingsModal";
import { CreateCircleRows } from "./CreateCircleRows";
import { circleStatusKey } from "./statusLabel";
import { ZoneConversation } from "./ZoneConversation";
import { ZoneHeader } from "./ZoneHeader";
import { ZoneSidebar, ZoneSwitcher } from "./ZoneSidebar";

/**
 * The Circle workspace (one-page redesign): a single page for every
 * circle the user can access. The far-left rail switches circles, the
 * zone column switches zones, and the conversation sits in the middle
 * with the collapsible team panel on the right. Switching is client
 * state; the URL is kept in sync with history.replaceState so a link
 * still points at the open circle + zone, and the deep-link routes
 * (/circle/:circleId/:zoneId) render this same workspace pre-selected.
 *
 * Panel visibility follows the Phase 1 rule: the store override wins,
 * otherwise open at >=1280px; below that it becomes a right overlay.
 */
export function CircleWorkspace({
  initialCircleId,
  initialZoneId,
}: {
  initialCircleId?: string;
  initialZoneId?: string;
}) {
  const { t } = useLanguage();
  const sessionUser = useSessionUser();
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(
    initialCircleId ?? null
  );
  const [detail, setDetail] = useState<CircleDetail | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    initialZoneId ?? null
  );
  const [missing, setMissing] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [withoutCircle, setWithoutCircle] = useState<MyCollabProject[]>([]);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [settingsZone, setSettingsZone] = useState<CircleZone | null>(null);
  const [showCircleSettings, setShowCircleSettings] = useState(false);
  const deepLink = useRef(
    Boolean(initialCircleId && initialZoneId)
  );
  const loadedCircleId = useRef<string | null>(null);
  const selectedZoneRef = useRef<string | null>(initialZoneId ?? null);

  useEffect(() => {
    selectedZoneRef.current = selectedZoneId;
  }, [selectedZoneId]);
  const detailRef = useRef<CircleDetail | null>(null);
  useEffect(() => {
    detailRef.current = detail;
  }, [detail]);

  // Live unread counts: the realtime socket pushes every zone
  // message to all circle members and LivePoller forwards it here,
  // so the badges bump in place instead of waiting for the next
  // fetch. The open zone is excluded (its conversation marks
  // itself read) and own messages never count.
  useEffect(() => {
    return subscribeZoneMessages((event) => {
      if (sessionUser && event.message.authorId === sessionUser.id) return;
      const open = detailRef.current;
      if (
        open &&
        event.circleId === open.id &&
        event.zoneId === selectedZoneRef.current
      ) {
        return;
      }
      const myName = sessionUser?.username ?? "";
      const mentionsMe =
        event.message.mentionsEveryone ||
        (myName !== "" &&
          new RegExp(
            `(^|\\s)@${myName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s.,!?;:])`
          ).test(event.message.content));
      if (open && event.circleId === open.id) {
        setDetail((prev) =>
          prev && prev.id === event.circleId
            ? {
                ...prev,
                zones: prev.zones.map((z) =>
                  z.id === event.zoneId
                    ? {
                        ...z,
                        unreadCount: z.unreadCount + 1,
                        ...(mentionsMe
                          ? {
                              mentionCount: z.mentionCount + 1,
                              firstMentionId: z.firstMentionId ?? event.message.id,
                            }
                          : {}),
                      }
                    : z
                ),
              }
            : prev
        );
      }
      setCircles((prev) =>
        prev
          ? prev.map((c) =>
              c.id === event.circleId
                ? {
                    ...c,
                    unreadCount: c.unreadCount + 1,
                    mentionCount: c.mentionCount + (mentionsMe ? 1 : 0),
                  }
                : c
            )
          : prev
      );
    });
  }, [sessionUser]);

  // The circles the user can access; preselect the deep-linked one or
  // the first in the list.
  useEffect(() => {
    let cancelled = false;
    getCircles()
      .then((rows) => {
        if (cancelled) return;
        setCircles(rows);
        setSelectedCircleId((prev) => prev ?? rows[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setCircles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Owned projects that still have no Circle (create affordance).
  useEffect(() => {
    if (!sessionUser) return;
    let cancelled = false;
    getMyCollabProjects()
      .then((projects) => {
        if (cancelled) return;
        setWithoutCircle(
          projects.filter(
            (p) =>
              p.owner.id === sessionUser.id &&
              !p.circleId &&
              p.myStatus !== "pending"
          )
        );
      })
      .catch(() => {
        // The create affordance simply stays hidden.
      });
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  // Load the selected circle's detail (zones + members).
  useEffect(() => {
    if (!selectedCircleId) return;
    let cancelled = false;
    setDetail(null);
    setDetailError(false);
    getCircleDetail(selectedCircleId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        if (deepLink.current && data.id === initialCircleId) {
          deepLink.current = false;
          if (
            initialZoneId &&
            !data.zones.some((z) => z.id === initialZoneId)
          ) {
            setMissing(true);
            return;
          }
          setSelectedZoneId(initialZoneId ?? data.zones[0]?.id ?? null);
        } else if (loadedCircleId.current !== data.id) {
          // A different circle: land on its first zone.
          setSelectedZoneId(data.zones[0]?.id ?? null);
        } else if (
          !data.zones.some((z) => z.id === selectedZoneRef.current)
        ) {
          setSelectedZoneId(data.zones[0]?.id ?? null);
        }
        loadedCircleId.current = data.id;
      })
      .catch((err) => {
        if (cancelled) return;
        if (
          initialCircleId &&
          selectedCircleId === initialCircleId &&
          err instanceof ApiError &&
          (err.status === 403 || err.status === 404)
        ) {
          // A deep link to a circle the user cannot open.
          setMissing(true);
        } else {
          setDetailError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCircleId, initialCircleId, initialZoneId]);

  // Keep the shareable URL pointed at the open circle + zone without
  // a route change (the workspace itself never remounts on a switch).
  useEffect(() => {
    if (!detail || !selectedZoneId) return;
    const url = `/circle/${detail.id}/${selectedZoneId}`;
    if (window.location.pathname !== url) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [detail, selectedZoneId]);

  const handleCreate = async (project: MyCollabProject) => {
    setCreatingId(project.id);
    try {
      const created = await createCircle(project.id);
      setCircles((prev) =>
        prev
          ? [
              ...prev.filter((c) => c.id !== created.id),
              {
                id: created.id,
                projectId: created.projectId,
                title: created.title,
                photoProfileUrl: created.photoUrl,
                unreadCount: 0,
                mentionCount: 0,
                status: created.status,
                isOwner: true,
                memberNames: created.members.map((m) => m.name),
                memberCount: created.members.length,
              },
            ]
          : prev
      );
      setWithoutCircle((prev) => prev.filter((p) => p.id !== project.id));
      setSelectedCircleId(created.id);
      return true;
    } catch (err) {
      toast.error(backendErrorMessage(err));
      return false;
    } finally {
      setCreatingId(null);
    }
  };

  const selectedSummary = (circles ?? []).find(
    (c) => c.id === selectedCircleId
  );
  const isOwner =
    selectedSummary?.isOwner ??
    detail?.members.some(
      (m) => m.userId === sessionUser?.id && m.isOwner
    ) ??
    false;

  const refreshDetail = async (circleId: string, preferZoneId?: string) => {
    const data = await getCircleDetail(circleId);
    setDetail(data);
    loadedCircleId.current = data.id;
    if (preferZoneId && data.zones.some((z) => z.id === preferZoneId)) {
      setSelectedZoneId(preferZoneId);
    } else if (!data.zones.some((z) => z.id === selectedZoneRef.current)) {
      setSelectedZoneId(data.zones[0]?.id ?? null);
    }
  };

  const handleZoneCreated = async (zone: CircleZone) => {
    setShowCreateZone(false);
    toast.success(t("circle.zoneCreated"));
    if (detail) await refreshDetail(detail.id, zone.id);
  };

  const handleZoneSaved = async (zone: CircleZone) => {
    setSettingsZone(null);
    toast.success(t("circle.changesSaved"));
    if (detail) await refreshDetail(detail.id, zone.id);
  };

  const handleZoneDeleted = async () => {
    setSettingsZone(null);
    toast.success(t("circle.zoneDeleted"));
    if (detail) await refreshDetail(detail.id);
  };

  const handleCircleSaved = (fresh: CircleDetail) => {
    setDetail(fresh);
    setCircles((prev) =>
      prev
        ? prev.map((c) =>
            c.id === fresh.id
              ? {
                  ...c,
                  title: fresh.title,
                  photoProfileUrl: fresh.photoUrl,
                }
              : c
          )
        : prev
    );
    setShowCircleSettings(false);
    toast.success(t("circle.changesSaved"));
  };

  const handleCircleDeleted = () => {
    if (!detail) return;
    const deletedId = detail.id;
    const remaining = (circles ?? []).filter((c) => c.id !== deletedId);
    setShowCircleSettings(false);
    setDetail(null);
    setCircles(remaining);
    setSelectedCircleId(remaining[0]?.id ?? null);
    toast.success(t("circle.circleDeleted"));
    // The project can pick a group space again: refresh the
    // without-circle list so its create affordance comes back.
    if (sessionUser) {
      getMyCollabProjects()
        .then((projects) => {
          setWithoutCircle(
            projects.filter(
              (p) =>
                p.owner.id === sessionUser.id &&
                !p.circleId &&
                p.myStatus !== "pending"
            )
          );
        })
        .catch(() => {
          // The create affordance simply stays as it was.
        });
    }
  };

  // Mention jump: the zone rows carry a pill with the mention
  // count; activating it selects the zone and asks its
  // conversation to scroll to the first mentioning message.
  const [jumpRequest, setJumpRequest] = useState<{
    zoneId: string;
    messageId: string;
    nonce: number;
  } | null>(null);
  const handleJumpToMention = (z: CircleZone) => {
    if (!z.firstMentionId) return;
    setSelectedZoneId(z.id);
    setJumpRequest({
      zoneId: z.id,
      messageId: z.firstMentionId,
      nonce: Date.now(),
    });
  };

  const markCurrentZoneRead = (newestCreatedAt?: string) => {
    if (!detail || !selectedZoneId) return;
    const zone = detail.zones.find((z) => z.id === selectedZoneId);
    if (!zone || zone.unreadCount === 0) return;
    const circleId = detail.id;
    const zoneId = zone.id;
    const count = zone.unreadCount;
    const mentions = zone.mentionCount;
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            zones: prev.zones.map((z) =>
              z.id === zoneId
                ? {
                    ...z,
                    unreadCount: 0,
                    lastRead: newestCreatedAt ?? z.lastRead,
                    mentionCount: 0,
                    firstMentionId: null,
                  }
                : z
            ),
          }
        : prev
    );
    setCircles((prev) =>
      prev
        ? prev.map((c) =>
            c.id === circleId
              ? {
                  ...c,
                  unreadCount: Math.max(0, c.unreadCount - count),
                  mentionCount: Math.max(0, c.mentionCount - mentions),
                }
              : c
          )
        : prev
    );
    void markZoneRead(circleId, zoneId).catch(() => {
      // Best-effort: counts refresh on the next fetch.
    });
  };

  // Right-panel visibility + mount animation (Phase 1 shell logic).
  const panel = usePanelState();
  const [isWide, setIsWide] = useState(false);
  const [renderPanel, setRenderPanel] = useState(false);
  const [panelShown, setPanelShown] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const apply = () => setIsWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const panelVisible = panel.open ?? isWide;

  useEffect(() => {
    if (panelVisible) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setRenderPanel(true);
      const raf = requestAnimationFrame(() => setPanelShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setPanelShown(false);
    closeTimer.current = setTimeout(() => setRenderPanel(false), 230);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [panelVisible]);

  if (missing) notFound();

  if (circles === null) {
    return (
      <AppShell
        fill
        breadcrumbRoot="Dashboard / Circle"
        breadcrumbLeaf={t("circle.title")}
        variant="detail"
      >
        <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-muted">
          {t("circle.loadingCircles")}
        </div>
      </AppShell>
    );
  }

  if (circles.length === 0 && !initialCircleId) {
    return (
      <AppShell breadcrumbRoot="Dashboard" breadcrumbLeaf="Circle">
        <div className="mx-auto flex w-full max-w-(--uf-content-w) flex-col gap-5 px-4 py-6 lg:px-0">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
          >
            <Icon name="left-arrow-alt" size={18} />
            {t("circle.backToFeed")}
          </Link>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {t("circle.title")}
            </h1>
            <p className="text-base text-muted">
              {t("circle.indexSubtitle")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-bg text-subtle">
              <Icon name="conversation" size={22} />
            </span>
            <p className="text-base font-medium text-ink">
              {t("circle.indexEmpty")}
            </p>
            <p className="max-w-sm text-sm text-muted">
              {t("circle.indexEmptyHint")}
            </p>
          </div>
          {withoutCircle.length > 0 && (
            <div className="flex flex-col gap-1 pt-2">
              <h2 className="pb-1 text-center text-base font-semibold text-ink">
                {t("circle.withoutCircleTitle")}
              </h2>
              <CreateCircleRows
                projects={withoutCircle}
                creatingId={creatingId}
                onCreate={handleCreate}
              />
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  const zone =
    detail?.zones.find((z) => z.id === selectedZoneId) ?? detail?.zones[0];

  return (
    <AppShell
      fill
      breadcrumbRoot="Dashboard / Circle"
      breadcrumbLeaf={detail?.title ?? t("circle.title")}
      variant="detail"
    >
      <div className="relative flex min-h-0 flex-1">
        <CircleRail
          circles={circles}
          selectedId={selectedCircleId}
          onSelect={setSelectedCircleId}
          withoutCircle={withoutCircle}
          onOpenCreateModal={() => setShowCreateCircle(true)}
        />
        {detail && zone ? (
          <>
            <ZoneSidebar
              detail={detail}
              zoneId={zone.id}
              statusLabel={t(circleStatusKey(detail.status))}
              onSelectZone={setSelectedZoneId}
              isOwner={isOwner}
              onCreateZone={() => setShowCreateZone(true)}
              onZoneSettings={setSettingsZone}
              onOpenCircleSettings={() => setShowCircleSettings(true)}
              onJumpToMention={handleJumpToMention}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <ZoneHeader
                zoneTitle={zone.title}
                memberCount={detail.members.length}
                panelVisible={panelVisible}
                isOwner={isOwner}
                onZoneSettings={() => setSettingsZone(zone)}
                onOpenCircleSettings={() => setShowCircleSettings(true)}
              />
              <ZoneSwitcher
                detail={detail}
                zoneId={zone.id}
                onSelectZone={setSelectedZoneId}
                isOwner={isOwner}
                onCreateZone={() => setShowCreateZone(true)}
                onJumpToMention={handleJumpToMention}
              />
              <ZoneConversation
                key={`${detail.id}:${zone.id}`}
                detail={detail}
                zone={zone}
                onSeenNewest={markCurrentZoneRead}
                jumpTo={
                  jumpRequest && jumpRequest.zoneId === zone.id
                    ? jumpRequest
                    : null
                }
              />
            </div>
            {renderPanel && (
              <>
                {!isWide && (
                  <button
                    type="button"
                    aria-label={t("circle.closePanel")}
                    onClick={() => setPanelOpen(false)}
                    className="absolute inset-0 z-20 cursor-default bg-black/40 xl:hidden"
                  />
                )}
                <CirclePanel members={detail.members} shown={panelShown} />
              </>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-muted">
            {detailError
              ? t("circle.loadError")
              : t("circle.loadingCircles")}
          </div>
        )}
        {showCreateCircle && withoutCircle.length > 0 ? (
          <CreateCircleModal
            projects={withoutCircle}
            creatingId={creatingId}
            onClose={() => setShowCreateCircle(false)}
            onCreate={(project) => {
              void handleCreate(project).then((ok) => {
                if (ok) setShowCreateCircle(false);
              });
            }}
          />
        ) : null}
        {showCreateZone && detail ? (
          <CreateZoneModal
            circleId={detail.id}
            onClose={() => setShowCreateZone(false)}
            onCreated={(zone) => void handleZoneCreated(zone)}
          />
        ) : null}
        {settingsZone && detail ? (
          <ZoneSettingsModal
            circleId={detail.id}
            zone={settingsZone}
            canDelete={detail.zones.length > 1}
            onClose={() => setSettingsZone(null)}
            onSaved={(zone) => void handleZoneSaved(zone)}
            onDeleted={() => void handleZoneDeleted()}
          />
        ) : null}
        {showCircleSettings && detail ? (
          <CircleSettingsModal
            detail={detail}
            onClose={() => setShowCircleSettings(false)}
            onSaved={handleCircleSaved}
            onDeleted={handleCircleDeleted}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
