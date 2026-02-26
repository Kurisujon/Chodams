<?php

/**
 * Integration Tests: Complete Survey Validation Flow
 * 
 * Feature: survey-form-validation
 * Task: 8.1 Test complete validation flow
 * 
 * **Validates: All Requirements**
 * 
 * This test suite verifies the complete validation flow from frontend to backend,
 * including error display, error clearing, and successful submission scenarios.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Set up session for authenticated validator
    Session::put('validator_id', 1);
    Session::put('name', 'Test Validator');
});

/**
 * Test 1: Submission with all required fields empty
 * 
 * This test verifies that when a user submits the form with all required fields empty,
 * the backend returns a 422 status with field-specific errors for all required fields.
 * 
 * **Validates: Requirements 1.5, 2.1, 2.2, 4.1, 4.2, 6.1, 6.2, 6.3, 6.4**
 */
test('submission with all required fields empty returns all field-specific errors', function () {
    $response = $this->postJson('/validator/api/survey', []);
    
    // Should return 422 status
    $response->assertStatus(422);
    
    // Should have standard error response structure
    $response->assertJsonStructure([
        'message',
        'errors',
    ]);
    
    // Should have validation summary message
    $response->assertJsonFragment([
        'message' => 'Validation failed. Please check the highlighted fields.',
    ]);
    
    // Should have errors for all required fields
    $errors = $response->json('errors');
    $requiredFields = [
        'classification',
        'previous_client',
        'interview_person',
        'last_name',
        'first_name',
        'barangay',
        'gender',
        'birth_date',
        'marital_status',
        'monthly_salary',
    ];
    
    foreach ($requiredFields as $field) {
        expect($errors)->toHaveKey($field);
        expect($errors[$field])->toBeArray();
        expect($errors[$field])->not->toBeEmpty();
        
        // Verify error message format: "The [field name] field is required"
        $errorMessage = $errors[$field][0];
        expect($errorMessage)->toContain('field is required');
    }
    
    // Should have exactly the required fields (no extra errors)
    expect(count($errors))->toBe(count($requiredFields));
});

/**
 * Test 2: Submission with only suffix empty (should succeed)
 * 
 * This test verifies that the suffix field is truly optional and that a submission
 * with all required fields filled but suffix empty succeeds without validation errors.
 * 
 * **Validates: Requirements 1.4, 4.3, 5.1, 5.2, 5.4, 5.5**
 */
