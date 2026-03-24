<?php

namespace App\Console\Commands\Security;

use Illuminate\Console\Command;

class PurgeAuditLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:purge-security-logs {--days=90 : Days of logs to keep}';

    protected $description = 'Purge old audit logs and webhook audits for LGPD minimization compliance';

    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $auditCount = \App\Models\AuditLog::where('created_at', '<', $cutoff)->delete();
        $webhookCount = \App\Models\WebhookAudit::where('processed_at', '<', $cutoff)->delete();

        $this->info("Purged {$auditCount} audit logs and {$webhookCount} webhook audits older than {$days} days.");
    }
}
