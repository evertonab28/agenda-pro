import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from 'radix-ui'; // Assuming Radix is used for Switch, or I'll use a custom one
import { User, Phone, Mail, FileText, Calendar, StickyNote, Save, X, ChevronLeft } from 'lucide-react';
import { route } from '@/lib/route';

interface Props {
  customer?: any;
}

export default function CustomerForm({ customer }: Props) {
  const isEdit = !!customer;
  
  const { data, setData, post, put, processing, errors } = useForm({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    document: customer?.document || '',
    birth_date: customer?.birth_date ? customer.birth_date.split('T')[0] : '',
    notes: customer?.notes || '',
    is_active: customer?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(route('customers.update', customer.id));
    } else {
      post(route('customers.store'));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Simple mask: (XX) XXXXX-XXXX
    let formatted = value;
    if (value.length > 2) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 7) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    }
    
    setData('phone', formatted);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    // Simple CPF/CNPJ mask
    let formatted = value;
    if (value.length <= 11) { // CPF
      if (value.length > 3) formatted = `${value.slice(0, 3)}.${value.slice(3)}`;
      if (value.length > 6) formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
      if (value.length > 9) formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else { // CNPJ
      if (value.length > 2) formatted = `${value.slice(0, 2)}.${value.slice(2)}`;
      if (value.length > 5) formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
      if (value.length > 8) formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
      if (value.length > 12) formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
    }
    
    setData('document', formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informações Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest ml-1">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    placeholder="Ex: João Silva"
                    className={`pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 ${errors.name ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 font-bold ml-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest ml-1">Telefone / WhatsApp *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="phone"
                    value={data.phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className={`pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 font-bold ml-1">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document" className="text-xs font-bold uppercase tracking-widest ml-1">CPF ou CNPJ</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="document"
                    value={data.document}
                    onChange={handleDocumentChange}
                    placeholder="000.000.000-00"
                    className="pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-xs font-bold uppercase tracking-widest ml-1">Data de Nascimento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="birth_date"
                    type="date"
                    value={data.birth_date}
                    onChange={e => setData('birth_date', e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-primary" />
              Observações e Notas
            </h3>
            <Textarea 
              value={data.notes}
              onChange={e => setData('notes', e.target.value)}
              placeholder="Adicione informações relevantes sobre o cliente, preferências, alergias, etc..."
              className="min-h-[150px] rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 p-4"
            />
          </div>
        </div>

        {/* Side Actions Card */}
        <div className="space-y-6">
          <div className="bg-zinc-900 dark:bg-zinc-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-200 dark:shadow-none">
            <h3 className="text-lg font-bold mb-6">Configurações do Perfil</h3>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 mb-8">
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Cliente Ativo</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Status operacional</p>
              </div>
              <input 
                type="checkbox"
                checked={data.is_active}
                onChange={e => setData('is_active', e.target.checked)}
                className="w-12 h-6 rounded-full bg-zinc-700 checked:bg-primary appearance-none relative cursor-pointer before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-7 transition-all"
              />
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                disabled={processing}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {processing ? 'Salvando...' : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {isEdit ? 'Salvar Alterações' : 'Criar Cliente'}
                  </>
                )}
              </Button>
              <Link href={isEdit ? route('customers.show', customer.id) : route('customers.index')} className="block">
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full h-14 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold transition-all"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancelar
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Dica Pro</h4>
             </div>
             <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
               Manter o telefone e nome corretos ajuda na automatização de lembretes via WhatsApp.
             </p>
          </div>
        </div>
      </div>
    </form>
  );
}
