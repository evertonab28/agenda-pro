<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAuthToken;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CustomerAuthController extends Controller
{
    public function sendToken(Request $request, Workspace $workspace)
    {
        $request->validate([
            'identifier' => 'required', // phone or email
            'name' => 'nullable|string|max:255', // only for new users
        ]);

        $rawIdentifier = $request->identifier;
        $phoneIdentifier = preg_replace('/\D/', '', $rawIdentifier);

        $customer = Customer::where('workspace_id', $workspace->id)
            ->where(function($q) use ($phoneIdentifier, $rawIdentifier) {
                $isEmail = filter_var($rawIdentifier, FILTER_VALIDATE_EMAIL);
                if ($isEmail) {
                    $q->where('email', $rawIdentifier);
                    if ($phoneIdentifier) {
                        $q->orWhere('phone', $phoneIdentifier);
                    }
                } else {
                    $q->where('phone', $phoneIdentifier);
                }
            })->first();

        if (!$customer) {
            if (!$request->name) {
                return response()->json([
                    'ok' => true,
                    'requires_name' => true,
                    'message' => 'Novo por aqui? Informe seu nome completo para continuar.'
                ]);
            }

            // Create new customer for first access
            $isEmail = filter_var($rawIdentifier, FILTER_VALIDATE_EMAIL);
            $customer = Customer::create([
                'workspace_id' => $workspace->id,
                'name' => $request->name,
                'phone' => !$isEmail ? $phoneIdentifier : null,
                'email' => $isEmail ? $rawIdentifier : null,
                'is_active' => true,
            ]);
        }

        // 1. Invalidar tokens anteriores
        CustomerAuthToken::where('customer_id', $customer->id)->delete();

        // 2. Gerar novo token de 6 dígitos
        $token = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        CustomerAuthToken::create([
            'customer_id' => $customer->id,
            'token' => $token,
            'expires_at' => now()->addMinutes(15),
        ]);

        // 3. Simular envio (WhatsApp/Email Mock)
        Log::info("MAGIC LINK OTP para {$customer->name} ({$workspace->slug}): {$token}");

        return response()->json([
            'ok' => true,
            'message' => 'Código de acesso enviado com sucesso!'
        ]);
    }

    /**
     * Passo 2: Validar Token e Login
     */
    public function verifyToken(Request $request, Workspace $workspace)
    {
        $request->validate([
            'identifier' => 'required',
            'token' => 'required|string|size:6',
        ]);

        $rawIdentifier = $request->identifier;
        $phoneIdentifier = preg_replace('/\D/', '', $rawIdentifier);

        $customer = Customer::where('workspace_id', $workspace->id)
            ->where(function($q) use ($phoneIdentifier, $rawIdentifier) {
                $isEmail = filter_var($rawIdentifier, FILTER_VALIDATE_EMAIL);
                if ($isEmail) {
                    $q->where('email', $rawIdentifier);
                    if ($phoneIdentifier) {
                        $q->orWhere('phone', $phoneIdentifier);
                    }
                } else {
                    $q->where('phone', $phoneIdentifier);
                }
            })->first();

        if (!$customer) {
            return response()->json(['ok' => false, 'message' => 'Código inválido ou cliente não encontrado'], 401);
        }

        $authToken = CustomerAuthToken::where('customer_id', $customer->id)
            ->latest()
            ->first();

        if (!$authToken || !$authToken->isValid()) {
            return response()->json(['ok' => false, 'message' => 'Código inválido ou expirado'], 401);
        }

        if ($authToken->token !== $request->token) {
            $authToken->increment('attempts');
            return response()->json(['ok' => false, 'message' => 'Código incorreto'], 401);
        }

        // Login sucesso
        Auth::guard('customer')->login($customer);
        $authToken->delete();

        return response()->json(['ok' => true, 'redirect' => route('portal.dashboard', $workspace->slug)]);
    }

    public function logout(Request $request, Workspace $workspace)
    {
        Auth::guard('customer')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('portal.login', $workspace->slug);
    }
}
