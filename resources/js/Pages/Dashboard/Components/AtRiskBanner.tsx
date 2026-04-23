import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { route } from '@/utils/route';

interface AtRiskBannerProps {
  atRiskCount: number;
}

export function AtRiskBanner({ atRiskCount }: AtRiskBannerProps) {
  if (atRiskCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
            {atRiskCount} {atRiskCount === 1 ? 'cliente está sumindo' : 'clientes estão sumindo'}
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Clientes em risco ou inativos que podem não voltar.
          </p>
        </div>
      </div>
      <Link href={route('crm.segment', 'Em Risco')} className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
        >
          Ver clientes <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}
