import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="bg-foreground text-background py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold mb-4 tracking-tight">Mentra</div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
              Designed for the way your brain actually works. Built with intention for clarity and focus.
            </p>
          </div>

          {/* Spacer for layout balance if needed or more cols */}
          <div className="hidden md:block"></div>

          {/* Links Section 1 */}
          <div>
            <h4 className="font-semibold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground/80">
              <li><Link href="#features" className="hover:text-background transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-background transition-colors">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-background transition-colors">Changelog</Link></li>
              <li><Link href="/manifesto" className="hover:text-background transition-colors">Manifesto</Link></li>
            </ul>
          </div>

          {/* Links Section 2 */}
          <div>
            <h4 className="font-semibold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground/80">
              <li><Link href="/about" className="hover:text-background transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-background transition-colors">Blog</Link></li>
              <li><Link href="https://twitter.com/mentra" className="hover:text-background transition-colors">Twitter</Link></li>
              <li><Link href="mailto:hello@mentra.so" className="hover:text-background transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground/60">
            © 2026 Mentra Inc. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm text-muted-foreground/60">
            <Link href="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-background transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
