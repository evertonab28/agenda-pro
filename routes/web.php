<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardPageController;

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::get('/dashboard', [DashboardPageController::class, 'index'])->name('dashboard');
Route::get('/dashboard/day/{date}', [DashboardPageController::class, 'dayDetails'])->name('dashboard.day');
Route::get('/dashboard/export', [DashboardPageController::class, 'export'])->name('dashboard.export');
