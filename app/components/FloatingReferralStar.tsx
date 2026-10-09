/* eslint-disable @next/next/no-img-element */
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type CustomerUser = {
  id: string;
};

type StarPosition = {
  x: number;
  y: number;
};

type MotionState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scrollOffsetY: number;
  lastScrollY: number;
  nextTargetAt: number;
};

const BLOCKER_SELECTOR = [
  ".product-card",
  ".products-grid",
  ".desktop-trust-panel",
  ".page-intro",
  ".home-reveal--filters",
  ".product-page-enter > div",
  ".contact-float",
].join(",");

const CONTENT_SELECTOR = [
  ".products-grid",
  ".desktop-trust-panel",
  ".page-intro",
  ".home-reveal--filters",
  ".product-page-enter > div",
].join(",");

function shouldShowOnCurrentPage(path: string, params: URLSearchParams) {
  if (params.get("use") || params.get("ref")) return false;
  return path === "/" || path.startsWith("/products/");
}

function overlaps(left: number, top: number, width: number, height: number, rect: DOMRect, gap = 28) {
  return !(
    left + width + gap < rect.left ||
    left > rect.right + gap ||
    top + height + gap < rect.top ||
    top > rect.bottom + gap
  );
}

function visibleRects(selector: string) {
  return Array.from(document.querySelectorAll(selector))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight);
}

function isSafePosition(left: number, top: number, width: number, height: number, blockers = visibleRects(BLOCKER_SELECTOR)) {
  const margin = window.innerWidth < 700 ? 10 : 18;
  const bottomInset = window.innerWidth < 700 ? 22 : 18;

  if (left < margin || top < 76) return false;
  if (left + width > window.innerWidth - margin) return false;
  if (top + height > window.innerHeight - bottomInset) return false;

  return blockers.every((rect) => !overlaps(left, top, width, height, rect));
}

function randomBetween(min: number, max: number) {
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

function rectCandidates(width: number, height: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = vw < 700 ? 10 : 18;
  const gap = vw < 700 ? 12 : 30;
  const top = vw < 700 ? 78 : 86;
  const bottom = Math.max(top, vh - height - (vw < 700 ? 18 : 20));
  const contentRects = visibleRects(CONTENT_SELECTOR);
  const contentLeft = contentRects.length ? Math.min(...contentRects.map((rect) => rect.left)) : vw * 0.24;
  const contentRight = contentRects.length ? Math.max(...contentRects.map((rect) => rect.right)) : vw * 0.76;
  const contentTop = contentRects.length ? Math.min(...contentRects.map((rect) => rect.top)) : vh * 0.32;
  const lanes: Array<{ left: number; right: number; top: number; bottom: number; weight: number }> = [];

  const leftRight = contentLeft - gap - width;
  if (leftRight > margin) lanes.push({ left: margin, right: leftRight, top, bottom, weight: 4 });

  const rightLeft = contentRight + gap;
  const rightRight = vw - width - margin;
  if (rightRight > rightLeft) lanes.push({ left: rightLeft, right: rightRight, top, bottom, weight: 4 });

  const topBottom = contentTop - gap - height;
  if (topBottom > top) lanes.push({ left: margin, right: vw - width - margin, top, bottom: topBottom, weight: 2 });

  if (vw < 760) {
    lanes.push({ left: margin, right: vw - width - margin, top, bottom, weight: 1 });
  }

  return lanes;
}

function pickSafePosition(width: number, height: number, previous?: StarPosition): StarPosition | null {
  const blockers = visibleRects(BLOCKER_SELECTOR);
  const lanes = rectCandidates(width, height);
  const weightedLanes = lanes.flatMap((lane) => Array.from({ length: lane.weight }, () => lane));

  for (let attempt = 0; attempt < 90; attempt += 1) {
    const lane = weightedLanes[Math.floor(Math.random() * weightedLanes.length)];
    if (!lane) break;
    const x = Math.round(randomBetween(lane.left, lane.right));
    const y = Math.round(randomBetween(lane.top, lane.bottom));
    if (previous && Math.abs(previous.x - x) < 58 && Math.abs(previous.y - y) < 58) continue;
    if (isSafePosition(x, y, width, height, blockers)) return { x, y };
  }

  return null;
}

function nearestSafePosition(x: number, y: number, width: number, height: number): StarPosition | null {
  const blockers = visibleRects(BLOCKER_SELECTOR);
  const lanes = rectCandidates(width, height);
  const candidates: StarPosition[] = [];

  for (const lane of lanes) {
    candidates.push(
      { x: lane.left, y: lane.top },
      { x: lane.left, y: lane.bottom },
      { x: lane.right, y: lane.top },
      { x: lane.right, y: lane.bottom },
      { x: Math.min(lane.right, Math.max(lane.left, x)), y: Math.min(lane.bottom, Math.max(lane.top, y)) }
    );
  }

  return candidates
    .filter((candidate) => isSafePosition(candidate.x, candidate.y, width, height, blockers))
    .sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2))[0] || null;
}

