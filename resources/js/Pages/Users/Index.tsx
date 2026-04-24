import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    UserCheck, 
    UserX,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Users as UsersIcon,
    Mail,
    Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/Shared/PageHeader';
import { SectionCard } from '@/components/Shared/SectionCard';
import { StatusPill } from '@/components/Shared/StatusPill';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'operator';
    status: 'active' | 'inactive';
}

export default function Index({ users }: { users: User[] }) {
    const toggleStatus = (id: number) => {
        if (confirm('Tem certeza que deseja alterar o status deste usuário?')) {
            router.patch(route('users.status', id));
        }
    };

    const deleteUser = (id: number) => {
        if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            router.delete(route('users', id));
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return (
                    <div className="flex items-center gap-1.5 text-destructive font-black uppercase text-[10px] tracking-widest bg-destructive/10 px-2 py-0.5 rounded-lg border border-destructive/20">
                        <ShieldAlert className="w-3 h-3" />
                        Administrador
                    </div>
                );
            case 'manager':
                return (
                    <div className="flex items-center gap-1.5 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                        <ShieldCheck className="w-3 h-3" />
                        Gerente
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-black uppercase text-[10px] tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/40">
                        <Shield className="w-3 h-3" />
                        Operador
                    </div>
                );
        }
    };

    return (
        <>
            <Head title="Equipe & Permissões" />

            <div className="max-w-6xl mx-auto space-y-6">
                <PageHeader 
                    title="Gestão de Equipe" 
                    subtitle="Controle quem acessa o sistema e quais permissões cada membro possui."
                    action={
                        <Link href={route('users.create')}>
                            <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-xs gap-2">
                                <Plus className="w-4 h-4" /> 
                                Novo Membro
                            </Button>
                        </Link>
                    }
                />

                <SectionCard noPadding>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/40">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membro / Usuário</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Perfil de Acesso</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <UsersIcon className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-sm font-medium">Nenhum usuário cadastrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-foreground tracking-tight">{user.name}</p>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-0.5">
                                                            <Mail className="w-3 h-3 opacity-60" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusPill 
                                                    label={user.status === 'active' ? 'ATIVO' : 'INATIVO'} 
                                                    variant={user.status === 'active' ? 'success' : 'muted'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-9 w-9 rounded-lg ${user.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                        onClick={() => toggleStatus(user.id)}
                                                        title={user.status === 'active' ? 'Desativar Usuário' : 'Ativar Usuário'}
                                                    >
                                                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </Button>
                                                    
                                                    <Link href={route('users.edit', user.id)}>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary hover:bg-primary/5">
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/5"
                                                        onClick={() => deleteUser(user.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}

Index.layout = (page: any) => <AppLayout children={page} />;

declare var route: any;
