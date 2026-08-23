import type { Metadata } from "next";
import { Head } from "nextra/components";
import type { ReactNode } from "react";

import "./styles.css";

export const metadata: Metadata = {
    title: {
        default: "黑白之外｜对立之间，追问真相",
        template: "%s｜黑白之外",
    },
    description: "对立之间，追问真相。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html dir="ltr" lang="zh-CN">
            <Head backgroundColor={{ light: "#ffffff", dark: "#111111" }} />
            <body>
                <a className="nextra-skip-link" href="#main-content">
                    跳至正文
                </a>
                {children}
            </body>
        </html>
    );
}
