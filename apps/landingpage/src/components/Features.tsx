"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, Shield, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: Clock,
        title: "Operational Efficiency",
        description: "Automate reminders, confirm slots, and handle no-shows without manual clinic intervention.",
    },
    {
        icon: Workflow,
        title: "Deterministic States",
        description: "A mathematically rigid state machine ensures an appointment can never be in an invalid condition.",
    },
    {
        icon: Shield,
        title: "GDPR Compliant",
        description: "Data isolation by design. Native multi-tenant architecture designed for European strictness.",
    },
];

export function Features() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 relative bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20">
                    <h2 className="text-3xl md:text-5xl font-black font-[family-name:var(--font-bricolage)] tracking-tight">
                        Engineered for <br /> <span className="text-primary">Clinical Perfection.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                            className="group relative p-8 bg-card border border-border hover:border-primary/50 transition-colors"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                            <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 font-[family-name:var(--font-bricolage)]">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
