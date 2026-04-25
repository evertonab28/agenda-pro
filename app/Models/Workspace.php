<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'status', 'theme_preset', 'min_advance_hours', 'max_advance_days',
        'public_name', 'public_description', 'logo_url', 'cover_url',
        'address_street', 'address_number', 'address_complement', 'address_district', 
        'address_city', 'address_state', 'address_zip', 'latitude', 'longitude',
        'whatsapp_number', 'instagram_handle', 'show_location', 'show_contact_button'
    ];

    protected $casts = [
        'min_advance_hours'   => 'integer',
        'max_advance_days'    => 'integer',
        'show_location'       => 'boolean',
        'show_contact_button' => 'boolean',
        'latitude'            => 'decimal:8',
        'longitude'           => 'decimal:8',
    ];

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
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

    public function subscriptions()
    {
        return $this->hasMany(WorkspaceSubscription::class);
    }

    public function subscription()
    {
        return $this->hasOne(WorkspaceSubscription::class)->latestOfMany();
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }

    public function billingInvoices()
    {
        return $this->hasMany(WorkspaceBillingInvoice::class);
    }
}
