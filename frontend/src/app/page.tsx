'use client';
import Link from 'next/link';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  Zap, Coins, Star, Lock, ShoppingBag, BarChart3, Users,
  ArrowRight, Shield, TrendingUp, Check, ChevronDown,
  Crown, Heart, Play, Sparkles, MessageCircle, Globe, ArrowUpRight,
} from 'lucide-react';
import HeroSectionNew from '@/components/blocks/demo';
import { DualEconomy } from '@/components/landing/DualEconomy';
import ScrollRevealText from '@/components/landing/ScrollRevealText';
import { GlobalNetwork } from '@/components/landing/GlobalNetwork';
import { PlatformFeatures } from '@/components/landing/PlatformFeatures';
import { SiteFooter } from '@/components/ui/footer-section';
import { CreatorTestimonials } from '@/components/ui/testimonial-v2';
import { CTASection } from '@/components/ui/cta-with-rectangle';
import { HowItWorks } from '@/components/landing/HowItWorks';
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
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
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

/* ═══ FLOATING PARTICLE ═══ */
function Particle({ x, y, size, opacity, delay }: { x: string; y: string; size: number; opacity: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ left: x, top: y, width: size, height: size, background: `rgba(255,66,77,${opacity})`, boxShadow: `0 0 ${size * 3}px rgba(255,66,77,${opacity * 0.6})` }}
      animate={{ y: [0, -30, 0], opacity: [opacity, opacity * 1.5, opacity] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

/* ═══ GRID BACKGROUND ═══ */
function GridBackground() {
  return (
    <div className="dk-grid-bg" aria-hidden="true">
      <div className="dk-grid-lines" />
      <div className="dk-grid-radial" />
    </div>
  );
}

const PARTICLES = [
  { x: '12%', y: '20%', size: 4, opacity: 0.6, delay: 0 },
  { x: '85%', y: '15%', size: 3, opacity: 0.4, delay: 1.2 },
  { x: '70%', y: '60%', size: 5, opacity: 0.5, delay: 0.7 },
  { x: '25%', y: '75%', size: 3, opacity: 0.35, delay: 2 },
  { x: '55%', y: '40%', size: 2, opacity: 0.3, delay: 1.5 },
  { x: '90%', y: '80%', size: 4, opacity: 0.45, delay: 0.3 },
  { x: '40%', y: '10%', size: 3, opacity: 0.5, delay: 1.8 },
];

/* ═══ SCROLLER STRIP ═══ */
const scrollerItems = [
  '⚡ Token-Gated Content', '🏆 Gamified Rewards', '💳 Stripe Payments',
  '🔒 Exclusive Access', '⭐ Daily Bonuses', '📊 Live Analytics',
  '🎁 Creator Store', '🚀 Zero Gas Fees', '👑 Fan Leaderboard',
];

function ScrollerStrip() {
  const doubled = [...scrollerItems, ...scrollerItems];
  return (
    <div className="dk-scroller-section">
      <div className="dk-scroller-wrapper">
        <motion.div className="dk-scroller-track"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, ease: 'linear', repeat: Infinity }}>
          {doubled.map((item, i) => <span key={i} className="dk-scroller-item">{item}</span>)}
        </motion.div>
      </div>
    </div>
  );
}

/* ═══ FAQ ═══ */
const faqs = [
  { q: 'What is Black Bolts Provisions?', a: 'A Web 2.5 creator monetization platform combining token economics with everyday simplicity — no crypto wallets, no gas fees. Creators earn, fans support.' },
  { q: 'How do Creator Tokens work?', a: 'Fans purchase token packages via Stripe. Tokens unlock exclusive content, let fans support creators directly, or grant threshold access to gated experiences.' },
  { q: 'What are Engagement Points?', a: "Points are earned by interacting — daily logins, liking or commenting on posts. They can be redeemed in the creator's store for exclusive rewards." },
  { q: 'Is there a fee for creators?', a: 'Creators keep the majority of every token purchase. Platform fees are minimal, transparent, and only charged on successful transactions.' },
  { q: 'How secure are payments?', a: 'All payments go through Stripe with PCI compliance. Every wallet operation is atomic server-side — zero chance of double-spending or manipulation.' },
];

function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <FadeUp delay={i * 0.05}>
      <div className="dk-faq-item">
        <button onClick={() => setOpen(!open)} className="dk-faq-question" aria-expanded={open}>
          <span>{q}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.28 }}>
            <ChevronDown size={18} />
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
              <p className="dk-faq-answer">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeUp>
  );
}

