# Landing Page AgendaNexo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a landing page comercial estática do AgendaNexo em Blade + Tailwind, servida na rota `/` do domínio `agendanexo.com.br`, separada da aplicação em `app.agendanexo.com.br`.

**Architecture:** Blade puro com Tailwind v4 (via o pipeline CSS já existente em `resources/css/app.css`). Sem Inertia, sem React — a landing é um arquivo `landing.blade.php` com seções inline organizadas por comentários. A rota `/` deixa de redirecionar para `/dashboard` e passa a renderizar a landing. Usuários autenticados que acessem `/` são redirecionados por middleware de sessão no grupo `auth`, não pela rota pública.

**Tech Stack:** Laravel 11, Blade, Tailwind CSS v4 (já configurado no projeto), Vite (CSS compilado via `resources/css/app.css` e `resources/js/app.tsx` já referenciados em `app.blade.php`).

---

## File Map

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `resources/views/landing.blade.php` | HTML completo da landing (hero, seções, FAQ, footer) |
| Modificar | `routes/web.php` | Rota `/` passa de redirect para `view('landing')` |
| Criar | `public/robots.txt` | Já existe — verificar se tem conteúdo adequado |

Nenhum controller novo necessário — a rota usa closure simples.

---

## Task 1: Alterar a rota `/` para servir a landing

**Files:**
- Modify: `routes/web.php` — linha com `Route::get('/', ...)`

- [ ] **Step 1: Localizar a linha atual da rota raiz**

```bash
grep -n "Route::get('/', " routes/web.php
```

Resultado esperado: algo como `Route::get('/', function () { return redirect('/dashboard'); });`

- [ ] **Step 2: Substituir o redirect pela view da landing**

Em `routes/web.php`, substituir:

```php
Route::get('/', function () {
    return redirect('/dashboard');
});
```

por:

```php
Route::get('/', function () {
    return view('landing');
})->name('home');
```

A rota deve ficar **fora** dos grupos `middleware('guest')` e `middleware(['auth', 'subscribed'])` — ela já está, só muda o conteúdo do closure.

- [ ] **Step 3: Verificar que não há conflito de rotas**

```bash
php artisan route:list --path="/"
```

Resultado esperado: uma única rota GET `/` com name `home`.

- [ ] **Step 4: Commit**

```bash
git add routes/web.php
git commit -m "feat(landing): rota / serve landing page em vez de redirecionar para /dashboard"
```

---

## Task 2: Criar `resources/views/landing.blade.php`

**Files:**
- Create: `resources/views/landing.blade.php`

Este arquivo é a landing completa. Usa `@vite` para puxar o CSS compilado já existente (`resources/css/app.css`). Não usa `@inertia`, não usa `@extends` — é um documento HTML completo independente.

- [ ] **Step 1: Criar o arquivo com o documento base**

Criar `resources/views/landing.blade.php` com o conteúdo abaixo. O arquivo está dividido em seções marcadas com comentários HTML para facilitar manutenção:

