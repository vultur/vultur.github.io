import { existsSync } from "node:fs";
import path from "node:path";

export function portraitPath(name: string | undefined) {
    if (!name || name === "佚名") return;

    const pathname = `/images/authors/${name}.jpg`;
    return existsSync(path.join(process.cwd(), "public", pathname)) ? pathname : undefined;
}
