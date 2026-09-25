import type { Metadata } from "next";
import "./admin.css";
import { AdminChrome } from "@/components/admin/admin-chrome";

export const metadata: Metadata = {
  title: "Newsroom Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>;
}
