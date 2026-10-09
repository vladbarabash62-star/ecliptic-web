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
  laneId: string;
};

type MotionState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  lastSafeX: number;
  lastSafeY: number;
  scrollOffsetY: number;
  lastScrollY: number;
  nextTargetAt: number;
  lastRecoveryAt: number;
  lastLaneId: string;
};

type SafeLane = {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  weight: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function laneRoot(id: string) {
  return id.split("-")[0] || id;
}

function addSplitLanes(lanes: SafeLane[], id: string, left: number, right: number, top: number, bottom: number, weight: number) {
  if (right <= left || bottom <= top) return;
  const height = bottom - top;
  const minSegment = window.innerWidth < 700 ? 84 : 132;

  if (height < minSegment * 2.6) {
    lanes.push({ id, left, right, top, bottom, weight });
    return;
  }

  const segment = height / 3;
  lanes.push(
    { id: `${id}-top`, left, right, top, bottom: top + segment, weight },
    { id: `${id}-middle`, left, right, top: top + segment, bottom: top + segment * 2, weight },
    { id: `${id}-bottom`, left, right, top: top + segment * 2, bottom, weight }
  );
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
  const contentBottom = contentRects.length ? Math.max(...contentRects.map((rect) => rect.bottom)) : vh * 0.72;
  const lanes: SafeLane[] = [];

  const leftRight = contentLeft - gap - width;
  if (leftRight > margin) addSplitLanes(lanes, "left", margin, leftRight, top, bottom, 4);

  const rightLeft = contentRight + gap;
  const rightRight = vw - width - margin;
  if (rightRight > rightLeft) addSplitLanes(lanes, "right", rightLeft, rightRight, top, bottom, 4);

  const topBottom = contentTop - gap - height;
  if (topBottom > top) {
    addSplitLanes(lanes, "top", margin, vw - width - margin, top, topBottom, 2);
  }

  const bottomTop = contentBottom + gap;
  if (bottom > bottomTop) {
    addSplitLanes(lanes, "bottom", margin, vw - width - margin, bottomTop, bottom, 2);
  }

  if (vw < 760) {
    lanes.push({ id: "mobile-free", left: margin, right: vw - width - margin, top, bottom, weight: 1 });
  }

  return lanes;
}

function pickSafePosition(
  width: number,
  height: number,
  previous?: StarPosition,
  mode: "any" | "same-root" | "different-root" = "any"
): StarPosition | null {
  const blockers = visibleRects(BLOCKER_SELECTOR);
  const lanes = rectCandidates(width, height);
  const previousRoot = previous?.laneId ? laneRoot(previous.laneId) : "";
  let laneChoices = lanes;

  if (previousRoot && mode === "same-root") {
    laneChoices = lanes.filter((lane) => laneRoot(lane.id) === previousRoot);
  }

  if (previousRoot && mode === "different-root" && lanes.length > 1) {
    laneChoices = lanes.filter((lane) => laneRoot(lane.id) !== previousRoot);
  }

  if (!laneChoices.length) laneChoices = lanes;

  const weightedLanes = laneChoices.flatMap((lane) => Array.from({ length: lane.weight }, () => lane));

  for (let attempt = 0; attempt < 130; attempt += 1) {
    const lane = weightedLanes[Math.floor(Math.random() * weightedLanes.length)] || lanes[Math.floor(Math.random() * lanes.length)];
    if (!lane) break;
    const x = Math.round(randomBetween(lane.left, lane.right));
    const y = Math.round(randomBetween(lane.top, lane.bottom));
    const minHorizontalShift = window.innerWidth < 700 ? 70 : 145;
    const minVerticalShift = window.innerWidth < 700 ? 58 : 96;
    if (
      previous &&
      attempt < 95 &&
      Math.abs(previous.x - x) < minHorizontalShift &&
      Math.abs(previous.y - y) < minVerticalShift
    ) {
      continue;
    }
    if (isSafePosition(x, y, width, height, blockers)) return { x, y, laneId: lane.id };
  }

  return null;
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
    lastSafeX: 18,
    lastSafeY: 220,
    scrollOffsetY: 0,
    lastScrollY: 0,
    nextTargetAt: 0,
    lastRecoveryAt: 0,
    lastLaneId: "",
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
      const laneMode = !motion.lastLaneId || force
        ? "any"
        : Math.random() < 0.66
          ? "same-root"
          : "different-root";
      const picked = pickSafePosition(
        width,
        height,
        { x: motion.targetX, y: motion.targetY, laneId: motion.lastLaneId },
        laneMode
      );
      if (!picked) {
        if (buttonRef.current) {
          buttonRef.current.style.opacity = "0";
          buttonRef.current.style.pointerEvents = "none";
        }
        return;
      }

      motion.targetX = picked.x;
      motion.targetY = picked.y;
      motion.lastLaneId = picked.laneId;
      motion.nextTargetAt = performance.now() + 5600 + Math.random() * 4600;
      if (!isReadyRef.current) {
        motion.x = picked.x;
        motion.y = picked.y;
        motion.lastSafeX = picked.x;
        motion.lastSafeY = picked.y;
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

      const pull = window.innerWidth < 700 ? 0.026 : 0.02;
      motion.x += (motion.targetX - motion.x) * pull;
      motion.y += (motion.targetY - motion.y) * pull;
      motion.scrollOffsetY *= 0.89;
      if (Math.abs(motion.scrollOffsetY) < 0.25) motion.scrollOffsetY = 0;

      const margin = window.innerWidth < 700 ? 10 : 18;
      const bottomInset = window.innerWidth < 700 ? 22 : 18;
      const renderX = clamp(motion.x, margin, window.innerWidth - width - margin);
      const renderY = clamp(motion.y + motion.scrollOffsetY, 76, window.innerHeight - height - bottomInset);

      if (isSafePosition(renderX, renderY, width, height)) {
        motion.lastSafeX = renderX;
        motion.lastSafeY = renderY;
        element.style.left = `${Math.round(renderX)}px`;
        element.style.top = `${Math.round(renderY)}px`;
        element.style.opacity = isReadyRef.current ? "1" : "0";
        element.style.pointerEvents = "auto";
      } else {
        if (time - motion.lastRecoveryAt > 900) {
          chooseTarget();
          motion.lastRecoveryAt = time;
        }
        element.style.left = `${Math.round(motion.lastSafeX)}px`;
        element.style.top = `${Math.round(motion.lastSafeY)}px`;
        element.style.opacity = isReadyRef.current ? "1" : "0";
        element.style.pointerEvents = "auto";
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
