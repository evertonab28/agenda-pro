<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Service;

class ServicePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function view(User $user, Service $service): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function update(User $user, Service $service): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function delete(User $user, Service $service): bool
    {
        return $user->role === 'admin';
    }
}
