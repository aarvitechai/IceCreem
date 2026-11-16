// Usage: node roles.mjs [baseUrl]. Logs in with each demo role and opens its screens. Reports JS errors, overflow and screens stuck loading.
const base = process.argv[2] ?? "http://localhost:3100";
const roles = {
  "Super admin": ["/admin", "/admin/analytics", "/admin/orders", "/admin/bookings", "/admin/products", "/admin/products/new", "/admin/categories", "/admin/coupons", "/admin/reviews", "/admin/inventory", "/admin/production", "/admin/hawkers", "/admin/users", "/admin/audit"],
  Staff: ["/admin", "/admin/orders", "/admin/inventory"],
  Delivery: ["/delivery"],
  Hawker: ["/hawker"],
  Customer: ["/account/orders", "/account/bookings"],
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

for (const [role, paths] of Object.entries(roles)) {
  const t = await (await fetch("http://127.0.0.1:9333/json/new?about:blank", { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } else if (d.method) events.push(d); };
  await new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const run = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: role === "Delivery" || role === "Hawker" ? 390 : 1366, height: 900, deviceScaleFactor: 1, mobile: false });

  // Log out any earlier session, then log in with the demo button.
  await send("Page.navigate", { url: base + "/login?r=" + Date.now() });
  await wait(6000);
  await run(`fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => 0)`);
  await send("Page.navigate", { url: base + "/login?r2=" + Date.now() });
  await wait(6000);
  const landed = await run(`(async () => { [...document.querySelectorAll("button")].find(b => b.textContent.trim() === ${JSON.stringify(role)}).click(); await new Promise(r => setTimeout(r, 300)); document.querySelector("form button.btn-primary").click(); await new Promise(r => setTimeout(r, 9000)); return location.pathname; })()`);
  console.log(`${role}: logged in, landed on ${landed}`);

  for (const path of paths) {
    events.length = 0;
    await send("Page.navigate", { url: base + path });
    await wait(9000);
    const v = await run(`({ path: location.pathname, overflow: document.documentElement.scrollWidth - innerWidth, h1: document.querySelector("h1")?.innerText || "", loading: !!document.querySelector(".animate-spin") && !document.querySelector("h1"), noAccess: document.body.innerText.includes("No access") })`);
    const errors = events
      .filter((e) => e.method === "Runtime.exceptionThrown" || (e.method === "Runtime.consoleAPICalled" && e.params.type === "error"))
      .map((e) => (e.params.exceptionDetails?.exception?.description ?? e.params.args?.map((a) => a.value ?? a.description).join(" ") ?? "").split("\n")[0])
      .filter((m) => !/ChunkLoadError|negotiation|Failed to start the connection|React DevTools|instant navigation/.test(m));
    const line = `${role} ${path} -> at ${v.path} | h1 "${v.h1.slice(0, 28)}" | overflow ${v.overflow}`;
    console.log(line);
    if (v.path !== path.split("?")[0]) problems.push(`${line} [redirected]`);
    if (v.overflow > 0) problems.push(`${line} [overflow]`);
    if (v.loading) problems.push(`${line} [still loading]`);
    if (v.noAccess) problems.push(`${line} [no access]`);
    for (const e of [...new Set(errors)]) problems.push(`${role} ${path} [js error] ${e.slice(0, 200)}`);
  }
  ws.close();
  await fetch(`http://127.0.0.1:9333/json/close/${t.id}`).catch(() => {});
}

console.log("\n==== PROBLEMS ====");
console.log(problems.length ? problems.join("\n") : "none");
