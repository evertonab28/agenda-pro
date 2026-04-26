<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardPageController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\PaymentLinkController; // Added

// Pagamento Direto (Público)
Route::get('/pay/{hash}', [PaymentLinkController::class, 'show'])->name('payment.direct');

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
    return view('landing');
})->name('home')->withoutMiddleware([
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\Session\Middleware\AuthenticateSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    \App\Http\Middleware\HandleInertiaRequests::class,
    \App\Http\Middleware\CheckOnboarding::class,
]);

Route::middleware(['auth', 'subscribed'])->group(function () {
    Route::resource('usuarios', \App\Http\Controllers\UserController::class)->names('users');
    Route::patch('usuarios/{user}/status', [\App\Http\Controllers\UserController::class, 'toggleStatus'])->name('users.status');

    Route::get('/dashboard', [DashboardPageController::class, 'index'])->name('dashboard')->middleware('can:view-dashboard');
    Route::get('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'index'])->name('onboarding.index');

    Route::get('/dashboard/day/{date}', [DashboardPageController::class, 'dayDetails'])->name('dashboard.day')->middleware('can:view-dashboard');
    Route::get('/dashboard/export', [DashboardPageController::class, 'export'])->name('dashboard.export')->middleware('can:export-dashboard');

    Route::get('/agenda', [\App\Http\Controllers\AgendaController::class, 'index'])->name('agenda');
    Route::post('/agenda', [\App\Http\Controllers\AgendaController::class, 'store'])->name('agenda.store');
    Route::put('/agenda/{appointment}', [\App\Http\Controllers\AgendaController::class, 'update'])->name('agenda.update');
    Route::delete('/agenda/{appointment}', [\App\Http\Controllers\AgendaController::class, 'destroy'])->name('agenda.destroy');
    Route::patch('/agenda/{appointment}/status', [\App\Http\Controllers\AgendaController::class, 'status'])->name('agenda.status');
    Route::patch('/agenda/{appointment}/finalizar', [\App\Http\Controllers\AgendaController::class, 'finalizeAndCheckout'])->name('agenda.finalize');

    Route::get('/agenda/{appointment}/checkout', [\App\Http\Controllers\AgendaCheckoutController::class, 'show'])->name('agenda.checkout.show');
    Route::post('/agenda/{appointment}/checkout', [\App\Http\Controllers\AgendaCheckoutController::class, 'store'])->name('agenda.checkout.store');

    Route::resource('lista-espera', \App\Http\Controllers\WaitlistController::class)->names('waitlist');
    Route::post('lista-espera/{entry}/converter', [\App\Http\Controllers\WaitlistController::class, 'convert'])->name('waitlist.convert');

    Route::resource('pacotes', \App\Http\Controllers\PackageController::class)->names('packages');
    Route::post('pacotes/{package}/vender', [\App\Http\Controllers\PackageController::class, 'sell'])->name('packages.sell');
    Route::post('clientes/{customer}/credito', [\App\Http\Controllers\CustomerController::class, 'addCredit'])->name('customers.add-credit');

    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('/executivo', [\App\Http\Controllers\ExecutiveDashboardController::class, 'index'])
            ->name('executive')
            ->middleware('feature:executive_bi');
    });

    Route::prefix('crm')->name('crm.')->group(function () {
        Route::get('/', [\App\Http\Controllers\CRMController::class, 'index'])
            ->name('index')
            ->middleware('feature:crm_tools');
        Route::get('/segmento/{segment}', [\App\Http\Controllers\CRMController::class, 'segment'])
            ->name('segment')
            ->middleware('feature:crm_tools');
    });
    // Módulo Financeiro
    Route::prefix('financeiro')->name('finance.')->group(function () {
        Route::get('/', [\App\Http\Controllers\FinanceController::class, 'dashboard'])->name('dashboard');
        Route::resource('servicos', \App\Http\Controllers\ServiceController::class)->names([
            'index' => 'services.index',
        ])->parameters(['servicos' => 'service']);
        Route::resource('cobrancas', \App\Http\Controllers\ChargeController::class)->names([
            'index' => 'charges.index',
            'create' => 'charges.create',
            'store' => 'charges.store',
            'show' => 'charges.show',
            'edit' => 'charges.edit',
            'update' => 'charges.update',
            'destroy' => 'charges.destroy',
        ])->parameters(['cobrancas' => 'charge']);
        Route::get('cobrancas/exportar', [\App\Http\Controllers\ChargeController::class, 'export'])->name('charges.export');
        Route::post('cobrancas/{charge}/receber', [\App\Http\Controllers\ChargeController::class, 'receive'])->name('charges.receive');
        Route::get('relatorios', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('relatorios/exportar', [\App\Http\Controllers\ReportController::class, 'exportCsv'])->name('reports.export');
    });

    Route::get('customers/search', [\App\Http\Controllers\CustomerController::class, 'autocomplete'])->name('customers.search');
    Route::resource('customers', \App\Http\Controllers\CustomerController::class);
    Route::patch('customers/{customer}/status', [\App\Http\Controllers\CustomerController::class, 'toggleStatus'])->name('customers.status');

    // Módulo de Configurações
    Route::prefix('configuracoes')->name('configuracoes.')->group(function () {
        Route::resource('servicos', \App\Http\Controllers\ServiceController::class)
            ->names('services')
            ->parameters(['servicos' => 'service']);
        Route::resource('profissionais', \App\Http\Controllers\ProfessionalController::class)
            ->names('professionals')
            ->parameters(['profissionais' => 'professional']);

        // Schedules
        Route::get('horarios', [\App\Http\Controllers\ScheduleController::class, 'index'])->name('schedules.index');
        Route::post('horarios', [\App\Http\Controllers\ScheduleController::class, 'store'])->name('schedules.store');

        // Holidays
        Route::resource('feriados', \App\Http\Controllers\HolidayController::class)->names('holidays');

        // General
        Route::get('geral', [\App\Http\Controllers\GeneralSettingsController::class, 'index'])->name('general.index');
        Route::post('geral', [\App\Http\Controllers\GeneralSettingsController::class, 'store'])->name('general.store');

        // Integrations
        Route::get('integrations-list', [\App\Http\Controllers\WorkspaceIntegrationPageController::class, 'index'])->name('integrations');

        // Billing
        Route::get('assinatura', [\App\Http\Controllers\BillingController::class, 'index'])->name('billing.index');
        Route::post('assinatura/upgrade', [\App\Http\Controllers\BillingController::class, 'upgrade'])->name('billing.upgrade');
        Route::post('assinatura/ativar', [\App\Http\Controllers\BillingController::class, 'activate'])->name('billing.activate');
        // Appearance
        Route::get('estilo', [\App\Http\Controllers\AppearanceController::class, 'index'])->name('visual_settings');
        Route::patch('aparencia', [\App\Http\Controllers\AppearanceController::class, 'update'])->name('appearance.update');
    });
});

