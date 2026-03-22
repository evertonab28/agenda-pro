<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AgendaStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'service_id' => 'required|exists:services,id',
            'professional_id' => 'required|exists:users,id',
            'starts_at' => 'required|date|after_or_equal:now',
            'ends_at' => 'required|date|after:starts_at',
            'status' => 'nullable|string|in:scheduled,confirmed,completed,no_show,canceled',
            'notes' => 'nullable|string',
        ];
    }

    public function messages()
    {
        return [
            'starts_at.after_or_equal' => 'Não é possível agendar no passado.',
            'ends_at.after' => 'O horário de término deve ser após o início.',
        ];
    }
}
