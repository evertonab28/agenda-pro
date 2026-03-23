<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardPageController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.update');
});

Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');


Route::get('/', function () {
    return redirect('/dashboard');
});

Route::middleware(['auth'])->group(function () {
    Route::resource('usuarios', \App\Http\Controllers\UserController::class)->names('users');
    Route::patch('usuarios/{user}/status', [\App\Http\Controllers\UserController::class, 'toggleStatus'])->name('users.status');

    Route::get('/dashboard', [DashboardPageController::class, 'index'])->name('dashboard');
    Route::get('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'index'])->name('onboarding.index');

 // ->middleware('can:view-dashboard');
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

    // Módulo de Configurações
    Route::prefix('configuracoes')->name('configuracoes.')->group(function () {
        Route::resource('servicos', \App\Http\Controllers\ServiceController::class)->names('services');
        Route::resource('profissionais', \App\Http\Controllers\ProfessionalController::class)->names('professionals');
        
        // Schedules
        Route::get('horarios', [\App\Http\Controllers\ScheduleController::class, 'index'])->name('schedules.index');
        Route::post('horarios', [\App\Http\Controllers\ScheduleController::class, 'store'])->name('schedules.store');
        
        // Holidays
        Route::resource('feriados', \App\Http\Controllers\HolidayController::class)->names('holidays');
        
        // General
        Route::get('geral', [\App\Http\Controllers\GeneralSettingsController::class, 'index'])->name('general.index');
        Route::post('geral', [\App\Http\Controllers\GeneralSettingsController::class, 'store'])->name('general.store');
    });
});