```blade
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- SEO --}}
    <title>AgendaNexo — Agendamento, confirmação e cobrança para barbearias, estética e clínicas</title>
    <meta name="description" content="Seu cliente agenda pelo link. Confirma ou reage pelo WhatsApp. Você cobra no final — tudo no AgendaNexo. Para barbearias, lava-rápidos, estética, clínicas e oficinas.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://agendanexo.com.br/">

    {{-- Open Graph --}}
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://agendanexo.com.br/">
    <meta property="og:title" content="AgendaNexo — Agendamento, confirmação e cobrança num só lugar">
    <meta property="og:description" content="Para negócios que vivem de horário. Barbearias, lava-rápidos, estética, clínicas e oficinas.">
    <meta property="og:site_name" content="AgendaNexo">

    {{-- CSS via Vite (mesmo pipeline do app) --}}
    @vite(['resources/css/app.css'])
</head>
<body class="bg-white text-gray-900 antialiased">

{{-- ============================================================
     HEADER FIXO
     ============================================================ --}}
<header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <a href="/" class="text-xl font-bold text-gray-900 tracking-tight">AgendaNexo</a>

        {{-- Nav desktop --}}
        <nav class="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#como-funciona" class="hover:text-gray-900 transition-colors">Como funciona</a>
            <a href="#para-quem" class="hover:text-gray-900 transition-colors">Para quem</a>
            <a href="#planos" class="hover:text-gray-900 transition-colors">Planos</a>
            <a href="#faq" class="hover:text-gray-900 transition-colors">Dúvidas</a>
        </nav>

        <div class="flex items-center gap-3">
            <a href="https://app.agendanexo.com.br/login"
               class="hidden sm:inline-flex text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Entrar
            </a>
            <a href="https://app.agendanexo.com.br/register"
               class="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
                Começar grátis
            </a>
        </div>
    </div>
</header>

{{-- ============================================================
     HERO
     ============================================================ --}}
<section class="pt-20 pb-24 px-4 sm:px-6">
    <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            Agendamento, confirmação e cobrança num só lugar — para negócios que vivem de horário.
        </h1>
        <p class="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Seu cliente agenda pelo link. Confirma ou reage pelo WhatsApp. Você cobra no final — tudo no AgendaNexo.
        </p>
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://app.agendanexo.com.br/register"
               class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors">
                Começar 14 dias grátis
            </a>
            <a href="#como-funciona"
               class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 text-base font-medium hover:bg-gray-50 transition-colors">
                Ver como funciona
            </a>
        </div>
        <p class="mt-4 text-sm text-gray-400">Sem cartão de crédito no início.</p>
    </div>
</section>

{{-- ============================================================
     BARRA DE CONTEXTO (escopo do produto)
     ============================================================ --}}
<section class="bg-gray-50 border-y border-gray-100 py-5 px-4">
    <p class="text-center text-sm text-gray-500 max-w-2xl mx-auto">
        Para barbearias, lava-rápidos, estética automotiva, clínicas e oficinas —
        negócios onde cada horário vazio custa dinheiro real.
    </p>
</section>

{{-- ============================================================
     O PROBLEMA
     ============================================================ --}}
<section class="py-20 px-4 sm:px-6">
    <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            O que acontece quando a operação é no improviso
        </h2>
        <p class="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Três problemas que custam horário, dinheiro e cliente — todo dia.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">No-show sem consequência</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O cliente falta, o horário vai embora e não há política. Na semana seguinte, acontece de novo.
                </p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Cobrança que fica para depois</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O atendimento termina, o cliente sai sem pagar, e o controle some. O dinheiro fica na memória.
                </p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Cliente sumindo sem aviso</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    Quem não volta em 60 ou 90 dias fica invisível. Você não sabe quem está saindo da base — até que a receita cai.
                </p>
            </div>
        </div>
    </div>
</section>

{{-- ============================================================
     COMO FUNCIONA
     ============================================================ --}}
<section id="como-funciona" class="py-20 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
    <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            Do agendamento ao pagamento — sem etapa perdida
        </h2>
        <p class="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            Quatro passos que fecham o ciclo completo de cada atendimento.
        </p>
        <div class="space-y-10">
            <div class="flex flex-col sm:flex-row gap-6 items-start">
                <div class="shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">1</div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Cliente agenda pelo link</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">
                        Cada negócio tem um link público de agendamento. O cliente escolhe serviço, profissional e horário disponível — sem precisar de senha ou app instalado. As regras de conflito, buffer entre atendimentos e feriados são respeitadas automaticamente.
                    </p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-6 items-start">
                <div class="shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Confirmação pelo WhatsApp</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">
                        Quando a integração com WhatsApp está ativa, o sistema notifica o cliente antes do horário e permite que ele confirme ou solicite reagendamento pela conversa. Sem a integração configurada, o agendamento funciona normalmente — a confirmação pelo WhatsApp é um recurso adicional.
                    </p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-6 items-start">
                <div class="shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Agenda multi-profissional em tempo real</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">
                        Sua equipe opera em visão diária, semanal ou mensal. Cada profissional tem seus horários, serviços e intervalos configurados. Você vê a agenda geral ou filtra por profissional — numa única tela.
                    </p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-6 items-start">
                <div class="shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Cobrança no encerramento</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">
                        Quando o atendimento termina, o sistema abre o checkout diretamente no agendamento. Pagamento total, parcial, link de cobrança via WhatsApp ou presencial — registrado e vinculado ao cliente ali mesmo.
                    </p>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- ============================================================
     PILARES DO PRODUTO
     ============================================================ --}}
<section class="py-20 px-4 sm:px-6">
    <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            O que o AgendaNexo entrega
        </h2>
        <p class="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            Cinco pilares que cobrem o ciclo completo da sua operação.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Confirmação pelo WhatsApp</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    Com a integração ativa, o sistema notifica o cliente antes do horário e permite confirmar ou reagendar pela conversa. Reduz no-show sem você precisar ligar para ninguém.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Cobrança no encerramento</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O checkout está dentro do agendamento. Ao finalizar, você registra o pagamento na mesma tela — inteiro, parcial, via link ou presencial. O histórico vai direto para o financeiro.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Link de agendamento sem senha</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O cliente agenda sem criar conta. O link é seu, permanente, e pode ser colocado no Instagram, no WhatsApp ou no cartão de visitas. A disponibilidade é calculada em tempo real com base na agenda real da equipe.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Clientes em risco — retenção que não depende de memória</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O CRM identifica quem não volta há mais de 30, 60 ou 90 dias. O painel mostra o número em risco com acesso direto à lista. Você age antes de perder o cliente.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Agenda com as regras reais do negócio</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    Buffers entre atendimentos, feriados, horários de almoço por profissional, bloqueios de data — tudo configurável. O sistema impede conflito de horário sem controle manual.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Portal do cliente sem app</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O cliente acessa seu histórico, faturas e agendamentos ativos por link — sem instalar nada. O login é por código enviado por WhatsApp ou e-mail.
                </p>
            </div>
        </div>
    </div>
</section>

{{-- ============================================================
     PARA QUEM É
     ============================================================ --}}
<section id="para-quem" class="py-20 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
    <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            Para quem é o AgendaNexo
        </h2>
        <p class="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Feito para negócios que vendem horário e precisam que cada horário seja aproveitado.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Barbearias</p>
                <p class="text-sm text-gray-500">Controle de equipe, agendamento por profissional e cobrança no encerramento de cada corte.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Lava-rápidos e estética automotiva</p>
                <p class="text-sm text-gray-500">Múltiplos serviços com duração diferente, controle de fila e agenda sem conflito de horário.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Estética</p>
                <p class="text-sm text-gray-500">Sobrancelha, lash, micropigmentação — cada horário representa uma receita fixa. Zero improviso.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Clínicas de pequeno e médio porte</p>
                <p class="text-sm text-gray-500">Atendimento por profissional especializado, com agenda separada e cobrança vinculada ao prontuário.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Oficinas leves</p>
                <p class="text-sm text-gray-500">Agendamento de serviço com controle de entrada, duração estimada e histórico do veículo.</p>
            </div>
            <div class="flex items-center bg-gray-900 rounded-xl p-5">
                <p class="text-white text-sm leading-relaxed">
                    Se o seu negócio perde dinheiro quando um horário fica vazio, o AgendaNexo é para você.
                </p>
            </div>
        </div>
    </div>
</section>

{{-- ============================================================
     CRM / CLIENTES EM RISCO
     ============================================================ --}}
<section class="py-20 px-4 sm:px-6">
    <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Quem está sumindo da sua base?
        </h2>
        <p class="text-gray-500 mb-8 leading-relaxed">
            Todo negócio tem clientes que param de aparecer sem avisar. A maioria dos donos descobre quando já perdeu o cliente — ou não descobre nunca.
        </p>
        <p class="text-gray-700 mb-8 leading-relaxed">
            O AgendaNexo identifica automaticamente os clientes que estão fora do padrão habitual de retorno. O painel mostra a contagem em tempo real e abre direto na lista filtrada. Você vê quem é, quando veio pela última vez, e age — por ligação, WhatsApp ou promoção direcionada.
        </p>
        <p class="text-sm text-gray-400 italic">
            Retenção de cliente não depende de memória. Depende de dado.
        </p>
    </div>
</section>

{{-- ============================================================
     CREDIBILIDADE (sem depoimentos fabricados)
     ============================================================ --}}
<section class="py-14 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
    <div class="max-w-3xl mx-auto text-center space-y-3">
        <p class="text-sm font-medium text-gray-700">Feito para o mercado brasileiro</p>
        <p class="text-sm text-gray-500">Suporte em português. Pensado para negócios que trabalham com horário marcado.</p>
        {{-- Espaço preparado para depoimentos reais futuros --}}
        {{-- <blockquote class="mt-10 border-l-4 border-gray-200 pl-4 text-left text-gray-600 italic">"..."</blockquote> --}}
    </div>
</section>

{{-- ============================================================
     PLANOS (âncora)
     ============================================================ --}}
<section id="planos" class="py-20 px-4 sm:px-6">
    <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Comece sem compromisso
        </h2>
        <p class="text-gray-500 mb-10 leading-relaxed">
            14 dias grátis, sem cartão de crédito. Depois, escolha o plano que cabe na sua operação.
        </p>
        <a href="https://app.agendanexo.com.br/register"
           class="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors">
            Começar grátis
        </a>
        <p class="mt-4 text-sm text-gray-400">Cancela quando quiser.</p>
    </div>
</section>

{{-- ============================================================
     FAQ
     ============================================================ --}}
<section id="faq" class="py-20 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
    <div class="max-w-2xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            Dúvidas frequentes
        </h2>
        <div class="space-y-8">
            <div>
                <h3 class="font-semibold text-gray-900 mb-2">O cliente precisa baixar um aplicativo para agendar?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Não. O agendamento é feito por link no navegador, sem login e sem app instalado. Funciona no celular de qualquer cliente.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">A confirmação pelo WhatsApp funciona automaticamente?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Quando a integração com WhatsApp está ativa e configurada, sim. A integração precisa ser conectada nas configurações do sistema. Sem ela, o agendamento e os lembretes funcionam normalmente — a confirmação pelo WhatsApp é um recurso adicional que depende dessa conexão.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Consigo usar o sistema com mais de um profissional?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Sim. O AgendaNexo suporta múltiplos profissionais com agendas, horários e serviços independentes. Você visualiza a agenda geral ou filtra por profissional.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Como funciona a cobrança no encerramento do atendimento?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Quando você finaliza um atendimento na agenda, o sistema abre um checkout vinculado ao agendamento. Você registra o pagamento — total, parcial ou via link enviado ao cliente — e o registro vai automaticamente para o módulo financeiro.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">O que acontece quando um cliente falta sem avisar?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">O sistema permite registrar o no-show e aplicar uma taxa configurável. Isso cria um registro no histórico do cliente e serve como base para política de reagendamento.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Consigo bloquear datas e feriados?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Sim. Você pode cadastrar feriados nacionais e locais, além de bloqueios de datas específicas por profissional ou para o negócio inteiro.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Como o sistema identifica clientes em risco?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">O CRM monitora o intervalo entre visitas de cada cliente. Quando alguém ultrapassa o padrão habitual de retorno — 30, 60 ou 90 dias sem agendar — aparece na lista de clientes em risco no painel.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Preciso de técnico para configurar?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Não. O onboarding guia você pelo cadastro de serviços, profissionais, horários e configurações iniciais. A maioria dos negócios entra em operação no mesmo dia.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">O sistema funciona para atendimento sem hora marcada?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">O AgendaNexo é voltado para operações que funcionam por agendamento. Se parte do atendimento é por ordem de chegada, o sistema pode coexistir — mas o módulo de agenda pressupõe horário marcado.</p>
            </div>
        </div>
    </div>
</section>

{{-- ============================================================
     CTA FINAL
     ============================================================ --}}
<section class="py-24 px-4 sm:px-6">
    <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Seu negócio vive de horário. Seu sistema deveria acompanhar isso.
        </h2>
        <p class="text-gray-500 mb-10 leading-relaxed">
            O AgendaNexo fecha o ciclo — do agendamento à cobrança — para que você não perca horário, cliente ou receita por falta de controle.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://app.agendanexo.com.br/register"
               class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors">
                Começar 14 dias grátis
            </a>
            <a href="https://wa.me/5511999999999"
               class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-lg border border-gray-300 text-gray-700 text-base font-medium hover:bg-gray-50 transition-colors">
                Falar com a equipe
            </a>
        </div>
        <p class="mt-4 text-sm text-gray-400">Sem cartão de crédito no início. Cancela quando quiser. Suporte em português.</p>
    </div>
</section>

{{-- ============================================================
     FOOTER
     ============================================================ --}}
<footer class="border-t border-gray-100 py-12 px-4 sm:px-6 bg-white">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
            <p class="text-lg font-bold text-gray-900">AgendaNexo</p>
            <p class="text-sm text-gray-400 mt-1">Agendamento, confirmação e cobrança num só lugar.</p>
            <p class="text-xs text-gray-300 mt-1">App: app.agendanexo.com.br</p>
        </div>
        <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            <a href="#planos" class="hover:text-gray-900 transition-colors">Planos</a>
            <a href="#faq" class="hover:text-gray-900 transition-colors">Dúvidas</a>
            <a href="/politica-de-privacidade" class="hover:text-gray-900 transition-colors">Privacidade</a>
            <a href="/termos-de-uso" class="hover:text-gray-900 transition-colors">Termos</a>
            <a href="mailto:contato@agendanexo.com.br" class="hover:text-gray-900 transition-colors">Contato</a>
        </nav>
    </div>
    <div class="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-50">
        <p class="text-xs text-gray-300">&copy; {{ date('Y') }} AgendaNexo. Todos os direitos reservados.</p>
    </div>
</footer>

</body>
</html>
```

