import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-choco text-cream">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-xl font-bold">🍨 Scoop Factory</div>
          <p className="mt-3 text-sm text-cream/70">Fresh ice cream made every morning with farm milk and real fruit.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link href="/products?category=tubs" className="hover:text-white">Tubs and Cups</Link></li>
            <li><Link href="/products?category=cones" className="hover:text-white">Cones</Link></li>
            <li><Link href="/products?category=kulfi" className="hover:text-white">Kulfi</Link></li>
            <li><Link href="/products?category=family" className="hover:text-white">Family Packs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Help</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link href="/track" className="hover:text-white">Track your order</Link></li>
            <li><Link href="/wedding" className="hover:text-white">Wedding booking</Link></li>
            <li><Link href="/about" className="hover:text-white">About and FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>Factory Road, Lucknow</li>
            <li>+91 90000 00000</li>
            <li>Open 9 am to 10 pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/50">
        Scoop Factory. Prices include GST. Free delivery above Rs 499.
      </div>
    </footer>
  );
}
