<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DashboardFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', 'in:confirmed,completed,no_show,pending,canceled'],
            'professional_id' => ['nullable', 'integer'],
            'service_id' => ['nullable', 'integer'],
            'pending_page' => ['nullable', 'integer', 'min:1'],
            'pending_search' => ['nullable', 'string', 'max:255'],
            'pending_status' => ['nullable', 'string', 'in:pending,overdue,all'],
        ];
    }

    protected function prepareForValidation()
    {
        if ($this->has('from') && $this->has('to')) {
            $from = \Carbon\Carbon::parse($this->from);
            $to = \Carbon\Carbon::parse($this->to);
            if ($from->gt($to)) {
                $this->merge([
                    'from' => $this->to,
                    'to' => $this->from,
                ]);
            }
        }
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('from') && $this->has('to')) {
                $from = \Carbon\Carbon::parse($this->from);
                $to = \Carbon\Carbon::parse($this->to);
                if ($from->diffInDays($to) > 365) {
                    $validator->errors()->add('to', 'O período máximo de busca é de 365 dias.');
                }
            }
        });
    }
}
