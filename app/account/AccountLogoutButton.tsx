"use client";

import { useState } from "react";

export default function AccountLogoutButton() {
  const [isBusy, setIsBusy] = useState(false);

  async function logout() {
    setIsBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.dispatchEvent(new Event("ecliptic-auth-changed"));
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isBusy}
      className="mt-8 w-full rounded-2xl border border-red-300/30 bg-red-500/12 px-5 py-4 text-sm font-black text-red-100 transition hover:border-red-200/44 hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isBusy ? "Выходим..." : "Выйти из аккаунта"}
    </button>
  );
}
