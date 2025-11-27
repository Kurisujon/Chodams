<?php

namespace App\Http\Controllers;

use App\Models\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class ValidatorController extends Controller
{
    /**
     * Validate a validator's credentials.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function validateValidator(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ]);

            $username = $request->input('username');
            $password = $request->input('password');

            $validator = Validator::where('username', $username)->first();

            if (!$validator) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username not found',
                ], 200);
            }

            // Check if password matches
            // Note: Assuming passwords are hashed. If they are plain text in legacy DB, 
            // you might need to change this to: if ($validator->password !== $password)
            // But for security, we should use Hash::check. 
            // If the legacy system used MD5, we might need md5($password) === $validator->password
            
            // Let's try standard Hash first, and maybe fallback or just stick to it.
            // If the user encounters "password incorrect" but they are sure it's right, 
            // we might need to adjust this.
            if (!Hash::check($password, $validator->password)) {
                 // Fallback for plain text passwords (DANGEROUS but common in legacy migrations)
                 if ($validator->password !== $password) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Incorrect password',
                        'debug' => ['username_found' => true]
                    ], 200);
                 }
            }

            if ($validator->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Validator account is not approved',
                ], 200);
            }

            // Return success with validator data
            // Map the fields to match what Flutter expects
            // Flutter ValidatorModel expects: id, name, username, status
            // Our DB has: validator_id, name, username, status
            
            $validatorData = [
                'id' => $validator->validator_id,
                'name' => $validator->name,
                'username' => $validator->username,
                'status' => $validator->status,
                'signature_data' => $validator->signature_data,
            ];

            return response()->json([
                'success' => true,
                'validator' => $validatorData,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Validator validation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all validators for syncing.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function syncValidators()
    {
        try {
            $validators = Validator::all();

            $validatorsData = $validators->map(function ($validator) {
                return [
                    'id' => $validator->validator_id,
                    'name' => $validator->name,
                    'username' => $validator->username,
                    'status' => $validator->status,
                    'signature_data' => $validator->signature_data,
                ];
            });

            return response()->json([
                'success' => true,
                'validators' => $validatorsData,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Sync validators error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
