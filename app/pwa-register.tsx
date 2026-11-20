"use client";

import { useEffect } from "react";

/**
 * Ensures any old Service Workers and caches from previous builds are purged
 * so the user always sees the clean, updated B2B Multi Service Portal.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
    }
  }, []);

  return null;
}
