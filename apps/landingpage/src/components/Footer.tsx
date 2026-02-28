import { Activity, Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-card/50 backdrop-blur-3xl pt-20 pb-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">

                {/* Brand Column */}
                <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Activity className="w-6 h-6" />
                        <span className="text-xl font-bold font-[family-name:var(--font-bricolage)] tracking-tight text-foreground">MSP</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                        A deterministic, event-driven medical appointment scheduling platform built for modern European healthcare.
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                        <Link href="#" className="text-slate-400 hover:text-primary transition-colors">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-slate-400 hover:text-primary transition-colors">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-slate-400 hover:text-primary transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Links Columns */}
                <div>
                    <h4 className="text-sm font-bold font-[family-name:var(--font-bricolage)] mb-6 text-foreground">Platform</h4>
                    <ul className="space-y-4 text-sm text-slate-400">
                        <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Architecture</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Security & GDPR</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-bold font-[family-name:var(--font-bricolage)] mb-6 text-foreground">Developers</h4>
                    <ul className="space-y-4 text-sm text-slate-400">
                        <li><Link href="#" className="hover:text-primary transition-colors">Documentation</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">API Reference</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">State Machine Specs</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Open Source</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-bold font-[family-name:var(--font-bricolage)] mb-6 text-foreground">Company</h4>
                    <ul className="space-y-4 text-sm text-slate-400">
                        <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <p>© {currentYear} Medical Scheduling Platform. Engineering perfection.</p>
                <div className="flex items-center gap-6">
                    <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Status: All systems operational</Link>
                </div>
            </div>
        </footer>
    );
}
