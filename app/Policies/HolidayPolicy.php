<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Holiday;

class HolidayPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function update(User $user, Holiday $holiday): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function delete(User $user, Holiday $holiday): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }
}
