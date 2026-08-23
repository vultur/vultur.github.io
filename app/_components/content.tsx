"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type PointerEvent } from "react";

type Entry = {
    name: string;
    image?: string;
};

type ContentProps = {
    authors: Entry[];
    books: Entry[];
};

const minLength = 9;
const influenceRadius = 72;
const activeStrip = 48;
const previewRadius = 60;
const maxScrollRatio = 3.2;

function IndexRail({ entries, type }: { entries: Entry[]; type: "author" | "book" }) {
    const railRef = useRef<HTMLDivElement>(null);
    const pointerRef = useRef<number | null>(null);
    const frameRef = useRef<number | null>(null);
    const previousRef = useRef<number | null>(null);
    const styledRef = useRef<Set<HTMLElement>>(new Set());

    useEffect(
        () => () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        },
        [],
    );

    function updateLines(pointer: number) {
        const rail = railRef.current;
        if (!rail) return;

        const horizontal = rail.scrollWidth > rail.clientWidth;
        const maxLength = 40;
        const railRect = rail.getBoundingClientRect();
        const previewStart = horizontal ? railRect.left : railRect.top;
        const previewEnd = horizontal ? railRect.right : railRect.bottom;
        const controls = Array.from(rail.children) as HTMLElement[];
        const itemSize = horizontal ? controls[0]?.offsetWidth : controls[0]?.offsetHeight;
        if (!itemSize) return;

        const start = horizontal ? railRect.left : railRect.top;
        const scrollPosition = horizontal ? rail.scrollLeft : rail.scrollTop;
        const centerIndex = Math.floor((pointer - start + scrollPosition) / itemSize);
        const radius = Math.ceil(influenceRadius / itemSize);
        const activeControls = new Set<HTMLElement>();

        for (
            let index = Math.max(0, centerIndex - radius);
            index <= Math.min(controls.length - 1, centerIndex + radius);
            index++
        ) {
            const control = controls[index];
            const center = start + index * itemSize + itemSize / 2 - scrollPosition;
            const proximity = Math.max(0, 1 - Math.abs(pointer - center) / influenceRadius);
            const length = minLength + (maxLength - minLength) * proximity ** 2;
            const previewCenter = Math.min(
                previewEnd - previewRadius,
                Math.max(previewStart + previewRadius, center),
            );
            control.style.setProperty("--indicator-scale", String(length / maxLength));
            control.style.setProperty("--preview-offset", `${previewCenter - center}px`);
            activeControls.add(control);
        }

        styledRef.current.forEach((control) => {
            if (activeControls.has(control)) return;
            control.style.removeProperty("--indicator-scale");
            control.style.removeProperty("--preview-offset");
        });
        styledRef.current = activeControls;
    }

    function stopAnimation() {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
    }

    function resetInteraction() {
        if (
            pointerRef.current === null &&
            previousRef.current === null &&
            styledRef.current.size === 0
        ) {
            return;
        }

        pointerRef.current = null;
        previousRef.current = null;
        stopAnimation();
        styledRef.current.forEach((control) =>
            ["--indicator-scale", "--preview-offset"].forEach((property) =>
                control.style.removeProperty(property),
            ),
        );
        styledRef.current.clear();
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (event.pointerType === "touch") return;

        const rail = railRef.current;
        if (!rail) return;

        const horizontal = rail.scrollWidth > rail.clientWidth;
        const rect = rail.getBoundingClientRect();
        const inStrip = horizontal
            ? type === "author"
                ? event.clientY <= rect.top + activeStrip
                : event.clientY >= rect.bottom - activeStrip
            : type === "author"
              ? event.clientX <= rect.left + activeStrip
              : event.clientX >= rect.right - activeStrip;

        if (!inStrip) {
            resetInteraction();
            return;
        }

        const pointer = horizontal ? event.clientX : event.clientY;
        const previous = previousRef.current;
        const viewport = horizontal ? rail.clientWidth : rail.clientHeight;
        const contentSize = horizontal ? rail.scrollWidth : rail.scrollHeight;

        if (previous !== null && viewport > 0) {
            const ratio = Math.min(
                maxScrollRatio,
                Math.max(0, (contentSize - viewport) / viewport),
            );
            const distance = (pointer - previous) * ratio;
            if (horizontal) rail.scrollLeft += distance;
            else rail.scrollTop += distance;
        }

        pointerRef.current = pointer;
        previousRef.current = pointer;

        if (frameRef.current === null) {
            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = null;
                if (pointerRef.current !== null) updateLines(pointerRef.current);
            });
        }
    }

    function handlePointerLeave() {
        resetInteraction();
    }

    return (
        <div
            ref={railRef}
            className={`nextra-home-index is-${type}s`}
            onPointerLeave={handlePointerLeave}
            onPointerMove={handlePointerMove}
        >
            {entries.map((entry) => {
                const isBook = type === "book";
                const label = isBook ? `《${entry.name}》` : entry.name;

                return (
                    <Link
                        key={entry.name}
                        aria-label={`查看${isBook ? "作品" : "作者"}${label}`}
                        className={`nextra-home-control is-${type}`}
                        href={
                            isBook ? `/${entry.name}` : `/authors#${encodeURIComponent(entry.name)}`
                        }
                    >
                        <span aria-hidden="true" className="nextra-home-preview">
                            {entry.image ? (
                                <Image
                                    alt=""
                                    height={isBook ? 96 : 90}
                                    src={entry.image}
                                    width={72}
                                />
                            ) : (
                                <span className="nextra-home-preview-placeholder">
                                    {Array.from(entry.name)[0]}
                                </span>
                            )}
                            <span>{label}</span>
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

export function Content({ authors, books }: ContentProps) {
    return (
        <nav aria-label="内容索引" className="nextra-home-pagination">
            <IndexRail entries={authors} type="author" />
            <IndexRail entries={books} type="book" />
        </nav>
    );
}
