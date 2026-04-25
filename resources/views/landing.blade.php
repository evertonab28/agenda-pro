<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- SEO --}}
    <title>AgendaNexo — Agendamento, confirmação e cobrança para barbearias, estética e clínicas</title>
    <meta name="description" content="Seu cliente agenda pelo link. Confirma pelo WhatsApp. Você cobra no final — tudo no AgendaNexo. Para barbearias, lava-rápidos, estética, clínicas e oficinas.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://agendanexo.com.br/">

    {{-- Open Graph --}}
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://agendanexo.com.br/">
    <meta property="og:title" content="AgendaNexo — Agendamento, confirmação e cobrança num só lugar">
    <meta property="og:description" content="Para negócios que vivem de horário. Barbearias, lava-rápidos, estética, clínicas e oficinas.">
    <meta property="og:site_name" content="AgendaNexo">

    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet">

    {{-- CSS via Vite --}}
    @vite(['resources/css/app.css'])

    <style>
        html { scroll-behavior: smooth; }
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-white text-ink antialiased">

{{-- ============================================================
     HEADER
     ============================================================ --}}
<header id="site-header" class="sticky top-0 z-50 transition-all duration-300 border-b border-transparent">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        <a href="/" class="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="#1F4E79"/>
                <path d="M8 14h4l2-5 2 10 2-5h2" stroke="#D9EAF7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="font-display font-bold text-[17px] tracking-tight text-ink">
                Agenda<span class="text-brand">Nexo</span>
            </span>
        </a>

        <nav class="hidden md:flex items-center gap-8">
            <a href="#como-funciona" class="text-sm font-medium text-ink-muted hover:text-brand transition-colors">Como funciona</a>
            <a href="#para-quem"      class="text-sm font-medium text-ink-muted hover:text-brand transition-colors">Para quem</a>
            <a href="#planos"         class="text-sm font-medium text-ink-muted hover:text-brand transition-colors">Planos</a>
            <a href="#faq"            class="text-sm font-medium text-ink-muted hover:text-brand transition-colors">Dúvidas</a>
        </nav>

        <div class="flex items-center gap-3">
            <a href="{{ config('app.saas_url') }}/login" class="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink transition-colors">Entrar</a>
            <a href="{{ config('app.saas_url') }}/register" class="landing-btn-primary text-sm px-4 py-2">Começar grátis</a>
        </div>
    </div>
</header>

{{-- ============================================================
     HERO
     ============================================================ --}}
