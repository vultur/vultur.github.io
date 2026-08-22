"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { defaultPlates, getPlate } from "./plates";

const cacheKey = "content-plate";

export function Figure() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [plate, setPlate] = useState(defaultPlates[0]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setPlate(getPlate(cacheKey, defaultPlates) ?? defaultPlates[0]);
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || !open || dialog.open) return;
        dialog.showModal();
    }, [open]);

    return (
        <>
            <figure className="nextra-figure">
                <button aria-label="放大随机插图" type="button" onClick={() => setOpen(true)}>
                    <Image
                        alt="随机插图"
                        height={900}
                        sizes="(max-width: 767px) 72vw, 18rem"
                        src={plate}
                        width={720}
                    />
                </button>
                <figcaption>随机插图</figcaption>
            </figure>
            {open && (
                <dialog
                    ref={dialogRef}
                    aria-label="插图预览"
                    className="nextra-plate-preview"
                    onCancel={() => setOpen(false)}
                    onClose={() => setOpen(false)}
                >
                    <button
                        aria-label="关闭插图预览"
                        className="nextra-plate-backdrop"
                        tabIndex={-1}
                        type="button"
                        onClick={() => setOpen(false)}
                    />
                    <div className="nextra-plate-frame">
                        <Image
                            alt="随机插图预览"
                            height={800}
                            sizes="min(512px, 56vh, calc(100vw - 6rem))"
                            src={plate}
                            width={640}
                        />
                    </div>
                </dialog>
            )}
        </>
    );
}
