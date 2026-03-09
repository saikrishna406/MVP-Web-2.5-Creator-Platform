'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface Testimonial {
    text: string;
    image: string;
    name: string;
    role: string;
}

const testimonials: Testimonial[] = [
    {
        text: "Black Bolts Provisions completely changed how I monetize. I launched my token gate in under 10 minutes and had my first superfan purchase within the hour.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Priya Sharma",
        role: "Lifestyle Creator · 120K Followers",
    },
    {
        text: "The dual-currency model is genius. My fans earn points by engaging, then spend tokens to unlock exclusive drops. Retention absolutely skyrocketed.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Marcus Webb",
        role: "Music Producer · 80K Fans",
    },
    {
        text: "I replaced three separate subscription tools with Black Bolts Provisions. My workflow is simpler and I earn 40% more per month from the same audience size.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Lena Fischer",
        role: "Fitness Coach · 200K Subscribers",
    },
    {
        text: "Token-gated coaching sessions sold out in 20 minutes. Never had that kind of velocity with Patreon or any other platform before.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Javier Morales",
        role: "Business Coach · 55K Audience",
    },
    {
        text: "The analytics dashboard shows me exactly which token tiers convert best. I doubled revenue in 60 days just by optimizing my pricing tiers.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Aisha Okafor",
        role: "Content Strategist · 90K Followers",
    },
    {
        text: "My superfans get a real sense of ownership. The gamification keeps them coming back daily. Engagement is up 3x compared to my old newsletter.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Yuki Tanaka",
        role: "Anime Artist · 170K Community",
    },
    {
        text: "Setting up my first token drop was scary but the onboarding guide was brilliant. Made my first ₹50,000 in week one.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Rohan Mehta",
        role: "Tech Educator · 45K Students",
    },
    {
        text: "Black Bolts Provisions's payment integration through Stripe is flawless. No crypto complexity, pure Web 2.5. My audience converted immediately.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Camille Nguyen",
        role: "Travel Creator · 310K Followers",
    },
    {
        text: "My community feels exclusive and valued. Gated Discord channels plus token rewards created a loyal inner circle that promotes my content for free.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Devon Clarke",
        role: "Gaming Creator · 500K Subs",
    },
];

const col1 = testimonials.slice(0, 3);
const col2 = testimonials.slice(3, 6);
const col3 = testimonials.slice(6, 9);

function TestimonialsColumn({ testimonials, duration = 14, className = '' }: {
    testimonials: Testimonial[];
    duration?: number;
    className?: string;
}) {
    return (
        <div className={className} style={{ overflow: 'hidden', flex: 1 }}>
            <motion.ul
                animate={{ translateY: '-50%' }}
                transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1.25rem', listStyle: 'none', margin: 0, padding: 0 }}
            >
                {[0, 1].map(rep => (
                    <React.Fragment key={rep}>
                        {testimonials.map(({ text, image, name, role }, i) => (
                            <motion.li
                                key={`${rep}-${i}`}
                                aria-hidden={rep === 1 ? 'true' : 'false'}
                                whileHover={{
                                    scale: 1.02, y: -6,
                                    transition: { type: 'spring', stiffness: 400, damping: 20 },
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '1.25rem',
                                    padding: '1.5rem',
                                    cursor: 'default',
                                    userSelect: 'none',
                                }}
                            >
                                <blockquote style={{ margin: 0, padding: 0 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, fontSize: '0.88rem', margin: 0 }}>
                                        &ldquo;{text}&rdquo;
                                    </p>
                                    <footer style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
                                        <img
                                            width={38} height={38}
                                            src={image} alt={name}
                                            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
                                        />
                                        <div>
                                            <cite style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, fontStyle: 'normal', color: '#fff', lineHeight: 1.3 }}>
                                                {name}
                                            </cite>
                                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                                                {role}
                                            </span>
                                        </div>
                                    </footer>
                                </blockquote>
                            </motion.li>
                        ))}
                    </React.Fragment>
                ))}
            </motion.ul>
        </div>
    );
}

export function CreatorTestimonials() {
    return (
        <section
            id="creators"
            aria-labelledby="testimonials-heading"
            style={{
                background: '#000000',
                width: '100%',
                padding: '6rem 0',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', boxSizing: 'border-box' }}>

                {/* heading */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ textAlign: 'center', marginBottom: '3.5rem' }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.35rem 1.2rem', borderRadius: '999px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.16em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
                        marginBottom: '1.25rem',
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
                        Success Stories
                    </div>

                    <h2
                        id="testimonials-heading"
                        style={{
                            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                            fontWeight: 800, color: '#fff',
                            letterSpacing: '-0.025em', lineHeight: 1.2,
                            margin: '0 0 1rem',
                        }}
                    >
                        Real creators. <em style={{ fontStyle: 'italic' }}>Real results.</em>
                    </h2>

                    <p style={{
                        fontSize: '1.05rem', color: 'rgba(255,255,255,0.45)',
                        maxWidth: 520, margin: '0 auto', lineHeight: 1.7, textAlign: 'center',
                    }}>
                        Join thousands of creators who already earn a living doing what they love on Black Bolts Provisions.
                    </p>
                </motion.div>

                {/* scrolling columns */}
                <div
                    role="region"
                    aria-label="Scrolling creator testimonials"
                    style={{
                        display: 'flex',
                        gap: '1.25rem',
                        maxHeight: 680,
                        overflow: 'hidden',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                    }}
                >
                    <TestimonialsColumn testimonials={col1} duration={16} />
                    <TestimonialsColumn testimonials={col2} duration={21} className="hidden-mobile" />
                    <TestimonialsColumn testimonials={col3} duration={18} className="hidden-tablet" />
                </div>
            </div>

            <style>{`
                @media (max-width: 767px) { .hidden-mobile { display: none !important; } }
                @media (max-width: 1023px) { .hidden-tablet { display: none !important; } }
            `}</style>
        </section>
    );
}