<section class="relative overflow-hidden px-4 sm:px-6 pt-20 pb-20"
         style="background: linear-gradient(155deg, #EAF4FB 0%, #D9EAF7 45%, #C5DFEF 100%);">

    {{-- Decorative circles --}}
    <div class="pointer-events-none absolute -top-20 -right-20 w-96 h-96 rounded-full"
         style="background: rgba(31,78,121,.06);"></div>
    <div class="pointer-events-none absolute -bottom-16 -left-16 w-60 h-60 rounded-full"
         style="background: rgba(31,78,121,.04);"></div>

    <div class="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {{-- Copy --}}
        <div>
            <div class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 text-xs font-semibold tracking-wide uppercase"
                 style="background: rgba(31,78,121,.08); color: #1F4E79;">
                <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                14 dias grátis · Sem cartão
            </div>

            <h1 class="font-display font-extrabold text-ink mb-6 leading-[1.1]"
                style="font-size: clamp(32px, 4.5vw, 56px); letter-spacing: -0.04em; text-wrap: pretty;">
                Agendamento, confirmação e cobrança
                <span class="text-brand"> num só lugar.</span>
            </h1>

            <p class="text-lg text-ink-muted leading-relaxed max-w-lg mb-10">
                Seu cliente agenda pelo link. Confirma pelo WhatsApp. Você cobra no final — sem planilha, sem improviso.
            </p>

            <div class="flex flex-col sm:flex-row gap-3">
                <a href="{{ config('app.saas_url') }}/register"
                   class="landing-btn-primary px-7 py-3.5 text-base"
                   style="box-shadow: 0 4px 20px rgba(31,78,121,.25);">
                    Começar 14 dias grátis
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
                <a href="#como-funciona" class="landing-btn-outline px-6 py-3.5 text-base">
                    Ver como funciona
                </a>
            </div>
            <p class="mt-4 text-sm text-ink-subtle">Sem cartão de crédito no início. Cancela quando quiser.</p>
        </div>

        {{-- Dashboard mockup --}}
        <div class="hidden lg:block">
            <div class="rounded-2xl border border-brand-border p-6"
                 style="background: rgba(255,255,255,.82); backdrop-filter: blur(8px); box-shadow: 0 24px 80px rgba(31,78,121,.18);">

                {{-- Header --}}
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <p class="text-xs font-medium text-ink-subtle mb-0.5">Hoje, Quarta-feira</p>
                        <p class="font-display font-bold text-lg text-ink">Agenda do dia</p>
                    </div>
                    <span class="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style="background:#1F4E79;">4 agendados</span>
                </div>

                {{-- KPI mini cards --}}
                <div class="grid grid-cols-2 gap-3 mb-5">
                    <div class="bg-brand-faint border border-brand-light rounded-xl p-3">
                        <p class="text-[11px] font-medium text-ink-subtle mb-1">Receita hoje</p>
                        <p class="font-display font-bold text-base text-ink">R$ 340</p>
                    </div>
                    <div class="bg-brand-faint border border-brand-light rounded-xl p-3">
                        <p class="text-[11px] font-medium text-ink-subtle mb-1">Em risco</p>
                        <p class="font-display font-bold text-base text-ink">3 clientes</p>
                    </div>
                </div>

                {{-- Appointments --}}
                @php
                $appts = [
                    ['name'=>'Carlos M.', 'time'=>'09:00', 'service'=>'Corte + Barba',        'color'=>'#22c55e'],
                    ['name'=>'Rafael S.', 'time'=>'10:30', 'service'=>'Corte',                'color'=>'#3b82f6'],
                    ['name'=>'João P.',   'time'=>'11:00', 'service'=>'Barba',                'color'=>'#f59e0b'],
                    ['name'=>'Thiago A.','time'=>'14:00', 'service'=>'Corte + Hidratação',   'color'=>'#8b5cf6'],
                ];
                @endphp

                <div class="space-y-2">
                    @foreach($appts as $a)
                    <div class="bg-white border border-[#E5ECF3] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                        <div class="w-1 h-9 rounded-full shrink-0" style="background:{{ $a['color'] }};"></div>
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-[13px] text-ink truncate">{{ $a['name'] }}</p>
                            <p class="text-[12px] text-ink-subtle truncate">{{ $a['service'] }}</p>
                        </div>
                        <span class="font-display font-bold text-[13px] text-ink-muted shrink-0">{{ $a['time'] }}</span>
                        <span class="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style="background:#22c55e22;">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </span>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>

    </div>
</section>

{{-- ============================================================
     CONTEXT BAR
     ============================================================ --}}
<div class="bg-brand py-4 px-4">
    <div class="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
        <span class="text-[11px] font-bold tracking-widest uppercase text-white/40 mr-3">Feito para</span>
        @foreach(['Barbearias','Lava-rápidos','Estética','Clínicas','Oficinas'] as $i => $seg)
            <span class="text-[13px] font-semibold text-white/80 px-3">{{ $seg }}</span>
            @if(!$loop->last)<span class="text-white/25 text-lg">·</span>@endif
        @endforeach
    </div>
</div>

{{-- ============================================================
     PROBLEMA
     ============================================================ --}}
