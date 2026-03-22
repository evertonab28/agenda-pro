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

    Route::resource('customers', \App\Http\Controllers\CustomerController::class);
    Route::patch('customers/{customer}/status', [\App\Http\Controllers\CustomerController::class, 'toggleStatus'])->name('customers.status');
// });