export default function FloatingReferralStar() {
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const isReadyRef = useRef(false);
  const motionRef = useRef<MotionState>({
    x: 18,
    y: 220,
    targetX: 18,
    targetY: 220,
    scrollOffsetY: 0,
    lastScrollY: 0,
    nextTargetAt: 0,
  });
  const [user, setUser] = useState<CustomerUser | null>(null);
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
    const refreshTimer = window.setTimeout(() => void refreshUser(), 0);

    const handleAuthChange = () => void refreshUser();
    window.addEventListener("ecliptic-auth-changed", handleAuthChange);
    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("ecliptic-auth-changed", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const locationTimer = window.setTimeout(() => {
      setLocationSearch(window.location.search);
      setIsLocationReady(true);
    }, 0);
    return () => window.clearTimeout(locationTimer);
  }, [pathname]);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    const motion = motionRef.current;
    motion.lastScrollY = window.scrollY;

    const measure = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      return {
        width: Math.max(window.innerWidth < 700 ? 70 : 116, rect?.width || (window.innerWidth < 700 ? 86 : 142)),
        height: Math.max(window.innerWidth < 700 ? 98 : 148, rect?.height || (window.innerWidth < 700 ? 112 : 166)),
      };
    };

    const chooseTarget = (force = false) => {
      const { width, height } = measure();
      const picked = pickSafePosition(width, height, { x: motion.targetX, y: motion.targetY });
      if (!picked) {
        if (buttonRef.current) {
          buttonRef.current.style.opacity = "0";
          buttonRef.current.style.pointerEvents = "none";
        }
        return;
      }

      motion.targetX = picked.x;
      motion.targetY = picked.y;
      motion.nextTargetAt = performance.now() + 4300 + Math.random() * 2700;
      if (!isReadyRef.current || force) {
        motion.x = picked.x;
        motion.y = picked.y;
        isReadyRef.current = true;
      }
      if (buttonRef.current) buttonRef.current.style.pointerEvents = "auto";
    };

    const onScroll = () => {
      const delta = window.scrollY - motion.lastScrollY;
      motion.lastScrollY = window.scrollY;
      if (Math.abs(delta) < 1) return;
      const limit = window.innerHeight * 0.26;
      motion.scrollOffsetY = Math.max(-limit, Math.min(limit, motion.scrollOffsetY - delta * 0.58));
    };

    const tick = (time: number) => {
      if (cancelled) return;
      const element = buttonRef.current;
      if (!element) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const { width, height } = measure();
      if (!motion.nextTargetAt || time > motion.nextTargetAt) chooseTarget();

      motion.x += (motion.targetX - motion.x) * 0.026;
      motion.y += (motion.targetY - motion.y) * 0.026;
      motion.scrollOffsetY *= 0.89;
      if (Math.abs(motion.scrollOffsetY) < 0.25) motion.scrollOffsetY = 0;

      const safe = nearestSafePosition(motion.x, motion.y + motion.scrollOffsetY, width, height);
      if (safe) {
        element.style.left = `${Math.round(safe.x)}px`;
        element.style.top = `${Math.round(safe.y)}px`;
        element.style.opacity = isReadyRef.current ? "1" : "0";
        element.style.pointerEvents = "auto";
      } else {
        element.style.opacity = "0";
        element.style.pointerEvents = "none";
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const onResize = () => chooseTarget(true);

    const startTimer = window.setTimeout(() => {
      chooseTarget(true);
      frameRef.current = window.requestAnimationFrame(tick);
    }, 180);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
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

  return (
    <button
      ref={buttonRef}
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
