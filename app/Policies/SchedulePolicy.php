<?php

namespace App\Policies;

use App\Models\User;

class SchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }
}
