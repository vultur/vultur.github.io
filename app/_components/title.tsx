"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { currentHeading, headingText, headingEvent, type Heading } from "./heading";

export function ReadingTitle({
    children,
    headings = [],
}: {
    children: ReactNode;
    headings?: Heading[];
}) {
    const ref = useRef<HTMLHeadingElement>(null);
    const headingsRef = useRef(headings);
    const lockedRef = useRef(false);
    const [stuck, setStuck] = useState(false);
    const [chapter, setChapter] = useState("");

    useEffect(() => {
        headingsRef.current = headings;
    }, [headings]);

    useEffect(() => {
        const title = ref.current;
        const header = title?.parentElement;
        const sentinel = header?.parentElement?.querySelector(".nextra-reading-sentinel");
        if (!title || !header || !sentinel?.classList.contains("nextra-reading-sentinel")) return;

        let observer: IntersectionObserver;
        let frame = 0;

        const updateChapter = () => {
            if (lockedRef.current) return;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const heading = currentHeading(headingsRef.current);
                const active = heading
                    ? (document.getElementById(heading.id)?.textContent?.trim() ??
                      headingText(heading.value))
                    : "";
                setChapter((previous) => (previous === active ? previous : active));
            });
        };

        const lockChapter = (event: Event) => {
            const id = (event as CustomEvent<string | null>).detail;
            if (!id) {
                lockedRef.current = false;
                updateChapter();
                return;
            }
            const heading = headingsRef.current.find((item) => item.id === id);
            if (!heading) return;

            lockedRef.current = true;
            setChapter(
                document.getElementById(id)?.textContent?.trim() ?? headingText(heading.value),
            );
        };

        const observe = () => {
            observer?.disconnect();
            const stickyTop = Number.parseFloat(getComputedStyle(header).top) || 0;
            observer = new IntersectionObserver(
                ([entry]) => {
                    const nextStuck =
                        !entry.isIntersecting && entry.boundingClientRect.top < stickyTop;
                    setStuck((previous) => (previous === nextStuck ? previous : nextStuck));
                    if (nextStuck) updateChapter();
                },
                { rootMargin: `-${stickyTop}px 0px 0px` },
            );
            observer.observe(sentinel);
        };

        const update = () => {
            observe();
            updateChapter();
        };

        observe();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", updateChapter, { passive: true });
        window.addEventListener(headingEvent, lockChapter);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", updateChapter);
            window.removeEventListener(headingEvent, lockChapter);
        };
    }, []);

    const className = [stuck && "is-stuck", stuck && chapter && "is-chapter"]
        .filter(Boolean)
        .join(" ");

    return (
        <h1 ref={ref} className={className || undefined}>
            {stuck && chapter ? chapter : children}
        </h1>
    );
}
