import Link from "next/link";

export default function NotFoundPage() {
    return (
        <main className="nextra-status" id="main-content">
            <span aria-hidden="true" className="nextra-status-rule" />
            <h1>此页待续</h1>
            <p>内容暂未收录，或仍在整理。</p>
            <nav aria-label="页面导航">
                <Link href="/">返回主页</Link>
            </nav>
        </main>
    );
}
