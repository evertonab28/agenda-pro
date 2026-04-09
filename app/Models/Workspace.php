<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'status'];

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function professionals()
    {
        return $this->hasMany(Professional::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function integrations()
    {
        return $this->hasMany(WorkspaceIntegration::class);
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }
}
