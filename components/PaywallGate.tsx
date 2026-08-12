"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ALWAYS_ALLOWED_PREFIXES = ["/pricing", "/checkout", "/settings", "/support"];

export default function PaywallGate({ shouldGate }: { shouldGate: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!shouldGate) return;
    if (ALWAYS_ALLOWED_PREFIXES.some((p) => pathname?.startsWith(p))) return;
    router.replace("/pricing");
  }, [shouldGate, pathname, router]);

  return null;
}
