"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const timeZone = "Asia/Shanghai";
const labelFormatter = new Intl.DateTimeFormat("zh-CN-u-nu-hanidec", {
    month: "long",
    timeZone,
    year: "numeric",
});
const valueFormatter = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone,
    year: "numeric",
});

function formatDate(timestamp: number) {
    const parts = valueFormatter.formatToParts(timestamp);
    const year = parts.find(({ type }) => type === "year")?.value;
    const month = parts.find(({ type }) => type === "month")?.value;

    return {
        label: labelFormatter.format(timestamp),
        value: `${year}-${month}`,
    };
}

export function SpineDate({ initialTimestamp }: { initialTimestamp: number }) {
    const [date, setDate] = useState(() => formatDate(initialTimestamp));

    useEffect(() => {
        setDate(formatDate(Date.now()));
    }, []);

    return (
        <Link aria-label="查看阅读时间线" className="nextra-spine-date" href="/timeline">
            <time dateTime={date.value}>{date.label}</time>
        </Link>
    );
}
