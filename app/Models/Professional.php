<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Professional extends Model
{
    use HasFactory, \App\Traits\BelongsToTenant;

    protected $fillable = [
        'clinic_id',
        'name',
        'email',
        'phone',
        'specialty',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * The services that the professional provides.
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ProfessionalSchedule::class);
    }

    /**
     * The appointments for the professional.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
