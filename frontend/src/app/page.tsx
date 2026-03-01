import Link from 'next/link';
import {
  Zap, Coins, Star, Lock, ShoppingBag, BarChart3, Users,
  ArrowRight, Sparkles, Globe, Shield, ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Rapid MVP</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Web 2.5 Creator Economy Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Monetize Your
            <br />
            <span className="gradient-text">Creative Vision</span>
          </h1>

          <p className="text-xl text-foreground-muted max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            The next-gen platform that combines the best of Web3 tokenomics with centralized simplicity.
            Token-gated content, gamified engagement, and a creator-first economy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/register" className="btn-primary text-base px-8 py-3.5">
              Start Creating <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/register" className="btn-secondary text-base px-8 py-3.5">
              Join as Fan
            </Link>
          </div>

          {/* Floating cards */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="card text-center py-6 animate-float" style={{ animationDelay: '0s' }}>
              <Coins className="w-8 h-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">Tokens</div>
              <div className="text-xs text-foreground-muted">Purchase & Spend</div>
            </div>
            <div className="card text-center py-6 animate-float" style={{ animationDelay: '0.5s' }}>
              <Star className="w-8 h-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">Points</div>
              <div className="text-xs text-foreground-muted">Earn & Redeem</div>
            </div>
            <div className="card text-center py-6 animate-float" style={{ animationDelay: '1s' }}>
              <Lock className="w-8 h-8 text-primary-light mx-auto mb-2" />
              <div className="text-2xl font-bold">Gated</div>
              <div className="text-xs text-foreground-muted">Exclusive Content</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Economy Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Two-Economy <span className="gradient-text">System</span>
            </h2>
            <p className="text-foreground-muted max-w-xl mx-auto">
              A dual-currency system that incentivizes both monetary support and active engagement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tokens */}
            <div className="card p-8 border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
                <Coins className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Creator Tokens</h3>
              <p className="text-foreground-muted mb-6">
                Purchased via Stripe. Use tokens to unlock exclusive content, support creators directly, and access gated experiences.
              </p>
              <ul className="space-y-3">
                {['Purchase via secure Stripe checkout', 'Unlock token-gated content', 'Support creators directly', 'Threshold access for holders'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-accent shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Points */}
            <div className="card p-8 border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Engagement Points</h3>
              <p className="text-foreground-muted mb-6">
                Earned through platform engagement. Like posts, comment, log in daily — earn points and redeem them for exclusive rewards.
              </p>
              <ul className="space-y-3">
                {['Daily login bonuses', 'Like & comment rewards', 'Redeem for store items', 'Climb the leaderboard'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-secondary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-background-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for <span className="gradient-text">Creators & Fans</span>
            </h2>
            <p className="text-foreground-muted max-w-xl mx-auto">
              Everything you need to build a thriving creator economy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Lock className="w-6 h-6" />, title: 'Token-Gated Content', description: 'Create exclusive content that fans unlock with tokens. Set fixed costs or threshold requirements.' },
              { icon: <ShoppingBag className="w-6 h-6" />, title: 'Redemption Store', description: 'Offer exclusive rewards fans can redeem with their earned points — shoutouts, merch, experiences.' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Creator Analytics', description: 'Track token sales, fan engagement, post performance, and revenue — all in one dashboard.' },
              { icon: <Shield className="w-6 h-6" />, title: 'Secure by Design', description: 'All wallet operations are atomic, server-validated, and designed to prevent double-spending.' },
              { icon: <Users className="w-6 h-6" />, title: 'Fan Engagement', description: 'Gamified engagement with daily rewards, action-based points, and platform-wide leaderboards.' },
              { icon: <Globe className="w-6 h-6" />, title: 'Web 2.5 Ready', description: 'Web3 tokenomics without the complexity. No wallets, no gas fees — just seamless UX.' },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 hover:border-primary/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light mb-4 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-12 border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-foreground-muted mb-8 max-w-lg mx-auto">
                Join as a creator to monetize your content or as a fan to support your favorites. The creator economy awaits.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="btn-primary text-base px-8 py-3.5">
                  Create Account <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="btn-secondary text-base px-8 py-3.5">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold gradient-text">Rapid MVP Creator</span>
          </div>
          <p className="text-sm text-foreground-muted">
            © 2026 Rapid MVP Creator. Web 2.5 Creator Economy Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
