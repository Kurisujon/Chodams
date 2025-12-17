<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'nullable|string',
            'email' => 'nullable|email',
            'password' => 'required|string',
        ]);

        $username = $request->input('username');
        $email = $request->input('email');
        $password = $request->input('password');

        if (is_string($email) && $email !== '') {
            if (Auth::attempt(['email' => $email, 'password' => $password], $request->boolean('remember'))) {
                $request->session()->regenerate();

                return redirect()->intended(RouteServiceProvider::HOME);
            }

            return back()->withErrors(['email' => 'The provided credentials do not match our records.']);
        }

        if (!is_string($username) || $username === '') {
            return back()->withErrors(['error' => 'Invalid username or password.']);
        }

        $admin = DB::table('admin')
            ->select('username', 'password')
            ->whereRaw('LOWER(username) = ?', [strtolower($username)])
            ->first();

        if ($admin) {
            $adminPassword = (string)$admin->password;
            $isValid = ($adminPassword !== '' && password_verify($password, $adminPassword))
                || $password === $adminPassword
                || (md5($password) === $adminPassword);
            if ($isValid) {
                $request->session()->regenerate();
                session([ 'loggedin' => true, 'role' => 'admin', 'username' => $admin->username ]);
                return redirect('/admin/dashboard');
            }
        }

        $validator = DB::table('validator')
            ->select('validator_id', 'name', 'username', 'password')
            ->whereRaw('LOWER(username) = ?', [strtolower($username)])
            ->where('status', 'approved')
            ->first();

        if ($validator) {
            $stored = (string)$validator->password;
            $valid = ($stored !== '' && password_verify($password, $stored))
                || $password === $stored
                || (md5($password) === $stored);
        } else {
            $valid = false;
        }
        if ($validator && $valid) {
            session([
                'loggedin' => true,
                'role' => 'validator',
                'username' => $validator->username,
                'validator_id' => $validator->validator_id,
                'name' => $validator->name,
            ]);
            return redirect('/validator/dashboard');
        }

        return back()->withErrors([ 'error' => 'Invalid username or password.' ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        session()->forget(['loggedin','role','username','validator_id','name']);
        return redirect('/login');
    }
}
