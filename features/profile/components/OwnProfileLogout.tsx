"use client";

import { useSessionUser } from "@/features/auth/store";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

/**
 * The Log out slot at the bottom of the Profile Detail card. It
 * shows whenever the viewed profile is the signed-in user's own —
 * the /profile/me alias AND the canonical /profile/<own id> route
 * (opening your own profile from a post or a comment used to hide
 * the button, because only the "me" id was checked). Other people's
 * profiles render nothing here.
 */
export function OwnProfileLogout({ personId }: { personId: string }) {
  const sessionUser = useSessionUser();
  const isOwn =
    personId === "me" ||
    (sessionUser !== null && sessionUser.id === personId);
  if (!isOwn) return null;
  return (
    <div className="pt-1">
      <LogoutButton />
    </div>
  );
}
