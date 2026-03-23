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
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
                return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"><ShieldAlert className="w-3 h-3 mr-1" /> Admin</Badge>;
            case 'manager':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"><ShieldCheck className="w-3 h-3 mr-1" /> Gerente</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"><Shield className="w-3 h-3 mr-1" /> Operador</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title="Gerenciamento de Usuários" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
                    <p className="text-muted-foreground">Gerencie as permissões e acessos do sistema</p>
                </div>
                <Link href={route('users.create')}>
                    <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Novo Usuário
                    </Button>
                </Link>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'active' ? 'default' : 'outline'} className={
                                        user.status === 'active' 
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                                            : 'text-gray-500'
                                    }>
                                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleStatus(user.id)}
                                            title={user.status === 'active' ? 'Desativar' : 'Ativar'}
                                        >
                                            {user.status === 'active' ? <UserX className="w-4 h-4 text-orange-500" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
                                        </Button>
                                        <Link href={route('users.edit', user.id)}>
                                            <Button variant="ghost" size="icon">
                                                <Edit2 className="w-4 h-4 text-blue-500" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteUser(user.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}

declare var route: any;
