"use client"

import { motion } from "framer-motion"

interface CTAProps {
    badge?: { text: string }
    title: string
    description?: string
    action: {
        text: string
        href: string
    }
    secondaryAction?: {
        text: string
        href: string
    }
    withGlow?: boolean
    className?: string
}

export function CTASection({
    badge,
    title,
    description,
    action,
    secondaryAction,
    withGlow = true,
}: CTAProps) {
    return (
        <section
            style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#000000',
                padding: '6rem 0 5rem',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* ambient radial glow */}
            {withGlow && (
                <>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 700, height: 400, borderRadius: '50%',
                        background: 'radial-gradient(ellipse at center, rgba(255,120,30,0.08) 0%, transparent 65%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', top: 0, left: '50%',
                        transform: 'translateX(-50%)',
                        width: '40%', height: 1,
                        background: 'linear-gradient(to right, transparent, rgba(255,120,40,0.4), transparent)',
                        filter: 'blur(1px)',
                    }} />
                </>
            )}

            {/* ── centred wrapper ── */}
            <div style={{
                maxWidth: '860px',
                margin: '0 auto',
                padding: '0 2rem',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '1.5rem',
                position: 'relative',
                zIndex: 1,
            }}>

                {/* badge */}
                {badge && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.3rem 1rem', borderRadius: '999px',
                            border: '1px solid rgba(255,140,50,0.3)',
                            background: 'rgba(255,120,30,0.08)',
                            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: '#ff8c32',
                        }}
                    >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff8c32', boxShadow: '0 0 8px rgba(255,140,50,0.8)', flexShrink: 0 }} />
                        {badge.text}
                    </motion.div>
                )}

                {/* heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                        fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.15,
                        letterSpacing: '-0.03em',
                        margin: 0,
                    }}
                >
                    {title}
                </motion.h2>

                {/* description */}
                {description && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        style={{
                            fontSize: '1.05rem',
                            color: 'rgba(255,255,255,0.45)',
                            lineHeight: 1.7,
                            maxWidth: '520px',
                            margin: '0 auto',
                            textAlign: 'center',
                        }}
                    >
                        {description}
                    </motion.p>
                )}

                {/* buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}
                >
                    <a
                        href={action.href}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.85rem 2.25rem',
                            borderRadius: '999px',
                            background: '#ffffff',
                            color: '#000000',
                            fontSize: '0.9rem', fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 0 40px rgba(255,120,30,0.35)',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 60px rgba(255,120,30,0.6)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 40px rgba(255,120,30,0.35)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)' }}
                    >
                        {action.text}
                    </a>

                    {secondaryAction && (
                        <a
                            href={secondaryAction.href}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.85rem 2rem',
                                borderRadius: '999px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.9rem', fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'background 0.2s, color 0.2s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)' }}
                        >
                            {secondaryAction.text}
                        </a>
                    )}
                </motion.div>

            </div>
        </section>
    )
}
