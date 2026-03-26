<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'clinic_id',
        'key',
        'value',
    ];

    /**
     * Get setting value by key.
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set setting value by key.
     */
    public static function set(string $key, $value)
    {
        return self::updateOrCreate(
            [
                'clinic_id' => auth()->user()->clinic_id,
                'key' => $key
            ],
            ['value' => $value]
        );
    }
}
