import { readFile } from "node:fs/promises";
import path from "node:path";

import type { MdxFile } from "nextra";
import { getPageMap } from "nextra/page-map";

import { portraitPath } from "./assets";
import { getTimestamps } from "./timestamp";

const collator = new Intl.Collator("zh-CN-u-co-pinyin");
const timeZone = "Asia/Shanghai";
const monthFormatter = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone,
    year: "numeric",
});

type Author = {
    image?: string;
    name: string;
};

type Book = {
    authors: ContentAuthor[];
    image: string;
    name: string;
    published: number;
    timestamp?: number;
};

type ContentAuthor = { country?: string; name: string };

type ContentMetadata = {
    authors?: ContentAuthor | ContentAuthor[];
    published?: number;
    timestamp?: number;
    title?: string;
};

function compareNames(left: { name: string }, right: { name: string }) {
    return collator.compare(left.name, right.name);
}

function compareUpdates(left: Book & { timestamp: number }, right: Book & { timestamp: number }) {
    return right.timestamp - left.timestamp || compareNames(left, right);
}

async function readContent(directory: "authors" | "books") {
    const pageMap = await getPageMap(`/${directory}`);

    return pageMap.filter(
        (item): item is MdxFile<ContentMetadata> =>
            "frontMatter" in item && item.name !== "index" && Boolean(item.frontMatter),
    );
}

async function hasBody(name: string) {
    const file = path.join(process.cwd(), "content/books", `${name}.mdx`);
    const source = await readFile(file, "utf8");
    const body = source
        .replace(/^---[\s\S]*?---\s*/, "")
        .replace(/^# .+(?:\r?\n|$)/, "")
        .trim();

    return Boolean(body);
}

export async function getAuthors(): Promise<Author[]> {
    return (await readContent("authors"))
        .map(({ frontMatter, name }) => {
            const title = frontMatter?.title ?? name;

            return {
                image: portraitPath(title),
                name: title,
            };
        })
        .sort(compareNames);
}

export async function getBooks(): Promise<Book[]> {
    const [content, timestamps] = await Promise.all([readContent("books"), getTimestamps()]);

    return content
        .filter(({ name }) => name !== "黑白之外")
        .map(({ frontMatter, name }) => {
            const value = frontMatter?.authors;
            const authors = value ? (Array.isArray(value) ? value : [value]) : [];

            return {
                authors,
                image: `/images/books/${frontMatter?.title ?? name}.svg`,
                name: frontMatter?.title ?? name,
                published: Number(frontMatter?.published),
                timestamp: timestamps.get(name) ?? frontMatter?.timestamp,
            };
        })
        .sort(compareNames);
}

export async function getAuthorsWithBooks() {
    const [authors, books] = await Promise.all([getAuthors(), getBooks()]);

    return authors.map((author) => ({
        ...author,
        books: books
            .filter((book) => book.authors.some(({ name }) => name === author.name))
            .sort((left, right) => left.published - right.published || compareNames(left, right)),
    }));
}

export async function getTimeline() {
    const content = await Promise.all(
        (await getBooks()).map(async (book) => ((await hasBody(book.name)) ? book : undefined)),
    );
    const books = content
        .filter((book): book is Book & { timestamp: number } => Boolean(book?.timestamp))
        .sort(compareUpdates);
    const months = new Map<string, typeof books>();

    for (const book of books) {
        const parts = monthFormatter.formatToParts(book.timestamp);
        const year = parts.find(({ type }) => type === "year")?.value;
        const month = parts.find(({ type }) => type === "month")?.value;
        const date = `${year}-${month}`;
        const group = months.get(date) ?? [];
        group.push(book);
        months.set(date, group);
    }

    return [...months]
        .map(([date, entries]) => ({ date, entries }))
        .sort((left, right) => right.date.localeCompare(left.date));
}

export type AuthorsWithBooks = Awaited<ReturnType<typeof getAuthorsWithBooks>>;
export type TimelineEntries = Awaited<ReturnType<typeof getTimeline>>;
