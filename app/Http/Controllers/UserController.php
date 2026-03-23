<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);
        return Inertia::render('Users/Index', [
            'users' => User::orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorize('create', User::class);
        return Inertia::render('Users/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', User::class);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:admin,manager,operator',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => 'active',
        ]);

        AuditService::log(auth()->user(), 'user.created', $user);

        return redirect()->route('users.index')->with('success', 'Usuário criado com sucesso.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);
        return Inertia::render('Users/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'role' => 'required|string|in:admin,manager,operator',
        ]);

        $user->update($request->only('name', 'email', 'role'));

        if ($request->filled('password')) {
            $request->validate([
                'password' => ['confirmed', Rules\Password::defaults()],
            ]);
            $user->update(['password' => Hash::make($request->password)]);
        }

        AuditService::log(auth()->user(), 'user.updated', $user);

        return redirect()->route('users.index')->with('success', 'Usuário atualizado com sucesso.');
    }

    /**
     * Toggle the status of the specified user.
     */
    public function toggleStatus(User $user)
    {
        $this->authorize('update', $user);
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Você não pode desativar sua própria conta.');
        }

        $user->update([
            'status' => $user->status === 'active' ? 'inactive' : 'active',
        ]);

        AuditService::log(auth()->user(), 'user.status_toggled', $user);

        return back()->with('success', 'Status do usuário atualizado.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Você não pode excluir sua própria conta.');
        }

        AuditService::log(auth()->user(), 'user.deleted', $user);
        $user->delete();

        return redirect()->route('users.index')->with('success', 'Usuário excluído com sucesso.');
    }
}
