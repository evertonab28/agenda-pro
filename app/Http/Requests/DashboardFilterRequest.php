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
            'pending_page' => ['nullable', 'integer', 'min:1'],
            'pending_search' => ['nullable', 'string', 'max:255'],
            'pending_status' => ['nullable', 'string', 'in:pending,overdue,all'],
        ];
    }

    protected function prepareForValidation()
    {
        if ($this->has('from') && $this->has('to')) {
            $from = strtotime($this->from);
            $to = strtotime($this->to);
            if ($from > $to) {
                $this->merge([
                    'from' => $this->to,
                    'to' => $this->from,
                ]);
            }
        }
    }
}
