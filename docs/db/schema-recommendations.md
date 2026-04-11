# Schema Recommendations — Agenda Pro

**Sprint T2 · Data: 2026-04-09**
**Baseado em:** migration-audit.md + schema-map.md

---

## 1. Decisão Estratégica: Manter Histórico vs. Squash/Baseline

### Recomendação: **Manter o histórico. Não fazer squash agora.**

**Justificativa:**

O projeto tem 57 migrations e está em operação ativa. As migrations já foram aplicadas em ambientes reais (produção ou staging). Fazer um squash/baseline implica:

1. Criar uma nova migration "mega-schema" do zero
2. Marcar todas as 57 antigas como "usadas" sem reexecutar
3. Garantir que ambientes existentes não reexecutem nada
4. Risco de divergência entre ambientes se o processo não for perfeito

O custo benefício **não justifica** agora. O histórico ainda é legível, as migrations são rápidas (< 2s total em dev), e não há pressão operacional de performance no `migrate` command.

**Quando fazer squash faz sentido:**
- > 200 migrations lentas acumuladas
- Onboarding de novos devs está sofrendo
- Migrations de teste demoram mais de 10-15 segundos
- Antes de um launch público com múltiplos ambientes

**Quando rever essa decisão:** Sprint T5+ ou quando o time crescer.

---

## 2. Correções Imediatas (Alta Prioridade)

### R1 — Corrigir os `down()` quebrados

**Por que é urgente:** Sem `down()` funcional, `migrate:rollback` em staging/CI produz estado inconsistente. Isso quebra CI pipelines que fazem rollback após testes.

**O que fazer:**

Não editar as migrations antigas. Criar **novas** migrations de correção estrutural:

```php
// NOVA migration: 2026_04_09_999999_fix_rollback_safety_for_clinic_id_waves.php
// Apenas documenta o estado — não altera up()
// Corrige o down() que faz rollback adequado
```

**Alternativa mais segura (recomendada):** Adicionar uma nota nos docs de que essas migrations NÃO suportam rollback e configurar CI para usar `migrate:fresh` em vez de `migrate:rollback` em ambientes efêmeros. Documentar no `CONTRIBUTING.md`.

**Status T4:** Documentado com comentários de aviso nas migrations.

---

### R2 — Remover/documentar a migration vazia

**Arquivo:** `2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php`

Essa migration já rodou em todos os ambientes. Não dá para apagar sem rollback manual.

**Ação recomendada:** Adicionar comentário explicativo no arquivo e documentar no `migration-audit.md` que ela é intencionalmente vazia (placeholder que nunca foi preenchido).

```php
// Este arquivo é um placeholder vazio que foi commitado acidentalmente.
// Os campos de retenção foram adicionados em:
// - 2026_04_09_175548_add_retention_fields_to_workspace_subscriptions (cancellation_category, etc.)
// - 2026_04_09_151108_add_cancellation_metadata_to_workspace_subscriptions (recorded_at, canceled_by)
// NÃO ALTERAR este arquivo — já está registrado no histórico de migrations.
```

**Status T4:** Comentário explicativo adicionado.

---

### R3 — Adicionar workspace_id nas tabelas financeiras sem escopo

**Tabelas:** `wallets`, `wallet_transactions`, `customer_packages`

**Problema real:** Queries de relatório financeiro por workspace exigem JOIN desnecessário com customers. Se no futuro um customer puder mudar de workspace (migração de dados), há risco de vazamento cross-tenant.

**Migration sugerida:**

```php
// 2026_04_XX_add_workspace_id_to_financial_tables.php
Schema::table('wallets', function (Blueprint $table) {
    $table->foreignId('workspace_id')
        ->nullable()
        ->after('id')
        ->constrained()
        ->cascadeOnDelete();
});

// População via script:
// UPDATE wallets w JOIN customers c ON w.customer_id = c.id
// SET w.workspace_id = c.workspace_id;

// Após população, tornar NOT NULL:
// ALTER TABLE wallets MODIFY workspace_id BIGINT NOT NULL;
```

**Risco:** Requer data migration (UPDATE com JOIN). Fazer em horário de baixo tráfego com lock mínimo.

**Status T4:** ✅ IMPLEMENTADO — migration 2026_04_10_000001 criada. workspace_id adicionado com backfill. FKs adicionadas no MySQL.

---

### R4 — Padronizar status em enum para billing

**Tabelas:** `workspace_subscriptions`, `customer_packages`, `wallet_transactions`

**Ação:** Criar migration de ajuste de tipo.

```php
// workspace_subscriptions.status
$table->enum('status', ['trialing', 'active', 'overdue', 'canceled'])
    ->default('trialing')
    ->change();

// workspace_subscriptions.canceled_by
$table->enum('canceled_by', ['customer', 'admin', 'system'])
    ->nullable()
    ->change();

// customer_packages.status
$table->enum('status', ['active', 'expired', 'exhausted', 'canceled'])
    ->default('active')
    ->change();

// wallet_transactions.type
$table->enum('type', ['credit', 'debit'])
    ->change();
```

**Nota:** Requer Doctrine DBAL (`composer require doctrine/dbal`) para uso de `change()` em MySQL.

---

## 3. Melhorias de Médio Prazo

### R5 — Adicionar índice composto em wallet_transactions

```php
$table->index(['reference_type', 'reference_id']);
```

Necessário para queries de "qual transação originou este appointment/charge".

**Status T4:** ✅ IMPLEMENTADO — índice (reference_type, reference_id) adicionado na migration de workspace_id.

---

### R6 — Documentar o padrão de reference_type/reference_id