<section class="py-24 px-4 sm:px-6 bg-white">
    <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
            <span class="landing-section-label">O problema</span>
            <h2 class="landing-h2">O que acontece quando a operação<br class="hidden sm:block"> é no improviso</h2>
            <p class="mt-4 text-ink-muted text-base max-w-md mx-auto">Três problemas que custam horário, dinheiro e cliente — todo dia.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @foreach([
                ['⛔','No-show sem consequência',       'O cliente falta, o horário vai embora e não há política. Na semana seguinte, acontece de novo.'],
                ['💸','Cobrança que fica para depois',  'O atendimento termina, o cliente sai sem pagar, e o controle some. O dinheiro fica na memória.'],
                ['👻','Cliente sumindo sem aviso',       'Quem não volta em 60 ou 90 dias fica invisível. Você não sabe quem está saindo da base — até que a receita cai.'],
            ] as [$icon,$title,$desc])
            <div class="bg-brand-faint border border-brand-light rounded-2xl p-8">
                <div class="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-2xl mb-5">{{ $icon }}</div>
                <h3 class="font-display font-bold text-ink text-base mb-3">{{ $title }}</h3>
                <p class="text-sm text-ink-muted leading-relaxed">{{ $desc }}</p>
            </div>
            @endforeach
        </div>
    </div>
</section>

{{-- ============================================================
     COMO FUNCIONA
     ============================================================ --}}
<section id="como-funciona" class="py-24 px-4 sm:px-6 bg-brand-faint border-y border-brand-light">
    <div class="max-w-6xl mx-auto">
        <div class="text-center mb-18">
            <span class="landing-section-label" style="background:var(--color-brand-light);">Como funciona</span>
            <h2 class="landing-h2">Do agendamento ao pagamento<br class="hidden sm:block"> sem etapa perdida</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-brand-border rounded-2xl overflow-hidden mt-16">
            @foreach([
                ['01','Cliente agenda pelo link',                  'Cada negócio tem um link público permanente. O cliente escolhe serviço, profissional e horário — sem senha, sem app. Conflitos, buffers e feriados são respeitados automaticamente.'],
                ['02','Confirmação pelo WhatsApp',                 'Com a integração ativa, o sistema notifica o cliente antes do horário e permite confirmar ou reagendar pela conversa. Reduz no-show sem você ligar para ninguém.'],
                ['03','Agenda multi-profissional em tempo real',   'Visão diária, semanal ou mensal. Cada profissional com seus horários e serviços. Você vê a agenda geral ou filtra por profissional — numa única tela.'],
                ['04','Cobrança no encerramento',                  'O checkout está dentro do agendamento. Ao finalizar, registre o pagamento — inteiro, parcial, via link ou presencial. Histórico vinculado ao cliente.'],
            ] as [$n,$title,$desc])
            <div class="bg-white p-8">
                <p class="font-display font-extrabold text-5xl text-brand-light mb-4 leading-none" style="letter-spacing:-3px;">{{ $n }}</p>
                <h3 class="font-display font-bold text-brand text-[15px] mb-3">{{ $title }}</h3>
                <p class="text-sm text-ink-muted leading-relaxed">{{ $desc }}</p>
            </div>
            @endforeach
        </div>
    </div>
</section>

{{-- ============================================================
     PILARES
     ============================================================ --}}
