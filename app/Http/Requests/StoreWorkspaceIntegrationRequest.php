<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkspaceIntegrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage-integrations');
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:payment,messaging'],
            'provider' => ['required', 'string', function ($attribute, $value, $fail) {
                if ($this->type === 'payment' && !in_array($value, ['asaas', 'stripe'])) {
                    $fail("O provedor '$value' não é suportado para pagamentos.");
                }
                if ($this->type === 'messaging' && !in_array($value, ['whatsapp', 'evolution'])) {
                    $fail("O provedor '$value' não é suportado para mensageria.");
                }
            }],
            'credentials' => ['required', 'array'],
            'credentials.api_key' => ['required_if:provider,asaas'],
            'credentials.instance_name' => ['required_if:provider,evolution'],
        ];
    }
}
