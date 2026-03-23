<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Professional;

class ProfessionalPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function view(User $user, Professional $professional): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function update(User $user, Professional $professional): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }

    public function delete(User $user, Professional $professional): bool
    {
        return $user->role === 'admin';
    }
}