<section class="py-24 px-4 sm:px-6 bg-white">
    <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
            <span class="landing-section-label">Recursos</span>
            <h2 class="landing-h2">O que o AgendaNexo entrega</h2>
            <p class="mt-4 text-ink-muted text-base max-w-sm mx-auto">Seis pilares que cobrem o ciclo completo da sua operação.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @foreach([
                ['M3 8c.5 1 1.5 2 2.5 2.5M10 3c0 0-1 6-7 7M3 13c3.3 0 7-3.58 7-8',
                 'Confirmação pelo WhatsApp',
                 'Com a integração ativa, notifica e permite confirmar ou reagendar pela conversa. Reduz no-show sem você ligar para ninguém.'],
                ['M2 5h16v12H2zM2 9h16M6 13h1',
                 'Cobrança no encerramento',
                 'O checkout está dentro do agendamento. Total, parcial, link ou presencial — registrado e no financeiro ali mesmo.'],
                ['M8 12l4-4M11.5 7.5l2.5-2.5a2.828 2.828 0 014 4l-2.5 2.5M8.5 12.5L6 15a2.828 2.828 0 01-4-4l2.5-2.5',
                 'Link sem senha',
                 'Permanente, funciona em qualquer celular. Disponibilidade calculada em tempo real com base na agenda real da equipe.'],
                ['M10 3v8M10 14v1',
                 'Clientes em risco',
                 'O CRM identifica quem não volta há 30, 60 ou 90 dias. Painel com contagem em tempo real e acesso à lista filtrada.'],
                ['M4 7h12M4 10h8M4 13h5',
                 'Regras reais do negócio',
                 'Buffers, feriados, almoço por profissional, bloqueios de data — tudo configurável. Sem conflito de horário, sem controle manual.'],
                ['M10 8a3 3 0 100-6 3 3 0 000 6zM4 17c0-3.31 2.69-6 6-6s6 2.69 6 6',
                 'Portal do cliente sem app',
                 'Histórico, faturas e agendamentos por link. Login por código via WhatsApp ou e-mail. Zero instalação.'],
            ] as [$path,$title,$desc])
            <div class="landing-card group">
                <div class="w-11 h-11 rounded-[14px] flex items-center justify-center mb-5 transition-colors duration-200"
                     style="background: var(--color-brand-faint);">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                         style="stroke: var(--color-brand); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round;">
                        <path d="{{ $path }}"/>
                    </svg>
                </div>
                <h3 class="font-display font-bold text-ink text-[15px] mb-2">{{ $title }}</h3>
                <p class="text-sm text-ink-muted leading-relaxed">{{ $desc }}</p>
            </div>
            @endforeach
        </div>
    </div>
</section>

{{-- ============================================================
     PARA QUEM
     ============================================================ --}}
<section id="para-quem" class="py-24 px-4 sm:px-6 bg-brand">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        <div>
            <span class="inline-block text-[11px] font-bold tracking-widest uppercase rounded-full px-3.5 py-1.5 mb-5"
                  style="background: rgba(255,255,255,.1); color: rgba(255,255,255,.7);">Para quem é</span>
            <h2 class="font-display font-extrabold text-white leading-tight mb-6"
                style="font-size: clamp(26px, 3.5vw, 44px); letter-spacing: -0.04em;">
                Para negócios que vendem horário
            </h2>
            <p class="text-white/60 text-base leading-relaxed mb-10 max-w-sm">
                Feito para quem precisa que cada horário seja aproveitado — porque horário vazio é dinheiro perdido.
            </p>
            <div class="rounded-2xl p-6" style="background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);">
                <p class="text-white/85 text-[15px] leading-relaxed italic">
                    "Se o seu negócio perde dinheiro quando um horário fica vazio, o AgendaNexo é para você."
                </p>
            </div>
        </div>

        <div class="flex flex-col gap-3">
            @foreach([
                ['Barbearias',                      'Controle de equipe, agendamento por profissional e cobrança no encerramento de cada atendimento.'],
                ['Lava-rápidos e estética automotiva','Múltiplos serviços com duração diferente, controle de agenda e sem conflito de horário.'],
                ['Estética',                         'Sobrancelha, lash, micropigmentação — cada horário representa uma receita fixa. Zero improviso.'],
                ['Clínicas de pequeno e médio porte','Atendimento por especialidade, com agenda separada e cobrança vinculada ao histórico.'],
                ['Oficinas leves',                   'Agendamento de serviço com controle de entrada, duração estimada e histórico por veículo.'],
            ] as [$label,$desc])
            <div class="rounded-2xl px-5 py-4 transition-colors duration-200 cursor-default"
                 style="background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);"
                 onmouseover="this.style.background='rgba(255,255,255,.1)'"
                 onmouseout="this.style.background='rgba(255,255,255,.06)'">
                <p class="font-display font-bold text-white text-[15px] mb-1">{{ $label }}</p>
                <p class="text-[13px] leading-relaxed" style="color: rgba(255,255,255,.55);">{{ $desc }}</p>
            </div>
            @endforeach
        </div>

    </div>
</section>

