# Control Plane — Operação e Debug

Painel administrativo interno do SaaS. Fornece visibilidade sobre workspaces, assinaturas, receita e saúde da plataforma.

---

## Acesso e Autenticação

Guard separado (`admin`), completamente independente do `web` (staff) e `customer` (portal).

| Rota | Método | Descrição |
|------|--------|-----------|
| `/admin/login` | GET | Formulário de login |
| `/admin/login` | POST | Processa login |
| `/admin/logout` | POST | Encerra sessão |
| `/admin` | GET | Dashboard |
| `/admin/workspaces` | GET | Lista workspaces |
| `/admin/workspaces/{id}` | GET | Detalhe do workspace |
| `/admin/workspaces/{id}/retention` | PUT | Salva dados de retenção |

**Middleware:** `EnsureAdmin` — rejeita com 401 (JSON) ou redireciona para `/admin/login` (browser).

**Criar admin pela primeira vez:**
```bash
php artisan tinker
AdminUser::create(['name' => 'Admin', 'email' => 'admin@...', 'password' => bcrypt('senha')]);
```

---

## Dashboard — Métricas Disponíveis

### Contagens de Workspace
| Métrica | Descrição |
|---------|-----------|
| `total_workspaces` | Total de workspaces cadastrados |
| `active_count` | Assinaturas ativas |
| `trialing_count` | Em período de trial |
| `overdue_count` | Com pagamento vencido |
| `canceled_count` | Canceladas |
| `without_subscription` | Sem assinatura vinculada |

### Receita
| Métrica | Descrição |
|---------|-----------|
| `mrr` | Receita Recorrente Mensal (apenas ativos) |
| `mrr_projected` | MRR projetado se todos os trials converterem |
| `arr` | MRR × 12 |
| `revenue_mtd` | Receita recebida no mês atual (invoices pagas) |
| `pending_invoices_value` | Valor total de invoices pendentes |
| `overdue_invoices_value` | Valor total de invoices vencidas |

### Conversão e Churn
| Métrica | Descrição |
|---------|-----------|
| `trial_conversion_rate` | % de trials convertidos para pago (null se dados insuficientes) |
| `churn_count` | Total de cancelamentos (contagem absoluta, não taxa) |

### Movimentos de Receita (MRR)
Calculado incrementalmente a partir de abril/2026, baseado em eventos.

| Componente | Descrição |
|------------|-----------|
| `new_mrr` | Novas assinaturas ativadas |
| `expansion_mrr` | Upgrades e expansões |
| `contraction_mrr` | Downgrades |
| `churned_mrr` | Cancelamentos |
| `recovered_mrr` | Reativações |
| `net_movement` | Variação líquida do MRR |

---

## Alertas Operacionais

Calculados a cada carregamento do dashboard. Níveis:

| Condição | Nível |
|----------|-------|
| Invoices vencidas > R$ 500 | `danger` |
| Invoices vencidas ≤ R$ 500 | `warning` |
| Workspaces com overdue ≥ 3 | `danger` |
| Workspaces com overdue < 3 | `warning` |
| Trials expirando em < 3 dias | `warning` |
| Trials expirados sem dunning | `danger` |
| Workspaces sem assinatura | `info` |

---

## Lista de Workspaces — Filtros

`GET /admin/workspaces?search=...&status=...&plan_id=...`

| Filtro `status` | Descrição |
|-----------------|-----------|
| `all` | Todos (padrão) |
| `active` | Assinatura ativa |
| `trialing` | Em trial |
| `ending_trial` | Trial expira em ≤ 7 dias |
| `overdue` | Pagamento vencido |
| `canceled` | Cancelados |
| `canceled_recently` | Cancelados nos últimos 30 dias (alvo winback) |
| `winback` | Marcados como candidatos a reativação |
| `none` | Sem assinatura |

Paginação: 25 por página.

---

## Detalhe do Workspace

`GET /admin/workspaces/{id}`

