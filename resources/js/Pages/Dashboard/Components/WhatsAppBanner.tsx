import { MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

interface WhatsAppBannerProps {
  whatsAppConnected: boolean;
}

export function WhatsAppBanner({ whatsAppConnected }: WhatsAppBannerProps) {
  if (whatsAppConnected) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Confirme agendamentos pelo WhatsApp
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Conecte sua conta para ativar confirmações e reagendamentos automáticos.
          </p>
        </div>
      </div>
      <Link href="/configurations/integrations" className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
        >
          Configurar WhatsApp <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}
