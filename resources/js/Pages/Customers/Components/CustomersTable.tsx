import React from 'react';
import { Link } from '@inertiajs/react';
import { Eye, Edit2, Phone, Mail, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { route } from '@/lib/route';
import { StatusPill } from '@/components/Shared/StatusPill';
import { EmptyState } from '@/components/Shared/EmptyState';
import { Search } from 'lucide-react';

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
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30 border-b border-border/60">
          <TableHead className="py-4 pl-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Cliente</TableHead>
          <TableHead className="py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Dados de Contato</TableHead>
          <TableHead className="py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Último Agendamento</TableHead>
          <TableHead className="py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Frequência</TableHead>
          <TableHead className="py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
          <TableHead className="py-4 pr-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-20">
              <EmptyState 
                icon={Search}
                title="Nenhum cliente encontrado"
                description="Tente ajustar seus filtros ou cadastre um novo cliente para começar."
              />
            </TableCell>
          </TableRow>
        ) : (
          customers.data.map((customer) => (
            <TableRow key={customer.id} className="group hover:bg-muted/30 transition-colors border-b border-border/40">
              <TableCell className="py-4 pl-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-primary font-black text-sm shadow-inner"
                    style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-foreground truncate uppercase tracking-tight">{customer.name}</p>
                    {customer.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate opacity-70">
                        <Mail className="w-3.5 h-3.5" />
                        {customer.email}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Phone className="w-4 h-4 opacity-40 text-primary" />
                  {formatPhone(customer.phone)}
                </div>
              </TableCell>
              <TableCell className="py-4">
                {customer.appointments && customer.appointments[0] ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <CalendarIcon className="w-4 h-4 opacity-40 text-primary" />
                    <span>
                      {format(parseISO(customer.appointments[0].starts_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/40 italic font-medium">Sem registros</span>
                )}
              </TableCell>
              <TableCell className="py-4 text-center">
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-muted text-xs font-black text-foreground">
                  {customer.appointments_count}
                </span>
              </TableCell>
              <TableCell className="py-4 text-center">
                <StatusPill 
                  label={customer.is_active ? 'Ativo' : 'Inativo'} 
                  variant={customer.is_active ? 'success' : 'muted'} 
                />
              </TableCell>
              <TableCell className="py-4 pr-6 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={route('customers.show', customer.id)}>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href={route('customers.edit', customer.id)}>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
