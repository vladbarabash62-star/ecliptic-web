/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

type CustomerUser = {
  id: string;
};

function shouldShowOnCurrentPage() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (params.get("use") || params.get("ref")) return false;
  return path === "/" || path.startsWith("/products/");
}

export default function FloatingReferralStar() {
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<CustomerUser | null>(null);

  async function refreshUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;

    const data = await response.json().catch(() => ({}));
    setUser(data.user || null);
  }

  useEffect(() => {
    setIsVisible(shouldShowOnCurrentPage());
    void refreshUser();

    const handleAuthChange = () => void refreshUser();
    window.addEventListener("ecliptic-auth-changed", handleAuthChange);
    return () => window.removeEventListener("ecliptic-auth-changed", handleAuthChange);
  }, []);

  function openReferral() {
    if (user) {
      window.location.href = "/account#referral";
      return;
    }
    window.dispatchEvent(new Event("ecliptic-open-auth"));
  }

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className="floating-referral-star"
      onClick={openReferral}
      aria-label="Получить звёзды"
    >
      <span className="floating-referral-star__image">
        <img src="/referral-star.png" alt="" draggable={false} />
      </span>
      <span className="floating-referral-star__label">Получить звёзды</span>
    </button>
  );
}
