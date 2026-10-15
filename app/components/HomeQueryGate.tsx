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
    const params = new URLSearchParams(window.location.search);
    const startSlug = cleanSlug(
      params.get("tgWebAppStartParam") || params.get("startapp") || params.get("start_param")
    );
    if (startSlug) {
      window.location.replace(`/products/${startSlug}?app=1`);
      return;
    }
    setReferralCode(cleanReferralCode(params.get("use") || params.get("ref")));
  }, []);

  return referralCode ? <ReferralLanding referralCode={referralCode} /> : children;
}
