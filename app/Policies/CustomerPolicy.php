<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function view(User $user, Customer $customer): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function update(User $user, Customer $customer): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function restore(User $user, Customer $customer): bool
    {
        return $user->role === 'admin';
    }

    public function forceDelete(User $user, Customer $customer): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Customer $customer): bool
    {
        return true;
    }
}
