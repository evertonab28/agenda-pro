<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminWorkspaceController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

// Admin Login (guest only)
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AdminAuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AdminAuthController::class, 'login'])->name('login.post');
});

// Admin Protected Area
Route::prefix('admin')->name('admin.')->middleware(EnsureAdmin::class)->group(function () {
    Route::post('logout', [AdminAuthController::class, 'logout'])->name('logout');

    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('workspaces', [AdminWorkspaceController::class, 'index'])->name('workspaces.index');
    Route::get('workspaces/{id}', [AdminWorkspaceController::class, 'show'])->name('workspaces.show')->where('id', '[0-9]+');
    Route::put('workspaces/{id}/retention', [AdminWorkspaceController::class, 'updateRetention'])->name('workspaces.retention.update')->where('id', '[0-9]+');
});
