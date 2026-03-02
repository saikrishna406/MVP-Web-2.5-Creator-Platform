"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion"
import { ChevronLeft, ChevronRight, Users, Coins, TrendingUp } from "lucide-react"

const steps = [
    {
        icon: <Users size={22} />, color: 'violet', title: 'Sign up in seconds',
        desc: 'Choose Creator or Fan. Fill in your profile and go live instantly. No technical setup required — just your passion and creativity.',
        company: 'Step 1'
    },
    {
        icon: <Coins size={22} />, color: 'ink', title: 'Set up your economy',
        desc: 'Create token-gated posts, set your pricing, and build your redemption store. Full control, your rules, your brand.',
        company: 'Step 2'
    },
    {
        icon: <TrendingUp size={22} />, color: 'amber', title: 'Watch your revenue grow',
        desc: 'Fans buy tokens, earn points, and engage. You get paid instantly via Stripe. Track everything in your analytics dashboard.',
        company: 'Step 3'
    },
]

export function DesignSteps() {
    const [activeIndex, setActiveIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    // Mouse position for magnetic effect
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { damping: 25, stiffness: 200 }
    const x = useSpring(mouseX, springConfig)
    const y = useSpring(mouseY, springConfig)

    // Transform for parallax on the large number
    const numberX = useTransform(x, [-200, 200], [-20, 20])
    const numberY = useTransform(y, [-200, 200], [-10, 10])

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    useEffect(() => {
        return scrollYProgress.onChange((latest) => {
            if (latest < 0.33) setActiveIndex(0);
            else if (latest < 0.66) setActiveIndex(1);
            else setActiveIndex(2);
        })
    }, [scrollYProgress])

    const scrollToStep = (idx: number) => {
        if (!containerRef.current) return;
        const top = containerRef.current.offsetTop;
        const targetY = top + (idx * window.innerHeight);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
    }

    const goNext = () => scrollToStep(Math.min(steps.length - 1, activeIndex + 1));
    const goPrev = () => scrollToStep(Math.max(0, activeIndex - 1));

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            mouseX.set(e.clientX - centerX)
            mouseY.set(e.clientY - centerY)
        }
    }

    const current = steps[activeIndex]

    return (
        <div ref={containerRef} className="relative h-[300vh] w-full bg-white" id="how-it-works">
            <div className="sticky top-0 flex flex-col items-center justify-center min-h-screen py-24 overflow-hidden w-full">
                <motion.div
                    className="section-header max-w-5xl mx-auto w-full px-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ marginBottom: '4rem', zIndex: 10, position: 'relative' }}
                >
                    <div className="section-label" style={{ justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <span className="section-label-dot" /> Simple Process
                    </div>
                    <h2 className="section-h2 text-gray-900">Up &amp; running in <em className="text-gray-900">minutes</em></h2>
                    <p className="section-sub text-gray-600 max-w-2xl mx-auto mt-4">
                        Three steps is all it takes to launch your creator economy. No technical knowledge required.
                    </p>
                </motion.div>

                <div className="relative w-full max-w-5xl px-8 mx-auto" onMouseMove={handleMouseMove}>
                    {/* Oversized index number */}
                    <motion.div
                        className="absolute -left-12 md:-left-8 top-1/2 -translate-y-1/2 text-[14rem] md:text-[28rem] font-bold text-gray-900/[0.04] select-none pointer-events-none leading-none tracking-tighter"
                        style={{ x: numberX, y: numberY }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={activeIndex}
                                initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="block"
                            >
                                {String(activeIndex + 1).padStart(2, "0")}
                            </motion.span>
                        </AnimatePresence>
                    </motion.div>

                    {/* Main content - asymmetric layout */}
                    <div className="relative flex flex-col md:flex-row">
                        {/* Left column - vertical text */}
                        <div className="hidden md:flex flex-col items-center justify-center pr-16 border-r border-gray-200">
                            <motion.span
                                className="text-xs font-mono text-gray-500 tracking-widest uppercase"
                                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                How It Works
                            </motion.span>

                            <div className="relative h-32 w-px bg-gray-200 mt-8">
                                <motion.div
                                    className="absolute top-0 left-0 w-full bg-gray-900 origin-top"
                                    animate={{
                                        height: `${((activeIndex + 1) / steps.length) * 100}%`,
                                    }}
                                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        </div>

                        {/* Center - main content */}
                        <div className="flex-1 md:pl-16 py-8">
                            {/* Step badge */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.4 }}
                                    className="mb-8"
                                >
                                    <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-500 border border-gray-200 rounded-full px-3 py-1">
                                        <span className={`w-2 h-2 rounded-full ${activeIndex === 0 ? 'bg-violet-500' : activeIndex === 1 ? 'bg-gray-900' : 'bg-amber-500'}`} />
                                        {current.company}
                                    </span>
                                </motion.div>
                            </AnimatePresence>

                            {/* Description with character reveal */}
                            <div className="relative mb-8 md:mb-12 min-h-[140px]">
                                <AnimatePresence mode="wait">
                                    <motion.blockquote
                                        key={activeIndex}
                                        className="text-2xl md:text-5xl font-light text-gray-900 leading-[1.15] tracking-tight"
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        {current.desc.split(" ").map((word, i) => (
                                            <motion.span
                                                key={i}
                                                className="inline-block"
                                                style={{ marginRight: '0.25em' }}
                                                variants={{
                                                    hidden: { opacity: 0, y: 20, rotateX: 90 },
                                                    visible: {
                                                        opacity: 1,
                                                        y: 0,
                                                        rotateX: 0,
                                                        transition: {
                                                            duration: 0.5,
                                                            delay: i * 0.03, // Faster than testimonial
                                                            ease: [0.22, 1, 0.36, 1],
                                                        },
                                                    },
                                                    exit: {
                                                        opacity: 0,
                                                        y: -10,
                                                        transition: { duration: 0.2, delay: i * 0.01 },
                                                    },
                                                }}
                                            >
                                                {word}
                                            </motion.span>
                                        ))}
                                    </motion.blockquote>
                                </AnimatePresence>
                            </div>

                            {/* Title row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeIndex}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                        className="flex items-center gap-4"
                                    >
                                        {/* Animated line / icon before name */}
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
                                            <div style={{ color: activeIndex === 0 ? 'var(--violet)' : activeIndex === 1 ? 'var(--gray-900)' : 'var(--amber)' }}>
                                                {current.icon}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{current.title}</h3>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation */}
                                <div className="flex items-center gap-4">
                                    <motion.button
                                        onClick={goPrev}
                                        className="group relative w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden hover:border-gray-900 transition-colors"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gray-900"
                                            initial={{ x: "-100%" }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                        <ChevronLeft size={18} className="relative z-10 text-gray-900 group-hover:text-white transition-colors" />
                                    </motion.button>

                                    <motion.button
                                        onClick={goNext}
                                        className="group relative w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden hover:border-gray-900 transition-colors"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gray-900"
                                            initial={{ x: "100%" }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                        <ChevronRight size={18} className="relative z-10 text-gray-900 group-hover:text-white transition-colors" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom ticker */}
                    <div className="absolute -bottom-8 md:-bottom-16 left-0 right-0 overflow-hidden opacity-[0.03] pointer-events-none">
                        <motion.div
                            className="flex whitespace-nowrap text-6xl md:text-8xl font-black tracking-tight uppercase"
                            animate={{ x: [0, -1000] }}
                            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                            {[...Array(10)].map((_, i) => (
                                <span key={i} className="mx-8">
                                    {steps.map((t) => t.title).join(" • ")} •
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
