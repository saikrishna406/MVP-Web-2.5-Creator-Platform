"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue, useScroll } from "framer-motion";

// --- Utility ---
// function cn(...inputs: ClassValue[]) {
//     return twMerge(clsx(inputs));
// }

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
    src: string;
    index: number;
    total: number;
    phase: AnimationPhase;
    target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- FlipCard Component ---
const IMG_WIDTH = 60;  // Reduced from 100
const IMG_HEIGHT = 85; // Reduced from 140

function FlipCard({
    src,
    index,
    total,
    phase,
    target,
}: FlipCardProps) {
    return (
        <motion.div
            // Smoothly animate to the coordinates defined by the parent
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotation,
                scale: target.scale,
                opacity: target.opacity,
            }}
            transition={{
                type: "spring",
                stiffness: 40,
                damping: 15,
            }}

            // Initial style
            style={{
                position: "absolute",
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: "preserve-3d", // Essential for the 3D hover effect
                perspective: "1000px",
            }}
            className="cursor-pointer group"
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gray-200"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <img
                        src={src}
                        alt={`hero-${index}`}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                </div>
                <div className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gray-900 flex flex-col items-center justify-center p-4 border border-gray-700" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <div className="text-center">
                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">View</p>
                        <p className="text-xs font-medium text-white">Details</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

const IMAGES = [
    "https://images.unsplash.com/photo-1506744626753-1fa44df62e83",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9",
    "https://images.unsplash.com/photo-1497250681560-c66146f4c8ab",
    "https://images.unsplash.com/photo-1542281286-9e0a16bb7366",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739",
    "https://images.unsplash.com/photo-1533130061792-64b345e4a833",
    "https://images.unsplash.com/photo-1481349518771-20055b2a7b24",
    "https://images.unsplash.com/photo-1542224566-6f34cd1cb5dc",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716",
    "https://images.unsplash.com/photo-1501504905252-473c47e087f8",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607"
];

const TOTAL_IMAGES = 15;
const MAX_SCROLL = 2200;

function lerp(start: number, end: number, t: number) {
    return start * (1 - t) + end * t;
}

