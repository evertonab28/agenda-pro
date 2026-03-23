# Deploy Checklist — Agenda Pro

## Pré-requisitos

- [ ] PHP 8.2+, Composer, Node.js 20+, banco de dados configurado
- [ ] `.env` copiado e preenchido (`cp .env.example .env`)
- [ ] `APP_KEY` gerada (`php artisan key:generate`)

## Passos de Deploy

### 1. Backend
```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 2. Frontend
```bash
npm ci
npm run build
```

### 3. Permissões de Arquivos
```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### 4. Queue Worker (se usar filas)
```bash
php artisan queue:restart
# Supervisord deve reiniciar automaticamente
```

### 5. Cache
```bash
php artisan cache:clear
```

## Variáveis de Ambiente Críticas

| Variável | Descrição | Exemplo |
|---|---|---|
| `APP_ENV` | Ambiente | `production` |
| `APP_DEBUG` | Debug (NUNCA `true` em prod) | `false` |
| `APP_URL` | URL base | `https://app.com` |
| `DB_*` | Conexão do banco | Ver `.env.example` |
| `DASHBOARD_CACHE_TTL` | TTL cache dashboard (seg) | `120` |
| `FINANCE_CACHE_TTL` | TTL cache financeiro (seg) | `120` |
| `SESSION_LIFETIME` | Minutos de sessão | `120` |

## Checklist Pós-Deploy

- [ ] Acessar `/login` e verificar que funciona
- [ ] Verificar que `/dashboard` carrega sem erros
- [ ] Verificar que rotas `/agenda` e `/financeiro` funcionam
- [ ] Logar como `operator` e confirmar bloqueio em `/financeiro/dashboard`
- [ ] Confirmar que logs de aplicação estão sendo gravados em `storage/logs/`

## Rollback

```bash
# Reverter última migration
php artisan migrate:rollback --step=1
# Rebuild sem a última versão
git checkout HEAD~1
composer install --no-dev --optimize-autoloader
npm ci && npm run build
```
