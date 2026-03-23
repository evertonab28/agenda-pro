import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'operator';
    status: 'active' | 'inactive';
}

export default function Edit({ user }: { user: User }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: user.role,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    return (
        <AppLayout>
            <Head title={`Editar Usuário - ${user.name}`} />

            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center gap-4">
                    <Link href={route('users.index')}>
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Usuário</h1>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-sm text-red-600 font-medium">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email de Acesso</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                {errors.email && <p className="text-sm text-red-600 font-medium">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Perfil de Acesso</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(value: any) => setData('role', value)}
                                >
                                    <SelectTrigger id="role" className="w-full">
                                        <SelectValue placeholder="Selecione um perfil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="manager">Gerente</SelectItem>
                                        <SelectItem value="operator">Operador</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-sm text-red-600 font-medium">{errors.role}</p>}
                            </div>

                            <hr className="border-gray-100 dark:border-zinc-800" />

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-bold">Dica de Segurança</p>
                                    <p>Deixe o campo de senha em branco se não desejar alterar a senha atual do usuário.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nova Senha (Opcional)</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    {errors.password && <p className="text-sm text-red-600 font-medium">{errors.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-zinc-800">
                            <Link href={route('users.index')} className="mr-4">
                                <Button variant="ghost" type="button">Cancelar</Button>
                            </Link>
                            <Button disabled={processing} className="flex items-center gap-2">
                                <Save className="w-4 h-4" /> Atualizar Usuário
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

declare var route: any;
