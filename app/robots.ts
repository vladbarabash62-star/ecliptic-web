import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin-access",
          "/admin-access/",
          "/account",
          "/account/",
          "/api",
          "/api/",
          "/go",
          "/go/",
          "/shop",
          "/tags",
          "/*?use=",
          "/*?ref=",
          "/*?app=",
          "/*?tgWebAppStartParam=",
          "/*?startapp=",
          "/*?start_param=",
          "/*?_fresh=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
