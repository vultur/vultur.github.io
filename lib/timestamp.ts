import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const marker = "--timestamp=";

let cache: Promise<Map<string, number>> | undefined;

async function readTimestamps() {
    const timestamps = new Map<string, number>();

    try {
        const { stdout } = await execFileAsync("git", [
            "-c",
            "core.quotepath=false",
            "log",
            `--format=${marker}%ct`,
            "--name-only",
            "--",
            "content/books",
        ]);
        let timestamp = 0;

        for (const line of stdout.split("\n")) {
            if (line.startsWith(marker)) {
                timestamp = Number(line.slice(marker.length)) * 1000;
                continue;
            }

            const match = line.match(/^content\/books\/(.+)\.mdx?$/);
            if (timestamp && match && !timestamps.has(match[1])) {
                timestamps.set(match[1], timestamp);
            }
        }
    } catch {
        // Nextra's timestamp remains the fallback when Git metadata is unavailable.
    }

    return timestamps;
}

export function getTimestamps() {
    return (cache ??= readTimestamps());
}
