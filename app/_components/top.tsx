"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const update = () => setVisible(window.scrollY > window.innerHeight * 0.75);

        update();
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, []);

    function handleClick() {
        window.scrollTo({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            top: 0,
        });
    }

    return (
        <button
            aria-label="返回顶部"
            aria-hidden={!visible}
            className="nextra-top"
            tabIndex={visible ? 0 : -1}
            type="button"
            onClick={handleClick}
        >
            <span aria-hidden="true" />
        </button>
    );
}
