<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Appointment;
use Illuminate\Auth\Access\Response;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['admin', 'manager', 'operator']);
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['admin', 'manager']);
    }
}
