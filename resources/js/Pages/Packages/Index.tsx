import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Package as PackageIcon, Plus, Edit2, Archive, CheckCircle2, ShoppingBag, ShoppingCart, User, MoreHorizontal, Calendar, AlertCircle } from 'lucide-react';
import { route } from '@/utils/route';
import CustomerAutocomplete from '@/components/CustomerAutocomplete';

interface Props {
    packages: any[];
    services: any[];
    customers: any[];
}

export default function PackageIndex({ packages, services, customers }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [packageToSell, setPackageToSell] = useState<any>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        service_id: '',
        name: '',
        description: '',
        sessions_count: 10,
        price: 0,
        validity_days: 90,
        is_active: true,
    });

    const { data: sellData, setData: setSellData, post: postSell, processing: sellProcessing, reset: resetSell, errors: sellErrors } = useForm({
        customer_id: '',
    });

    const openModal = (pkg?: any) => {
        if (pkg) {
            setSelectedPackage(pkg);
            setData({
                service_id: String(pkg.service_id),
                name: pkg.name,
                description: pkg.description || '',
                sessions_count: pkg.sessions_count,
                price: pkg.price,
                validity_days: pkg.validity_days,
                is_active: !!pkg.is_active,
            });
        } else {
            setSelectedPackage(null);
            reset();
        }
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPackage) {
            put(route('packages.update', selectedPackage.id), {
                onSuccess: () => {
                    setShowModal(false);
                    // toast.success('Pacote atualizado!');
                },
            });
        } else {
            post(route('packages.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const openSellModal = (pkg: any) => {
        setPackageToSell(pkg);
        resetSell();
        setShowSellModal(true);
    };

    const handleSell = (e: React.FormEvent) => {
        e.preventDefault();
        postSell(route('packages.sell', packageToSell.id), {
            onSuccess: () => {
                setShowSellModal(false);
                // toast.success('Venda registrada com sucesso!');
            },
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <AppLayout>
            <Head title="Gestão de Pacotes" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pacotes de Serviços</h1>
                        <p className="text-muted-foreground">Crie ofertas de sessões acumuladas para seus clientes.</p>
                    </div>
                    <Button onClick={() => openModal()} className="shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> Novo Pacote
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <Card key={pkg.id} className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all ${!pkg.is_active ? 'opacity-60 grayscale' : 'bg-white'}`}>
                            <div className="h-2 bg-primary" />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                                        {pkg.service.name}
                                    </Badge>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(pkg)}>
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-xl mt-2">{pkg.name}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">{pkg.description || 'Sem descrição.'}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm py-2 border-y border-zinc-50">
                                    <span className="text-muted-foreground">Sessões</span>
                                    <span className="font-bold text-lg">{pkg.sessions_count}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Validade</span>
                                    <span className="font-medium text-amber-600">{pkg.validity_days} dias</span>
                                </div>
                                <div className="pt-2">
                                    <p className="text-2xl font-black text-zinc-900">{formatCurrency(pkg.price)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                        {formatCurrency(pkg.price / pkg.sessions_count)} por sessão
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-zinc-50 gap-2 border-t py-3">
                                {!pkg.is_active ? (
                                    <Badge variant="secondary" className="w-full justify-center py-1">Desativado</Badge>
                                ) : (
                                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => openSellModal(pkg)}>
                                        <ShoppingBag className="w-3.5 h-3.5 mr-2" /> Vender Pacote
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{selectedPackage ? 'Editar Pacote' : 'Novo Pacote'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Pacote</Label>
                            <Input 
                                placeholder="Ex: Combo 10 Barbas" 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Serviço Vinculado</Label>
                            <Select 
                                value={data.service_id} 
                                onChange={(e) => setData('service_id', e.target.value)}
                            >
                                <SelectItem value="">Selecione o serviço...</SelectItem>
                                {services.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </Select>
                            {errors.service_id && <p className="text-xs text-red-500 font-medium">{errors.service_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nº de Sessões</Label>
                                <Input 
                                    type="number" 
                                    value={data.sessions_count} 
                                    onChange={e => setData('sessions_count', parseInt(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Preço Total (R$)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    value={data.price} 
                                    onChange={e => setData('price', parseFloat(e.target.value))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Validade (dias)</Label>
                                <Input 
                                    type="number" 
                                    value={data.validity_days} 
                                    onChange={e => setData('validity_days', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <input 
                                    type="checkbox" 
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary"
                                />
                                <Label htmlFor="is_active">Pacote Ativo</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea 
                                placeholder="Detalhes do que está incluso no pacote..." 
                                value={data.description} 
                                onChange={e => setData('description', e.target.value)}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>Salvar Pacote</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Vender Pacote</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSell} className="space-y-6 py-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">Pacote Selecionado</p>
                                <p className="text-lg font-bold">{packageToSell?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Valor</p>
                                <p className="font-bold">{packageToSell ? formatCurrency(packageToSell.price) : '-'}</p>
                            </div>
                        </div>

                        <CustomerAutocomplete 
                            label="Selecionar Cliente"
                            value={sellData.customer_id}
                            onChange={(id) => setSellData('customer_id', id)}
                            error={sellErrors.customer_id}
                            placeholder="Busque por nome ou telefone..."
                        />

                        <div className="bg-amber-50 border border-amber-100 p-3 rounded text-[11px] text-amber-800 flex gap-2">
                            <ShoppingBag className="w-4 h-4 shrink-0" />
                            <p>Ao confirmar, uma cobrança será gerada para o cliente e as sessões serão creditadas no perfil dele.</p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowSellModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={sellProcessing}>Confirmar Venda</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
