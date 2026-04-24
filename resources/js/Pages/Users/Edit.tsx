import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, Save, AlertCircle, ShieldCheck, Mail, Lock, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/Shared/PageHeader';
import { SectionCard } from '@/components/Shared/SectionCard';

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
        <>
            <Head title={`Editar Usuário - ${user.name}`} />

            <div className="max-w-3xl mx-auto space-y-6">
                <PageHeader 
                    title="Editar Membro" 
                    subtitle={`Atualize as permissões ou dados de acesso de ${user.name}.`}
                    backHref={route('users.index')}
                />

                <SectionCard 
                    title="Configurações do Usuário" 
                    subtitle="Modifique os dados cadastrais e o perfil de segurança."
                >
                    <form onSubmit={submit} className="space-y-8 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                                <div className="relative">
                                    <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                    <Input
                                        id="name"
                                        className="h-11 pl-10 rounded-xl bg-muted/30"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="João Silva"
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email de Acesso</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="h-11 pl-10 rounded-xl bg-muted/30"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Perfil de Acesso</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(val: any) => setData('role', val)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/40">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                            <SelectValue placeholder="Selecione o perfil" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="manager">Gerente</SelectItem>
                                        <SelectItem value="operator">Operador</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.role}</p>}
                            </div>

                            <div className="md:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-xs text-foreground/80 leading-relaxed">
                                    <p className="font-black uppercase tracking-wider text-[10px] text-primary mb-1">Dica de Segurança</p>
                                    <p className="font-medium">Deixe os campos de senha em branco se não desejar alterar a senha atual do usuário.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nova Senha (Opcional)</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="h-11 pl-10 rounded-xl bg-muted/30"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password && <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        className="h-11 pl-10 rounded-xl bg-muted/30"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
                            <Link href={route('users.index')}>
                                <Button variant="ghost" type="button" className="rounded-xl font-bold uppercase text-[10px] tracking-wider">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button disabled={processing} className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs gap-2">
                                <Save className="w-4 h-4" /> 
                                Atualizar Usuário
                            </Button>
                        </div>
                    </form>
                </SectionCard>
            </div>
        </>
    );
}

Edit.layout = (page: any) => <AppLayout>{page}</AppLayout>;

declare var route: any;
