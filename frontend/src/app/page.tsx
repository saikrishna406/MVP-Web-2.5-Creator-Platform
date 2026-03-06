'use client';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  Zap, Coins, Star, Lock, ShoppingBag, BarChart3, Users,
  ArrowRight, Shield, TrendingUp, Check, ChevronDown,
  Crown, Heart, Play, Sparkles, MessageCircle, Globe,
} from 'lucide-react';

import IntroAnimation from '@/components/ui/scroll-morph-hero';
import { DesignSteps } from '@/components/ui/design-steps';
/* ═══ ANIMATION HELPERS ═══ */
function useInViewOnce(margin = '-60px') {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: margin as `${number}px` });
  return { ref, inView };
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInViewOnce();
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

function StaggerGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInViewOnce();
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className={className}>
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ═══ TICKER STRIP ═══ */
const tickerItems = ['Musicians', 'Illustrators', 'Streamers', 'Writers', 'Educators', 'Photographers', 'Podcasters', 'Coaches', 'Chefs', 'Gamers', 'Comedians', 'Filmmakers'];

function TickerStrip() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="hero-ticker-strip">
      <motion.div className="ticker-track"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}>
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-dot" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══ SCROLLER STRIP ═══ */
const scrollerItems = [
  '⚡ Token-Gated Content',
  '🏆 Gamified Rewards',
  '💳 Stripe Payments',
  '🔒 Exclusive Access',
  '⭐ Daily Bonuses',
  '📊 Live Analytics',
  '🎁 Creator Store',
  '🚀 Zero Gas Fees',
  '👑 Fan Leaderboard',
];

function ScrollerStrip() {
  const doubled = [...scrollerItems, ...scrollerItems];
  return (
    <div className="scroller-section">
      <div className="infinite-scroller-wrapper">
        <motion.div className="infinite-scroller-track"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, ease: 'linear', repeat: Infinity }}>
          {doubled.map((item, i) => <span key={i} className="scroller-item">{item}</span>)}
        </motion.div>
      </div>
    </div>
  );
}

/* ═══ HERO DASHBOARD CARDS ═══ */
function HeroCards() {
  return (
    <div className="hero-right-panel">
      {/* Main creator card */}
      <motion.div className="hero-card"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <div className="hero-card-header">
          <div className="hc-avatar violet">🎵</div>
          <div>
            <div className="hc-name">Aria Storm</div>
            <div className="hc-sub">Music Artist · Pro Plan</div>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: 999, border: '1px solid rgba(16,185,129,0.2)' }}>
            Live ✦
          </div>
        </div>

        <div className="hc-stats-row">
          <div className="hc-stat">
            <div className="hc-val">12,450</div>
            <div className="hc-label">Tokens Earned</div>
          </div>
          <div className="hc-stat">
            <div className="hc-val">8,241</div>
            <div className="hc-label">Active Fans</div>
          </div>
          <div className="hc-stat">
            <div className="hc-val" style={{ color: '#10B981' }}>+38%</div>
            <div className="hc-label">Growth</div>
          </div>
        </div>

        <div className="hc-bar-row">
          <div className="hc-bar-label">
            <span>Monthly Revenue</span>
            <span style={{ color: 'var(--coral)', fontWeight: 700 }}>$4,820</span>
          </div>
          <div className="hc-bar-track">
            <motion.div className="hc-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: '78%' }}
              transition={{ duration: 1.4, delay: 1.2, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </div>

        <div className="hc-tags">
          <span className="hc-tag">🎵 Music</span>
          <span className="hc-tag active">Token-Gated</span>
          <span className="hc-tag">💬 Community</span>
        </div>
      </motion.div>

      {/* Floating notification badge */}
      <motion.div className="hero-badge-card"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}>
        <div className="badge-icon">⭐</div>
        <div>
          <div className="badge-label">Points Redeemed Today</div>
          <div className="badge-val">24,800 pts</div>
        </div>
      </motion.div>

      {/* Fan stats card */}
      <motion.div className="hero-card"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}>
        <div className="hero-card-header" style={{ marginBottom: '1rem' }}>
          <div className="hc-avatar amber">🛍️</div>
          <div>
            <div className="hc-name">New Redemption</div>
            <div className="hc-sub">Fan redeemed &quot;Private Shoutout&quot;</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { icon: <Heart size={14} />, val: '4.8K', label: 'Likes' },
            { icon: <MessageCircle size={14} />, val: '938', label: 'Comments' },
            { icon: <Users size={14} />, val: '8.2K', label: 'Fans' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1,
              background: 'var(--gray-50)',
              borderRadius: 10,
              padding: '0.65rem 0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ color: 'var(--gray-400)', marginBottom: 3, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gray-900)' }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══ FAQ ═══ */