Contém:
- Dados do workspace (name, slug, created_at)
- Contagem de usuários staff e clientes do portal
- Assinatura atual (status, datas, plano)
- Timeline comercial (eventos + invoices mesclados, cronológico)
- Lista de invoices (com links de pagamento)
- Formulário de retenção (apenas para canceled/overdue)

---

## Timeline Comercial

Visão cronológica mesclada de eventos de assinatura + eventos de invoice.

| Tipo de Evento | Significado |
|----------------|-------------|
| `trial_started` | Workspace entrou em trial |
| `trial_expired` | Trial expirou sem conversão |
| `trial_ending_soon` | Trial expira em < 3 dias |
| `subscription_activated` | Trial convertido para pago |
| `subscription_overdue` | Pagamento venceu |
| `subscription_canceled` | Workspace cancelou |
| `subscription_reactivated` | Workspace reativado (winback) |
| `invoice_generated` | Invoice gerada |
| `invoice_paid` | Pagamento recebido |
| `invoice_overdue` | Invoice venceu sem pagamento |
| `plan_changed` | Mudança de plano |
| `plan_upgrade_requested` | Upgrade solicitado (admin registrou) |
| `plan_upgraded` | Upgrade concluído |
| `cancellation_reason_recorded` | Admin registrou motivo de churn |

---

## Gerenciamento de Retenção / Churn

`PUT /admin/workspaces/{id}/retention`

Disponível apenas para workspaces com assinatura `canceled` ou `overdue`.

**Campos:**
- `cancellation_category` — Categoria do churn:
  - `Preço/Custo`
  - `Falta de uso`
  - `Concorrente`
  - `Faltou feature`
  - `Fechou as portas`
  - `Outro`
- `cancellation_reason` — Descrição livre (opcional)
- `winback_candidate` — `true/false` para marcar como alvo de reativação

**Efeitos ao salvar pela primeira vez:**
1. Define `cancellation_recorded_at = now()`
2. Define `canceled_by = 'admin'`
3. Emite evento `CancellationReasonRecorded` (alimenta analytics de churn)
4. Emite evento `SubscriptionCanceled` (alimenta cálculos de MRR)

---

## Serviços Envolvidos

| Serviço | Responsabilidade |
|---------|-----------------|
| `SaasMetricsService` | Métricas gerais, alertas, trials, workspaces em risco |
| `PlatformReadService` | Consultas de workspaces, invoices, cancelamentos (bypassa tenant scope) |
| `RevenueOpsService` | Movimentos de MRR por período |

**Atenção:** Todos os serviços do control plane usam `withoutGlobalScopes()` — ignoram o isolamento de tenant intencionalmente.

---

## Limitações Atuais

| Limitação | Impacto |
|-----------|---------|
| Não é possível alterar status de assinatura pelo painel | Mudanças exigem Tinker ou banco direto |
| Não é possível emitir reembolsos ou créditos | Deve ser feito diretamente no Asaas |
| Não é possível criar/deletar workspaces | Operação via Tinker |
| Não é possível prorrogar trial manualmente | Operação via Tinker |
| Churn rate não calculado (apenas count) | Requer snapshots históricos |
| Sem filtro de data customizado no dashboard | Período fixo (mês atual) |
| Sem exportação de métricas | Apenas visualização web |
| Alertas não geram notificações ativas | Exige abertura manual do painel |
| Movimentos de MRR só existem a partir de abr/2026 | Sem dados históricos anteriores |

---

## Como Investigar Problemas

**Workspace com status incorreto no dashboard:**
```bash
php artisan tinker
$ws = Workspace::with('subscription')->find($id);
$ws->subscription->status; // verifica status real
```

**MRR zerado ou incorreto:**
- Verifique se há eventos `subscription_activated` na tabela `workspace_subscription_events` com payload contendo `amount`
- Verifique se as invoices estão com `status = 'paid'`

**Trial não aparece como "expirando":**
- Verifique `trial_ends_at` na `workspace_subscriptions`
- Alerta dispara quando `days_left <= 7`

**Winback não aparece no filtro:**
- Verifique coluna `winback_candidate = 1` em `workspace_subscriptions`
