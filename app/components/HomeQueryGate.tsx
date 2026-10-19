"use client";

import { useEffect, useState, type ReactNode } from "react";
import ReferralLanding from "./ReferralLanding";

function cleanSlug(value: string | null) {
  const slug = String(value || "").trim().toLowerCase();
  return /^[a-z0-9-]{1,80}$/.test(slug) ? slug : "";
}

function cleanReferralCode(value: string | null) {
  const code = String(value || "").trim().toLowerCase();
  return /^[a-z0-9_-]{1,32}$/.test(code) ? code : "";
}

export default function HomeQueryGate({ children }: { children: ReactNode }) {
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const startSlug = cleanSlug(
      params.get("tgWebAppStartParam") || params.get("startapp") || params.get("start_param")
    );
    if (startSlug) {
      window.location.replace(`/products/${startSlug}?app=1`);
      return;
    }

    const nextReferralCode = cleanReferralCode(params.get("use") || params.get("ref"));
    if (!nextReferralCode) return;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { user?: unknown } | null) => {
        if (!active) return;
        if (payload?.user) {
          window.location.replace("/account#referral");
          return;
        }
        setReferralCode(nextReferralCode);
      })
      .catch(() => {
        if (active) setReferralCode(nextReferralCode);
      });

    return () => {
      active = false;
    };
  }, []);

  return referralCode ? <ReferralLanding referralCode={referralCode} /> : children;
}
