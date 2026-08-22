import { importPage } from "nextra/pages";

import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export async function generateMetadata() {
    const { metadata } = await importPage(["guide"]);

    return {
        ...metadata,
        title: { absolute: "黑白之外｜对立之间，追问真相" },
    };
}

const Wrapper = getMDXComponents().wrapper;

export default async function GuidePage() {
    const { default: MDXContent, ...page } = await importPage(["guide"]);

    return (
        <Wrapper {...page}>
            <MDXContent />
        </Wrapper>
    );
}
