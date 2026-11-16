// End to end customer journeys in a real browser. Usage: node journeys.mjs [baseUrl]
const base = process.argv[2] ?? "http://localhost:3100";
const t = await (await fetch("http://127.0.0.1:9333/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const run = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval failed");
  return r.result.value;
};
const go = async (path, ms = 7000) => { await send("Page.navigate", { url: base + path }); await wait(ms); };
const results = [];
const check = (name, ok, detail = "") => { results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };

// Helper in the page: set a React controlled or registered input like a person typing.
const typeFn = `window.__type = (sel, v) => { const el = document.querySelector(sel); if (!el) throw new Error("missing " + sel);
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };`;

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });

// 1. Start with an empty cart.
await go("/");
await run(`fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" })`);
await go("/");
await run(`localStorage.removeItem("icecream-cart"); Object.keys(localStorage).forEach(k => k.includes("cart") && localStorage.removeItem(k)); true`);

// 2. Quick add from the shop.
await go("/products", 9000);
const added = await run(`(async () => { const b = [...document.querySelectorAll("main button")].find(b => b.textContent.trim().toLowerCase() === "add to cart"); if (!b) return "no button"; b.click(); await new Promise(r => setTimeout(r, 800)); return document.querySelector("header a[href='/cart']").textContent.trim(); })()`);
check("Add to cart from product card updates header count", added === "1", `cart shows ${added}`);
const stepper = await run(`!!document.querySelector("main [aria-label^='One more']")`);
check("Card turns into a stepper", stepper);

// 3. Cart page and free delivery bar.
await go("/cart");
const cart = await run(`({ items: document.querySelectorAll("main li").length, bar: !!document.querySelector("[role=progressbar]"), total: /total/i.test(document.body.innerText) })`);
check("Cart lists the item with totals and free delivery bar", cart.items >= 1 && cart.bar && cart.total, JSON.stringify(cart));

// 4. Checkout validation, then a real order.
await go("/checkout", 8000);
await run(typeFn + "true");
await run(`document.querySelector("form button[type=submit]").click(); true`);
await wait(800);
const errors = await run(`[...document.querySelectorAll(".field-error")].length`);
check("Empty checkout shows field errors", errors >= 4, `${errors} errors`);
await run(`__type("#customerName", "E2E Tester"); __type("#mobile", "9899999999"); __type("#addressLine", "12 Test Lane, Premnagar"); __type("#city", "Varanasi"); __type("#pincode", "221001"); true`);
await wait(300);
await run(`document.querySelector("form button[type=submit]").click(); true`);
await wait(6000);
const success = await run(`location.pathname`);
if (!success.startsWith("/order-success/")) console.log("checkout said:", await run(`[...document.querySelectorAll("[data-sonner-toast], .field-error")].map(e => e.textContent).join(" / ")`));
check("Placing the order opens the success page", success.startsWith("/order-success/"), success);
const live = await run(`/thank you/i.test(document.body.innerText) && /placed/i.test(document.body.innerText)`);
check("Success page shows thank you and live tracking", live);
const cartAfter = await run(`document.querySelector("header a[href='/cart']")?.textContent.trim()`);
check("Cart is empty after ordering", cartAfter === "0", `cart shows ${cartAfter}`);

// 5. Track the order from the public form.
const orderNumber = decodeURIComponent(success.split("/").pop());
await go("/track");
await run(typeFn + `__type("#orderNumber", ${JSON.stringify(orderNumber)}); __type("#mobile", "9899999999"); true`);
await wait(300);
await run(`document.querySelector("main form button").click(); true`);
await wait(9000);
const tracked = await run(`location.pathname + location.search + " | " + document.body.innerText.toUpperCase().includes(${JSON.stringify(orderNumber.toUpperCase())})`);
check("Track form finds the order", tracked.includes("/track/") && tracked.endsWith("true"), tracked);

// 6. Booking form opens with the occasion picked.
await go("/wedding/book?event=Corporate", 8000);
const booking = await run(`document.body.innerText.match(/Event\\s*\\n?\\s*Corporate/) !== null`);
check("Booking form presets the occasion from the link", booking);

// 7. Gallery viewer.
await go("/gallery", 8000);
const viewer = await run(`(async () => { document.querySelector("main ul li button").click(); await new Promise(r => setTimeout(r, 800)); const open = !!document.querySelector("dialog[open]"); document.querySelector("dialog button[aria-label=Close]")?.click(); await new Promise(r => setTimeout(r, 400)); return open && !document.querySelector("dialog[open]"); })()`);
check("Gallery picture opens and closes", viewer);

// 8. Blog filter.
await go("/blog", 7000);
const blog = await run(`(async () => { const all = document.querySelectorAll("main a[href^='/blog/']").length; [...document.querySelectorAll("main button")].find(b => b.textContent.trim() === "Tips").click(); await new Promise(r => setTimeout(r, 500)); return [all, document.querySelectorAll("main a[href^='/blog/']").length]; })()`);
check("Blog category filter narrows the list", blog[1] > 0 && blog[1] < blog[0], JSON.stringify(blog));

// 9. Review form validation.
await go("/testimonials", 8000);
const review = await run(`(async () => { document.querySelector("#write form button[type=submit]").click(); await new Promise(r => setTimeout(r, 600)); return [...document.querySelectorAll("#write .field-error")].map(e => e.textContent); })()`);
check("Empty review shows rating, name and text errors", review.length >= 3, review.join(" / "));

// 10. Partner form opens WhatsApp with details.
await go("/partner", 7000);
await run(typeFn + `window.__opened = null; window.open = (u) => { window.__opened = u; return null; }; true`);
await run(`__type("#name", "Partner Test"); __type("#mobile", "9800000001"); __type("#city", "Varanasi"); true`);
await wait(300);
const wa = await run(`(async () => { document.querySelector("main form button[type=submit]").click(); await new Promise(r => setTimeout(r, 600)); return window.__opened || ""; })()`);
check("Partner enquiry opens WhatsApp with the details", wa.startsWith("https://wa.me/") && decodeURIComponent(wa).includes("Partner Test"), wa.slice(0, 60));

console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length} passed, ${results.filter((r) => r.startsWith("FAIL")).length} failed`);
ws.close();
