<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\ChargeController;
use App\Http\Controllers\Api\MessagingWebhookController;
use App\Http\Controllers\Api\DashboardController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('customers', CustomerController::class)->names('api.customers');
    Route::apiResource('services', ServiceController::class)->names('api.services');

    Route::get('appointments', [AppointmentController::class, 'index']);
    Route::post('appointments', [AppointmentController::class, 'store']);
    Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
    Route::patch('appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);

    Route::patch('charges/{charge}/mark-paid', [ChargeController::class, 'markPaid']);

    Route::get('dashboard/overview', [DashboardController::class, 'overview']);
    Route::get('dashboard/timeseries', [DashboardController::class, 'timeseries']);
    Route::get('dashboard/pending-charges', [DashboardController::class, 'pendingCharges']);
});


Route::get('p/{workspace}/charges', [\App\Http\Controllers\Api\ChargeController::class, 'portalIndex'])->middleware(['auth:customer', 'customer.workspace']);

Route::get('appointments/{appointment}/confirm/{token}', [AppointmentController::class, 'confirm']);
Route::post('webhooks/messaging/inbound', [MessagingWebhookController::class, 'inbound'])->middleware('throttle:6,1');