// --- PORTAL DO CLIENTE ---
Route::prefix('p/{workspace}')->name('portal.')->group(function () {
    Route::get('/', function (\App\Models\Workspace $workspace) {
        return redirect()->route('portal.schedule', $workspace->slug);
    })->name('public');

    Route::get('/login', function (\App\Models\Workspace $workspace) {
        return Inertia::render('Portal/Login', [
            'workspace' => $workspace,
            'initialIdentifier' => request('identifier')
        ]);
    })->name('login');

    Route::get('/agendar', function (\App\Models\Workspace $workspace) {
        $workspace->load(['services', 'professionals', 'photos']);
        
        $openingHours = \App\Models\ProfessionalSchedule::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->get()
            ->groupBy('weekday')
            ->map(function ($daySchedules) {
                return [
                    'start_time' => collect($daySchedules)->min('start_time'),
                    'end_time'   => collect($daySchedules)->max('end_time'),
                ];
            });

        return Inertia::render('Portal/Schedule', [
            'workspace' => $workspace,
            'customer' => Auth::guard('customer')->user(),
            'openingHours' => $openingHours
        ]);
    })->name('schedule');

    Route::middleware(['auth:customer', 'customer.workspace'])->group(function () {
        Route::get('/dashboard', function (\App\Models\Workspace $workspace) {
            $customer = Auth::guard('customer')->user();

            return Inertia::render('Portal/Dashboard', [
                'workspace' => $workspace,
                'customer' => $customer,
                'nextAppointment' => $customer->appointments()
                    ->with(['service', 'professional'])
                    ->whereIn('status', ['scheduled', 'confirmed'])
                    ->where('starts_at', '>=', now())
                    ->orderBy('starts_at')
                    ->first(),
            ]);
        })->name('dashboard');

        Route::get('/agendamentos', function (\App\Models\Workspace $workspace) {
            return Inertia::render('Portal/Appointments', [
                'workspace' => $workspace,
                'appointments' => Auth::guard('customer')->user()->appointments()->with(['service', 'professional'])->get()
            ]);
        })->name('appointments');

        Route::get('/faturas', function (\App\Models\Workspace $workspace) {
            return Inertia::render('Portal/Charges', ['workspace' => $workspace]);
        })->name('charges');

        Route::get('/perfil', [\App\Http\Controllers\PortalProfileController::class, 'show'])->name('profile');
        Route::put('/perfil', [\App\Http\Controllers\PortalProfileController::class, 'update'])->name('profile.update');

        // Appointment Management
        Route::post('/agendamentos/{appointment}/cancel', [\App\Http\Controllers\Portal\PortalAppointmentController::class, 'cancel'])->name('appointments.cancel');
        Route::put('/agendamentos/{appointment}/reschedule', [\App\Http\Controllers\Portal\PortalAppointmentController::class, 'reschedule'])->name('appointments.reschedule');

        Route::post('/logout', [\App\Http\Controllers\Api\CustomerAuthController::class, 'logout'])->name('logout');
    });

    // Auth & Scheduling
    Route::post('/auth/send-token', [\App\Http\Controllers\Api\CustomerAuthController::class, 'sendToken'])->name('auth.send-token')->middleware('throttle:3,1');
    Route::post('/auth/verify-token', [\App\Http\Controllers\Api\CustomerAuthController::class, 'verifyToken'])->name('auth.verify-token')->middleware('throttle:10,1');

    Route::prefix('scheduling')->name('scheduling.')->group(function () {
        Route::get('/services', [\App\Http\Controllers\Api\PublicSchedulingController::class, 'getServices'])->name('services');
        Route::get('/services/{service}/professionals', [\App\Http\Controllers\Api\PublicSchedulingController::class, 'getProfessionals'])->name('professionals');
        Route::get('/availability', [\App\Http\Controllers\Api\PublicSchedulingController::class, 'getAvailability'])->name('availability');
        Route::post('/book', [\App\Http\Controllers\Api\PublicSchedulingController::class, 'store'])->name('book')->middleware('throttle:5,1');
    });
});
