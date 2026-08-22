"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <main className="nextra-status" id="main-content">
            <span aria-hidden="true" className="nextra-status-rule" />
            <h1>暂不可阅</h1>
            <p>内容仍然存在，请稍后再试。</p>
            <button type="button" onClick={reset}>
                重新载入
            </button>
        </main>
    );
}
