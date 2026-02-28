"use client";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Activity, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1F2937_1px,transparent_1px),linear-gradient(to_bottom,#1F2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 text-center max-w-5xl mx-auto space-y-8"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium tracking-wide mb-4">
                    <Activity className="w-4 h-4" />
                    <span>Next-Generation German Healthcare Architecture</span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight font-[family-name:var(--font-bricolage)] leading-[1.1]">
                    Frictionless <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-400 to-accent">
                        Patient Booking.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    A deterministic, event-driven scheduling architecture designed for the strict demands of European clinics. Say goodbye to double-bookings and manual workflows.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-background bg-foreground rounded-none overflow-hidden transition-transform hover:scale-105 active:scale-95">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center gap-2 group-hover:text-background transition-colors duration-300">
                            Deploy Your Pilot <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-foreground border border-border hover:bg-card hover:border-primary/50 transition-colors duration-300">
                        Read Architecture Docs
                    </button>
                </div>
            </motion.div>

            {/* Decorative floating elements */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute hidden lg:flex items-center gap-3 p-4 bg-card/80 backdrop-blur-md border border-border/50 top-1/3 left-10 xl:left-32 rounded-2xl shadow-2xl"
            >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold font-[family-name:var(--font-bricolage)]">Confirmed</p>
                    <p className="text-xs text-slate-400">Deterministic Lock</p>
                </div>
            </motion.div>

            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute hidden lg:flex items-center gap-3 p-4 bg-card/80 backdrop-blur-md border border-border/50 bottom-1/3 right-10 xl:right-32 rounded-2xl shadow-2xl"
            >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[#0B0F19]">
                    <Lock className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold font-[family-name:var(--font-bricolage)]">GDPR Ready</p>
                    <p className="text-xs text-slate-400">EU Data Residency</p>
                </div>
            </motion.div>
        </section>
    );
}
