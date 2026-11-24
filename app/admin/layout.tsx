import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/AdminShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};


export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
