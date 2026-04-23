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

    <style>
        html { scroll-behavior: smooth; }
    </style>
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
            <a href="{{ url('/login') }}"
               class="hidden sm:inline-flex text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Entrar
            </a>
            <a href="{{ url('/register') }}"
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
            Agendamento, confirmação e cobrança num só lugar&nbsp;&mdash; para negócios que vivem de horário.
        </h1>
        <p class="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Seu cliente agenda pelo link. Confirma ou reage pelo WhatsApp. Você cobra no final &mdash; tudo no AgendaNexo.
        </p>
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="{{ url('/register') }}"
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
        Para barbearias, lava-rápidos, estética automotiva, clínicas e oficinas &mdash;
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
            Três problemas que custam horário, dinheiro e cliente &mdash; todo dia.
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
                    Quem não volta em 60 ou 90 dias fica invisível. Você não sabe quem está saindo da base &mdash; até que a receita cai.
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
            Do agendamento ao pagamento &mdash; sem etapa perdida
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
                        Cada negócio tem um link público de agendamento. O cliente escolhe serviço, profissional e horário disponível &mdash; sem precisar de senha ou app instalado. As regras de conflito, buffer entre atendimentos e feriados são respeitadas automaticamente.
                    </p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-6 items-start">
                <div class="shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Confirmação pelo WhatsApp</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">
                        Quando a integração com WhatsApp está ativa, o sistema notifica o cliente antes do horário e permite que ele confirme ou solicite reagendamento pela conversa. Sem a integração configurada, o agendamento funciona normalmente &mdash; a confirmação pelo WhatsApp é um recurso adicional.
                    </p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-6 items-start">
                <div class="shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Agenda multi-profissional em tempo real</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">
                        Sua equipe opera em visão diária, semanal ou mensal. Cada profissional tem seus horários, serviços e intervalos configurados. Você vê a agenda geral ou filtra por profissional &mdash; numa única tela.
                    </p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-6 items-start">
                <div class="shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Cobrança no encerramento</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">
                        Quando o atendimento termina, o sistema abre o checkout diretamente no agendamento. Pagamento total, parcial, link de cobrança via WhatsApp ou presencial &mdash; registrado e vinculado ao cliente ali mesmo.
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
            Seis pilares que cobrem o ciclo completo da sua operação.
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
                    O checkout está dentro do agendamento. Ao finalizar, você registra o pagamento na mesma tela &mdash; inteiro, parcial, via link ou presencial. O histórico vai direto para o financeiro.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Link de agendamento sem senha</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O cliente agenda sem criar conta. O link é seu, permanente, e pode ser colocado no Instagram, no WhatsApp ou no cartão de visitas. A disponibilidade é calculada em tempo real com base na agenda real da equipe.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Clientes em risco</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O CRM identifica quem não volta há mais de 30, 60 ou 90 dias. O painel mostra a contagem em risco com acesso direto à lista. Você age antes de perder o cliente.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Agenda com as regras reais do negócio</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    Buffers entre atendimentos, feriados, horários de almoço por profissional, bloqueios de data &mdash; tudo configurável. O sistema impede conflito de horário sem controle manual.
                </p>
            </div>
            <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-2">Portal do cliente sem app</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                    O cliente acessa histórico, faturas e agendamentos ativos por link &mdash; sem instalar nada. O login é por código enviado por WhatsApp ou e-mail.
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
                <p class="text-sm text-gray-500">Controle de equipe, agendamento por profissional e cobrança no encerramento de cada atendimento.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Lava-rápidos e estética automotiva</p>
                <p class="text-sm text-gray-500">Múltiplos serviços com duração diferente, controle de agenda e sem conflito de horário.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Estética</p>
                <p class="text-sm text-gray-500">Sobrancelha, lash, micropigmentação &mdash; cada horário representa uma receita fixa. Zero improviso.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Clínicas de pequeno e médio porte</p>
                <p class="text-sm text-gray-500">Atendimento por profissional especializado, com agenda separada e cobrança vinculada ao histórico.</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p class="font-semibold text-gray-900 mb-1">Oficinas leves</p>
                <p class="text-sm text-gray-500">Agendamento de serviço com controle de entrada, duração estimada e histórico por veículo.</p>
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
            Todo negócio tem clientes que param de aparecer sem avisar. A maioria dos donos descobre quando já perdeu o cliente &mdash; ou não descobre nunca.
        </p>
        <p class="text-gray-700 mb-8 leading-relaxed">
            O AgendaNexo identifica automaticamente os clientes que estão fora do padrão habitual de retorno. O painel mostra a contagem em tempo real e abre direto na lista filtrada. Você vê quem é, quando veio pela última vez, e age &mdash; por ligação, WhatsApp ou promoção direcionada.
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
        {{-- Espaço preparado para depoimentos reais futuros:
        <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <blockquote class="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                <p class="text-gray-600 text-sm italic leading-relaxed">"..."</p>
                <footer class="mt-3 text-xs text-gray-400">— Nome, Estabelecimento, Cidade</footer>
            </blockquote>
        </div>
        --}}
    </div>
