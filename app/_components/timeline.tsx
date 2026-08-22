import Image from "next/image";
import Link from "next/link";

import type { TimelineEntries } from "@/lib/content";
import { countryLabel } from "@/lib/country";

import { BackToTop } from "./top";

const monthFormatter = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
});

function formatMonth(value: string) {
    const [year, month] = value.split("-").map(Number);
    const parts = monthFormatter.formatToParts(new Date(Date.UTC(year, month - 1)));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value;

    return `${part("year")}.${part("month")}`;
}

export function Timeline({ months }: { months: TimelineEntries }) {
    return (
        <main className="nextra-content is-index" id="main-content">
            <article className={`nextra-content-layout${months.length === 0 ? " is-empty" : ""}`}>
                <h1 className="nextra-sr-only">时间线</h1>
                <nav aria-label="页面导航" className="nextra-content-nav">
                    <Link href="/">
                        <span aria-hidden="true" />[ 首页 ]
                    </Link>
                </nav>
                {months.length === 0 ? (
                    <p className="nextra-index-empty">尚未开卷</p>
                ) : (
                    <div className="nextra-index nextra-timeline">
                        {months.map(({ date, entries }) => {
                            const label = formatMonth(date);

                            return (
                                <section id={date} key={date}>
                                    <header>
                                        <h2>
                                            <a href={`#${date}`} title={label}>
                                                <span
                                                    aria-hidden="true"
                                                    className="nextra-index-marker"
                                                >
                                                    #
                                                </span>
                                                <time className="nextra-index-name" dateTime={date}>
                                                    {label}
                                                </time>
                                            </a>
                                        </h2>
                                    </header>
                                    <ul aria-label={`${label}更新的书籍`}>
                                        {entries.map((book) => (
                                            <li key={book.name}>
                                                <Link href={`/${book.name}`}>
                                                    <Image
                                                        alt={`${book.name}封面`}
                                                        height={90}
                                                        src={book.image}
                                                        width={72}
                                                    />
                                                    <span className="nextra-work-title">
                                                        《{book.name}》
                                                    </span>
                                                    <span
                                                        aria-hidden="true"
                                                        className="nextra-work-rule"
                                                    />
                                                    <span className="nextra-work-authors">
                                                        {book.authors.map((author, index) => (
                                                            <span key={author.name}>
                                                                {index > 0 && "、"}
                                                                <small>
                                                                    〔{countryLabel(author.country)}
                                                                    〕
                                                                </small>
                                                                {author.name}
                                                            </span>
                                                        ))}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            );
                        })}
                    </div>
                )}
            </article>
            <BackToTop />
        </main>
    );
}
