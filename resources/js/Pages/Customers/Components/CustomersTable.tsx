import React from 'react';
import { Link } from '@inertiajs/react';
import { Eye, Edit2, Phone, Mail, Calendar as CalendarIcon, MoreHorizontal, UserCheck, UserMinus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { route } from '@/lib/route';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  appointments_count: number;
  appointments?: any[];
}

interface Props {
  customers: {
    data: Customer[];
    links: any[];
  };
}

export default function CustomersTable({ customers }: Props) {
  const formatPhone = (phone: string) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
          <TableRow className="hover:bg-transparent border-b border-zinc-100 dark:border-zinc-800">
            <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[350px]">Cliente</TableHead>
            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contato</TableHead>
            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Último Agendamento</TableHead>
            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Agendamentos</TableHead>
            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
            <TableHead className="py-4 pr-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <UserMinus className="w-12 h-12 opacity-20" />
                  <p className="font-medium">Nenhum cliente encontrado</p>
                  <p className="text-sm opacity-60">Tente ajustar seus filtros de busca</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            customers.data.map((customer) => (
              <TableRow key={customer.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 border-b border-zinc-50 dark:border-zinc-800 transition-colors">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{customer.name}</p>
                      {customer.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {formatPhone(customer.phone)}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  {customer.appointments && customer.appointments[0] ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <CalendarIcon className="w-4 h-4 text-primary opacity-60" />
                      <span>
                        {format(parseISO(customer.appointments[0].starts_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Nenhum registro</span>
                  )}
                </TableCell>
                <TableCell className="py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    {customer.appointments_count}
                  </span>
                </TableCell>
                <TableCell className="py-4 text-center">
                  {customer.is_active ? (
                    <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                       <UserCheck className="w-3 h-3 mr-1" /> Ativo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700">
                       <UserMinus className="w-3 h-3 mr-1" /> Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={route('customers.show', customer.id)}>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={route('customers.edit', customer.id)}>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Pagination component would go here or be in the Index page */}
    </div>
  );
}
