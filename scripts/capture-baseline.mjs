// Captures one PNG per Storybook story from `storybook-static/` with headless
// Chrome, to compare the rendering before and after a refactor.
//
// Usage: pnpm storybook:build && pnpm baseline:capture [outDir]
// CHROME_PATH overrides the browser; outDir defaults to docs/baseline.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";

const root = resolve("storybook-static");
const outDir = resolve(process.argv[2] ?? "docs/baseline");
const port = 6107;

const chromeCandidates = [
	process.env.CHROME_PATH,
	"C:/Program Files/Google/Chrome/Application/chrome.exe",
	"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/usr/bin/google-chrome",
	"/usr/bin/chromium",
];
const chrome = chromeCandidates.find((path) => path && existsSync(path));

if (!existsSync(join(root, "index.json"))) {
	console.error(
		"storybook-static/ not found: run `pnpm storybook:build` first.",
	);
	process.exit(1);
}
if (!chrome) {
	console.error("No Chrome found: set CHROME_PATH.");
	process.exit(1);
}

const types = {
	".html": "text/html",
	".js": "text/javascript",
	".json": "application/json",
	".css": "text/css",
	".svg": "image/svg+xml",
	".png": "image/png",
	".woff2": "font/woff2",
};

const server = createServer((request, response) => {
	let path = decodeURIComponent(request.url.split("?")[0]);
	if (path.endsWith("/")) {
		path += "index.html";
	}
	try {
		const file = join(root, path);
		const body = readFileSync(file);
		response.writeHead(200, {
			"Content-Type": types[extname(file)] ?? "application/octet-stream",
		});
		response.end(body);
	} catch {
		response.writeHead(404);
		response.end();
	}
});

await new Promise((done) => server.listen(port, "127.0.0.1", done));

const { entries } = JSON.parse(readFileSync(join(root, "index.json"), "utf8"));
const stories = Object.values(entries).filter(
	(entry) => entry.type === "story",
);

mkdirSync(outDir, { recursive: true });

// Chrome must run asynchronously: a synchronous call would block this
// process's event loop, and with it the server Chrome is loading from.
const capture = (args) =>
	new Promise((done, fail) =>
		execFile(chrome, args, { timeout: 60_000 }, (error) =>
			error ? fail(error) : done(),
		),
	);

for (const { id } of stories) {
	await capture([
		"--headless=new",
		"--disable-gpu",
		"--hide-scrollbars",
		"--window-size=1000,900",
		"--virtual-time-budget=8000",
		`--screenshot=${join(outDir, `${id}.png`)}`,
		`http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story`,
	]);
	console.log(`✓ ${id}`);
}

server.close();
console.log(`${stories.length} captures in ${outDir}`);
