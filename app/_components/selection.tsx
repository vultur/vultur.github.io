"use client";

import { toBlob } from "html-to-image";
import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
    type TouchEvent,
} from "react";
import { createPortal } from "react-dom";

import { parseSelection, type Excerpt } from "./excerpt";
import { shareCardBackground, ShareCard, ShareCardPreview, type ShareAuthor } from "./share";

type SelectionActionsProps = {
    authors: ShareAuthor[];
    date?: string;
    indexed?: boolean;
    portrait?: string;
    title: string;
};

type Toolbar = {
    text: string;
    x: number;
    y: number;
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 12 20">
            <g transform={direction === "right" ? "translate(12 0) scale(-1 1)" : undefined}>
                <path d="M9 2 2 10l7 8" />
            </g>
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 4v14m0 0 5-5m-5 5-5-5" />
        </svg>
    );
}

function safeFilename(value: string) {
    return value.replace(/[\\/:*?"<>|]/g, "-");
}

export function SelectionActions({
    authors,
    date,
    indexed,
    portrait,
    title,
}: SelectionActionsProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const exportRefs = useRef<Array<HTMLDivElement | null>>([]);
    const touchStartRef = useRef(0);
    const [toolbar, setToolbar] = useState<Toolbar>();
    const [pages, setPages] = useState<Excerpt[]>([]);
    const [current, setCurrent] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);

    const cards = pages.map((page, index) => ({
        authors,
        date,
        indexed,
        page,
        pageCount: pages.length,
        pageNumber: index + 1,
        portrait,
        title,
    }));

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        let frame = 0;
        let timer = 0;

        const update = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (window.matchMedia("(max-width: 47.999rem)").matches) {
                    setToolbar(undefined);
                    return;
                }
                if (dialogRef.current?.open) return;

                const selection = window.getSelection();
                const root = document.querySelector<HTMLElement>(".nextra-content-body");
                if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !root) {
                    setToolbar(undefined);
                    return;
                }

                const range = selection.getRangeAt(0);
                const ancestor =
                    range.commonAncestorContainer instanceof Element
                        ? range.commonAncestorContainer
                        : range.commonAncestorContainer.parentElement;
                if (!ancestor || !root.contains(ancestor)) {
                    setToolbar(undefined);
                    return;
                }

                const text = selection.toString().trim();
                const rect = range.getBoundingClientRect();
                if (!text || (!rect.width && !rect.height)) {
                    setToolbar(undefined);
                    return;
                }

                setToolbar({
                    text,
                    x: Math.min(window.innerWidth - 48, Math.max(48, rect.left + rect.width / 2)),
                    y: Math.max(48, rect.top - 8),
                });
            });
        };

        const schedule = () => {
            window.clearTimeout(timer);
            setToolbar(undefined);
            timer = window.setTimeout(update, 260);
        };
        const hide = () => setToolbar(undefined);

        document.addEventListener("selectionchange", schedule);
        window.addEventListener("resize", update);
        window.addEventListener("scroll", hide, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(timer);
            document.removeEventListener("selectionchange", schedule);
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", hide);
        };
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || pages.length === 0 || dialog.open) return;
        dialog.showModal();
    }, [pages]);

    function preserveSelection(event: PointerEvent<HTMLButtonElement>) {
        event.preventDefault();
    }

    async function copySelection() {
        if (!toolbar) return;
        const text = toolbar.text;
        setToolbar(undefined);
        window.getSelection()?.removeAllRanges();
        await navigator.clipboard.writeText(text);
    }

    function openShare() {
        const selection = window.getSelection();
        const root = document.querySelector<HTMLElement>(".nextra-content-body");
        if (!selection || selection.rangeCount === 0 || !root) return;

        const range = selection.getRangeAt(0).cloneRange();
        setToolbar(undefined);
        selection.removeAllRanges();
        const nextPages = parseSelection(range, root);
        if (nextPages.length === 0) return;

        setCurrent(0);
        setPages(nextPages);
    }

    function closeDialog() {
        dialogRef.current?.close();
        setPages([]);
        setCurrent(0);
        setSaving(false);
    }

    function move(step: number) {
        setCurrent((index) => (index + step + cards.length) % cards.length);
    }

    function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
        if (event.key === "ArrowLeft" && cards.length > 1) move(-1);
        if (event.key === "ArrowRight" && cards.length > 1) move(1);
    }

    function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
        touchStartRef.current = event.changedTouches[0]?.clientX ?? 0;
    }

    function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
        if (cards.length < 2) return;
        const distance = (event.changedTouches[0]?.clientX ?? 0) - touchStartRef.current;
        if (Math.abs(distance) < 44) return;
        move(distance > 0 ? -1 : 1);
    }

    async function saveAll() {
        if (saving) return;
        setSaving(true);

        try {
            await document.fonts.ready;
            const urls = await Promise.all(
                exportRefs.current.slice(0, cards.length).map(async (node, index) => {
                    if (!node) throw new Error(`Missing export card ${index + 1}`);
                    const blob = await toBlob(node, {
                        backgroundColor: shareCardBackground,
                        cacheBust: true,
                        height: 960,
                        pixelRatio: 2,
                        width: 540,
                    });
                    if (!blob) throw new Error(`Unable to render card ${index + 1}`);
                    return URL.createObjectURL(blob);
                }),
            );

            urls.forEach((url, index) => {
                const anchor = document.createElement("a");
                const markedTitle = indexed === false ? `「${title}」` : `《${title}》`;
                anchor.download = `${safeFilename(`黑白之外-${markedTitle}`)}-${index + 1}.png`;
                anchor.href = url;
                anchor.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 3000);
            });
        } finally {
            setSaving(false);
        }
    }

    if (!mounted) return null;

    return createPortal(
        <>
            {toolbar && (
                <div className="nextra-selection" style={{ left: toolbar.x, top: toolbar.y }}>
                    <div role="toolbar" aria-label="选中文字操作">
                        <button
                            onClick={copySelection}
                            onPointerDown={preserveSelection}
                            type="button"
                        >
                            复制
                        </button>
                        <span aria-hidden="true" />
                        <button onClick={openShare} onPointerDown={preserveSelection} type="button">
                            转发
                        </button>
                    </div>
                </div>
            )}
            <dialog
                aria-label="转发摘录"
                className="nextra-share-dialog"
                onCancel={(event) => {
                    event.preventDefault();
                    closeDialog();
                }}
                onKeyDown={handleDialogKeyDown}
                ref={dialogRef}
            >
                <button
                    aria-label="关闭转发预览"
                    className="nextra-share-backdrop"
                    onClick={closeDialog}
                    tabIndex={-1}
                    type="button"
                />
                {cards.length > 0 && (
                    <div className="nextra-share-layout">
                        <div
                            className="nextra-share-preview"
                            onTouchEnd={handleTouchEnd}
                            onTouchStart={handleTouchStart}
                        >
                            <ShareCardPreview data={cards[current]} />
                        </div>
                        {cards.length > 1 && (
                            <>
                                <button
                                    aria-label="上一张"
                                    className="nextra-share-arrow is-previous"
                                    onClick={() => move(-1)}
                                    type="button"
                                >
                                    <ChevronIcon direction="left" />
                                </button>
                                <button
                                    aria-label="下一张"
                                    className="nextra-share-arrow is-next"
                                    onClick={() => move(1)}
                                    type="button"
                                >
                                    <ChevronIcon direction="right" />
                                </button>
                            </>
                        )}
                        <footer className="nextra-share-controls">
                            <button
                                aria-label={`保存全部 ${cards.length} 张图片`}
                                className="nextra-share-button nextra-share-download"
                                disabled={saving}
                                onClick={saveAll}
                                title={`保存全部 ${cards.length} 张图片`}
                                type="button"
                            >
                                <DownloadIcon />
                            </button>
                        </footer>
                    </div>
                )}
                <div aria-hidden="true" className="nextra-share-export">
                    {cards.map((card, index) => (
                        <ShareCard
                            data={card}
                            key={index}
                            ref={(node) => {
                                exportRefs.current[index] = node;
                            }}
                        />
                    ))}
                </div>
            </dialog>
        </>,
        document.body,
    );
}
