"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion, stagger, useAnimate } from "motion/react"

import Floating, {
    FloatingElement,
} from "@/components/ui/parallax-floating"
import { FloatingNav } from "@/components/ui/floating-navbar"
import { ShinyButton } from "@/components/ui/shiny-button"
import { Home, MessageSquare, User } from "lucide-react"

const exampleImages = [
    // Force tailwind compile
    // "flex max-w-fit fixed top-6 inset-x-0 mx-auto border border-white/20 rounded-full bg-black/80 backdrop-blur-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[6000] px-8 py-3 items-center justify-center space-x-6 relative text-white/80 transition-colors hidden sm:block text-sm border-white/[0.2] text-white hover:bg-white/10 absolute",
    {
        url: "https://images.unsplash.com/photo-1727341554370-80e0fe9ad082?q=80&w=2276&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "Branislav Rodman",
        link: "https://unsplash.com/photos/a-black-and-white-photo-of-a-woman-brushing-her-teeth-r1SjnJL5tf0",
        title: "A Black and White Photo of a Woman Brushing Her Teeth",
    },
    {
        url: "https://images.unsplash.com/photo-1640680608781-2e4199dd1579?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        link: "https://unsplash.com/photos/a-painting-of-a-palm-leaf-on-a-multicolored-background-AaNPwrSNOFE",
        title: "Neon Palm",
        author: "Tim Mossholder",
    },
    {
        url: "https://images.unsplash.com/photo-1726083085160-feeb4e1e5b00?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        link: "https://unsplash.com/photos/a-blurry-photo-of-a-crowd-of-people-UgbxzloNGsc",
        author: "ANDRII SOLOK",
        title: "A blurry photo of a crowd of people",
    },
    {
        url: "https://images.unsplash.com/photo-1562016600-ece13e8ba570?q=80&w=2838&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        link: "https://unsplash.com/photos/rippling-crystal-blue-water-9-OCsKoyQlk",
        author: "Wesley Tingey",
        title: "Rippling Crystal Blue Water",
    },
    {
        url: "https://images.unsplash.com/photo-1624344965199-ed40391d20f2?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        link: "https://unsplash.com/de/fotos/mann-im-schwarzen-hemd-unter-blauem-himmel-m8RDNiuEXro",
        author: "Serhii Tyaglovsky",
        title: "Mann im schwarzen Hemd unter blauem Himmel",
    },
    {
        url: "https://images.unsplash.com/photo-1689553079282-45df1b35741b?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        link: "https://unsplash.com/photos/a-woman-with-a-flower-crown-on-her-head-0S3muIttbsY",
        author: "Vladimir Yelizarov",
        title: "A women with a flower crown on her head",
    },
    {
        url: "https://images.unsplash.com/photo-1721968317938-cf8c60fccd1a?q=80&w=2728&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "A blurry photo of white flowers in a field",
        author: "Eugene Golovesov",
        link: "https://unsplash.com/photos/a-blurry-photo-of-white-flowers-in-a-field-6qbx0lzGPyc",
    },
    {
        url: "https://images.unsplash.com/photo-1677338354108-223e807fb1bd?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "Mathilde Langevin",
        link: "https://unsplash.com/photos/a-table-topped-with-two-wine-glasses-and-plates-Ig0gRAHspV0",
        title: "A table topped with two wine glasses and plates",
    },
]

export default function Preview() {
    const [scope, animate] = useAnimate()

    useEffect(() => {
        animate("img", { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.15) })
    }, [animate])

    return (
        <div className="w-full">
            {/* ── FLOATING NAVBAR ── */}
            <FloatingNav navItems={[
                { name: "Home", link: "/", icon: <Home className="h-4 w-4 text-white" /> },
                { name: "About", link: "#about", icon: <User className="h-4 w-4 text-white" /> },
                { name: "Contact", link: "#contact", icon: <MessageSquare className="h-4 w-4 text-white" /> },
            ]} />

            {/* ── PARALLAX HERO ── */}
            <div
                className="flex w-full h-full min-h-screen justify-center items-center bg-black overflow-hidden relative"
                ref={scope}
            >
                <motion.div
                    className="z-50 text-center space-y-4 items-center flex flex-col"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.88, delay: 1.5 }}
                >
                    <p className="text-3xl md:text-5xl lg:text-7xl z-50 text-white font-bold tracking-tight px-4 leading-tight">
                        Production Ready <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF424D] to-[#8B5CF6]">Web 2.5</span><br />
                        Creator Platform
                    </p>
                    <Link href="/register" className="mt-6 z-50">
                        <ShinyButton>
                            Get Started
                        </ShinyButton>
                    </Link>
                </motion.div>

                <Floating sensitivity={-1} className="overflow-hidden">
                    <FloatingElement depth={0.5} className="top-[8%] left-[11%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[0].url}
                            className="w-16 h-16 md:w-24 md:h-24 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>
                    <FloatingElement depth={1} className="top-[10%] left-[32%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[1].url}
                            className="w-20 h-20 md:w-28 md:h-28 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>
                    <FloatingElement depth={2} className="top-[2%] left-[53%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[2].url}
                            className="w-28 h-40 md:w-40 md:h-52 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>
                    <FloatingElement depth={1} className="top-[0%] left-[83%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[3].url}
                            className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>

                    <FloatingElement depth={1} className="top-[40%] left-[2%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[4].url}
                            className="w-28 h-28 md:w-36 md:h-36 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>
                    <FloatingElement depth={2} className="top-[70%] left-[77%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[7].url}
                            className="w-28 h-28 md:w-36 md:h-48 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>

                    <FloatingElement depth={4} className="top-[73%] left-[15%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[5].url}
                            className="w-40 md:w-52 h-full object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>
                    <FloatingElement depth={1} className="top-[80%] left-[50%]">
                        <motion.img
                            initial={{ opacity: 0 }}
                            src={exampleImages[6].url}
                            className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
                        />
                    </FloatingElement>
                </Floating>
            </div>
        </div>
    )
}
