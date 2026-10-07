"use client";

import { useRef, type MouseEvent } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { CollabProject } from "../types";

const TILT_DEG = 4;
const TILT_DURATION = 0.3;
const TILT_EASE = "power2.out";

interface CollabCardProps {
  project: CollabProject;
}

/**
 * Project card with GSAP hover tilt (Penpot "Collaborations" frame).
 * Card: 226x212, bg #f1f0ee, r=12. Tilt is the "miring" in the design.
 */
export function CollabCard({ project }: CollabCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isFull = project.slotsFilled >= project.slotsTotal;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateY: x * TILT_DEG * 2,
      rotateX: -y * TILT_DEG * 2,
      duration: TILT_DURATION,
      ease: TILT_EASE,
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      duration: TILT_DURATION,
      ease: TILT_EASE,
      overwrite: "auto",
    });
  };

  const handleClick = () => {
    router.push(`/collaborations/${project.id}`);
  };

    return (
    <div style={{ perspective: 800 }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ transformStyle: "preserve-3d" }}
        className="flex h-[212px] w-[226px] cursor-pointer flex-col justify-between rounded-lg bg-bg p-3 transition-shadow hover:shadow-md"
      >
      {/* Top: status + title + subtitle */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Icon name="joystick" size={16} className="text-ink" />
          <span className="text-xs font-medium capitalize">
            {project.status}
          </span>
        </div>
        <h3 className="line-clamp-2 text-2xl font-bold leading-tight">
          {project.title}
        </h3>
        <p className="text-base font-medium text-muted">
          {project.subtitle}
        </p>
      </div>

      {/* Middle: due date */}
      <div className="flex items-center gap-1">
        <Icon name="calendar" size={14} className="text-muted" />
        <span className="text-xs font-medium text-muted">
          Due to: {project.dueDate}
        </span>
      </div>

      {/* Bottom: slots + apply */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Icon name="group" size={16} className="text-muted" />
          <span className="text-xs font-medium text-muted">
            {project.slotsFilled} / {project.slotsTotal}
          </span>
        </div>
        <button
          type="button"
          disabled={isFull}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFull) router.push(`/collaborations/${project.id}`);
          }}
          className={
            isFull
              ? "flex cursor-not-allowed items-center gap-1 rounded-md bg-placeholder px-3 py-1.5 text-xs font-medium text-muted"
              : "flex cursor-pointer items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-ink transition-opacity hover:opacity-85"
          }
        >
          {isFull ? "Full" : "Apply"}
          {!isFull && <Icon name="send" size={12} />}
        </button>
      </div>
      </div>
    </div>
  );
}