/* eslint-disable @next/next/no-img-element */
"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type CustomerUser = {
  id: string;
};

type StarPosition = {
  x: number;
  y: number;
  ready: boolean;
};

const BLOCKER_SELECTOR = [
  ".product-card",
  ".products-grid",
  ".desktop-trust-panel",
  ".page-intro",
  ".product-page-enter > div",
  ".contact-float",
].join(",");

function shouldShowOnCurrentPage(path: string, params: URLSearchParams) {
  if (params.get("use") || params.get("ref")) return false;
  return path === "/" || path.startsWith("/products/");
}

function overlaps(left: number, top: number, width: number, height: number, rect: DOMRect) {
  const gap = 14;
  return !(
    left + width + gap < rect.left ||
    left > rect.right + gap ||
    top + height + gap < rect.top ||
    top > rect.bottom + gap
  );
}

function createCandidatePositions(width: number, height: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxX = Math.max(8, vw - width - 10);
  const maxY = Math.max(92, vh - height - 18);
  const minY = Math.min(maxY, 92);
  const side = Math.max(10, Math.min(86, vw * 0.08));
  const positions: Array<{ x: number; y: number }> = [
    { x: side, y: vh * 0.36 },
    { x: maxX - side, y: vh * 0.34 },
    { x: side * 0.7, y: vh * 0.62 },
    { x: maxX - side * 0.7, y: vh * 0.66 },
    { x: vw * 0.12, y: vh * 0.18 },
    { x: vw * 0.76, y: vh * 0.2 },
    { x: vw * 0.08, y: vh * 0.78 },
    { x: vw * 0.78, y: vh * 0.76 },
  ];

  for (let index = 0; index < 18; index += 1) {
    const edge = Math.floor(Math.random() * 4);
    const randomY = minY + Math.random() * Math.max(1, maxY - minY);
    const randomX = 10 + Math.random() * Math.max(1, maxX - 10);
    if (edge === 0) positions.push({ x: 10 + Math.random() * side, y: randomY });
    if (edge === 1) positions.push({ x: maxX - Math.random() * side, y: randomY });
    if (edge === 2) positions.push({ x: randomX, y: minY + Math.random() * 90 });
    if (edge === 3) positions.push({ x: randomX, y: maxY - Math.random() * 120 });
  }

  return positions.map((item) => ({
    x: Math.max(8, Math.min(maxX, Math.round(item.x))),
    y: Math.max(minY, Math.min(maxY, Math.round(item.y))),
  }));
}

function pickSafePosition(previous?: StarPosition): StarPosition {
  const width = window.innerWidth < 700 ? 96 : 142;
  const height = window.innerWidth < 700 ? 124 : 166;
  const blockers = Array.from(document.querySelectorAll(BLOCKER_SELECTOR))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  const candidates = createCandidatePositions(width, height).filter((item) => {
    if (previous?.ready && Math.abs(previous.x - item.x) < 36 && Math.abs(previous.y - item.y) < 36) return false;
    return blockers.every((rect) => !overlaps(item.x, item.y, width, height, rect));
  });
  const picked = candidates[Math.floor(Math.random() * candidates.length)] || createCandidatePositions(width, height)[0];
  return { x: picked.x, y: picked.y, ready: true };
}

export default function FloatingReferralStar() {
  const pathname = usePathname();
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [position, setPosition] = useState<StarPosition>({ x: 14, y: 220, ready: false });
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationReady, setIsLocationReady] = useState(false);
  const isVisible = useMemo(() => {
    if (!isLocationReady) return false;
    return shouldShowOnCurrentPage(pathname || "/", new URLSearchParams(locationSearch));
  }, [isLocationReady, pathname, locationSearch]);

  async function refreshUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;

    const data = await response.json().catch(() => ({}));
    setUser(data.user || null);
  }

  useEffect(() => {
    void refreshUser();

    const handleAuthChange = () => void refreshUser();
    window.addEventListener("ecliptic-auth-changed", handleAuthChange);
    return () => window.removeEventListener("ecliptic-auth-changed", handleAuthChange);
  }, []);

  useEffect(() => {
    setLocationSearch(window.location.search);
    setIsLocationReady(true);
  }, [pathname]);

  useEffect(() => {
    if (!isVisible) return;

    let timer = 0;
    let cancelled = false;
    const placeStar = () => {
      if (cancelled) return;
      setPosition((current) => pickSafePosition(current));
    };

    window.requestAnimationFrame(() => {
      window.setTimeout(placeStar, 180);
    });
    timer = window.setInterval(placeStar, 11800);
    window.addEventListener("resize", placeStar);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("resize", placeStar);
    };
  }, [isVisible, pathname, locationSearch]);

  function openReferral() {
    if (user) {
      window.location.href = "/account#referral";
      return;
    }
    window.dispatchEvent(new Event("ecliptic-open-auth"));
  }

  if (!isVisible) return null;

  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    opacity: position.ready ? 1 : 0,
  } as CSSProperties;

  return (
    <button
      type="button"
      className="floating-referral-star"
      style={style}
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
