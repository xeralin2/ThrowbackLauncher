"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isSwitching } from "@/lib/view-transition";

const SELECTOR =
  ".card-grid .nav-card, .faq-list .question, .dev-card-row .dev-card";
const SETTLE_MS = 400;

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const started = performance.now();

    function documentIndex(el: Element): number {
      return [...document.querySelectorAll(SELECTOR)].indexOf(el);
    }

    let nextReveal = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const initial = performance.now() - started < SETTLE_MS;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const now = performance.now();
          const at = initial
            ? now + documentIndex(el) * 80
            : Math.max(now, nextReveal);
          nextReveal = Math.max(nextReveal, at + 60);
          window.setTimeout(
            () => el.setAttribute("data-inview", "true"),
            at - now,
          );
          observer.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    document.querySelectorAll(SELECTOR).forEach((el) => observer.observe(el));

    const added = new MutationObserver((records) => {
      const reveal = (el: Element) =>
        isSwitching()
          ? el.setAttribute("data-inview", "instant")
          : observer.observe(el);
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) reveal(node);
          node.querySelectorAll(SELECTOR).forEach(reveal);
        });
      });
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      added.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
