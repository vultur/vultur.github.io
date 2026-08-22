import type { Metadata } from "next";

import { Authors } from "@/app/_components/authors";
import { getAuthorsWithBooks } from "@/lib/content";

export const metadata: Metadata = {
    title: { absolute: "黑白之外｜对立之间，追问真相" },
    description: "作者资料与作品索引",
};

export default async function AuthorsPage() {
    const authors = await getAuthorsWithBooks();
    return <Authors authors={authors} />;
}
