"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={signOut}
      className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold"
    >
      Sign out
    </button>
  );
}