{{-- ============================================================
     CRM SPOTLIGHT
     ============================================================ --}}
<section class="py-24 px-4 sm:px-6 bg-white">
    <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        <div>
            <span class="landing-section-label">CRM inteligente</span>
            <h2 class="landing-h2 mb-5">Quem está sumindo<br>da sua base?</h2>
            <p class="text-ink-muted text-[15px] leading-relaxed mb-4">
                Todo negócio tem clientes que param de aparecer sem avisar. A maioria dos donos descobre quando já perdeu o cliente — ou não descobre nunca.
            </p>
            <p class="text-ink text-[15px] leading-relaxed mb-8">
                O AgendaNexo identifica automaticamente os clientes fora do padrão de retorno. O painel mostra a contagem em tempo real e abre direto na lista filtrada.
            </p>
            <p class="text-sm text-ink-subtle italic pl-4" style="border-left: 3px solid var(--color-brand-light);">
                Retenção de cliente não depende de memória. Depende de dado.
            </p>
        </div>

        {{-- CRM widget --}}
        <div class="bg-brand-faint border border-brand-light rounded-2xl p-6">
            <div class="flex items-start justify-between mb-5">
                <div>
                    <p class="font-display font-bold text-ink text-base">Clientes em risco</p>
                    <p class="text-xs text-ink-subtle mt-0.5">Sem retorno há mais de 30 dias</p>
                </div>
                <span class="text-xs font-bold rounded-lg px-2.5 py-1.5" style="background:#ef444420; color:#ef4444;">5 detectados</span>
            </div>
            <div class="space-y-2">
                @foreach([
                    ['Ana Clara',   '94','alto'],
                    ['Marcos V.',   '67','medio'],
                    ['Juliana R.',  '61','medio'],
                    ['Pedro H.',    '38','baixo'],
                    ['Camila F.',   '33','baixo'],
                ] as [$name,$days,$risk])
                @php
                    $color = $risk === 'alto' ? '#ef4444' : ($risk === 'medio' ? '#f59e0b' : '#3b82f6');
                    $label = $risk === 'alto' ? '+90 dias' : ($risk === 'medio' ? '60–90 dias' : '30–60 dias');
                    $initials = collect(explode(' ', $name))->map(fn($w) => mb_substr($w,0,1))->take(2)->implode('');
                @endphp
                <div class="bg-white border border-[#E5ECF3] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center font-display font-bold text-[12px] text-brand shrink-0">
                        {{ $initials }}
                    </div>
                    <p class="flex-1 text-[13px] font-semibold text-ink">{{ $name }}</p>
                    <span class="text-[11px] font-bold rounded-md px-2 py-1" style="background:{{ $color }}18; color:{{ $color }};">{{ $label }}</span>
                </div>
                @endforeach
            </div>
        </div>

    </div>
</section>

{{-- ============================================================
     PLANOS
     ============================================================ --}}
<section id="planos" class="py-24 px-4 sm:px-6 bg-brand-faint border-y border-brand-light">
    <div class="max-w-xl mx-auto text-center">
        <span class="landing-section-label" style="background:var(--color-brand-light);">Planos</span>
        <h2 class="landing-h2 mb-4">Comece sem compromisso</h2>
        <p class="text-ink-muted text-base leading-relaxed mb-10">
            14 dias grátis, sem cartão de crédito. Depois, escolha o plano que cabe na sua operação.
        </p>
        <a href="{{ config('app.saas_url') }}/register"
           class="landing-btn-primary px-10 py-4 text-base"
           style="box-shadow: 0 6px 24px rgba(31,78,121,.28);">
            Começar 14 dias grátis
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </a>
        <p class="mt-4 text-sm text-ink-subtle">Cancela quando quiser.</p>
    </div>
</section>

{{-- ============================================================
     FAQ
     ============================================================ --}}
