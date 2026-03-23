# Runbook de Incidentes — Agenda Pro

## 1. Erro 500 (Internal Server Error)

**Sintomas:** Página em branco ou tela de erro genérico.

**Diagnóstico:**
```bash
# Ver últimos erros
tail -100 storage/logs/laravel.log

# Ver erros de PHP
cat /var/log/nginx/error.log   # ou apache equivalente
```

**Causas comuns e soluções:**

| Causa | Solução |
|---|---|
| `.env` incorreto / ausente | Verificar `APP_KEY`, credenciais do banco |
| Permissões de arquivo | `chmod -R 775 storage bootstrap/cache` |
| Cache corrompido | `php artisan cache:clear && php artisan config:clear` |
| Migration não rodada | `php artisan migrate --force` |
| Dependência faltando | `composer install` |

---

## 2. Página em Branco (Frontend)

**Sintomas:** HTML carrega mas tela fica vazia sem conteúdo.

**Diagnóstico:**
```bash
# Verificar se build do frontend existe
ls public/build/

# Recompilar frontend
npm run build
```

**Causas comuns:**
- Assets não buildados (`npm run build` não executado)
- `VITE_` env var incorreta
- Erro de TypeScript não detectado

---

## 3. Falha de Autenticação

**Sintomas:** Login redireciona em loop, sessão não persiste.

**Diagnóstico:**
```bash
# Verificar driver de sessão
grep SESSION_DRIVER .env   # deve ser 'file' ou 'database'

# Limpar sessões
php artisan session:clear  # ou remover storage/framework/sessions/*
```

---

## 4. Lentidão Extrema

**Sintomas:** Páginas demoram > 5s para carregar.

**Diagnóstico:**
```bash
# Verificar cache ativo
php artisan cache:clear   # limpar e reconstruir

# Habilitar query logging temporariamente (dev only)
# Em AppServiceProvider::boot():
# DB::listen(fn($q) => Log::info($q->sql));
```

**Possíveis causas:**
- Cache desconfigurado ou desabilitado
- N+1 queries (verificar com Telescope ou log)
- Banco sem índices nas colunas de filtro

---

## 5. Jobs de Fila Travados

```bash
# Ver status dos workers
php artisan queue:status

# Reiniciar workers
php artisan queue:restart

# Limpar jobs com falha
php artisan queue:flush
```

---

## 6. Auditoria — Investigando Ações

```bash
# Ver logs de audit no banco
php artisan tinker
>>> App\Models\AuditLog::latest()->limit(20)->get(['action','entity','user_id','created_at']);

# Filtrar por entidade específica
>>> App\Models\AuditLog::where('entity', 'Appointment')->where('action', 'appointment.deleted')->get();
```

---

## Contatos e Escalação

| Nível | Condição | Ação |
|---|---|---|
| L1 | Erro pontual de usuário | Verificar logs e guiar usuário |
| L2 | Erro sistêmico / 500 generalizado | Rollback + notify |
| L3 | Perda de dados / breach | Backup restore + análise forense nos audit_logs |
