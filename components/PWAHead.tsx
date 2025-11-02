"use client";

import { useEffect } from "react";

export function PWAHead() {
  useEffect(() => {
    // Add PWA meta tags dynamically
    const addMetaTag = (name: string, content: string, attribute = "name") => {
      if (document.querySelector(`meta[${attribute}="${name}"]`)) return;
      const meta = document.createElement("meta");
      meta.setAttribute(attribute, name);
      meta.setAttribute("content", content);
      document.head.appendChild(meta);
    };

    const addLinkTag = (rel: string, href: string, sizes?: string) => {
      if (document.querySelector(`link[rel="${rel}"]`)) return;
      const link = document.createElement("link");
      link.setAttribute("rel", rel);
      link.setAttribute("href", href);
      if (sizes) link.setAttribute("sizes", sizes);
      document.head.appendChild(link);
    };

    // Add manifest
    addLinkTag("manifest", "/manifest.json");

    // Add theme color
    addMetaTag("theme-color", "#2563eb");
    addMetaTag("apple-mobile-web-app-capable", "yes");
    addMetaTag("apple-mobile-web-app-status-bar-style", "default");
    addMetaTag("apple-mobile-web-app-title", "Expense Tracker");
    addMetaTag("mobile-web-app-capable", "yes");
    addMetaTag("application-name", "Expense Tracker");

    // Add apple touch icon
    addLinkTag("apple-touch-icon", "/icon-152x152.png");
  }, []);

  return null;
}
