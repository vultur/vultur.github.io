import type { Metadata } from "next";

import { Timeline } from "@/app/_components/timeline";
import { getTimeline } from "@/lib/content";

export const metadata: Metadata = {
    title: "时间线",
    description: "按阅读时间浏览作品",
};

export default async function TimelinePage() {
    return <Timeline months={await getTimeline()} />;
}
