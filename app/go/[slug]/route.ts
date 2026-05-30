import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "../../../lib/productStore";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

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

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug, { cached: true });

  if (!product) {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  const userAgent = request.headers.get("user-agent") || "";
  const telegramBot = getTelegramBotUsername();
  const miniAppShortName = getTelegramMiniAppShortName();

  if (isMobileUserAgent(userAgent) && telegramBot && miniAppShortName) {
    const telegramUrl = new URL(`https://t.me/${telegramBot}/${miniAppShortName}`);
    telegramUrl.searchParams.set("startapp", product.slug);
    telegramUrl.searchParams.set("mode", "fullscreen");

    const response = NextResponse.redirect(telegramUrl, 307);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  const productUrl = new URL(`/products/${product.slug}`, request.url);
  productUrl.searchParams.set("app", "1");

  const response = NextResponse.redirect(productUrl, 307);
  response.headers.set("Cache-Control", "private, no-cache, max-age=0, must-revalidate");
  return response;
}
