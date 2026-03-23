import { useEffect, FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }: { status?: string, canResetPassword?: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <Label htmlFor="email">Email</Label>

                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    {errors.email && <p className="text-sm text-red-600 mt-2 font-medium">{errors.email}</p>}
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Esqueceu sua senha?
                            </Link>
                        )}
                    </div>

                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    {errors.password && <p className="text-sm text-red-600 mt-2 font-medium">{errors.password}</p>}
                </div>

                <div className="block mt-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                        />
                        <span className="ms-2 text-sm text-muted-foreground">Lembrar de mim</span>
                    </label>
                </div>

                <div className="flex items-center justify-end">
                    <Button className="w-full" disabled={processing}>
                        Entrar
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}

// Global window.route to avoid TypeScript errors if not globally available
declare var route: any;
