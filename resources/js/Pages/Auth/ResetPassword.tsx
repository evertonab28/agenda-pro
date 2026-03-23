import { useEffect, FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }: { token: string, email: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.update'));
    };

    return (
        <GuestLayout>
            <Head title="Redefinir senha" />

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
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    {errors.email && <p className="text-sm text-red-600 mt-2 font-medium">{errors.email}</p>}
                </div>

                <div className="mt-4">
                    <Label htmlFor="password">Nova Senha</Label>

                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    {errors.password && <p className="text-sm text-red-600 mt-2 font-medium">{errors.password}</p>}
                </div>

                <div className="mt-4">
                    <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>

                    <Input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />

                    {errors.password_confirmation && (
                        <p className="text-sm text-red-600 mt-2 font-medium">{errors.password_confirmation}</p>
                    )}
                </div>

                <div className="flex items-center justify-end">
                    <Button className="w-full" disabled={processing}>
                        Redefinir senha
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}

declare var route: any;
