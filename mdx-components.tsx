import Image from "next/image";
import Link from "next/link";
import type { MDXWrapper } from "nextra";
import { Anchor, Callout, withGitHubAlert } from "nextra/components";
import { LinkArrowIcon } from "nextra/icons";
import type { MDXComponents } from "nextra/mdx-components";
import { useMDXComponents as getMDXComponents } from "nextra/mdx-components";
import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { Figure } from "./app/_components/figure";
import { SelectionActions } from "./app/_components/selection";
import { ReadingTitle } from "./app/_components/title";
import { ReadingToc } from "./app/_components/toc";
import { BackToTop } from "./app/_components/top";
import { portraitPath } from "./lib/assets";
import { countryLabel } from "./lib/country";

const alertLabels = {
    caution: "注意",
    important: "重要",
    note: "说明",
    tip: "提醒",
    warning: "警告",
} as const;

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
});

type AuthorMetadata = {
    country?: string;
    name: string;
};

type PageMetadata = {
    authors?: unknown;
    cover?: boolean;
    portrait?: boolean;
    published?: number;
    timestamp?: number;
    title?: string;
    toc?: boolean;
};

function hasBody(sourceCode: string) {
    const withoutFrontMatter = sourceCode.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
    const withoutTitle = withoutFrontMatter.replace(/^\s*#(?!#)[^\r\n]*(?:\r?\n|$)/, "");

    return withoutTitle.trim().length > 0;
}

function MdxAnchor({ children, href = "", ...props }: ComponentPropsWithoutRef<"a">) {
    const isExternal = typeof href === "string" && /^(?:https?:)?\/\//.test(href);

    if (!isExternal || typeof children !== "string") {
        return (
            <Anchor href={href} {...props}>
                {children}
            </Anchor>
        );
    }

    const characters = Array.from(children);
    const lastCharacter = characters.pop();

    return (
        <a href={href} rel="noreferrer" target="_blank" {...props}>
            <span className="nextra-external-text">{characters.join("")}</span>
            <span className="nextra-external-tail">
                <span className="nextra-external-text">{lastCharacter}</span>&nbsp;
                <LinkArrowIcon aria-hidden="true" height="1em" />
            </span>
        </a>
    );
}

function hasName(value: unknown): value is AuthorMetadata {
    return Boolean(
        value &&
        typeof value === "object" &&
        typeof (value as { name?: unknown }).name === "string",
    );
}

function normalizeAuthors(value: unknown) {
    const authors = [value].flat().filter(hasName);
    return authors.length > 0 ? authors : [{ name: "佚名" }];
}

const Blockquote = withGitHubAlert(({ type, children }) => {
    const content = Children.toArray(children).slice(1) as ReactNode[];

    return (
        <Callout className="nextra-alert" emoji={null} type={null}>
            <b>{alertLabels[type]}</b>
            {content}
        </Callout>
    );
});

const ContentWrapper: MDXWrapper = ({ children, metadata, sourceCode, toc }) => {
    const page = metadata as PageMetadata;
    const authors = normalizeAuthors(page.authors);
    const isPublication = Boolean(page.published);
    const hasPortrait = page.portrait !== false;
    const hasCover = page.cover !== false;
    const title = page.title;
    const cover = isPublication && hasCover && title ? `/images/books/${title}.svg` : undefined;
    const authorPortrait = portraitPath(authors[0]?.name);
    const portrait = hasPortrait ? (authorPortrait ?? cover) : undefined;
    const headings = toc.filter((heading) => heading.depth === 2);
    const showToc = page.toc !== false && headings.length >= 3;
    const isEmpty = isPublication && !hasBody(sourceCode);
    const className = [
        "nextra-content",
        "is-reading",
        isPublication ? "is-publication" : "is-page",
        isEmpty && "is-empty",
    ]
        .filter(Boolean)
        .join(" ");
    const timestamp = page.timestamp;
    const updated = timestamp ? dateFormatter.format(timestamp) : "";

    return (
        <main className={className} id="main-content">
            <article className="nextra-content-layout">
                <nav aria-label="页面导航" className="nextra-reading-nav">
                    <span aria-hidden="true" />
                    <Link href="/">[ 首页 ]</Link>
                </nav>
                <span aria-hidden="true" className="nextra-reading-sentinel" />
                {isPublication && (portrait || cover) && (
                    <aside aria-label="作品信息" className="nextra-reading-meta">
                        {portrait && (
                            <Image
                                alt=""
                                aria-hidden="true"
                                className="nextra-reading-portrait"
                                height={90}
                                src={portrait}
                                width={72}
                            />
                        )}
                        {cover && (
                            <Image
                                alt={`${title}封面`}
                                className="nextra-reading-cover"
                                height={96}
                                src={cover}
                                width={72}
                            />
                        )}
                    </aside>
                )}
                <header className="nextra-content-header">
                    {title && <ReadingTitle headings={headings}>{title}</ReadingTitle>}
                    {authors.length > 0 && (
                        <p>
                            {authors.map((author, index) => (
                                <span key={author.name}>
                                    {index > 0 && "、"}
                                    <small>〔{countryLabel(author.country)}〕</small>
                                    <Link href={`/authors#${encodeURIComponent(author.name)}`}>
                                        {author.name}
                                    </Link>
                                </span>
                            ))}
                        </p>
                    )}
                </header>
                {showToc && (
                    <aside className="nextra-reading-aside">
                        <ReadingToc headings={headings} />
                    </aside>
                )}
                <div className="nextra-content-body">
                    {isEmpty ? <p className="nextra-content-empty">尚未起笔</p> : children}
                </div>
                {isPublication && timestamp && (
                    <footer className="nextra-content-footer">
                        <span aria-hidden="true" />
                        <Link href="/timeline">
                            <time dateTime={new Date(timestamp).toISOString()}>{updated}</time>
                        </Link>
                        <Image alt="" aria-hidden="true" height={32} src="/icon.png" width={32} />
                    </footer>
                )}
            </article>
            <BackToTop />
            {isPublication && title && (
                <SelectionActions
                    authors={authors.map(({ country, name }) => ({
                        country: countryLabel(country),
                        name,
                    }))}
                    portrait={hasPortrait ? authorPortrait : undefined}
                    title={title}
                />
            )}
        </main>
    );
};

export function useMDXComponents(components: MDXComponents = {}) {
    return {
        ...getMDXComponents({ wrapper: ContentWrapper }),
        Figure,
        a: MdxAnchor,
        blockquote: Blockquote,
        ...components,
    };
}
