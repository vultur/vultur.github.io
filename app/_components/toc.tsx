"use client";

import { useEffect, useRef, useState, type MouseEvent, type WheelEvent } from "react";

import {
    currentHeading,
    headingEvent,
    reducedMotion,
    scrollToHeading,
    type Heading,
} from "./heading";

export function ReadingToc({ headings }: { headings: Heading[] }) {
    const navRef = useRef<HTMLElement>(null);
    const lockedRef = useRef(false);
    const cancelScrollRef = useRef<(() => void) | undefined>(undefined);
    const frameRef = useRef(0);
    const scrollUntilRef = useRef(0);
    const [activeId, setActiveId] = useState(headings[0]?.id);

    useEffect(() => {
        return () => {
            cancelScrollRef.current?.();
            cancelAnimationFrame(frameRef.current);
        };
    }, []);

    useEffect(() => {
        let frame = 0;

        const update = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (lockedRef.current) return;
                const current = currentHeading(headings)?.id ?? headings[0]?.id;
                setActiveId((previous) => (previous === current ? previous : current));
            });
        };

        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [headings]);

    useEffect(() => {
        let frame = 0;

        const scrollToHash = () => {
            const id = decodeURIComponent(location.hash.slice(1));
            if (!id) return;

            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                scrollToHeading(id);
            });
        };

        scrollToHash();
        window.addEventListener("hashchange", scrollToHash);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("hashchange", scrollToHash);
        };
    }, []);

    useEffect(() => {
        const nav = navRef.current;
        const active = nav?.querySelector<HTMLElement>("a.is-active");
        if (!nav || !active || nav.scrollHeight <= nav.clientHeight) return;
        if (performance.now() < scrollUntilRef.current) return;

        const navRect = nav.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        const distance =
            activeRect.top + activeRect.height / 2 - (navRect.top + nav.clientHeight / 2);

        if (Math.abs(distance) < 3) return;

        cancelAnimationFrame(frameRef.current);

        if (reducedMotion()) {
            nav.scrollTop += distance;
        } else {
            const target = nav.scrollTop + distance;
            const duration = 260;
            const start = performance.now();
            let previous = nav.scrollTop;

            const animate = (time: number) => {
                const progress = Math.min(1, (time - start) / duration);
                const next = previous + (target - previous) * 0.22;
                nav.scrollTop = next;
                previous = next;

                if (progress < 1 && Math.abs(target - next) > 0.8) {
                    frameRef.current = requestAnimationFrame(animate);
                }
            };

            frameRef.current = requestAnimationFrame(animate);
        }
    }, [activeId]);

    function handleWheel(event: WheelEvent<HTMLElement>) {
        const nav = navRef.current;
        if (!nav || nav.scrollHeight <= nav.clientHeight) return;

        const atTop = nav.scrollTop <= 0;
        const atBottom = nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 1;
        const scrollingUp = event.deltaY < 0;
        const scrollingDown = event.deltaY > 0;

        if ((scrollingUp && atTop) || (scrollingDown && atBottom)) return;

        scrollUntilRef.current = performance.now() + 700;
        cancelAnimationFrame(frameRef.current);
        event.stopPropagation();
    }

    function handleHeadingClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
        event.preventDefault();
        cancelAnimationFrame(frameRef.current);
        cancelScrollRef.current?.();
        lockedRef.current = true;
        setActiveId(id);
        history.pushState(null, "", `#${encodeURIComponent(id)}`);
        window.dispatchEvent(new CustomEvent(headingEvent, { detail: id }));
        cancelScrollRef.current = scrollToHeading(id, reducedMotion() ? "auto" : "smooth", () => {
            lockedRef.current = false;
            setActiveId(id);
            window.dispatchEvent(new CustomEvent(headingEvent, { detail: null }));
        });
    }

    return (
        <nav ref={navRef} aria-label="章节" className="nextra-toc" onWheel={handleWheel}>
            <ol>
                {headings.map((heading) => {
                    const active = heading.id === activeId;
                    return (
                        <li key={heading.id}>
                            <a
                                aria-current={active ? "location" : undefined}
                                className={active ? "is-active" : undefined}
                                href={`#${encodeURIComponent(heading.id)}`}
                                onClick={(event) => handleHeadingClick(event, heading.id)}
                            >
                                <span>{heading.value}</span>
                                <span aria-hidden="true" className="nextra-toc-marker" />
                            </a>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