- [ ] **Step 2: Verificar que o arquivo foi criado**

```bash
ls resources/views/landing.blade.php
```

- [ ] **Step 3: Commit**

```bash
git add resources/views/landing.blade.php
git commit -m "feat(landing): criar landing page comercial AgendaNexo em Blade + Tailwind"
```

---

## Task 3: Verificar compilação do CSS e testar localmente

**Files:**
- Read: `vite.config.js` (já lido — sem alteração necessária)
- Read: `resources/css/app.css` (já lido — sem alteração necessária)

O CSS da landing usa o mesmo pipeline Vite que o app (`resources/css/app.css` + `@tailwindcss/vite`). O Vite detecta classes Tailwind via `@source` directives que incluem `../**/*.blade.php`, então as classes novas da landing serão compiladas automaticamente.

- [ ] **Step 1: Iniciar Vite em modo dev**

```bash
npm run dev
```

- [ ] **Step 2: Em outro terminal, iniciar o servidor Laravel**

```bash
php artisan serve
```

- [ ] **Step 3: Acessar a landing no browser**

Abrir: `http://localhost:8000/`

Verificar:
- Hero com headline e dois CTAs renderizados
- Header sticky visível
- Seções de problema, como funciona, pilares, para quem, CRM, credibilidade, planos, FAQ e CTA final
- Footer com copyright dinâmico

