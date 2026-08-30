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
    date?: string;
    indexed?: boolean;
    page: Excerpt;
    pageCount: number;
    pageNumber: number;
    portrait?: string;
    title: string;
};

export const shareCardBackground = "#f4f3ef";

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
    const isIndexed = data.indexed !== false;
    const thresholds = data.portrait
        ? { compact: 190, dense: 280, ultra: 410, max: 520 }
        : { compact: 240, dense: 360, ultra: 520, max: 680 };
    const density =
        length > thresholds.max
            ? "is-max-dense"
            : length > thresholds.ultra
              ? "is-ultra-dense"
              : length > thresholds.dense
                ? "is-dense"
                : length > thresholds.compact
                  ? "is-compact"
                  : undefined;
    const title = isIndexed ? `《${data.title}》` : `「${data.title}」`;
    const source = isIndexed
        ? data.authors.map((author, index) => (
              <span key={author.name}>
                  {index > 0 && "、"}
                  <span className="nextra-share-country">〔{author.country}〕</span>
                  {author.name}
              </span>
          ))
        : data.date;

    return (
        <div className={["nextra-share-card", density].filter(Boolean).join(" ")} ref={ref}>
            <header className="nextra-share-source">
                <p>{title}</p>
                <p>{source}</p>
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
