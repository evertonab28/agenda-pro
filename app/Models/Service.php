<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Service extends Model
{
    use HasFactory;
protected $fillable = [
'name', 'duration_minutes', 'price', 'active',
];

protected $casts = [
'active' => 'boolean',
'price' => 'decimal:2',
];

public function appointments(): HasMany
{
return $this->hasMany(Appointment::class);
}
}