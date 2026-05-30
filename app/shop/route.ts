import { NextRequest, NextResponse } from "next/server";

function isMobileUserAgent(userAgent: string) {
  return /android|iphone|ipad|ipod|mobile|windows phone/i.test(userAgent);
}

function getTelegramBotUsername() {
  const username =
    process.env.TELEGRAM_WEBAPP_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_WEBAPP_BOT_USERNAME ||
    "Ecliptic_Store_BOT";

  const normalized = username.replace(/^@/, "").trim();
  return /^[a-zA-Z0-9_]{5,32}$/.test(normalized) ? normalized : "";
}

function getTelegramMiniAppShortName() {
  const shortName =
    process.env.TELEGRAM_WEBAPP_SHORT_NAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_WEBAPP_SHORT_NAME ||
    "Ecliptic_Store";

  return /^[a-zA-Z0-9_]{3,64}$/.test(shortName) ? shortName : "";
}

export function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const telegramBot = getTelegramBotUsername();
  const miniAppShortName = getTelegramMiniAppShortName();

  if (isMobileUserAgent(userAgent) && telegramBot && miniAppShortName) {
    const telegramUrl = new URL("tg://resolve");
    telegramUrl.searchParams.set("domain", telegramBot);
    telegramUrl.searchParams.set("appname", miniAppShortName);
    telegramUrl.searchParams.set("mode", "fullscreen");

    const response = NextResponse.redirect(telegramUrl, 307);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  const response = NextResponse.redirect(new URL("/", request.url), 307);
  response.headers.set("Cache-Control", "private, no-cache, max-age=0, must-revalidate");
  return response;
}
