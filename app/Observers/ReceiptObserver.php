<?php

namespace App\Observers;

use App\Models\Receipt;
use Illuminate\Support\Facades\Cache;

class ReceiptObserver
{
    /**
     * Handle the Receipt "saved" event.
     */
    public function saved(Receipt $receipt): void
    {
        Cache::flush();
    }

    /**
     * Handle the Receipt "deleted" event.
     */
    public function deleted(Receipt $receipt): void
    {
        Cache::flush();
    }
}
