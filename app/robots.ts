export default function robots() {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/admin/", "/api/admin", "/api/admin/"],
        },
      ],
      sitemap: "https://ecliptic.website/sitemap.xml",
    };
  }
