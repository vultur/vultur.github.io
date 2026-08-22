import { readdir } from "node:fs/promises";
import path from "node:path";

import Image from "next/image";
import Link from "next/link";

import { getAuthors, getBooks } from "@/lib/content";
import { countryLabel } from "@/lib/country";

import { Content } from "./_components/content";
import { SpineDate } from "./_components/date";
import { Plates } from "./_components/plates";
import icon from "./icon.png";

const platesDirectory = path.join(process.cwd(), "public/images/plates");

export default async function HomePage() {
    const [authors, books, plateFiles] = await Promise.all([
        getAuthors(),
        getBooks(),
        readdir(platesDirectory),
    ]);
    const plates = plateFiles
        .filter((file) => /\.(?:jpe?g|png|webp)$/i.test(file))
        .sort()
        .map((file) => `/images/plates/${file}`);
    const latestBook = books
        .filter((book) => book.timestamp)
        .sort((left, right) => right.timestamp! - left.timestamp!)[0];

    return (
        <>
            <main className="nextra-home" id="main-content">
                <blockquote className="nextra-home-epigraph">
                    <p>
                        <span>世界问永恒的问题，</span>
                        <span>天空答永恒的沉默。</span>
                    </p>
                    <cite>泰戈尔《飞鸟集》</cite>
                </blockquote>
                <header className="nextra-home-spine">
                    <Link
                        aria-label="查看排版规范"
                        className="nextra-home-spine-icon"
                        href="/guide"
                    >
                        <Image alt="" aria-hidden="true" src={icon} />
                    </Link>
                    <h1 className="nextra-home-spine-label">黑白之外</h1>
                    <SpineDate initialTimestamp={Date.now()} />
                </header>
                <section aria-label="扉页" className="nextra-home-frontispiece">
                    <Plates plates={plates} />
                    {latestBook && (
                        <div className="nextra-home-latest">
                            <small className="nextra-home-latest-label">最近更新</small>
                            <div className="nextra-home-latest-content">
                                <Link
                                    aria-label={`阅读《${latestBook.name}》`}
                                    className="nextra-home-latest-book"
                                    href={`/${latestBook.name}`}
                                >
                                    <cite>《{latestBook.name}》</cite>
                                </Link>
                                {latestBook.authors.length > 0 && (
                                    <span className="nextra-home-latest-authors">
                                        {latestBook.authors.map((author, index) => (
                                            <span key={author.name}>
                                                {index > 0 && "、"}
                                                <small>〔{countryLabel(author.country)}〕</small>
                                                <Link
                                                    href={`/authors#${encodeURIComponent(author.name)}`}
                                                >
                                                    {author.name}
                                                </Link>
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
            <Content authors={authors} books={books} />
        </>
    );
}