</section>

{{-- ============================================================
     PLANOS
     ============================================================ --}}
<section id="planos" class="py-20 px-4 sm:px-6">
    <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Comece sem compromisso
        </h2>
        <p class="text-gray-500 mb-10 leading-relaxed">
            14 dias grátis, sem cartão de crédito. Depois, escolha o plano que cabe na sua operação.
        </p>
        <a href="{{ url('/register') }}"
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
                <p class="text-gray-500 text-sm leading-relaxed">Quando a integração com WhatsApp está ativa e configurada, sim. A integração precisa ser conectada nas configurações do sistema. Sem ela, o agendamento funciona normalmente &mdash; a confirmação pelo WhatsApp é um recurso adicional que depende dessa conexão.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Consigo usar o sistema com mais de um profissional?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Sim. O AgendaNexo suporta múltiplos profissionais com agendas, horários e serviços independentes. Você visualiza a agenda geral ou filtra por profissional.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Como funciona a cobrança no encerramento do atendimento?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Quando você finaliza um atendimento na agenda, o sistema abre um checkout vinculado ao agendamento. Você registra o pagamento &mdash; total, parcial ou via link enviado ao cliente &mdash; e o registro vai automaticamente para o módulo financeiro.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">O que acontece quando um cliente falta sem avisar?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">O sistema permite registrar o no-show e aplicar uma taxa configurável. Isso cria um registro no histórico do cliente e serve como base para a política de reagendamento.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Consigo bloquear datas e feriados?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Sim. Você pode cadastrar feriados nacionais e locais, além de bloqueios de datas específicas por profissional ou para o negócio inteiro.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Como o sistema identifica clientes em risco?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">O CRM monitora o intervalo entre visitas de cada cliente. Quando alguém ultrapassa o padrão habitual de retorno &mdash; 30, 60 ou 90 dias sem agendar &mdash; aparece na lista de clientes em risco no painel.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">Preciso de técnico para configurar?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">Não. O onboarding guia você pelo cadastro de serviços, profissionais, horários e configurações iniciais. A maioria dos negócios entra em operação no mesmo dia.</p>
            </div>
            <div class="border-t border-gray-100 pt-8">
                <h3 class="font-semibold text-gray-900 mb-2">O sistema funciona para atendimento sem hora marcada?</h3>
                <p class="text-gray-500 text-sm leading-relaxed">O AgendaNexo é voltado para operações que funcionam por agendamento. Se parte do atendimento é por ordem de chegada, o sistema pode coexistir &mdash; mas o módulo de agenda pressupõe horário marcado.</p>
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
            O AgendaNexo fecha o ciclo &mdash; do agendamento à cobrança &mdash; para que você não perca horário, cliente ou receita por falta de controle.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="{{ url('/register') }}"
               class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gray-900 text-white text-base font-medium hover:bg-gray-700 transition-colors">
                Começar 14 dias grátis
            </a>
            <a href="mailto:contato@agendanexo.com.br"
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
