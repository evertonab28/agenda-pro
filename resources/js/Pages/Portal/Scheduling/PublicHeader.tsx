import React from 'react';
import { ChevronLeft, User } from 'lucide-react';
import type { Workspace, Customer } from './types';

interface Props {
    workspace: Workspace;
    customer?: Customer;
    /** Show "← Voltar" when wizard is open */
    isWizardOpen?: boolean;
    onCloseWizard?: () => void;
}

export default function PublicHeader({ workspace, customer, isWizardOpen, onCloseWizard }: Props) {
    const initials = workspace.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    return (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left: back + brand */}
                <div className="flex items-center gap-3">
                    {isWizardOpen && onCloseWizard && (
                        <button
                            onClick={onCloseWizard}
                            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors pr-2 border-r border-slate-100 mr-1"
                        >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">Perfil</span>
                        </button>
                    )}
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials}
                    </div>
                    <span className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-none">
                        {workspace.name}
                    </span>
                </div>

                {/* Right: account CTA */}
                {customer ? (
                    <a
                        href={`/p/${workspace.slug}/dashboard`}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <User size={15} />
                        <span className="hidden sm:inline">{customer.name}</span>
                        <span className="sm:hidden">Minha área</span>
                    </a>
                ) : (
                    <a
                        href={`/p/${workspace.slug}/login`}
                        className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        Minha conta
                    </a>
                )}
            </div>
        </header>
    );
}
