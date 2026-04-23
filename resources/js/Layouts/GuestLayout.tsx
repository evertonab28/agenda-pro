import { ReactNode } from 'react';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-50/50 dark:bg-zinc-950 page-fade-in">
            <div>
                <Link href="/" className="text-3xl font-bold text-primary tracking-tight">
                    AgendaNexo
                </Link>
            </div>

            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white dark:bg-zinc-900 shadow-md overflow-hidden sm:rounded-lg border border-gray-200 dark:border-zinc-800">
                {children}
            </div>
        </div>
    );
}
