import { FormEventHandler } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Esqueceu sua senha" />

            <div className="mb-4 text-sm text-muted-foreground">
                Esqueceu sua senha? Sem problemas. Basta nos informar seu endereço de e-mail e enviaremos um link de redefinição de senha que permitirá que você escolha uma nova.
            </div>

            {status && <div className="mb-4 font-medium text-sm text-green-600 dark:text-emerald-400">{status}</div>}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <Label htmlFor="email">Email</Label>

                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    {errors.email && <p className="text-sm text-red-600 mt-2 font-medium">{errors.email}</p>}
                </div>

                <div className="flex items-center justify-end">
                    <Button className="w-full" disabled={processing}>
                        Enviar link de redefinição
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}

declare var route: any;