- [ ] **Step 4: Testar responsividade no mobile**

No DevTools do browser (F12), ativar modo responsivo e testar nas larguras:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (tablet)

Verificar que:
- Headline não trunca no iPhone SE
- Os 4 passos de "como funciona" empilham verticalmente
- Os botões CTA ficam em coluna no mobile
- O menu hamburguer some (nav desktop oculta em mobile, sem menu móvel por ora)

- [ ] **Step 5: Verificar âncoras de navegação**

Clicar em cada item do header: "Como funciona", "Para quem", "Planos", "Dúvidas".
Esperado: scroll suave até a seção correspondente (navegação nativa por `id`).

- [ ] **Step 6: Commit de ajustes visuais (se houver)**

Se houver ajustes de classes Tailwind após testes visuais:

```bash
git add resources/views/landing.blade.php
git commit -m "fix(landing): ajustes visuais após teste responsivo"
```

---

## Task 4: Atualizar `robots.txt` e verificar SEO básico

**Files:**
- Modify: `public/robots.txt`

- [ ] **Step 1: Verificar conteúdo atual do robots.txt**

```bash
cat public/robots.txt
```

- [ ] **Step 2: Atualizar para permitir indexação da landing e bloquear rotas internas do app**

Substituir conteúdo de `public/robots.txt` por:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /agenda
Disallow: /admin
Disallow: /configuracoes
Disallow: /financeiro
Disallow: /clientes
Disallow: /crm
Disallow: /usuarios
Disallow: /pacotes
Disallow: /lista-espera

