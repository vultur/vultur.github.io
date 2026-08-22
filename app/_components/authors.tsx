import Image from "next/image";
import Link from "next/link";

import type { AuthorsWithBooks } from "@/lib/content";

import { AuthorAlphabet } from "./alphabet";
import { BackToTop } from "./top";

type AuthorsProps = {
    authors: AuthorsWithBooks;
};

const initials: Record<string, string> = {
    阿: "A",
    埃: "A",
    艾: "A",
    安: "A",
    奥: "A",
    巴: "B",
    柏: "B",
    保: "B",
    本: "B",
    伯: "B",
    布: "B",
    陈: "C",
    丹: "D",
    道: "D",
    厄: "E",
    方: "F",
    费: "F",
    弗: "F",
    顾: "G",
    海: "H",
    韩: "H",
    汉: "H",
    豪: "H",
    何: "H",
    赫: "H",
    纪: "J",
    贾: "J",
    卡: "K",
    拉: "L",
    赖: "L",
    李: "L",
    理: "L",
    梁: "L",
    刘: "L",
    鲁: "L",
    路: "L",
    罗: "L",
    马: "M",
    玛: "M",
    蒙: "M",
    米: "M",
    莫: "M",
    纳: "N",
    欧: "O",
    齐: "Q",
    乔: "Q",
    切: "Q",
    若: "R",
    三: "S",
    杉: "S",
    沈: "S",
    石: "S",
    史: "S",
    斯: "S",
    苏: "S",
    索: "S",
    特: "T",
    托: "T",
    汪: "W",
    王: "W",
    威: "W",
    维: "W",
    沃: "W",
    吴: "W",
    西: "X",
    夏: "X",
    亚: "Y",
    阎: "Y",
    伊: "Y",
    尤: "Y",
    原: "Y",
    约: "Y",
    詹: "Z",
    张: "Z",
    周: "Z",
    朱: "Z",
    兹: "Z",
    宗: "Z",
};

function initialFor(name: string) {
    const first = Array.from(name)[0] ?? "";
    return initials[first] ?? (/[A-Z]/i.test(first) ? first.toUpperCase() : "#");
}

export function Authors({ authors }: AuthorsProps) {
    const entries = authors.map((author) => ({
        ...author,
        initial: initialFor(author.name),
    }));
    const letters = [...new Set(entries.map((author) => author.initial))];
    const seen = new Set<string>();

    return (
        <main className="nextra-content is-index" id="main-content">
            <article className="nextra-content-layout">
                <h1 className="nextra-sr-only">作者</h1>
                <nav aria-label="页面导航" className="nextra-content-nav">
                    <Link href="/">
                        <span aria-hidden="true" />[ 首页 ]
                    </Link>
                </nav>
                <AuthorAlphabet letters={letters} />
                <div className="nextra-index">
                    {entries.map((author) => {
                        const startsLetter = !seen.has(author.initial);
                        seen.add(author.initial);

                        return (
                            <section id={author.name} key={author.name}>
                                {startsLetter && (
                                    <span
                                        aria-hidden="true"
                                        className="nextra-author-letter"
                                        id={letterId(author.initial)}
                                    />
                                )}
                                <header>
                                    <h2>
                                        <a
                                            href={`#${encodeURIComponent(author.name)}`}
                                            title={author.name}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="nextra-index-marker"
                                            >
                                                #
                                            </span>
                                            <span className="nextra-index-name">{author.name}</span>
                                        </a>
                                    </h2>
                                </header>
                                <ul aria-label={`${author.name}的作品`}>
                                    {author.books.map((book) => (
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
                                                <time dateTime={String(book.published)}>
                                                    {book.published}
                                                </time>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            </article>
            <BackToTop />
        </main>
    );
}

function letterId(letter: string) {
    return `authors-${letter}`;
}
