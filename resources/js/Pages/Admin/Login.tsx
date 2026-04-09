import { Head, useForm } from '@inertiajs/react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Login({ errors }: { errors?: Record<string, string> }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <Head title="Control Plane — Login" />

            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-900/50">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-white text-xl font-bold">Control Plane</h1>
                        <p className="text-zinc-500 text-sm">Agenda Pro SaaS Admin</p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-zinc-400 text-sm font-medium block">E-mail</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                required
                                autoFocus
                                placeholder="admin@agendapro.com"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                            />
                            {errors?.email && (
                                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-zinc-400 text-sm font-medium block">Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-lg shadow-violet-900/30"
                        >
                            {processing ? 'Autenticando...' : 'Entrar no Painel'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-700 text-xs mt-6">
                    Acesso exclusivo para administradores da plataforma
                </p>
            </div>
        </div>
    );
}