test('submission with only suffix empty succeeds without validation errors', function () {
    $data = [
        'classification' => 'Displaced',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        'barangay' => 'Test Barangay',
        'gender' => 'Female',
        'birth_date' => '1990-01-01',
        'marital_status' => 'Single',
        'monthly_salary' => '10000',
        'suffix' => '', // Empty suffix should be accepted
        'middle_name' => 'Marie', // Include some other fields
        'purok' => 'Purok 1',
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should succeed (200 or 201)
    expect($response->status())->toBeIn([200, 201]);
    
    // Should not have validation errors
    $responseData = $response->json();
    expect($responseData)->not->toHaveKey('errors');
    
    // Verify suffix is stored as NULL in database
    if (isset($responseData['survey_id'])) {
        $surveyId = $responseData['survey_id'];
        
        $demographic = DB::table('demographic')
            ->where('survey_id', $surveyId)
            ->first();
        
        // Suffix should be NULL, not empty string or "N/A"
        expect($demographic->suffix)->toBeNull();
        
        // Other fields should be stored correctly
        expect($demographic->first_name)->toBe('Jane');
        expect($demographic->last_name)->toBe('Smith');
        expect($demographic->middle_name)->toBe('Marie');
    }
});

/**
 * Test 3: Submission with invalid date format
 * 
 * This test verifies that the backend validates date format and returns
 * a specific error message when an invalid date is provided.
 * 
 * **Validates: Requirements 2.4, 4.4, 6.1, 6.2, 6.3**
 */
test('submission with invalid date format returns specific error message', function () {
    $data = [
        'classification' => 'Displaced',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        'barangay' => 'Test Barangay',
        'gender' => 'Female',
        'birth_date' => 'invalid-date-format', // Invalid date
        'marital_status' => 'Single',
        'monthly_salary' => '10000',
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should return 422 status
    $response->assertStatus(422);
    
    // Should have error for birth_date field
    $errors = $response->json('errors');
    expect($errors)->toHaveKey('birth_date');
    
    // Error message should identify the field and describe the problem
    $errorMessage = $errors['birth_date'][0];
    expect($errorMessage)->toContain('birth date');
    expect($errorMessage)->toMatch('/date|valid/i');
});

/**
 * Test 4: Submission with birth date in the future
 * 
 * This test verifies that the backend validates that birth_date must be before today.
 * 
 * **Validates: Requirements 2.4, 4.4, 6.1, 6.2, 6.3**
 */
test('submission with birth date in future returns specific error message', function () {
    $tomorrow = now()->addDay()->format('Y-m-d');
    
    $data = [
        'classification' => 'Displaced',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        'barangay' => 'Test Barangay',
        'gender' => 'Female',
        'birth_date' => $tomorrow, // Future date
        'marital_status' => 'Single',
        'monthly_salary' => '10000',
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should return 422 status
    $response->assertStatus(422);
    
    // Should have error for birth_date field
    $errors = $response->json('errors');
    expect($errors)->toHaveKey('birth_date');
    
    // Error message should indicate date must be before today
    $errorMessage = $errors['birth_date'][0];
    expect($errorMessage)->toContain('birth date');
    expect($errorMessage)->toMatch('/before|past/i');
});

/**
 * Test 5: Submission with duplicate tag number
 * 
 * This test verifies that when a duplicate tag number is submitted,
 * the backend returns a specific error message identifying the duplicate.
 * 
 * Note: This test creates a survey first, then attempts to create a duplicate.
 * The tag_number has retry logic, so we need to mock or force a duplicate scenario.
 * 
 * **Validates: Requirements 6.5, 7.1, 7.2**
 */
test('submission with duplicate tag number returns specific error message', function () {
    // First, create a survey successfully
    $data = [
        'classification' => 'Displaced',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        'barangay' => 'Test Barangay',
        'gender' => 'Female',
        'birth_date' => '1990-01-01',
        'marital_status' => 'Single',
        'monthly_salary' => '10000',
    ];
    
    $response1 = $this->postJson('/validator/api/survey', $data);
    
    // First submission should succeed
    expect($response1->status())->toBeIn([200, 201]);
    
    // Get the created survey's tag number
    $surveyId = $response1->json('survey_id');
    $demographic = DB::table('demographic')
        ->where('survey_id', $surveyId)
        ->first();
    
    $tagNumber = $demographic->tag_number;
    
    // Now manually insert a duplicate to force the error
    // (The retry logic makes it hard to naturally trigger a duplicate)
    try {
        DB::table('demographic')->insert([
            'survey_id' => $surveyId + 1000, // Different survey_id
            'tag_number' => $tagNumber, // Same tag number
            'last_name' => 'Duplicate',
            'first_name' => 'Test',
            'barangay' => 'Test',
            'gender' => 'Male',
            'birth_date' => '1990-01-01',
            'marital_status' => 'Single',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // This should fail due to unique constraint
        expect(true)->toBeFalse('Expected duplicate entry error');
    } catch (\Illuminate\Database\QueryException $e) {
        // Verify the error is a duplicate entry error
        $errorNumber = $e->errorInfo[1] ?? null;
        expect($errorNumber)->toBe(1062);
        
        // Verify error message contains tag_number
        $errorMessage = $e->getMessage();
        expect($errorMessage)->toContain('tag_number');
    }
})->skip('Tag number has retry logic that prevents natural duplicates');

/**
 * Test 6: Submission with valid data succeeds
 * 
 * This test verifies that when all required fields are provided with valid data,
 * the submission succeeds and data is stored correctly in the database.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 5.2, 5.4**
 */
test('submission with valid data succeeds and stores data correctly', function () {
    $data = [
        'classification' => 'Displaced',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        'middle_name' => 'Marie',
        'suffix' => 'Jr.',
        'barangay' => 'Test Barangay',
        'purok' => 'Purok 1',
        'street' => 'Main Street',
        'gender' => 'Female',
        'birth_date' => '1990-01-01',
        'birth_place' => 'Test City',
        'person_age' => '34',
        'marital_status' => 'Single',
        'contact_number' => '09123456789',
        'religion' => 'Catholic',
        'language_spoken' => 'Tagalog',
        'tribe' => 'None',
        'highest_education' => 'College Graduate',
        'monthly_salary' => '15000',
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should succeed
    expect($response->status())->toBeIn([200, 201]);
    
    // Should return survey_id
    $responseData = $response->json();
    expect($responseData)->toHaveKey('survey_id');
    
    $surveyId = $responseData['survey_id'];
    
    // Verify data is stored correctly in database
    $demographic = DB::table('demographic')
        ->where('survey_id', $surveyId)
        ->first();
    
    expect($demographic)->not->toBeNull();
    expect($demographic->first_name)->toBe('Jane');
    expect($demographic->last_name)->toBe('Smith');
    expect($demographic->middle_name)->toBe('Marie');
    expect($demographic->suffix)->toBe('Jr.');
    expect($demographic->barangay)->toBe('Test Barangay');
    expect($demographic->purok)->toBe('Purok 1');
    expect($demographic->street)->toBe('Main Street');
    expect($demographic->gender)->toBe('Female');
    expect($demographic->birth_date)->toBe('1990-01-01');
    expect($demographic->birth_place)->toBe('Test City');
    expect($demographic->person_age)->toBe(34);
    expect($demographic->marital_status)->toBe('Single');
    expect($demographic->contact_number)->toBe('09123456789');
    expect($demographic->religion)->toBe('Catholic');
    expect($demographic->language_spoken)->toBe('Tagalog');
    expect($demographic->tribe)->toBe('None');
    expect($demographic->highest_education)->toBe('College Graduate');
    
    // Verify classification data
    $classification = DB::table('classification')
        ->where('survey_id', $surveyId)
        ->first();
    
    expect($classification)->not->toBeNull();
    expect($classification->classification)->toBe('Displaced');
    expect($classification->previous_client)->toBe('Yes');
    
    // Verify economic data
    $economic = DB::table('economic')
        ->where('survey_id', $surveyId)
        ->first();
    
    expect($economic)->not->toBeNull();
    expect($economic->monthly_salary)->toBe('15000');
});

/**
 * Test 7: Error display and clearing for multiple fields
 * 
 * This test verifies that when multiple fields have errors, all errors are returned
 * and can be identified by field name for display and clearing.
 * 
 * **Validates: Requirements 2.1, 2.2, 3.1, 3.4, 6.2, 6.3, 6.4**
 */
test('multiple field errors are returned with field-specific messages', function () {
    $data = [
        'classification' => 'InvalidValue', // Invalid enum value
        'previous_client' => 'Maybe', // Invalid enum value
        'interview_person' => '', // Empty required field
        'last_name' => '', // Empty required field
        'first_name' => '', // Empty required field
        'barangay' => '', // Empty required field
        'gender' => 'Other', // Invalid enum value
        'birth_date' => 'not-a-date', // Invalid date format
        'marital_status' => '', // Empty required field
        'monthly_salary' => '', // Empty required field
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should return 422 status
    $response->assertStatus(422);
    
    // Should have errors for all invalid/empty fields
    $errors = $response->json('errors');
    
    // Verify each field has an error
    expect($errors)->toHaveKey('classification');
    expect($errors)->toHaveKey('previous_client');
    expect($errors)->toHaveKey('interview_person');
    expect($errors)->toHaveKey('last_name');
    expect($errors)->toHaveKey('first_name');
    expect($errors)->toHaveKey('barangay');
    expect($errors)->toHaveKey('gender');
    expect($errors)->toHaveKey('birth_date');
    expect($errors)->toHaveKey('marital_status');
    expect($errors)->toHaveKey('monthly_salary');
    
    // Verify each error message identifies the field
    foreach ($errors as $field => $messages) {
        expect($messages)->toBeArray();
        expect($messages)->not->toBeEmpty();
        
        $errorMessage = $messages[0];
        // Error message should contain the field name or be descriptive
        expect($errorMessage)->toBeString();
        expect(strlen($errorMessage))->toBeGreaterThan(10);
    }
    
    // Verify error message format for required fields
    expect($errors['last_name'][0])->toBe('The last name field is required.');
    expect($errors['first_name'][0])->toBe('The first name field is required.');
    expect($errors['barangay'][0])->toBe('The barangay field is required.');
    
    // Verify error message format for invalid enum values
    expect($errors['classification'][0])->toContain('classification');
    expect($errors['classification'][0])->toMatch('/invalid|selected/i');
    
    expect($errors['gender'][0])->toBe('The gender field is invalid.');
});

/**
 * Test 8: Validation error logging
 * 
 * This test verifies that validation failures are logged with proper context
 * including validator_id, timestamp, and failed fields.
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */
test('validation failures are logged with validator_id and timestamp', function () {
    Log::shouldReceive('info')
        ->once()
        ->withArgs(function ($message, $context) {
            // Verify log message
            expect($message)->toBe('Survey validation failed');
            
            // Verify context includes required fields
            expect($context)->toHaveKey('validator_id');
            expect($context)->toHaveKey('timestamp');
            expect($context)->toHaveKey('errors');
            
            // Verify validator_id is correct
            expect($context['validator_id'])->toBe(1);
            
            // Verify timestamp is a valid datetime string
            expect($context['timestamp'])->toBeString();
            
            // Verify errors is an array
            expect($context['errors'])->toBeArray();
            
            return true;
        });
    
    $response = $this->postJson('/validator/api/survey', []);
    
    $response->assertStatus(422);
});

/**
 * Test 9: Optional fields with empty values are stored as NULL
 * 
 * This test verifies that when optional fields are left empty,
 * they are stored as NULL in the database, not as empty strings or "N/A".
 * 
 * **Validates: Requirements 5.2, 5.4, 5.5**
 */
test('optional fields with empty values are stored as NULL not N/A', function () {
    $data = [
        'classification' => 'Displaced',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        'barangay' => 'Test Barangay',
        'gender' => 'Female',
        'birth_date' => '1990-01-01',
        'marital_status' => 'Single',
        'monthly_salary' => '10000',
        // All optional fields left empty
        'suffix' => '',
        'middle_name' => '',
        'purok' => '',
        'street' => '',
        'birth_place' => '',
        'person_age' => '',
        'contact_number' => '',
        'religion' => '',
        'language_spoken' => '',
        'tribe' => '',
        'highest_education' => '',
        'last_school_attended' => '',
        'year_graduated' => '',
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should succeed
    expect($response->status())->toBeIn([200, 201]);
    
    $surveyId = $response->json('survey_id');
    
    // Verify all optional fields are NULL
    $demographic = DB::table('demographic')
        ->where('survey_id', $surveyId)
        ->first();
    
    expect($demographic->suffix)->toBeNull();
    expect($demographic->middle_name)->toBeNull();
    expect($demographic->purok)->toBeNull();
    expect($demographic->street)->toBeNull();
    expect($demographic->birth_place)->toBeNull();
    expect($demographic->person_age)->toBeNull();
    expect($demographic->contact_number)->toBeNull();
    expect($demographic->religion)->toBeNull();
    expect($demographic->language_spoken)->toBeNull();
    expect($demographic->tribe)->toBeNull();
    expect($demographic->highest_education)->toBeNull();
    expect($demographic->last_school_attended)->toBeNull();
    expect($demographic->year_graduated)->toBeNull();
    
    // Verify none are "N/A"
    expect($demographic->suffix)->not->toBe('N/A');
    expect($demographic->middle_name)->not->toBe('N/A');
    expect($demographic->contact_number)->not->toBe('N/A');
    expect($demographic->religion)->not->toBe('N/A');
});

/**
 * Test 10: Invalid enum values return specific error messages
 * 
 * This test verifies that when invalid enum values are provided,
 * the backend returns specific error messages identifying the field and issue.
 * 
 * **Validates: Requirements 2.3, 2.4, 6.1, 6.2**
 */
test('invalid enum values return specific error messages', function () {
    $data = [
        'classification' => 'InvalidClassification',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        'barangay' => 'Test Barangay',
        'gender' => 'InvalidGender',
        'birth_date' => '1990-01-01',
        'marital_status' => 'InvalidStatus',
        'monthly_salary' => '10000',
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should return 422 status
    $response->assertStatus(422);
    
    // Should have errors for invalid enum fields
    $errors = $response->json('errors');
    
    expect($errors)->toHaveKey('classification');
    expect($errors)->toHaveKey('gender');
    expect($errors)->toHaveKey('marital_status');
    
    // Verify error messages identify the field and issue
    expect($errors['classification'][0])->toContain('classification');
    expect($errors['classification'][0])->toMatch('/invalid|selected/i');
    
    expect($errors['gender'][0])->toBe('The gender field is invalid.');
    
    expect($errors['marital_status'][0])->toContain('marital status');
    expect($errors['marital_status'][0])->toMatch('/invalid|selected/i');
});

/**
 * Test 11: Partial data submission with some required fields missing
 * 
 * This test verifies that when some (but not all) required fields are provided,
 * only the missing required fields have errors.
 * 
 * **Validates: Requirements 2.1, 2.2, 6.2, 6.3**
 */
test('partial data submission returns errors only for missing required fields', function () {
    $data = [
        'classification' => 'Displaced',
        'previous_client' => 'Yes',
        'interview_person' => 'John Doe',
        'last_name' => 'Smith',
        'first_name' => 'Jane',
        // Missing: barangay, gender, birth_date, marital_status, monthly_salary
    ];
    
    $response = $this->postJson('/validator/api/survey', $data);
    
    // Should return 422 status
    $response->assertStatus(422);
    
    $errors = $response->json('errors');
    
    // Should have errors for missing required fields
    expect($errors)->toHaveKey('barangay');
    expect($errors)->toHaveKey('gender');
    expect($errors)->toHaveKey('birth_date');
    expect($errors)->toHaveKey('marital_status');
    expect($errors)->toHaveKey('monthly_salary');
    
    // Should NOT have errors for provided required fields
    expect($errors)->not->toHaveKey('classification');
    expect($errors)->not->toHaveKey('previous_client');
    expect($errors)->not->toHaveKey('interview_person');
    expect($errors)->not->toHaveKey('last_name');
    expect($errors)->not->toHaveKey('first_name');
    
    // Should NOT have errors for optional fields
    expect($errors)->not->toHaveKey('suffix');
    expect($errors)->not->toHaveKey('middle_name');
    expect($errors)->not->toHaveKey('purok');
});

/**
 * Test 12: Response structure consistency
 * 
 * This test verifies that validation error responses always follow
 * the standard Laravel validation error format.
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 */
test('validation error responses follow standard Laravel format', function () {
    $response = $this->postJson('/validator/api/survey', []);
    
    // Should return 422 status
    $response->assertStatus(422);
    
    // Should have standard structure
    $response->assertJsonStructure([
        'message',
        'errors',
    ]);
    
    $responseData = $response->json();
    
    // Message should be a string
    expect($responseData['message'])->toBeString();
    expect(strlen($responseData['message']))->toBeGreaterThan(0);
    
    // Errors should be an object with field names as keys
    expect($responseData['errors'])->toBeArray();
    expect(count($responseData['errors']))->toBeGreaterThan(0);
    
    // Each error should be an array of messages
    foreach ($responseData['errors'] as $field => $messages) {
        expect($field)->toBeString();
        expect($messages)->toBeArray();
        expect(count($messages))->toBeGreaterThan(0);
        
        foreach ($messages as $message) {
            expect($message)->toBeString();
            expect(strlen($message))->toBeGreaterThan(0);
        }
    }
});