Sitemap: https://agendanexo.com.br/sitemap.xml
```

- [ ] **Step 3: Verificar meta tags da landing no browser**

Abrir `http://localhost:8000/` e inspecionar `<head>`:
- `<title>` presente e descritivo
- `<meta name="description">` com o subheadline
- `<meta property="og:title">` e `og:description` presentes
- `<link rel="canonical">` apontando para `https://agendanexo.com.br/`

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt
git commit -m "feat(landing): atualizar robots.txt para indexação da landing e proteção das rotas do app"
```

---

## Decisões de implementação documentadas

1. **Blade puro, sem Inertia/React.** A landing não tem estado interativo. Blade com Tailwind entrega HTML estático com performance máxima de carregamento e SEO nativo — sem JavaScript desnecessário.

2. **Mesmo pipeline Vite/CSS do app.** O `@vite(['resources/css/app.css'])` na landing reutiliza a compilação existente. Sem duplicação de configuração. O Tailwind detecta as classes via `@source '../**/*.blade.php'`.

3. **Rota `/` com closure simples, sem controller.** Uma landing estática não justifica um controller dedicado. Se no futuro precisar de dados dinâmicos (ex.: contagem de clientes), criar `LandingController` nesse momento.

4. **Menu mobile não implementado.** A nav desktop está oculta em mobile com `hidden md:flex`. Por simplicidade e velocidade de entrega, não há menu hamburguer nesta versão. Os CTAs principais (Entrar, Começar grátis) ficam visíveis em mobile no header.

5. **WhatsApp do "Falar com a equipe" usa placeholder.** O número `5511999999999` no link `wa.me` precisa ser substituído pelo número real de suporte antes do go-live.

6. **Separação agendanexo.com.br / app.agendanexo.com.br** é feita nos links da landing (todos os CTAs de conversão apontam para `https://app.agendanexo.com.br/register` ou `/login`). A configuração de DNS/subdomínio é feita no servidor (Nginx/Caddy), não no Laravel.

---

## Como testar localmente

```bash
# Terminal 1
cd d:/saas/agenda-pro
npm run dev

# Terminal 2
cd d:/saas/agenda-pro
php artisan serve

# Browser
# Landing:  http://localhost:8000/
# App:      http://localhost:8000/login  (inalterado)
# Dashboard: http://localhost:8000/dashboard  (inalterado, requer auth)
```
