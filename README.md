# 📅 Agenda Pro

**Agenda Pro** é um sistema moderno de gestão de agendamentos e visão financeira voltado para clínicas, profissionais autônomos e pequenos negócios que desejam controle total sobre seus horários e receitas.

Construído utilizando os padrões mais modernos de desenvolvimento web, a aplicação oferece uma experiência de Single Page Application (SPA) veloz e reativa com uma arquitetura robusta no backend.

---

## 🚀 Tecnologias Utilizadas

Este projeto adota uma stack moderna e de alta performance:

### Backend
- **[Laravel](https://laravel.com/) (PHP)**: Framework robusto para a construção da API e lógica de negócios.
- **[Inertia.js](https://inertiajs.com/)**: O "elo" que conecta as rotas e os dados do backend do Laravel diretamente aos componentes React, sem a necessidade de construir uma API JSON separada.

### Frontend
- **[React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)**: Biblioteca para interfaces ricas, fortemente tipada para evitar bugs e escalar melhor.
- **[Vite](https://vitejs.dev/)**: Ferramenta de build de frontend super rápida, em conjunto com o `laravel-vite-plugin`.
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Framework utilitário de CSS que torna a estilização ágil e responsiva.
- **[Shadcn/UI](https://ui.shadcn.com/)**: Biblioteca de componentes baseada no Radix UI e e TailwindCSS, responsável por toda estética moderna dos inputs, cards, badges e tabelas do sistema.
- **[Recharts](https://recharts.org/)**: Biblioteca React para criação de gráficos fluidos e customizados.
- **[Lucide React](https://lucide.dev/)**: Pack de ícones consistente e minimalista.

---

## 🎯 Funcionalidades Principais (Dashboard)

- **Visão Analítica Global:** Acompanhe o total de agendamentos, taxa de confirmação e taxa de faltas (no-show) de forma instantânea.
- **Controle Financeiro Direto:** Visualize imediatamente a soma financeira atrelada aos serviços, dividida por status (Pago, Pendente, e Em Atraso).
- **Gráficos Dinâmicos (Série Diária):** Gráfico interativo evidenciando o cruzamento entre Agendamentos realizados vs Receita financeira (R$) num dado dia, ajudando a entender picos de demanda.
- **Tabela Crítica de Inadimplência:** Identificação em tempo real, acompanhada de indicativos visuais (Tags coloridas dinâmicas), de todos os débitos e vencimentos programados dos clientes/pacientes.
- **Filtro de Período Inteligente:** Navegação retroativa ou futura por datas usando busca dinâmica e veloz provida pelo ecossistema Inertia.
- **Dashboard Filters & Export (V2):** Filtros avançados combinados (Data, Status, ID Profissional, ID Serviço). Exibição de variação percentual (Deltas) em relação ao período anterior nos indicadores chave. Exportação do relatório completo e consolidado diretamente para formato CSV mantendo os filtros ativos.

---

## ⚙️ Como Executar o Projeto Localmente

Antes de começar, garanta que você tenha o **PHP**, **Composer**, **Node.js** e um banco de dados (ex: MySQL/SQLite/PostgreSQL) configurados.

1. **Clone do repositório / Baixe os arquivos:**
   ```bash
   git clone <url-do-repositorio>
   cd agenda-pro
   ```

2. **Instale as dependências do Backend (Laravel):**
   ```bash
   composer install
   ```

3. **Instale as dependências do Frontend (NPM):**
   ```bash
   npm install
   ```

4. **Configure seu ambiente (`.env`):**
   ```bash
   cp .env.example .env
   # Gere a key do Laravel:
   php artisan key:generate
   ```
   *Certifique-se de preencher as variáveis do banco de dados (DB_CONNECTION, DB_DATABASE...) corretamente.*

5. **Migre o banco de dados (Criação das Tabelas):**
   ```bash
   php artisan migrate
   # Se houver seeders com dados falsos para teste:
   # php artisan migrate --seed
   ```

6. **Inicie os Servidores (Você precisará de 2 abas no terminal):**
   
   Aba 1 (Backend PHP):
   ```bash
   php artisan serve
   ```
   
   Aba 2 (Frontend Vite):
   ```bash
   npm run dev
   ```

7. **Acesse a Aplicação:**
   Acesse [http://localhost:8000](http://localhost:8000) (ou especificamente na rota `/dashboard`) pelo seu navegador!

---

## 🧱 Abordagem de Design e Componentização

Toda a inferência visual do sistema é pautada nos arquivos-base do **Shadcn/UI**, que ficam alojados em `resources/js/components/ui`. As adaptações de layout principal (Sidebar de menu cruzando com o conteúdo dinâmico) acontecem em `AppLayout.tsx`. 

O uso ostensivo da arquitetura MVC moderna, mesclando Controladores que empacotam e pré-formatam os dados do BD diretamente para a `view` em Typescript, dispensa o intermédio burocrático de APIs Redux ou requests paralelos desnecessários.
