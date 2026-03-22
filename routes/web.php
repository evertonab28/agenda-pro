<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardPageController;

Route::get('/', function () {
    return redirect('/dashboard');
});

// Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardPageController::class, 'index'])->name('dashboard'); // ->middleware('can:view-dashboard');
    Route::get('/dashboard/day/{date}', [DashboardPageController::class, 'dayDetails'])->name('dashboard.day'); // ->middleware('can:view-dashboard');
    Route::get('/dashboard/export', [DashboardPageController::class, 'export'])->name('dashboard.export'); // ->middleware('can:export-dashboard');

    Route::get('/agenda', [\App\Http\Controllers\AgendaController::class, 'index'])->name('agenda');
    Route::post('/agenda', [\App\Http\Controllers\AgendaController::class, 'store'])->name('agenda.store');
    Route::put('/agenda/{appointment}', [\App\Http\Controllers\AgendaController::class, 'update'])->name('agenda.update');
    Route::delete('/agenda/{appointment}', [\App\Http\Controllers\AgendaController::class, 'destroy'])->name('agenda.destroy');
    Route::patch('/agenda/{appointment}/status', [\App\Http\Controllers\AgendaController::class, 'status'])->name('agenda.status');

    // Módulo Financeiro
    Route::prefix('financeiro')->name('finance.')->group(function () {
        Route::get('/', [\App\Http\Controllers\FinanceController::class, 'dashboard'])->name('dashboard');
        Route::resource('cobrancas', \App\Http\Controllers\ChargeController::class)->names([
            'index' => 'charges.index',
            'create' => 'charges.create',
            'store' => 'charges.store',
            'show' => 'charges.show',
            'edit' => 'charges.edit',
            'update' => 'charges.update',
            'destroy' => 'charges.destroy',
        ]);
        Route::get('cobrancas/exportar', [\App\Http\Controllers\ChargeController::class, 'export'])->name('charges.export');
        Route::post('cobrancas/{charge}/receber', [\App\Http\Controllers\ChargeController::class, 'receive'])->name('charges.receive');
    });

    Route::resource('customers', \App\Http\Controllers\CustomerController::class);
    Route::patch('customers/{customer}/status', [\App\Http\Controllers\CustomerController::class, 'toggleStatus'])->name('customers.status');
// });
