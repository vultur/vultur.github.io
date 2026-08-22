"use client";

import { useEffect, useState, type MouseEvent } from "react";

const scrollNudge = 1;

function letterId(letter: string) {
    return `authors-${letter}`;
}

function stickyOffset() {
    const heading = document.querySelector<HTMLElement>(".nextra-index section > header");
    return heading ? Number.parseFloat(getComputedStyle(heading).top) || 0 : 0;
}

function headingTop(target: HTMLElement) {
    const section = target.closest<HTMLElement>("section");
    if (!section) return window.scrollY + target.getBoundingClientRect().top;

    const paddingTop = Number.parseFloat(getComputedStyle(section).paddingTop) || 0;
    return window.scrollY + section.getBoundingClientRect().top + paddingTop;
}

export function AuthorAlphabet({ letters }: { letters: string[] }) {
    const [active, setActive] = useState(letters[0]);

    useEffect(() => {
        let frame = 0;

        const update = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const boundary = stickyOffset() + scrollNudge;
                let current = letters[0];

                for (const letter of letters) {
                    const anchor = document.getElementById(letterId(letter));
                    if (!anchor || anchor.getBoundingClientRect().top > boundary) break;
                    current = letter;
                }

                setActive((previous) => (previous === current ? previous : current));
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
    }, [letters]);

    useEffect(() => {
        let frame = 0;

        const alignHash = () => {
            const id = decodeURIComponent(location.hash.slice(1));
            const target = id ? document.getElementById(id) : null;
            if (!target) return;

            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                window.scrollTo({
                    behavior: "auto",
                    top: headingTop(target) - stickyOffset() + scrollNudge,
                });
            });
        };

        alignHash();
        window.addEventListener("hashchange", alignHash);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("hashchange", alignHash);
        };
    }, []);

    function handleClick(event: MouseEvent<HTMLAnchorElement>, letter: string) {
        const target = document.getElementById(letterId(letter));
        if (!target) return;

        event.preventDefault();
        setActive(letter);
        history.pushState(null, "", `#${letterId(letter)}`);
        window.scrollTo({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            top: headingTop(target) - stickyOffset() + scrollNudge,
        });
    }

    return (
        <nav aria-label="作者字母索引" className="nextra-alphabet">
            <ol>
                {letters.map((letter) => (
                    <li key={letter}>
                        <a
                            aria-current={active === letter ? "location" : undefined}
                            className={active === letter ? "is-active" : undefined}
                            href={`#${letterId(letter)}`}
                            onClick={(event) => handleClick(event, letter)}
                        >
                            <span>{letter}</span>
                            <span aria-hidden="true" className="nextra-alphabet-marker" />
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
