'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { useRef, MouseEvent } from 'react';

interface ScrollRevealTextProps {
    text: string;
}

export default function ScrollRevealText({ text }: ScrollRevealTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 85%', 'end 50%'], // Starts when element hits 85% of viewport height, ends at 50% (middle)
    });

    // Cursor tracking state
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth physics for the spotlight following the mouse
    const smoothMouseX = useSpring(mouseX, { stiffness: 75, damping: 15 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 75, damping: 15 });

    function handleMouseMove(e: MouseEvent<HTMLElement>) {
        if (!containerRef.current) return;
        const { left, top } = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    }

    const words = text.split(' ');

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="group relative w-full flex items-center justify-center py-32 px-6 md:px-12 border-t border-b border-white/[0.05] overflow-hidden cursor-default"
            style={{ minHeight: '60vh', background: '#000000' }}
        >
            {/* Interactive Spotlight Glow */}
            <motion.div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`radial-gradient(600px circle at ${smoothMouseX}px ${smoothMouseY}px, rgba(255,255,255,0.08), transparent 80%)`,
                }}
            />

            {/* Animated Ambient Background Glows */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, 50, 0],
                    y: [0, -30, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.5, 0.2],
                    x: [0, -50, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] rounded-full bg-white/[0.03] blur-[150px] pointer-events-none"
            />

            <div className="max-w-7xl mx-auto w-full flex items-center justify-center relative z-10 p-12">
                <h2 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-medium leading-[1.4] tracking-tight max-w-[900px]">
                    {words.map((word, i) => {
                        const start = i / words.length;
                        const end = start + (1 / words.length);
                        return (
                            <Word key={i} range={[start, end]} progress={scrollYProgress}>
                                {word}
                            </Word>
                        );
                    })}
                </h2>
            </div>
        </section>
    );
}

function Word({ children, range, progress }: any) {
    const opacity = useTransform(progress, range, [0, 1]);
    const y = useTransform(progress, range, [12, 0]); // Parallax micro-lift up
    const scale = useTransform(progress, range, [0.96, 1]); // Micro-scale in

    return (
        <span className="relative inline-block mt-2 group/word" style={{ marginRight: '0.3em' }}>
            {/* The base opaque gray word underneath */}
            <span className="absolute opacity-20 text-white transition-all duration-300 group-hover/word:opacity-30">
                {children}
            </span>
            {/* The white glowing word overlapping it that fades in on scroll */}
            <motion.span
                style={{ opacity, y, scale }}
                className="text-white relative z-10 inline-block transition-all duration-300 group-hover/word:drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] group-hover/word:-translate-y-1 cursor-pointer"
            >
                {children}
            </motion.span>
        </span>
    );
}
