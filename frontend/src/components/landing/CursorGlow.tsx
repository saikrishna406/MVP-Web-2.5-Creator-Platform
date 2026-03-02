'use client';
import { useEffect, useRef } from 'react';

export default function CursorGlow() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const cursorDotRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ x: 0, y: 0 });
    const smoothPos = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            pos.current = { x: e.clientX, y: e.clientY };
            if (cursorDotRef.current) {
                cursorDotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
            }
        };

        const animate = () => {
            smoothPos.current.x += (pos.current.x - smoothPos.current.x) * 0.08;
            smoothPos.current.y += (pos.current.y - smoothPos.current.y) * 0.08;
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${smoothPos.current.x - 20}px, ${smoothPos.current.y - 20}px)`;
            }
            rafRef.current = requestAnimationFrame(animate);
        };

        const handleEnter = () => {
            if (cursorRef.current) cursorRef.current.style.opacity = '1';
            if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1';
        };
        const handleLeave = () => {
            if (cursorRef.current) cursorRef.current.style.opacity = '0';
            if (cursorDotRef.current) cursorDotRef.current.style.opacity = '0';
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseenter', handleEnter);
        document.addEventListener('mouseleave', handleLeave);
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseenter', handleEnter);
            document.removeEventListener('mouseleave', handleLeave);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <>
            {/* Large glowing orb */}
            <div
                ref={cursorRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(6,182,212,0.1) 70%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    filter: 'blur(2px)',
                    willChange: 'transform',
                }}
            />
            {/* Sharp dot */}
            <div
                ref={cursorDotRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    pointerEvents: 'none',
                    zIndex: 10000,
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    willChange: 'transform',
                    boxShadow: '0 0 10px rgba(139,92,246,0.8)',
                }}
            />
        </>
    );
}