const faqs = [
  { q: 'What is Rapid MVP Creator?', a: 'A Web 2.5 creator monetization platform combining token economics with everyday simplicity — no crypto wallets, no gas fees. Creators earn, fans support.' },
  { q: 'How do Creator Tokens work?', a: 'Fans purchase token packages via Stripe. Tokens unlock exclusive content, let fans support creators directly, or grant threshold access to gated experiences.' },
  { q: 'What are Engagement Points?', a: "Points are earned by interacting — daily logins, liking or commenting on posts. They can be redeemed in the creator's store for exclusive rewards." },
  { q: 'Is there a fee for creators?', a: 'Creators keep the majority of every token purchase. Platform fees are minimal, transparent, and only charged on successful transactions.' },
  { q: 'How secure are payments?', a: 'All payments go through Stripe with PCI compliance. Every wallet operation is atomic server-side — zero chance of double-spending or manipulation.' },
];

function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <FadeUp delay={i * 0.05}>
      <div className="faq-item">
        <button onClick={() => setOpen(!open)} className="faq-question" aria-expanded={open}>
          <span>{q}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.28 }}>
            <ChevronDown size={18} color="var(--gray-400)" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="ans"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}>
              <p className="faq-answer">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeUp>
  );
}

/* ═══ DATA ═══ */
const features = [
  { icon: <Lock size={20} />, title: 'Token-Gated Content', desc: 'Create posts fans must unlock with tokens. Fixed cost or token-threshold gates for tiered access.', color: 'violet' },
  { icon: <ShoppingBag size={20} />, title: 'Redemption Store', desc: 'Let fans cash in engagement points for shoutouts, merch, and custom experiences.', color: 'amber' },
  { icon: <BarChart3 size={20} />, title: 'Creator Analytics', desc: 'Revenue, top fans, post performance — all in one clean dashboard designed for growth.', color: 'coral' },
  { icon: <Shield size={20} />, title: 'Atomic Security', desc: 'All wallet ops run in transactions. Zero double-spending risk, ever. Bank-grade protection.', color: 'sky' },
  { icon: <Crown size={20} />, title: 'Fan Leaderboard', desc: 'Celebrate top supporters publicly. Gamified rankings fuel loyalty and community.', color: 'emerald' },
  { icon: <Sparkles size={20} />, title: 'Web 2.5 Ready', desc: 'Token economics without complexity. No wallets. No gas fees. Just seamless, familiar UX.', color: 'violet' },
];

const creators = [
  {
    emoji: '🎵', name: 'Aria Storm', handle: '@ariastorm', role: 'Music Artist',
    quote: 'My fans love unlocking exclusive sessions. Token-gating changed how I monetize entirely.',
    tokens: '12,400', fans: '8.2K', growth: '+340% revenue',
  },
  {
    emoji: '🎨', name: 'Leo Chen', handle: '@leovisuals', role: 'Visual Artist',
    quote: "The points system keeps my community coming back every single day. It's genuinely addictive!",
    tokens: '9,800', fans: '5.6K', growth: '+220% engagement',
  },
  {
    emoji: '🏋️', name: 'Zara Pulse', handle: '@zarapulse', role: 'Fitness Coach',
    quote: 'I set up my store and my superfans immediately started redeeming. Zero learning curve.',
    tokens: '21,300', fans: '14.1K', growth: '3× token sales',
  },
];

