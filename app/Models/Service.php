<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
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