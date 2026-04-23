export type Product = {
  name: string;
  icon: string;
  slug: string;
};

export const products: Product[] = [
  {
    name: "Telegram Stars",
    icon: "https://lztcdn.com/files/6514f1e6-dab4-4d49-806a-3ff22d7793e5.webp",
    slug: "telegram-stars",
  },
  {
    name: "Telegram Premium",
    icon: "https://smmlaboratory.com/image/data/3/telegrammpremium.svg",
    slug: "telegram-premium",
  },
  {
    name: "Telegram аккаунты",
    icon: "https://static.vecteezy.com/system/resources/previews/023/986/562/non_2x/telegram-logo-telegram-logo-transparent-telegram-icon-transparent-free-free-png.png",
    slug: "telegram-accounts",
  },
  {
    name: "Steam пополнение",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/960px-Steam_icon_logo.svg.png",
    slug: "steam-topup",
  },
  {
    name: "Epic Games пополнение",
    icon: "https://cms-assets.unrealengine.com/AjTAN1C8SLWRn7fg4wnzlz/cmd6p7ipv3hl707ohjnyhwki2",
    slug: "epic-games-topup",
  },
  {
    name: "Standoff 2",
    icon: "https://standof.ru/wp-content/uploads/2023/07/favicon.png",
    slug: "standoff-2",
  },
  {
    name: "PUBG Mobile",
    icon: "https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/pubg-mobile-logo.png",
    slug: "pubg-mobile",
  },
  {
    name: "Brawl Stars",
    icon: "https://static.vecteezy.com/system/resources/thumbnails/027/127/558/small_2x/brawl-stars-logo-brawl-stars-icon-transparent-free-png.png",
    slug: "brawl-stars",
  },
  {
    name: "Roblox",
    icon: "https://media.tenor.com/HO1YAH0_iMcAAAAj/roblox-logo.gif",
    slug: "roblox",
  },
  {
    name: "Minecraft",
    icon: "https://images.icon-icons.com/2699/PNG/512/minecraft_logo_icon_168974.png",
    slug: "minecraft",
  },
  {
    name: "Clash Royale",
    icon: "https://www.pngplay.com/wp-content/uploads/10/Clash-Royale-Logo-PNG-HD-Photos.png",
    slug: "clash-royale",
  },
  {
    name: "Mobile Legends",
    icon: "https://www.freepnglogos.com/uploads/logo-mobile-legend-png/logo-mobile-legend-nasce-team-psg-rrq-paris-saint-germain-sbarca-20.png",
    slug: "mobile-legends",
  },
  {
    name: "Free Fire",
    icon: "https://images.seeklogo.com/logo-png/50/2/free-fire-logo-png_seeklogo-500424.png",
    slug: "free-fire",
  },
  {
    name: "GTA 5 RP",
    icon: "https://gta5rp.com/_next/image?url=%2Fimages%2Flogo%2Fmain.png&w=1920&q=100",
    slug: "gta-5-rp",
  },
  {
    name: "Amazing RP",
    icon: "https://www.google.com/s2/favicons?sz=128&domain_url=https://amazing-rp.ru",
    slug: "amazing-rp",
  },
  {
    name: "Black Russia",
    icon: "https://cdn140.picsart.com/327485001024211.png",
    slug: "black-russia",
  },
  {
    name: "Spotify Premium",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/3840px-Spotify_logo_without_text.svg.png",
    slug: "spotify-premium",
  },
  {
    name: "YouTube Premium",
    icon: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png",
    slug: "youtube-premium",
  },
  {
    name: "TikTok Coins",
    icon: "https://cdn-icons-png.freepik.com/256/3621/3621450.png?semt=ais_white_label",
    slug: "tiktok-coins",
  },
  {
    name: "PlayStation",
    icon: "https://www.pngkey.com/png/full/7-74293_la-siguiente-playstation-playstation-4-logo-png.png",
    slug: "playstation",
  },
  {
    name: "Boosty",
    icon: "https://images.live.vkvideo.ru/image/31715c5a-91c0-455b-994f-31650954caee?change_time=1729181151&mw=640",
    slug: "boosty",
  },
  {
    name: "Twitch",
    icon: "https://cdn-icons-png.flaticon.com/512/3938/3938117.png",
    slug: "twitch",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
