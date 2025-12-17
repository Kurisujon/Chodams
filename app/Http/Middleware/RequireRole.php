<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireRole
{
    public function handle(Request $request, Closure $next, $role)
    {
        $loggedin = session('loggedin');
        $currentRole = session('role');
        if (!$loggedin || $currentRole !== $role) {
            if ($request->expectsJson() || $request->is('admin/api/*') || $request->is('validator/api/*')) {
                return response()->json(['message' => 'Log in first before can continue to this'], 401);
            }
            return redirect()->route('login')->withErrors(['error' => 'Log in first before can continue to this']);
        }
        return $next($request);
    }
}

