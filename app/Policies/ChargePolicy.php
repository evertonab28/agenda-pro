<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Charge;
use Illuminate\Auth\Access\Response;

class ChargePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Charge $charge): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Charge $charge): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine whether the user can delete the model (cancel charge).
     */
    public function delete(User $user, Charge $charge): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine whether the user can receive payment.
     */
    public function receive(User $user, Charge $charge): bool
    {
        return true; // operator can receive payment, but cannot cancel
    }
}
