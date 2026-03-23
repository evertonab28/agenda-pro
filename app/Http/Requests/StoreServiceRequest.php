<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Service::class);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|unique:services,name',
            'duration_minutes' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'color' => ['nullable', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'is_active' => 'required|boolean',
            'description' => 'nullable|string',
        ];
    }
}
