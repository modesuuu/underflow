"use client";

import { useRouter } from "next/navigation";
import { logout } from "../api";

/** Signs out and returns to the login page. Rendered on your own profile only. */
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        logout();
        router.replace("/login");
      }}
      className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-sm font-medium text-ink transition-colors hover:bg-bg"
    >
      Log out
    </button>
  );
}
