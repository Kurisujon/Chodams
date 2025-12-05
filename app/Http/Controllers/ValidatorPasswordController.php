<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\ValidatorResetPasswordMail;

class ValidatorPasswordController extends Controller
{
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $email = strtolower(trim($request->input('email')));
        $row = DB::table('validator')->select('validator_id','email','name','status')->where('email',$email)->first();
        if (!$row || ($row->status ?? '') !== 'approved') {
            return response()->json(['success' => true, 'message' => 'If this email exists, a reset link will be sent']);
        }
        $token = Str::random(64);
        DB::table('password_resets')->updateOrInsert(
            ['email' => $email],
            ['token' => $token, 'created_at' => now()]
        );
        try { Mail::to($email)->send(new ValidatorResetPasswordMail($email, $token)); } catch (\Throwable $e) { Log::warning('Mail send failed', ['email' => $email, 'error' => $e->getMessage()]); }
        return response()->json(['success' => true, 'message' => 'Reset link sent']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate(['token' => 'required|string', 'password' => 'required|string|min:8']);
        $token = $request->input('token');
        $row = DB::table('password_resets')->where('token',$token)->first();
        if (!$row) {
            return response()->json(['success' => false, 'message' => 'Invalid token'], 422);
        }
        $created = Carbon::parse($row->created_at);
        if ($created->diffInMinutes(now()) > 30) {
            DB::table('password_resets')->where('email',$row->email)->delete();
            return response()->json(['success' => false, 'message' => 'Token expired'], 422);
        }
        $updated = DB::table('validator')->where('email',$row->email)->update(['password' => Hash::make($request->input('password'))]);
        DB::table('password_resets')->where('email',$row->email)->delete();
        if ($updated) {
            $v = DB::table('validator')->select('validator_id','name','email')->where('email',$row->email)->first();
            DB::table('notifications')->insert([
                'type' => 'validator_password_reset',
                'title' => 'Password changed',
                'payload' => json_encode(['validator_id' => $v->validator_id ?? null, 'name' => $v->name ?? null, 'email' => $v->email ?? null]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        if ($updated === 0) {
            return response()->json(['success' => false, 'message' => 'Account not found'], 404);
        }
        return response()->json(['success' => true, 'message' => 'Password updated']);
    }

    public function showResetForm(Request $request)
    {
        $token = (string)$request->query('token', '');
        $email = (string)$request->query('email', '');
        return view('auth.validator_reset_form', ['token' => $token, 'email' => $email]);
    }

    public function submitResetForm(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        $token = $request->input('token');
        $row = DB::table('password_resets')->where('token',$token)->first();
        if (!$row) {
            return redirect()->back()->withErrors(['token' => 'Invalid token']);
        }
        $created = Carbon::parse($row->created_at);
        if ($created->diffInMinutes(now()) > 30) {
            DB::table('password_resets')->where('email',$row->email)->delete();
            return redirect()->back()->withErrors(['token' => 'Token expired']);
        }
        DB::table('validator')->where('email',$row->email)->update(['password' => Hash::make($request->input('password'))]);
        DB::table('password_resets')->where('email',$row->email)->delete();
        $v = DB::table('validator')->select('validator_id','name','email')->where('email',$row->email)->first();
        DB::table('notifications')->insert([
            'type' => 'validator_password_reset',
            'title' => 'Password changed',
            'payload' => json_encode(['validator_id' => $v->validator_id ?? null, 'name' => $v->name ?? null, 'email' => $v->email ?? null]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return view('auth.validator_reset_success');
    }
}
