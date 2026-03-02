'use client';
import { motion } from 'framer-motion';

const items = [
    '⚡ Token-Gated Content',
    '🏆 Gamified Engagement',
    '💰 Stripe Payments',
    '🔒 Exclusive Experiences',
    '⭐ Daily Rewards',
    '📊 Creator Analytics',
    '🎁 Redemption Store',
    '🌐 Web 2.5 Economy',
    '🚀 Zero Gas Fees',
    '🎯 Fan Leaderboards',
];

export default function InfiniteScroller() {
    const doubled = [...items, ...items];

    return (
        <div className="infinite-scroller-wrapper">
            <motion.div
                className="infinite-scroller-track"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
            >
                {doubled.map((item, i) => (
                    <span key={i} className="scroller-item">
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
