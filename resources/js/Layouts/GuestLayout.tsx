import { ReactNode } from 'react';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-background dark:bg-zinc-950 page-fade-in"
             style={{ background: 'linear-gradient(155deg, #EAF4FB 0%, #D9EAF7 45%, #C5DFEF 100%)' }}>
            
            {/* Decorative circles from landing page */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-96 h-96 rounded-full"
                 style={{ background: 'rgba(31,78,121,.06)' }}></div>
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-60 h-60 rounded-full"
                 style={{ background: 'rgba(31,78,121,.04)' }}></div>

            <div className="relative z-10 flex flex-col items-center">
                <Link href="/" className="flex items-center gap-2 mb-8 hover-lift">
                    <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                        <rect width="28" height="28" rx="7" fill="#1F4E79"/>
                        <path d="M8 14h4l2-5 2 10 2-5h2" stroke="#D9EAF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-display font-bold text-2xl tracking-tight text-[#1F2937]">
                        Agenda<span className="text-[#1F4E79]">Nexo</span>
                    </span>
                </Link>

                <div className="w-full sm:max-w-md px-8 py-10 bg-card dark:bg-zinc-900 overflow-hidden sm:rounded-2xl border border-border shadow-[0_24px_80px_rgba(31,78,121,.18)]">
                    {children}
                </div>
                
                <p className="mt-8 text-sm text-[#5B6573] font-medium">
                    Sistema operacional para quem vive de horário.
                </p>
            </div>
        </div>
    );
}
