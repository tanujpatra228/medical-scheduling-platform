"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Database, Server } from "lucide-react";

export function Architecture() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);

    return (
        <section ref={ref} className="py-32 px-4 sm:px-6 lg:px-8 relative bg-card overflow-hidden border-t border-border">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

                {/* Left Text */}
                <div className="flex-1 space-y-6">
                    <div className="inline-flex px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-sm font-bold mb-4">
                        Tech Stack
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black font-[family-name:var(--font-bricolage)] leading-none">
                        Ready for <br /> 10x Growth.
                    </h2>
                    <p className="text-lg text-slate-400 max-w-lg">
                        Built on a Clean Architecture foundation.
                        No business logic in controllers.
                        Redis-backed slot caching for sub-200ms load times.
                        Horizontally scalable Node.js microservices.
                    </p>
                    <ul className="space-y-4 mt-8 pt-8 border-t border-border">
                        {["Node.js & TypeScript Strict", "PostgreSQL Multi-Tenant", "Redis Job Queues & Caching"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-medium font-[family-name:var(--font-bricolage)] text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right Abstract Visuals */}
                <div className="flex-1 relative h-[500px] w-full mt-10 lg:mt-0">
                    <motion.div style={{ y: y1 }} className="absolute z-20 top-1/4 left-0 md:left-10 p-6 bg-background border border-border shadow-2xl backdrop-blur-xl w-64 rounded-xl">
                        <Server className="w-8 h-8 text-primary mb-4" />
                        <div className="h-2 bg-border rounded w-2/3 mb-2" />
                        <div className="h-2 bg-border rounded w-1/2" />
                    </motion.div>

                    <motion.div style={{ y: y2 }} className="absolute z-10 bottom-1/4 right-0 md:right-10 p-6 bg-background border border-primary/50 shadow-2xl shadow-primary/20 backdrop-blur-xl w-72 rounded-xl">
                        <Database className="w-8 h-8 text-accent mb-4" />
                        <div className="flex gap-2 mb-2">
                            <div className="h-2 bg-primary/40 rounded w-1/3" />
                            <div className="h-2 bg-accent/40 rounded w-1/4" />
                        </div>
                        <div className="h-2 bg-border rounded w-3/4" />
                    </motion.div>

                    <div className="absolute inset-0 border-[0.5px] border-border/30 rounded-full w-[150%] left-[-25%] top-[-25%] h-[150%] opacity-20 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                </div>

            </div>
        </section>
    );
}
