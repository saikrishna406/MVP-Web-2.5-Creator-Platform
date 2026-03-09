'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
    Facebook,
    Instagram,
    Youtube,
    Linkedin,
    Zap,
    Twitter,
} from 'lucide-react';

interface FooterLink {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}
interface FooterSection {
    label: string;
    links: FooterLink[];
}

const footerLinks: FooterSection[] = [
    {
        label: 'Platform',
        links: [
            { title: 'Features', href: '#features' },
            { title: 'How It Works', href: '#how-it-works' },
            { title: 'Pricing', href: '#pricing' },
            { title: 'Testimonials', href: '#creators' },
        ],
    },
    {
        label: 'Company',
        links: [
            { title: 'About Us', href: '/about' },
            { title: 'Blog', href: '/blog' },
            { title: 'Careers', href: '/careers' },
            { title: 'Press Kit', href: '/press' },
        ],
    },
    {
        label: 'Legal',
        links: [
            { title: 'Privacy Policy', href: '/privacy' },
            { title: 'Terms of Service', href: '/terms' },
            { title: 'Cookie Policy', href: '/cookies' },
            { title: 'Help Center', href: '/help' },
        ],
    },
    {
        label: 'Follow Us',
        links: [
            { title: 'Twitter / X', href: '#', icon: Twitter },
            { title: 'Instagram', href: '#', icon: Instagram },
            { title: 'YouTube', href: '#', icon: Youtube },
            { title: 'LinkedIn', href: '#', icon: Linkedin },
        ],
    },
];

export function SiteFooter() {
    return (
        <footer
            style={{
                background: '#000000',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                width: '100%',
                boxSizing: 'border-box',
                padding: '5rem 0 3rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* top-edge glow line */}
            <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '33%', height: 1,
                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
                filter: 'blur(1px)',
            }} />

            {/* subtle radial glow */}
            <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                width: 600, height: 300, borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', boxSizing: 'border-box' }}>

                {/* top row: brand + nav grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: '4rem',
                    marginBottom: '4rem',
                }}>
                    {/* brand block */}
                    <AnimatedContainer delay={0.0}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <img
                                src="/images/logo-1.jpeg"
                                alt="Black Bolts Provisions Logo"
                                style={{
                                    width: 38, height: 38, borderRadius: '50%',
                                    objectFit: 'cover',
                                    boxShadow: '0 0 10px rgba(255,140,0,0.3)',
                                }}
                            />
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>
                                Black Bolts Provisions
                            </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, maxWidth: 260 }}>
                            The Web 2.5 creator monetization platform that bridges social engagement with token-gated economies.
                        </p>

                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)', marginTop: '1.5rem' }}>
                            © {new Date().getFullYear()} Black Bolts Provisions. All rights reserved.
                        </p>
                    </AnimatedContainer>

                    {/* nav grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '2rem',
                    }}>
                        {footerLinks.map((section, i) => (
                            <AnimatedContainer key={section.label} delay={0.1 + i * 0.07}>
                                <h3 style={{
                                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                                    marginBottom: '1rem',
                                }}>
                                    {section.label}
                                </h3>
                                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {section.links.map(link => (
                                        <li key={link.title}>
                                            <a
                                                href={link.href}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                    fontSize: '0.84rem', color: 'rgba(255,255,255,0.5)',
                                                    textDecoration: 'none',
                                                    transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                                            >
                                                {link.icon && <link.icon className="size-3.5" />}
                                                {link.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </AnimatedContainer>
                        ))}
                    </div>
                </div>

                {/* divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: '2rem' }} />

                {/* bottom bar */}
                <AnimatedContainer delay={0.5}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '1rem',
                    }}>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.22)', margin: 0 }}>
                            Built for creators who dare to monetize differently.
                        </p>
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                            {[
                                { label: 'Privacy', href: '/privacy' },
                                { label: 'Terms', href: '/terms' },
                                { label: 'Cookies', href: '/cookies' },
                            ].map(l => (
                                <a
                                    key={l.label}
                                    href={l.href}
                                    style={{
                                        fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)',
                                        textDecoration: 'none', transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                                >
                                    {l.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </AnimatedContainer>

            </div>
        </footer>
    );
}

/* ─── Animated container helper ─── */
type AnimProps = {
    delay?: number;
    className?: ComponentProps<typeof motion.div>['className'];
    children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: AnimProps) {
    const shouldReduceMotion = useReducedMotion();
    if (shouldReduceMotion) return <>{children}</>;
    return (
        <motion.div
            initial={{ filter: 'blur(4px)', y: 12, opacity: 0 }}
            whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.7, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
