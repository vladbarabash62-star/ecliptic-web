type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";

type TelegramWebApp = {
  HapticFeedback?: {
    impactOccurred?: (style: HapticStyle) => void;
    selectionChanged?: () => void;
  };
};

function getTelegramWebApp() {
  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

function isMobileHapticDevice() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches ||
      /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent))
  );
}

export function pulseTelegram(styles: HapticStyle[], gap = 82) {
  const haptic = getTelegramWebApp()?.HapticFeedback;
  if (!haptic?.impactOccurred) return false;

  styles.forEach((style, index) => {
    const run = () => {
      try {
        haptic.impactOccurred?.(style);
      } catch {
        // Haptics are optional in browsers outside Telegram.
      }
    };

    if (index === 0) run();
    else window.setTimeout(run, index * gap);
  });

  return true;
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers and WebViews do not allow vibration.
  }
}

export function playLaunchHaptic() {
  if (!isMobileHapticDevice()) return;

  const usedTelegramHaptic = pulseTelegram(
    [
      "light",
      "soft",
      "light",
      "medium",
      "soft",
      "light",
      "medium",
      "soft",
      "light",
      "rigid",
      "soft",
      "light",
      "medium",
      "soft",
      "light",
      "medium",
      "soft",
      "light",
      "heavy",
    ],
    132
  );
  if (!usedTelegramHaptic) {
    vibrate([28, 64, 28, 72, 44, 84, 28, 58, 36, 92, 54, 112, 28, 58, 36, 84, 48, 104, 28, 64, 28, 72, 44, 92, 62]);
  }
}

export function playProductHaptic() {
  const usedTelegramHaptic = pulseTelegram(["light", "soft"], 58);
  if (!usedTelegramHaptic) vibrate([10, 24, 8]);
}

export function playBuyHaptic() {
  const usedTelegramHaptic = pulseTelegram(["medium", "light"], 64);
  if (!usedTelegramHaptic) vibrate([18, 28, 12]);
}

export function playButtonHaptic() {
  const usedTelegramHaptic = pulseTelegram(["light"], 0);
  if (!usedTelegramHaptic) vibrate(8);
}

export function playFieldHaptic() {
  try {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged?.();
  } catch {
    // Optional.
  }

  vibrate(6);
}
