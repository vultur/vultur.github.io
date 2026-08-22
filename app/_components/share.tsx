"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type Ref } from "react";

import type { Excerpt } from "./excerpt";

export type ShareAuthor = {
    country: string;
    name: string;
};

export type ShareData = {
    authors: ShareAuthor[];
    page: Excerpt;
    pageCount: number;
    pageNumber: number;
    portrait?: string;
    title: string;
};

export function ShareCard({
    data,
    ref,
    showPagination = false,
}: {
    data: ShareData;
    ref?: Ref<HTMLDivElement>;
    showPagination?: boolean;
}) {
    const length = data.page.text.length;
    const density =
        length > 410
            ? "is-ultra-dense"
            : length > 280
              ? "is-dense"
              : length > 190
                ? "is-compact"
                : undefined;

    return (
        <div className={["nextra-share-card", density].filter(Boolean).join(" ")} ref={ref}>
            <header className="nextra-share-source">
                <p>《{data.title}》</p>
                <p>
                    {data.authors.map((author, index) => (
                        <span key={author.name}>
                            {index > 0 && "、"}
                            <span className="nextra-share-country">〔{author.country}〕</span>
                            {author.name}
                        </span>
                    ))}
                </p>
            </header>
            <div className={`nextra-share-content${data.portrait ? " has-portrait" : ""}`}>
                {data.portrait && (
                    <Image
                        alt=""
                        aria-hidden="true"
                        className="nextra-share-portrait"
                        height={96}
                        src={data.portrait}
                        width={96}
                    />
                )}
                <div
                    className="nextra-share-quote"
                    dangerouslySetInnerHTML={{ __html: data.page.html }}
                />
            </div>
            <footer className="nextra-share-brand">
                {showPagination && (
                    <span aria-live="polite" className="nextra-share-page">
                        {data.pageNumber} / {data.pageCount}
                    </span>
                )}
                <Image alt="" aria-hidden="true" height={32} src="/icon.png" width={32} />
            </footer>
        </div>
    );
}

export function ShareCardPreview({ data }: { data: ShareData }) {
    const frameRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;

        const observer = new ResizeObserver(([entry]) => {
            setScale(entry.contentRect.width / 540);
        });
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="nextra-share-frame" ref={frameRef}>
            <div className="nextra-share-scale" style={{ transform: `scale(${scale})` }}>
                <ShareCard data={data} showPagination />
            </div>
        </div>
    );
}
