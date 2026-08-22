export type Excerpt = {
    html: string;
    text: string;
};

const selector = "h2,h3,h4,p,blockquote,ul,ol,hr,article";
const allowedTags = new Set([
    "BLOCKQUOTE",
    "BR",
    "CITE",
    "DEL",
    "EM",
    "H2",
    "H3",
    "H4",
    "HR",
    "INS",
    "LI",
    "MARK",
    "OL",
    "P",
    "STRONG",
    "SUB",
    "SUP",
    "U",
    "UL",
]);

function isAtomic(element: Element) {
    const tag = element.tagName;
    const container = element.closest("blockquote,ol,ul");

    if (container && container !== element) return false;
    if (tag !== "ARTICLE") return true;

    return !element.querySelector(":scope > p,:scope > blockquote,:scope > ol,:scope > ul");
}

function clipContents(range: Range, element: Element) {
    const elementRange = document.createRange();
    elementRange.selectNodeContents(element);

    if (range.compareBoundaryPoints(Range.START_TO_START, elementRange) > 0) {
        elementRange.setStart(range.startContainer, range.startOffset);
    }
    if (range.compareBoundaryPoints(Range.END_TO_END, elementRange) < 0) {
        elementRange.setEnd(range.endContainer, range.endOffset);
    }

    return elementRange.cloneContents();
}

function sanitizeNode(node: Node): Node | undefined {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    if (!(node instanceof HTMLElement)) return;

    const tagName = node.tagName === "ARTICLE" ? "P" : node.tagName;
    const children = Array.from(node.childNodes)
        .map(sanitizeNode)
        .filter((child): child is Node => Boolean(child));

    if (!allowedTags.has(tagName)) {
        const fragment = document.createDocumentFragment();
        fragment.append(...children);
        return fragment;
    }

    const element = document.createElement(tagName.toLowerCase());
    element.append(...children);
    return element;
}

function parseBlock(range: Range, element: HTMLElement) {
    const wrapper = element.cloneNode(false) as HTMLElement;
    wrapper.replaceChildren(clipContents(range, element));
    const sanitized = sanitizeNode(wrapper);
    const container = document.createElement("div");

    if (sanitized) container.append(sanitized);

    const text = container.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!text && element.tagName !== "HR") return;

    return {
        heading: /^H[2-4]$/.test(element.tagName),
        html: container.innerHTML,
        text,
    };
}

export function parseSelection(range: Range, root: HTMLElement): Excerpt[] {
    const blocks = Array.from(root.querySelectorAll<HTMLElement>(selector))
        .filter(isAtomic)
        .filter((element) => range.intersectsNode(element))
        .map((element) => parseBlock(range, element))
        .filter((block): block is NonNullable<typeof block> => Boolean(block));

    const pages: Excerpt[] = [];
    let chapter: Excerpt | undefined;

    for (const block of blocks) {
        if (block.heading) {
            if (chapter) pages.push(chapter);
            chapter = { html: block.html, text: block.text };
        } else if (chapter) {
            chapter.html += block.html;
            chapter.text += `\n\n${block.text}`;
        } else {
            pages.push({ html: block.html, text: block.text });
        }
    }

    if (chapter) pages.push(chapter);
    return pages;
}