export default function IntroAnimation() {
    const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Container Size ---
    useEffect(() => {
        if (!containerRef.current) return;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        };

        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);

        setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
        });

        return () => observer.disconnect();
    }, []);

    // --- Virtual Scroll Logic ---
    const virtualScroll = useMotionValue(0);
    const scrollRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            const currentScroll = scrollRef.current;
            const newScroll = Math.min(Math.max(currentScroll + e.deltaY, 0), MAX_SCROLL);

            // Allow page scroll if we're at the very top and scrolling up, or at the bottom scrolling down
            const AtTopEscaping = currentScroll === 0 && e.deltaY < 0;
            const AtBottomEscaping = currentScroll === MAX_SCROLL && e.deltaY > 0;

            if (!AtTopEscaping && !AtBottomEscaping) {
                e.preventDefault(); // Stop browser overscroll/bounce
            }

            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };

        // Touch support
        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };
        const handleTouchMove = (e: TouchEvent) => {
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            touchStartY = touchY;

            const currentScroll = scrollRef.current;
            const newScroll = Math.min(Math.max(currentScroll + deltaY, 0), MAX_SCROLL);

            const AtTopEscaping = currentScroll === 0 && deltaY < 0;
            const AtBottomEscaping = currentScroll === MAX_SCROLL && deltaY > 0;

            if (!AtTopEscaping && !AtBottomEscaping) {
                if (e.cancelable) e.preventDefault();
            }

            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        container.addEventListener("touchstart", handleTouchStart, { passive: false });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
        };
    }, [virtualScroll]);

    // 1. Morph Progress: 0 (Circle) -> 1 (Bottom Arc)
    const morphProgress = useTransform(virtualScroll, [0, 800], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 400, damping: 40 }); // Stiff spring prevents visual lag!

    // 2. Scroll Rotation (Shuffling)
    const scrollRotate = useTransform(virtualScroll, [800, MAX_SCROLL], [0, 360]);
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 400, damping: 40 });

    // Mouse Parallax mapped exactly without React State
    const mouseX = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const normalizedX = (relativeX / rect.width) * 2 - 1;
            mouseX.set(normalizedX * 100);
        };
        container.addEventListener("mousemove", handleMouseMove);
        return () => container.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX]);

    // --- Intro Sequence (Timeline of scatter -> line -> circle) ---
    useEffect(() => {
        const timer1 = setTimeout(() => setIntroPhase("line"), 500);
        const timer2 = setTimeout(() => setIntroPhase("circle"), 2500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    // --- Transforms for Text Fades ---
    // Fade out main text when morph reaches 0.5
    const text1Opacity = useTransform(smoothMorph, [0, 0.4], [1, 0]);

    // Fade in second text when morph reaches 0.8
    const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
    const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

    // --- Pre-calculate INITIAL_SCATTER to avoid React Hydration Mismatch (which causes the red/white screen crash) ---
    const scatterPositions = useMemo(() => {
        return [
            { x: -600, y: -300, rotation: -20, scale: 0.6, opacity: 0 },
            { x: 400, y: 200, rotation: 45, scale: 0.6, opacity: 0 },
            { x: -300, y: 400, rotation: -60, scale: 0.6, opacity: 0 },
            { x: 600, y: -100, rotation: 15, scale: 0.6, opacity: 0 },
            { x: -100, y: -400, rotation: 80, scale: 0.6, opacity: 0 },
            { x: 200, y: 300, rotation: -40, scale: 0.6, opacity: 0 },
            { x: -550, y: 100, rotation: 50, scale: 0.6, opacity: 0 },
            { x: 300, y: -450, rotation: -10, scale: 0.6, opacity: 0 },
            { x: -200, y: 500, rotation: 70, scale: 0.6, opacity: 0 },
            { x: 500, y: -200, rotation: -80, scale: 0.6, opacity: 0 },
            { x: -400, y: -100, rotation: 30, scale: 0.6, opacity: 0 },
            { x: 100, y: 350, rotation: -50, scale: 0.6, opacity: 0 },
            { x: -650, y: 200, rotation: 60, scale: 0.6, opacity: 0 },
            { x: 400, y: -350, rotation: -30, scale: 0.6, opacity: 0 },
            { x: -50, y: 550, rotation: 20, scale: 0.6, opacity: 0 },
        ];
    }, []);

    // We need to continuously read motion values to calculate per-image positions without triggering React renders
    // We achieve this using nested useTransforms for each card!
    return (
        <div ref={containerRef} className="relative w-full h-full bg-[#FAFAFA] overflow-hidden">
            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000">

                {/* Intro Text (Fades out tied seamlessly to native scroll) */}
                <motion.div
                    style={{ opacity: introPhase === "circle" ? text1Opacity : 0 }}
                    animate={introPhase === "circle" ? { filter: "blur(0px)", y: 0 } : { filter: "blur(10px)", y: 20 }}
                    initial={{ filter: "blur(10px)", y: 20 }}
                    transition={{ duration: 1 }}
                    className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2"
                >
                    <h1 className="text-2xl font-medium tracking-tight text-gray-800 md:text-5xl lg:text-7xl">
                        The future is built on AI.
                    </h1>
                    <p className="mt-4 text-xs font-bold tracking-[0.2em] text-gray-400">
                        SCROLL TO EXPLORE
                    </p>
                </motion.div>

                {/* Arc Active Content (Fades in) */}
                <motion.div
                    style={{ opacity: contentOpacity, y: contentY }}
                    className="absolute top-[15%] md:top-[20%] z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4"
                >
                    <h2 className="text-3xl md:text-5xl lg:text-7xl font-semibold text-gray-900 tracking-tight mb-4">
                        Explore Our Vision
                    </h2>
                    <p className="text-sm md:text-base lg:text-xl text-gray-600 max-w-2xl leading-relaxed">
                        Discover a world where technology meets creativity. <br className="hidden md:block" />
                        Scroll through our curated collection of innovations designed to shape the future.
                    </p>
                </motion.div>

                {/* Main Container */}
                <div className="relative flex items-center justify-center w-full h-full">
                    {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => (
                        <MorphingCard
                            key={i}
                            src={src}
                            i={i}
                            introPhase={introPhase}
                            scatterPositions={scatterPositions}
                            containerSize={containerSize}
                            smoothMorph={smoothMorph}
                            smoothScrollRotate={smoothScrollRotate}
                            smoothMouseX={smoothMouseX}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface MorphingCardProps {
    src: string;
    i: number;
    introPhase: AnimationPhase;
    scatterPositions: { x: number; y: number; rotation: number; scale: number; opacity: number }[];
    containerSize: { width: number; height: number };
    smoothMorph: any;
    smoothScrollRotate: any;
    smoothMouseX: any;
}

function MorphingCard({ src, i, introPhase, scatterPositions, containerSize, smoothMorph, smoothScrollRotate, smoothMouseX }: MorphingCardProps) {
    const cardX = useTransform(() => {
        if (introPhase === "scatter") return scatterPositions[i]?.x || 0;
        if (introPhase === "line") {
            const lineSpacing = 70;
            return i * lineSpacing - (TOTAL_IMAGES * lineSpacing) / 2;
        }

        const isMobile = containerSize.width < 768;
        const minDimension = Math.min(containerSize.width, containerSize.height);
        const circleRadius = Math.min(minDimension * 0.35, 350);
        const circleAngle = (i / TOTAL_IMAGES) * 360;
        const circleX = Math.cos((circleAngle * Math.PI) / 180) * circleRadius;

        const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
        const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
        const spreadAngle = isMobile ? 100 : 130;
        const startAngle = -90 - (spreadAngle / 2);
        const step = spreadAngle / (TOTAL_IMAGES - 1);

        const scrollProgress = Math.min(Math.max(smoothScrollRotate.get() / 360, 0), 1);
        const boundedRotation = -scrollProgress * (spreadAngle * 0.8);
        const arcRad = ((startAngle + (i * step) + boundedRotation) * Math.PI) / 180;
        const arcX = Math.cos(arcRad) * arcRadius + smoothMouseX.get();

        return lerp(circleX, arcX, smoothMorph.get());
    });

    const cardY = useTransform(() => {
        if (introPhase === "scatter") return scatterPositions[i]?.y || 0;
        if (introPhase === "line") return 0;

        const isMobile = containerSize.width < 768;
        const minDimension = Math.min(containerSize.width, containerSize.height);
        const circleRadius = Math.min(minDimension * 0.35, 350);
        const circleAngle = (i / TOTAL_IMAGES) * 360;
        const circleY = Math.sin((circleAngle * Math.PI) / 180) * circleRadius;

        const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
        const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
        const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
        const arcCenterY = arcApexY + arcRadius;
        const spreadAngle = isMobile ? 100 : 130;
        const startAngle = -90 - (spreadAngle / 2);
        const step = spreadAngle / (TOTAL_IMAGES - 1);

        const scrollProgress = Math.min(Math.max(smoothScrollRotate.get() / 360, 0), 1);
        const boundedRotation = -scrollProgress * (spreadAngle * 0.8);
        const arcRad = ((startAngle + (i * step) + boundedRotation) * Math.PI) / 180;
        const arcY = Math.sin(arcRad) * arcRadius + arcCenterY;

        return lerp(circleY, arcY, smoothMorph.get());
    });

    const cardRotate = useTransform(() => {
        if (introPhase === "scatter") return scatterPositions[i]?.rotation || 0;
        if (introPhase === "line") return 0;

        const circleAngle = (i / TOTAL_IMAGES) * 360;
        const circleRot = circleAngle + 90;

        const isMobile = containerSize.width < 768;
        const spreadAngle = isMobile ? 100 : 130;
        const startAngle = -90 - (spreadAngle / 2);
        const step = spreadAngle / (TOTAL_IMAGES - 1);
        const scrollProgress = Math.min(Math.max(smoothScrollRotate.get() / 360, 0), 1);
        const boundedRotation = -scrollProgress * (spreadAngle * 0.8);
        const arcRot = startAngle + (i * step) + boundedRotation + 90;

        return lerp(circleRot, arcRot, smoothMorph.get());
    });

    const cardScale = useTransform(() => {
        if (introPhase === "scatter") return scatterPositions[i]?.scale || 1;
        if (introPhase === "line") return 1;
        const isMobile = containerSize.width < 768;
        return lerp(1, isMobile ? 1.4 : 1.8, smoothMorph.get());
    });

    return (
        <motion.div
            style={{
                position: "absolute",
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: "preserve-3d",
                perspective: "1000px",
                x: cardX,
                y: cardY,
                rotate: cardRotate,
                scale: cardScale,
                opacity: 1, // Opacity defaults to visible beyond scatter
            }}
            className="cursor-pointer group"
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                <div className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gray-200" style={{ backfaceVisibility: "hidden" }}>
                    <img src={src} alt={`hero-${i}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                </div>
                <div className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gray-900 flex flex-col items-center justify-center p-4 border border-gray-700" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <div className="text-center">
                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">View</p>
                        <p className="text-xs font-medium text-white">Details</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
