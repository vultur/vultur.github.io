import { readdir } from "node:fs/promises";
import path from "node:path";

import { importPage } from "nextra/pages";

import { getTimestamps } from "@/lib/timestamp";

import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export async function generateStaticParams() {
    const directory = path.join(process.cwd(), "content/books");
    const files = await readdir(directory);

    return files
        .filter((file) => /\.mdx?$/.test(file))
        .map((file) => ({
            mdxPath: file.replace(/\.mdx?$/, ""),
        }));
}

type BookPageProps = {
    params: Promise<{ mdxPath: string }>;
};

function hasName(value: unknown): value is { name: string } {
    return Boolean(
        value &&
        typeof value === "object" &&
        typeof (value as { name?: unknown }).name === "string",
    );
}

function authorNames(value: unknown) {
    return [value]
        .flat()
        .filter(hasName)
        .map((author) => author.name)
        .join("、");
}

export async function generateMetadata({ params }: BookPageProps) {
    const { mdxPath } = await params;
    const { metadata } = await importPage(["books", mdxPath]);
    const authors = authorNames(metadata.authors);
    const title =
        mdxPath === "黑白之外"
            ? "黑白之外｜对立之间，追问真相"
            : [metadata.title, authors].filter(Boolean).join("｜");

    return {
        ...metadata,
        title: { absolute: title },
    };
}

const Wrapper = getMDXComponents().wrapper;

export default async function BookPage({ params }: BookPageProps) {
    const { mdxPath: name } = await params;
    const mdxPath = ["books", name];
    const { default: MDXContent, ...page } = await importPage(mdxPath);
    const source = page.metadata.filePath?.match(/^content\/books\/(.+)\.mdx?$/)?.[1] ?? name;
    const timestamp = (await getTimestamps()).get(source) ?? page.metadata.timestamp;
    page.metadata = { ...page.metadata, timestamp };

    return (
        <Wrapper {...page}>
            <MDXContent params={{ mdxPath }} />
        </Wrapper>
    );
}