<section id="faq" class="py-24 px-4 sm:px-6 bg-white border-t border-[#E5ECF3]">
    <div class="max-w-2xl mx-auto">
        <div class="text-center mb-14">
            <span class="landing-section-label">Dúvidas</span>
            <h2 class="landing-h2">Perguntas frequentes</h2>
        </div>
        <div class="space-y-2" id="faq-list">

            @foreach([
                ['O cliente precisa baixar um aplicativo para agendar?',
                 'Não. O agendamento é feito por link no navegador, sem login e sem app instalado. Funciona no celular de qualquer cliente.'],
                ['A confirmação pelo WhatsApp funciona automaticamente?',
                 'Quando a integração com WhatsApp está ativa e configurada, sim. Sem ela, o agendamento funciona normalmente — a confirmação pelo WhatsApp é um recurso adicional que depende dessa conexão.'],
                ['Consigo usar o sistema com mais de um profissional?',
                 'Sim. O AgendaNexo suporta múltiplos profissionais com agendas, horários e serviços independentes. Você visualiza a agenda geral ou filtra por profissional.'],
                ['Como funciona a cobrança no encerramento do atendimento?',
                 'Ao finalizar o atendimento, o sistema abre um checkout vinculado ao agendamento. Você registra o pagamento — total, parcial ou via link enviado ao cliente — e o registro vai para o módulo financeiro.'],
                ['O que acontece quando um cliente falta sem avisar?',
                 'O sistema permite registrar o no-show e aplicar uma taxa configurável. Isso cria um registro no histórico do cliente e serve como base para a política de reagendamento.'],
                ['Consigo bloquear datas e feriados?',
                 'Sim. Você pode cadastrar feriados nacionais e locais, além de bloqueios de datas específicas por profissional ou para o negócio inteiro.'],
                ['Como o sistema identifica clientes em risco?',
                 'O CRM monitora o intervalo entre visitas de cada cliente. Quando alguém ultrapassa o padrão habitual de retorno — 30, 60 ou 90 dias sem agendar — aparece na lista de clientes em risco no painel.'],
                ['Preciso de técnico para configurar?',
                 'Não. O onboarding guia você pelo cadastro de serviços, profissionais, horários e configurações iniciais. A maioria dos negócios entra em operação no mesmo dia.'],
            ] as $i => [$q,$a])
            <div class="faq-item border rounded-2xl overflow-hidden transition-colors duration-200"
                 style="border-color: #E5ECF3;">
                <button class="faq-btn w-full text-left px-6 py-5 flex items-center justify-between gap-4 bg-white transition-colors duration-200"
                        aria-expanded="false">
                    <span class="font-display font-semibold text-ink text-[15px]">{{ $q }}</span>
                    <span class="faq-icon w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                          style="background: var(--color-brand-faint);">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="faq-plus transition-transform duration-200">
                            <path d="M7 2v10M2 7h10" stroke="#1F4E79" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </span>
                </button>
                <div class="faq-answer hidden px-6 pb-5">
                    <p class="text-sm text-ink-muted leading-relaxed">{{ $a }}</p>
                </div>
            </div>
            @endforeach

        </div>
    </div>
</section>

{{-- ============================================================
     CTA FINAL
     ============================================================ --}}
<section class="relative overflow-hidden py-28 px-4 sm:px-6 bg-brand-faint border-t border-brand-light">
    <div class="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full"
         style="background: rgba(31,78,121,.05);"></div>
    <div class="max-w-2xl mx-auto text-center relative">
        <h2 class="font-display font-extrabold text-ink leading-tight mb-5"
            style="font-size: clamp(28px, 4vw, 48px); letter-spacing: -0.04em;">
            Seu negócio vive de horário.<br>
            <span class="text-brand">Seu sistema deveria acompanhar isso.</span>
        </h2>
        <p class="text-ink-muted text-lg leading-relaxed mb-12">
            O AgendaNexo fecha o ciclo — do agendamento à cobrança — para que você não perca horário, cliente ou receita por falta de controle.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="{{ config('app.saas_url') }}/register"
               class="landing-btn-primary w-full sm:w-auto px-10 py-4 text-base"
               style="box-shadow: 0 6px 24px rgba(31,78,121,.28);">
                Começar 14 dias grátis
            </a>
            <a href="mailto:contato@agendanexo.com.br"
               class="landing-btn-outline w-full sm:w-auto px-8 py-4 text-base">
                Falar com a equipe
            </a>
        </div>
        <p class="mt-6 text-sm text-ink-subtle">Sem cartão de crédito &nbsp;·&nbsp; Cancela quando quiser &nbsp;·&nbsp; Suporte em português</p>
    </div>
