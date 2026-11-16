// Opens every page at phone and desktop width and reports: HTTP status, horizontal overflow,
// JavaScript errors, broken images and empty main content. Usage: node pages.mjs [baseUrl]
const base = process.argv[2] ?? "http://localhost:3100";
const pages = [
  "/", "/products", "/products/classic-vanilla", "/products/alphonso-mango", "/cart", "/checkout",
  "/events", "/events/birthday", "/events/corporate", "/wedding", "/wedding/book?event=Birthday",
  "/gallery", "/blog", "/blog/kulfi-vs-ice-cream", "/testimonials", "/partner", "/about", "/contact",
  "/track", "/login", "/register", "/no-such-page",
];
const widths = [390, 1366];

async function tab() {
  const t = await (await fetch("http://127.0.0.1:9333/json/new?about:blank", { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); }
    else if (d.method) events.push(d);
  };
  await new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { ws, send, events, id: t.id };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

for (const width of widths) {
  for (const path of pages) {
    const { ws, send, events, id } = await tab();
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await send("Page.navigate", { url: base + path });
    await wait(7000);
    const r = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.loading !== "lazy").map(i => i.getAttribute("src")).slice(0, 3),
        main: (document.querySelector("main")?.innerText || "").trim().length,
        h1: document.querySelector("h1")?.innerText || "",
      }))()`,
    });
    const v = r.result.value;
    const doc = events.find((e) => e.method === "Network.responseReceived" && e.params.type === "Document");
    const status = doc?.params.response.status;
    const errors = events
      .filter((e) => e.method === "Runtime.exceptionThrown" || (e.method === "Runtime.consoleAPICalled" && e.params.type === "error"))
      .map((e) => (e.params.exceptionDetails?.exception?.description ?? e.params.args?.map((a) => a.value ?? a.description).join(" ") ?? "").split("\n")[0])
      .filter((m) => !/ChunkLoadError|negotiation|Failed to start the connection|Download the React DevTools/.test(m));
    const line = `${width}px ${path} -> ${status} | overflow ${v.overflow} | main ${v.main} chars | h1 "${v.h1.slice(0, 30)}"`;
    console.log(line);
    const expected404 = path === "/no-such-page";
    if ((!expected404 && status !== 200) || (expected404 && status !== 404)) problems.push(`${line} [status]`);
    if (v.overflow > 0) problems.push(`${line} [overflow]`);
    if (v.broken.length) problems.push(`${line} [broken images ${v.broken.join(", ")}]`);
    if (v.main < 40) problems.push(`${line} [almost empty]`);
    for (const e of [...new Set(errors)]) problems.push(`${width}px ${path} [js error] ${e.slice(0, 200)}`);
    ws.close();
    await fetch(`http://127.0.0.1:9333/json/close/${id}`).catch(() => {});
  }
}

console.log("\n==== PROBLEMS ====");
console.log(problems.length ? problems.join("\n") : "none");
