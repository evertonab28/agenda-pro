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
            'status.*' => ['string', 'in:confirmed,completed,no_show,pending,cancelled'],
            'professional_id' => ['nullable', 'integer'],
            'service_id' => ['nullable', 'integer'],
        ];
    }

    protected function prepareForValidation()
    {
        // Fallback for when 'from' > 'to'
        if ($this->has('from') && $this->has('to')) {
            $from = strtotime($this->from);
            $to = strtotime($this->to);
            if ($from > $to) {
                // Swap them elegantly
                $this->merge([
                    'from' => $this->to,
                    'to' => $this->from,
                ]);
            }
        }
    }
}