</section>

{{-- ============================================================
     FOOTER
     ============================================================ --}}
<footer class="bg-ink py-12 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto">
        <div class="flex flex-col sm:flex-row justify-between items-start gap-10 pb-8 border-b" style="border-color: rgba(255,255,255,.08);">
            <div>
                <div class="flex items-center gap-2 mb-3">
                    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                        <rect width="28" height="28" rx="7" fill="#1F4E79"/>
                        <path d="M8 14h4l2-5 2 10 2-5h2" stroke="#D9EAF7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="font-display font-bold text-white text-base">AgendaNexo</span>
                </div>
                <p class="text-sm leading-relaxed" style="color: rgba(255,255,255,.4);">
                    Agendamento, confirmação e cobrança num só lugar.<br>
                    <span class="text-xs" style="color: rgba(255,255,255,.25);">app.agendanexo.com.br</span>
                </p>
            </div>
            <nav class="flex flex-wrap gap-x-8 gap-y-3">
                @foreach([['#planos','Planos'],['#faq','Dúvidas'],['/politica-de-privacidade','Privacidade'],['/termos-de-uso','Termos'],['mailto:contato@agendanexo.com.br','Contato']] as [$href,$label])
                <a href="{{ $href }}" class="text-sm font-medium transition-colors duration-200"
                   style="color: rgba(255,255,255,.45);"
                   onmouseover="this.style.color='#fff'"
                   onmouseout="this.style.color='rgba(255,255,255,.45)'">{{ $label }}</a>
                @endforeach
            </nav>
        </div>
        <p class="pt-6 text-xs" style="color: rgba(255,255,255,.2);">
            &copy; {{ date('Y') }} AgendaNexo. Todos os direitos reservados. Feito para o mercado brasileiro.
        </p>
    </div>
</footer>

{{-- ============================================================
     SCRIPTS
     ============================================================ --}}
<script>
// Sticky header
(function () {
    const header = document.getElementById('site-header');
    function onScroll() {
        if (window.scrollY > 20) {
            header.style.background = 'rgba(255,255,255,.97)';
            header.style.backdropFilter = 'blur(10px)';
            header.style.borderBottomColor = '#E5ECF3';
        } else {
            header.style.background = 'transparent';
            header.style.backdropFilter = 'none';
            header.style.borderBottomColor = 'transparent';
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();

// FAQ accordion
(function () {
    document.querySelectorAll('.faq-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const item   = btn.closest('.faq-item');
            const answer = item.querySelector('.faq-answer');
            const icon   = item.querySelector('.faq-icon');
            const plus   = item.querySelector('.faq-plus');
            const open   = btn.getAttribute('aria-expanded') === 'true';

            // Close all
            document.querySelectorAll('.faq-item').forEach(function (other) {
                other.querySelector('.faq-answer').classList.add('hidden');
                other.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
                other.querySelector('.faq-icon').style.background = 'var(--color-brand-faint)';
                other.querySelector('.faq-plus').style.transform  = 'rotate(0deg)';
                other.style.borderColor = '#E5ECF3';
                other.style.background  = '#fff';
            });

            if (!open) {
                answer.classList.remove('hidden');
                btn.setAttribute('aria-expanded', 'true');
                icon.style.background      = '#1F4E79';
                plus.style.transform       = 'rotate(45deg)';
                plus.querySelector('path').setAttribute('stroke', '#fff');
                item.style.borderColor     = 'var(--color-brand-light)';
                item.style.background      = 'var(--color-brand-faint)';
                btn.style.background       = 'var(--color-brand-faint)';
            }
        });
    });
})();
</script>

</body>
</html>
