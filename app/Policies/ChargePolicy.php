<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Charge;
use Illuminate\Auth\Access\Response;

class ChargePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function view(User $user, Charge $charge): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function update(User $user, Charge $charge): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function delete(User $user, Charge $charge): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine whether the user can receive payment.
     */
    public function receive(User $user, Charge $charge): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }
}
