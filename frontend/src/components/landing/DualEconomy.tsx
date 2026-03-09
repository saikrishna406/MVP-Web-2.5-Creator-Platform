'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export function DualEconomy() {
    return (
        <section className="relative py-32 px-6 w-full max-w-7xl mx-auto z-10" id="features">
            <div className="flex flex-col md:flex-row items-center gap-12 justify-between mb-20 text-white">
                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-bold tracking-[0.15em] mb-6 uppercase"
                    >
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF424D] to-[#8B5CF6]"></span> Dual Currency System
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight"
                    >
                        Two economies.<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF424D] to-[#8B5CF6]">One platform.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-6 text-lg md:text-xl text-white/60 leading-relaxed font-medium max-w-lg"
                    >
                        A dual-currency model — tokens you buy, points you earn. Together they create a thriving creator ecosystem built for long-term loyalty.
                    </motion.p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 w-full perspective-[2000px]">

                {/* CARD 01 */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotateX: 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="relative p-[1px] rounded-[32px] overflow-hidden group hover:-translate-y-2 transition-transform duration-500 ease-out"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative h-full bg-[#111116]/90 backdrop-blur-xl rounded-[31px] p-10 md:p-14 overflow-hidden flex flex-col justify-between shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_40px_-10px_rgba(0,0,0,0.5)]">
                        {/* Ambient Glow */}
                        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FF424D]/15 blur-[120px] rounded-full pointer-events-none transition-transform duration-[1500ms] group-hover:scale-125 group-hover:translate-x-10"></div>

                        <div className="relative z-10">
                            <div className="text-[100px] leading-none font-black text-[#FF424D] mb-6 tracking-tighter drop-shadow-xl" style={{ WebkitTextStroke: '2px rgba(255, 66, 77, 0.2)' }}>01</div>
                            <h3 className="text-3xl font-bold text-white mb-4">Creator Tokens</h3>
                            <p className="text-lg text-white/60 leading-relaxed mb-10 min-h-[80px]">
                                Purchased via Stripe. Fans spend tokens to unlock exclusive content, support creators directly, or gain threshold access to gated experiences.
                            </p>

                            <ul className="space-y-4 mb-14">
                                {['Purchase via Stripe checkout', 'Unlock token-gated posts', 'Direct creator support', 'Threshold access tiers'].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-4 text-white/80 text-base font-medium">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF424D]/20 flex items-center justify-center">
                                            <Check size={14} className="text-[#FF424D]" strokeWidth={3} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Link href="/register" className="inline-flex items-center gap-2 text-[#FF424D] font-bold text-base hover:gap-3 transition-all">
                            Learn more <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>

                {/* CARD 02 */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotateX: 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="relative p-[1px] rounded-[32px] overflow-hidden group hover:-translate-y-2 transition-transform duration-500 ease-out"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative h-full bg-[#111116]/90 backdrop-blur-xl rounded-[31px] p-10 md:p-14 overflow-hidden flex flex-col justify-between shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_40px_-10px_rgba(0,0,0,0.5)]">
                        {/* Ambient Glow */}
                        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#F59E0B]/15 blur-[120px] rounded-full pointer-events-none transition-transform duration-[1500ms] group-hover:scale-125 group-hover:translate-x-10"></div>

                        <div className="relative z-10">
                            <div className="text-[100px] leading-none font-black text-[#F59E0B] mb-6 tracking-tighter drop-shadow-xl" style={{ WebkitTextStroke: '2px rgba(245, 158, 11, 0.2)' }}>02</div>
                            <h3 className="text-3xl font-bold text-white mb-4">Engagement Points</h3>
                            <p className="text-lg text-white/60 leading-relaxed mb-10 min-h-[80px]">
                                Earned by showing up — daily logins, liking posts, leaving comments. Redeem for exclusive rewards from your favourite creator&apos;s store.
                            </p>

                            <ul className="space-y-4 mb-14">
                                {['Daily login bonuses', 'Like & comment rewards', 'Redeem in creator stores', 'Climb the leaderboard'].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-4 text-white/80 text-base font-medium">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                                            <Check size={14} className="text-[#F59E0B]" strokeWidth={3} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Link href="/register" className="inline-flex items-center gap-2 text-[#F59E0B] font-bold text-base hover:gap-3 transition-all">
                            Learn more <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