const steps = [
  {
    icon: <Users size={22} />, color: 'violet', title: 'Sign up in seconds',
    desc: 'Choose Creator or Fan. Fill in your profile and go live instantly. No technical setup required — just your passion and creativity.',
  },
  {
    icon: <Coins size={22} />, color: 'ink', title: 'Set up your economy',
    desc: 'Create token-gated posts, set your pricing, and build your redemption store. Full control, your rules, your brand.',
  },
  {
    icon: <TrendingUp size={22} />, color: 'amber', title: 'Watch your revenue grow',
    desc: 'Fans buy tokens, earn points, and engage. You get paid instantly via Stripe. Track everything in your analytics dashboard.',
  },
];

const stats = [
  { num: '50K+', label: 'Active Creators', suffix: '' },
  { num: '$2M+', label: 'Creator Earnings', suffix: '' },
  { num: '1.2M+', label: 'Fan Memberships', suffix: '' },
  { num: '99.9', label: 'Uptime SLA', suffix: '%' },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger immediately to check initial scroll position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="lp-root">

        {/* ── NAV ── */}
        <motion.nav className={`lp-nav ${isScrolled ? 'scrolled' : ''}`}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="lp-nav-inner patreon-style">
            {/* Left Nav */}
            <div className="lp-nav-links">
              {['Creators', 'Features', 'Pricing', 'Resources'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="lp-nav-link">
                  {l}
                </a>
              ))}
              <a href="#updates" className="lp-nav-pill-link">Updates</a>
            </div>

            {/* Center Logo */}
            <Link href="/" className="lp-logo center-logo">
              <span className="lp-logo-text">RAPIDMVP</span>
            </Link>

            {/* Right CTAs */}
            <div className="lp-nav-ctas">
              <Link href="/search" className="btn-nav-outline-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Find a Creator
              </Link>
              <Link href="/login" className="btn-nav-outline-pill">Log in</Link>
              <Link href="/register" className="btn-nav-solid-pill">Get Started</Link>
            </div>
          </div>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="lp-hero" style={{ height: 'calc(100vh - 80px)', padding: 0, position: 'relative', border: 'none', background: 'transparent', zIndex: 10 }}>
          <IntroAnimation />
        </section>

        {/* ── SCROLLER ── */}
        <ScrollerStrip />

        {/* ── STATS BAR ── */}
        <FadeUp>
          <div className="stats-bar">
            {stats.map(s => (
              <div key={s.label} className="stats-bar-item">
                <div className="stats-bar-num">
                  {s.num}<span>{s.suffix}</span>
                </div>
                <div className="stats-bar-label">{s.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* ── ECONOMY ── */}
        <section className="lp-section" id="features">
          <FadeUp>
            <div className="section-header">
              <div className="section-label">
                <span className="section-label-dot" /> Dual Currency
              </div>
              <h2 className="section-h2">
                Two economies.<br /><em>One platform.</em>
              </h2>
              <p className="section-sub">
                A dual-currency model — tokens you buy, points you earn. Together they create a thriving creator ecosystem built for long-term loyalty.
              </p>
            </div>
          </FadeUp>

          <StaggerGrid className="economy-grid">
            <StaggerItem>
              <div className="economy-card">
                <div className="economy-card-accent accent-violet" />
                <div className="economy-num violet">01</div>
                <div className="economy-title">Creator Tokens</div>
                <p className="economy-desc">
                  Purchased via Stripe. Fans spend tokens to unlock exclusive content, support creators directly, or gain threshold access to gated experiences.
                </p>
                <ul className="economy-list">
                  {['Purchase via Stripe checkout', 'Unlock token-gated posts', 'Direct creator support', 'Threshold access tiers'].map(item => (
                    <li key={item} className="economy-list-item">
                      <div className="eli-check violet"><Check size={10} strokeWidth={3} /></div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="economy-cta">
                  Learn more <ArrowRight size={14} />
                </Link>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="economy-card">
                <div className="economy-card-accent accent-amber" />
                <div className="economy-num amber">02</div>
                <div className="economy-title">Engagement Points</div>
                <p className="economy-desc">
                  Earned by showing up — daily logins, liking posts, leaving comments. Redeem for exclusive rewards from your favourite creator&apos;s store.
                </p>
                <ul className="economy-list">
                  {['Daily login bonuses', 'Like & comment rewards', 'Redeem in creator stores', 'Climb the leaderboard'].map(item => (
                    <li key={item} className="economy-list-item">
                      <div className="eli-check amber"><Check size={10} strokeWidth={3} /></div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="economy-cta amber">
                  Learn more <ArrowRight size={14} />
                </Link>
              </div>
            </StaggerItem>
          </StaggerGrid>
        </section>


        {/* ── HOW IT WORKS ── */}
        <DesignSteps />

        {/* ── FEATURES ── */}
        <div className="lp-section-dark" id="features">
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <FadeUp>
              <div className="section-header">
                <div className="section-label" style={{ color: 'var(--coral-light)', background: 'rgba(255,66,77,0.12)' }}>
                  <span className="section-label-dot" style={{ background: 'var(--coral)' }} />
                  Platform Features
                </div>
                <h2 className="section-h2 section-h2-light">
                  Everything you need <br /><em>to build &amp; grow.</em>
                </h2>
              </div>
            </FadeUp>

            <StaggerGrid className="features-grid">
              {features.map(f => (
                <StaggerItem key={f.title}>
                  <div className="feature-card">
                    <div className={`fi-wrap ${f.color}`}>{f.icon}</div>
                    <div className="feature-title">{f.title}</div>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </div>

        {/* ── CREATORS ── */}
        <section className="lp-section" id="creators">
          <FadeUp>
            <div className="section-header">
              <div className="section-label">
                <span className="section-label-dot" /> Success Stories
              </div>
              <h2 className="section-h2">
                Real creators.<br /><em>Real results.</em>
              </h2>
              <p className="section-sub">
                Join thousands of creators who already earn a living doing what they love on RapidMVP.
              </p>
            </div>
          </FadeUp>

          <StaggerGrid className="creators-grid">
            {creators.map(c => (
              <StaggerItem key={c.name}>
                <div className="creator-card">
                  <div className="cc-top">
                    <div className="cc-avi">{c.emoji}</div>
                    <div>
                      <div className="cc-name">{c.name}</div>
                      <div className="cc-handle">{c.handle}</div>
                      <div className="cc-role">{c.role}</div>
                    </div>
                  </div>
                  <p className="cc-quote">&ldquo;{c.quote}&rdquo;</p>
                  <div className="cc-stats">
                    <div className="cc-stat">
                      <div className="cc-val">{c.tokens}</div>
                      <div className="cc-label">Tokens Earned</div>
                    </div>
                    <div className="cc-stat">
                      <div className="cc-val">{c.fans}</div>
                      <div className="cc-label">Active Fans</div>
                    </div>
                  </div>
                  <div className="cc-pill">
                    <TrendingUp size={11} /> {c.growth}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>

        {/* ── FAQ ── */}
        <div className="lp-section-full" id="faq">
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <FadeUp>
              <div className="section-header section-header-center">
                <div className="section-label">
                  <span className="section-label-dot" /> Got Questions?
                </div>
                <h2 className="section-h2">Frequently <em>asked</em></h2>
                <p className="section-sub" style={{ margin: '0 auto' }}>
                  Everything you need to know about the platform and how to get started.
                </p>
              </div>
            </FadeUp>
            <div className="faq-wrapper">
              {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} i={i} />)}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="cta-section">
          <div className="cta-noise" />
          <FadeUp>
            <div className="cta-inner">
              <div className="cta-label">Start Today — It&apos;s Free</div>
              <h2 className="cta-h2">Your creator<br />empire starts here.</h2>
              <p className="cta-sub">
                Join as a creator to monetize your content, or as a fan to support your favourites. No credit card required to get started.
              </p>
              <div className="cta-btns">
                <Link href="/register" className="btn-cta-primary" id="cta-create-account">
                  Create free account <ArrowRight size={16} />
                </Link>
                <Link href="/login" className="btn-cta-ghost" id="cta-sign-in">
                  Sign in
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="footer-inner">
            <div className="footer-logo">
              <div className="footer-logo-mark">
                <Zap size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="footer-logo-text">RapidMVP</span>
            </div>
            <p className="footer-copy">© 2026 Rapid MVP Creator. Web 2.5 Creator Economy Platform.</p>
            <div className="footer-links">
              <a href="#features" className="footer-link">Features</a>
              <a href="#how-it-works" className="footer-link">How It Works</a>
              <a href="#faq" className="footer-link">FAQ</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
