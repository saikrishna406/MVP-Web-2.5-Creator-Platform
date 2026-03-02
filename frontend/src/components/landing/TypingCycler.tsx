'use client';
import { motion } from 'framer-motion';

const words = ['Creators', 'Artists', 'Musicians', 'Streamers', 'Educators', 'Writers'];

export default function TypingCycler() {
    return (
        <div className="typing-cycler">
            {words.map((word, i) => (
                <motion.span
                    key={word}
                    className="typing-word gradient-text-hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        y: [20, 0, 0, -20],
                    }}
                    transition={{
                        duration: 3,
                        delay: i * 3,
                        repeat: Infinity,
                        repeatDelay: (words.length - 1) * 3,
                        times: [0, 0.15, 0.85, 1],
                    }}
                    style={{ position: 'absolute', left: 0, right: 0 }}
                >
                    {word}
                </motion.span>
            ))}
        </div>
    );
}
