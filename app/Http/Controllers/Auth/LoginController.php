<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $username = $request->input('username');
        $password = $request->input('password');

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
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        session()->forget(['loggedin','role','username','validator_id','name']);
        return redirect('/login');
    }
}