Tanto `charges` quanto `wallet_transactions` usam o padrão polimórfico manual:
```
reference_type VARCHAR + reference_id BIGINT
```

Esse padrão não segue o padrão Eloquent (`morphTo`) que usa `_type` e `_id`. Decisão aceitável (polimorfismo manual explícito), mas deve ser documentada para evitar variações futuras.

**Ação:** Adicionar ao `CONTRIBUTING.md` ou ao `docs/architecture/`:
> "Referências polimórficas usam `reference_type` + `reminder_id` (não morphTo do Eloquent). Ao adicionar novos polimorfismos, seguir esse mesmo padrão."

---

### R7 — Avaliar separação de `charges` em dois contextos

A tabela `charges` cobre dois contextos distintos:
1. **Cobrança operacional:** ligada a appointment, gerada automaticamente
2. **Cobrança financeira avulsa:** ligada diretamente a customer, independente de agenda

Atualmente convivem na mesma tabela com `appointment_id` nullable como discriminador.

**Não recomendo separar agora.** O JOIN seria necessário em muitos relatórios e a separação tem alto custo de refactor. Mas se a tabela continuar crescendo em colunas que só se aplicam a um dos contextos, considerar:
- Campo `charge_type` enum(operational, standalone) como discriminador explícito
- Ou separação futura em `appointment_charges` e `standalone_charges`

---

### R8 — Padronizar padrão de novos domínios (checklist)

Para evitar repetir os erros dos domínios anteriores (clinic_id adicionado em 5 ondas, índices tardios, FKs erradas), adotar o seguinte padrão para **toda nova migration de criação de tabela**:

```
☐ Definir workspace_id na criação da tabela (se domínio tenant)
☐ Definir todos os índices na própria migration de criação
☐ Usar enum() para campos de status/tipo com valores conhecidos
☐ Implementar down() funcional e testado
☐ Nomear a migration de forma única e descritiva
☐ Verificar FKs apontando para as tabelas corretas
```

---

## 4. Estratégia de Padronização Futura

### Convenção de Nomes para Novas Migrations

| Operação | Padrão | Exemplo |
|----------|--------|---------|
| Criar tabela | `create_{table}_table` | `create_workspace_reports_table` |
| Adicionar campo(s) | `add_{field}_to_{table}_table` | `add_metadata_to_crm_actions_table` |
| Remover campo(s) | `remove_{field}_from_{table}_table` | `remove_legacy_status_from_charges_table` |
| Renomear | `rename_{old}_to_{new}_in_{table}_table` | `rename_clinic_to_workspace_in_users_table` |
| Adicionar índice | `add_{purpose}_indexes_to_{table}_table` | `add_search_indexes_to_customers_table` |
| Correção de estrutura | `fix_{description}_in_{table}_table` | `fix_nullable_workspace_id_in_wallets_table` |

**Regra:** Nunca reusar um nome lógico que já existe no histórico (cf. problema P2 desta auditoria).

---

### Padrão de Tipos de Campo

| Campo | Tipo recomendado | Evitar |
|-------|-----------------|--------|
| Status com valores fixos | `enum()` | `string()` |
| Flags booleanas | `boolean()` | `tinyint()` manual |
| Referência polimórfica | `string reference_type` + `unsignedBigInteger reference_id` | morphTo Eloquent (para consistência) |
| Campos de cancelamento | `enum canceled_by` | `string canceled_by` com comment |
| Metadados opcionais | `json()->nullable()` | `text` com serialização manual |

---

## 5. Plano de Organização Sugerido por Sprint

### Sprint T3 (próxima sprint técnica)
- [ ] Comentar/documentar migration vazia (R2) — 15 min
- [ ] Adicionar índice composto em wallet_transactions (R5) — 30 min
- [ ] Criar CONTRIBUTING.md de padrão de migrations — 1h

### Sprint T4
- [ ] Migration de workspace_id em wallets/wallet_transactions/customer_packages (R3)
  - Incluir data migration (UPDATE com JOIN)
  - Testar em ambiente staging com volume real de dados
- [ ] Padronizar enums em billing (R4)

### Sprint T5+
- [ ] Avaliar se charges precisa discriminador explícito (R7)
- [ ] Avaliar baseline/squash se > 100 migrations

---

## 6. Decisão sobre Squash/Baseline

### Veredicto: **Não fazer squash. Adotar baseline congelado no futuro.**

**Proposta de baseline futuro (quando chegar a hora):**

1. Criar `database/migrations/baseline/` com uma única migration `baseline_schema_YYYY_MM_DD.php`
2. Essa migration cria todo o schema do zero (estado atual)
3. Environments novos rodam `migrate --path=database/migrations/baseline` + migrations novas
4. Environments existentes ignoram o baseline (já foram migrados)
5. As 57 migrations antigas ficam em `database/migrations/legacy/` — preservadas para auditoria, não executadas em novos environments

Essa abordagem:
- Preserva o histórico completo (git blame, auditoria)
- Acelera `migrate:fresh` em environments novos/CI
- Não quebra nada nos environments existentes

**Gatilho para fazer isso:** > 100 migrations ou `migrate:fresh` demorando > 30s em CI.

---

## 7. Resumo Executivo de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| down() quebrado em migrate:rollback | Alta | Alto | Documentar limitação; usar migrate:fresh em CI |
| Cross-tenant leak em wallets sem workspace_id | Média | Alto | Adicionar workspace_id (R3) |
| Bugs de validação por string vs enum | Média | Médio | Padronizar em billing (R4) |
| Migration vazia causando confusão | Baixa | Baixo | Comentar arquivo (R2) |
| charges crescendo além do razoável | Baixa | Médio | Monitorar; avaliar split em T5+ |
