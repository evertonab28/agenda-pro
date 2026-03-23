<?php

namespace App\Policies;

use App\Models\Package;
use App\Models\User;

class PackagePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function view(User $user, Package $package): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function update(User $user, Package $package): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function delete(User $user, Package $package): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function sell(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }
}
