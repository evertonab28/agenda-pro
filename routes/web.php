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
// });