/* ═══ DATA ═══ */
const features = [
  { icon: <Lock size={22} />, title: 'Token-Gated Content', desc: 'Create posts fans must unlock with tokens. Fixed cost or token-threshold gates for tiered access.', color: 'coral', glow: 'rgba(255,255,255,0.1)' },
  { icon: <ShoppingBag size={22} />, title: 'Redemption Store', desc: 'Let fans cash in engagement points for shoutouts, merch, and custom experiences.', color: 'amber', glow: 'rgba(255,255,255,0.08)' },
  { icon: <BarChart3 size={22} />, title: 'Creator Analytics', desc: 'Revenue, top fans, post performance — all in one clean dashboard designed for growth.', color: 'emerald', glow: 'rgba(255,255,255,0.06)' },
  { icon: <Shield size={22} />, title: 'Atomic Security', desc: 'All wallet ops run in transactions. Zero double-spending risk, ever. Bank-grade protection.', color: 'sky', glow: 'rgba(255,255,255,0.08)' },
  { icon: <Crown size={22} />, title: 'Fan Leaderboard', desc: 'Celebrate top supporters publicly. Gamified rankings fuel loyalty and community.', color: 'violet', glow: 'rgba(255,255,255,0.06)' },
  { icon: <Sparkles size={22} />, title: 'Web 2.5 Ready', desc: 'Token economics without complexity. No wallets. No gas fees. Just seamless, familiar UX.', color: 'coral', glow: 'rgba(255,255,255,0.1)' },
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

const stats = [
  { num: '50K+', label: 'Active Creators', icon: <Users size={20} /> },
  { num: '$2M+', label: 'Creator Earnings', icon: <TrendingUp size={20} /> },
  { num: '1.2M+', label: 'Fan Memberships', icon: <Heart size={20} /> },
  { num: '99.9%', label: 'Uptime SLA', icon: <Shield size={20} /> },
];

const steps = [
  {
    icon: <Users size={24} />, num: '01', color: 'coral', title: 'Sign up in seconds',
    desc: 'Choose Creator or Fan. Fill in your profile and go live instantly. No technical setup required — just your passion and creativity.',
  },
  {
    icon: <Coins size={24} />, num: '02', color: 'amber', title: 'Set up your economy',
    desc: 'Create token-gated posts, set your pricing, and build your redemption store. Full control, your rules, your brand.',
  },
  {
    icon: <TrendingUp size={24} />, num: '03', color: 'emerald', title: 'Watch your revenue grow',
    desc: 'Fans buy tokens, earn points, and engage. You get paid instantly via Stripe. Track everything in your analytics dashboard.',
  },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="dk-root">
        <HeroSectionNew />

        {/* ── SCROLLER STRIP ── */}
        <ScrollerStrip />

        {/* ── SCROLL REVEAL TEXT ── */}
        <ScrollRevealText text="Black Bolts Provisions is a next-generation Web 2.5 platform that provides seamless token-gated monetization and gamified interaction experiences between creators and their superfans" />

        {/* ── ECONOMY — DUAL Currency ── */}
        <section className="relative w-full overflow-hidden" id="features" style={{ background: '#000000', paddingTop: '12rem', paddingBottom: '8rem' }}>
          {/* Deep ambient BG */}
          <div className="absolute top-0 left-[-10%] w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-[160px] -z-10 pointer-events-none" />
          <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-[160px] -z-10 pointer-events-none" />

          <div className="w-full relative z-10" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>

            {/* ── HEADER ── */}
            <FadeUp>
              <div className="dk-section-header dk-section-header-center flex flex-col items-center">
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.4rem 1.25rem', borderRadius: '99px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.4)' }} />
                  Dual Currency System
                </div>
                <h2 className="dk-section-h2 center" style={{ color: '#fff', fontSize: 'clamp(3rem, 5vw, 4.5rem)' }}>
                  Two economies. <span style={{ color: '#fff' }}>One platform.</span>
                </h2>
                <p className="dk-section-sub mx-auto text-center" style={{ maxWidth: '600px' }}>
                  A dual-currency model — tokens you buy, points you earn. Together they create a thriving creator ecosystem built for long-term loyalty.
                </p>
              </div>
            </FadeUp>

            {/* ── CARDS GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              <StaggerItem>
                <div className="group hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)] transition-all duration-500 border border-white/[0.07] hover:border-white/20" style={{
                  position: 'relative', height: '100%',
                  background: 'linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(17,17,22,0.98) 60%)',
                  borderRadius: '2rem', padding: '3rem 2.5rem',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  {/* Ghost number */}
                  <div className="group-hover:scale-110 group-hover:text-white/5 transition-all duration-500" style={{
                    position: 'absolute', top: '-0.5rem', right: '1.5rem',
                    fontSize: '10rem', fontWeight: '900', lineHeight: '1',
                    color: 'transparent', letterSpacing: '-0.05em',
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.08)',
                    pointerEvents: 'none', userSelect: 'none',
                  }}>01</div>

                  {/* Glow blob */}
                  <div style={{
                    position: 'absolute', top: '-80px', left: '-80px',
                    width: '350px', height: '350px', borderRadius: '50%',
                    background: 'radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)',
                    pointerEvents: 'none', filter: 'blur(40px)',
                  }} />

                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
                      Creator Tokens
                    </h3>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.75', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      Purchased via Stripe. Fans spend tokens to unlock exclusive content, support creators directly, or gain threshold access to gated experiences.
                    </p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                      {['Purchase via Stripe checkout', 'Unlock token-gated posts', 'Direct creator support', 'Threshold access tiers'].map(item => (
                        <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: '500' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={11} style={{ color: '#ffffff' }} strokeWidth={3} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    Learn more <ArrowRight size={15} />
                  </Link>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="group hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)] transition-all duration-500 border border-white/[0.07] hover:border-white/20" style={{
                  position: 'relative', height: '100%',
                  background: 'linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(17,17,22,0.98) 60%)',
                  borderRadius: '2rem', padding: '3rem 2.5rem',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  {/* Ghost number */}
                  <div className="group-hover:scale-110 group-hover:text-white/5 transition-all duration-500" style={{
                    position: 'absolute', top: '-0.5rem', right: '1.5rem',
                    fontSize: '10rem', fontWeight: '900', lineHeight: '1',
                    color: 'transparent', letterSpacing: '-0.05em',
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.08)',
                    pointerEvents: 'none', userSelect: 'none',
                  }}>02</div>

                  {/* Glow blob */}
                  <div style={{
                    position: 'absolute', top: '-80px', left: '-80px',
                    width: '350px', height: '350px', borderRadius: '50%',
                    background: 'radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)',
                    pointerEvents: 'none', filter: 'blur(40px)',
                  }} />

                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
                      Engagement Points
                    </h3>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.75', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      Earned by showing up — daily logins, liking posts, leaving comments. Redeem for exclusive rewards from your favourite creator&apos;s store.
                    </p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                      {['Daily login bonuses', 'Like & comment rewards', 'Redeem in creator stores', 'Climb the leaderboard'].map(item => (
                        <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: '500' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={11} style={{ color: '#ffffff' }} strokeWidth={3} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    Learn more <ArrowRight size={15} />
                  </Link>
                </div>
              </StaggerItem>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <HowItWorks />

        {/* ── FEATURES GRID ── */}
        <PlatformFeatures />

        {/* ── GLOBAL NETWORK ── */}
        <GlobalNetwork />

        {/* ── CREATOR TESTIMONIALS ── */}
        <CreatorTestimonials />

        {/* ── FAQ ── */}
        <section className="dk-section" id="faq" style={{ background: '#000000' }}>
          <FadeUp>
            <div className="dk-section-header dk-section-header-center">
              <div className="dk-section-label" style={{ justifyContent: 'center', margin: '0 auto 1rem' }}>
                <span className="dk-label-dot" /> Got Questions?
              </div>
              <h2 className="dk-section-h2 center">Frequently <em>asked</em></h2>
              <p className="dk-section-sub mx-auto">
                Everything you need to know about the platform and how to get started.
              </p>
            </div>
          </FadeUp>
          <div className="dk-faq-wrapper">
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} i={i} />)}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <CTASection
          badge={{ text: "Start Today — It's Free" }}
          title="Your creator empire starts here"
          description="Join as a creator to monetize your content, or as a fan to support your favourites. No credit card required to get started."
          action={{
            text: "Create free account",
            href: "/register",
          }}
          secondaryAction={{
            text: "Sign in",
            href: "/login",
          }}
        />

        {/* ── FOOTER ── */}
        <SiteFooter />

      </div>
    </>
  );
}
