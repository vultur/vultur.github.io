"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type PlatesProps = {
    plates: string[];
};

export const defaultPlates = [
    "/images/plates/coast.jpg",
    "/images/plates/crosswalk.jpg",
    "/images/plates/figures.jpg",
    "/images/plates/flower.jpg",
    "/images/plates/gate.jpg",
    "/images/plates/horizon.jpg",
    "/images/plates/river.jpg",
    "/images/plates/skylight.jpg",
    "/images/plates/swans.jpg",
    "/images/plates/tide.jpg",
    "/images/plates/vase.jpg",
];

const cacheKey = "home-plate";
const cacheTtl = 6 * 60 * 60 * 1000;

type StoredPlate = {
    expiresAt: number;
    src: string;
};

function pick(plates: string[], previous?: string) {
    const candidates =
        plates.length > 1 && previous ? plates.filter((plate) => plate !== previous) : plates;

    return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getPlate(key: string, plates: string[]): string | undefined {
    if (plates.length === 0) return;

    let stored: StoredPlate | undefined;

    try {
        stored = JSON.parse(localStorage.getItem(key) ?? "null") ?? undefined;
    } catch {
        stored = undefined;
    }

    if (stored && stored.expiresAt > Date.now() && plates.includes(stored.src)) {
        return stored.src;
    }

    const src = pick(plates, stored?.src);

    try {
        localStorage.setItem(
            key,
            JSON.stringify({
                expiresAt: Date.now() + cacheTtl,
                src,
            } satisfies StoredPlate),
        );
    } catch {
        // Storage may be unavailable in private or restricted browsing modes.
    }

    return src;
}

export function Plates({ plates }: PlatesProps) {
    const [src, setSrc] = useState<string>();

    useEffect(() => {
        setSrc(getPlate(cacheKey, plates));
    }, [plates]);

    return (
        <Link
            aria-label="进入黑白之外"
            className={`nextra-home-plate${src ? " is-ready" : ""}`}
            href="/黑白之外"
        >
            {src && (
                <Image
                    alt=""
                    aria-hidden="true"
                    fetchPriority="high"
                    height={800}
                    sizes="clamp(61px, calc(4.43vw + 27px), 94px)"
                    src={src}
                    width={640}
                />
            )}
        </Link>
    );
}
