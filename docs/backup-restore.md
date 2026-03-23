# Backup & Restore — Agenda Pro

## Backup do Banco de Dados (MySQL)

```bash
# Backup completo
mysqldump -u [user] -p[password] [database] > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
mysqldump -u [user] -p[password] [database] | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup de tabelas específicas (apenas dados, sem schema)
mysqldump -u [user] -p[password] --no-create-info [database] \
  appointments charges receipts customers > dados_criticos.sql
```

## Restore do Banco de Dados

```bash
# Restore completo
mysql -u [user] -p[password] [database] < backup_YYYYMMDD.sql

# Restore comprimido
gunzip -c backup_YYYYMMDD.sql.gz | mysql -u [user] -p[password] [database]
```

## Backup do Storage (uploads/avatares)

```bash
# Copiar storage para backup
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/app/

# Restaurar storage
tar -xzf storage_backup_YYYYMMDD.tar.gz
```

## Automação (cron)

Adicione ao crontab do servidor para backup diário às 3h:
```cron
0 3 * * * mysqldump -u USUARIO -pSENHA BANCO | gzip > /backups/agenda_pro/db_$(date +\%Y\%m\%d).sql.gz
0 3 * * * find /backups/agenda_pro/ -mtime +30 -delete
```

## Retenção Recomendada

| Tipo | Frequência | Retenção |
|---|---|---|
| Banco de dados | Diário | 30 dias |
| Storage (uploads) | Semanal | 90 dias |
| Logs de aplicação | Rotação diária | 14 dias |

## Verificação de Integridade

```bash
# Testar restore em banco de staging
mysql -u user -p staging_banco < backup_YYYYMMDD.sql
php artisan migrate:status   # checar tabelas
php artisan tinker --execute="echo App\Models\Customer::count();"
```
