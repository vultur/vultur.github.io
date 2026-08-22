import type { ReactNode } from "react";

export type Heading = {
    id: string;
    value: ReactNode;
};

export const headingEvent = "nextra:reading-heading";

const wideQuery = "(min-width: 75rem)";
const gap = 16;

export function reducedMotion() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stickyEdge() {
    const header = document.querySelector<HTMLElement>(".is-reading .nextra-content-header");
    const elements = [header];

    if (!matchMedia(wideQuery).matches) {
        elements.push(document.querySelector<HTMLElement>(".is-reading .nextra-reading-aside"));
    }

    const bottom = elements.reduce((max, element) => {
        if (!element) return max;
        const rect = element.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return max;
        return Math.max(max, rect.bottom);
    }, 0);

    return Math.ceil(bottom);
}

function stickyOffset() {
    return stickyEdge() + gap;
}

export function currentHeading(headings: Heading[]) {
    const boundary = stickyOffset();
    let active: Heading | undefined;

    for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element || element.getBoundingClientRect().top > boundary) break;
        active = heading;
    }

    return active;
}

export function headingText(node: ReactNode): string {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(headingText).join("");
    return "";
}

export function scrollToHeading(
    id: string,
    behavior: ScrollBehavior = "auto",
    onSettled?: () => void,
) {
    const target = document.getElementById(id);
    if (!target) return;

    let fallback = 0;
    let frame = 0;
    let settled = false;

    const align = (scrollBehavior: ScrollBehavior) => {
        const rect = target.getBoundingClientRect();
        window.scrollTo({
            behavior: scrollBehavior,
            top: window.scrollY + rect.bottom - stickyEdge(),
        });
    };
    const cleanup = () => {
        window.clearTimeout(fallback);
        cancelAnimationFrame(frame);
        window.removeEventListener("scrollend", settle);
    };
    const settle = () => {
        if (settled) return;
        settled = true;
        cleanup();
        frame = requestAnimationFrame(() => {
            align("auto");
            onSettled?.();
        });
    };

    align(behavior);

    if (behavior === "smooth") {
        window.addEventListener("scrollend", settle, { once: true });
        fallback = window.setTimeout(settle, 2000);
    } else {
        settle();
    }

    return cleanup;
}
