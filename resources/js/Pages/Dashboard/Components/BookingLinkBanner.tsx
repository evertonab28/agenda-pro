import { useState } from 'react';
import { Link2, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingLinkBannerProps {
  publicBookingUrl: string;
}

export function BookingLinkBanner({ publicBookingUrl }: BookingLinkBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicBookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Seu link de agendamento
          </p>
          <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md">
            {publicBookingUrl}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copiado</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copiar link</>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(publicBookingUrl, '_blank')}
          className="gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Abrir
        </Button>
      </div>
    </div>
  );
}
