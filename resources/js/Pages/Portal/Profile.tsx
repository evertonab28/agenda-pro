import React from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { ArrowLeft, User } from "lucide-react";
import { route } from "@/utils/route";

export default function Profile({
    workspace,
    customer,
}: {
    workspace: any;
    customer: any;
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name || "",
        phone: customer.phone || "",
        document: customer.document || "",
        birth_date: customer.birth_date
            ? customer.birth_date.split("T")[0]
            : "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("portal.profile.update", workspace.slug), {
            onSuccess: () => toast.success("Perfil atualizado com sucesso!"),
            onError: () =>
                toast.error("Erro ao atualizar perfil. Verifique os dados."),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-center" richColors />
            <Head title={`Meu Perfil - ${workspace.name}`} />

            <header className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Link
                            href={route("portal.dashboard", workspace.slug)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-bold text-indigo-900">
                            Meu Perfil
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 py-8">
                <Card className="shadow-lg border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 h-24 relative">
                        <div className="absolute -bottom-12 left-8 border-4 border-white rounded-2xl bg-white p-1">
                            <div className="bg-indigo-100 w-24 h-24 rounded-xl flex items-center justify-center text-indigo-600">
                                <User className="w-12 h-12" />
                            </div>
                        </div>
                    </div>

                    <CardHeader className="pt-16 pb-6 px-8">
                        <CardTitle className="text-2xl font-extrabold">
                            {customer.name}
                        </CardTitle>
                        <CardDescription>
                            {workspace.name} - Cliente
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email (Não alterável)
                                    </Label>
                                    <Input
                                        id="email"
                                        value={customer.email}
                                        disabled
                                        className="bg-slate-50 cursor-not-allowed opacity-75"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        Entre em contato para alterar seu email.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        WhatsApp / Telefone
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData("phone", e.target.value)
                                        }
                                        placeholder="(11) 99999-9999"
                                        required
                                    />
                                    {errors.phone && (
                                        <p className="text-xs text-red-500">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="document">
                                        CPF (Opcional)
                                    </Label>
                                    <Input
                                        id="document"
                                        value={data.document}
                                        onChange={(e) =>
                                            setData("document", e.target.value)
                                        }
                                        placeholder="000.000.000-00"
                                    />
                                    {errors.document && (
                                        <p className="text-xs text-red-500">
                                            {errors.document}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">
                                        Data de Nascimento
                                    </Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={data.birth_date}
                                        onChange={(e) =>
                                            setData(
                                                "birth_date",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.birth_date && (
                                        <p className="text-xs text-red-500">
                                            {errors.birth_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8"
                                    disabled={processing}
                                >
                                    {processing
                                        ? "Salvando..."
                                        : "Salvar Alterações"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
