# Beneficiary Duplication Validation - Implementation Documentation

## Overview

This document outlines the requirements and implementation plan for adding beneficiary duplication validation to the CHODAMS system. Currently, the system only validates tag number uniqueness but does not prevent duplicate beneficiary entries based on personal information.

## Current State Analysis

### What's Already Implemented ✅

#### 1. Tag Number Duplication Prevention
- **Location:** `app/Http/Controllers/ValidatorDashboardController.php` - `createSurvey()` method
- **Mechanism:** 
  - Retry loop (up to 5 attempts) when MySQL error 1062 occurs
  - Automatic tag number regeneration on collision
  - Database-level unique constraint on `demographic.tag_number`
  - Thread-safe generation using `lockForUpdate()`

```php
// Current implementation (lines 1494-1530)
while (true) {
    $attempts++;
    $tagNumber = $this->generateTagNumber($barangayVal);
    try {
        DB::table('demographic')->insert([...]);
        break;
    } catch (\Illuminate\Database\QueryException $e) {
        $isDuplicate = is_array($err) && isset($err[1]) && (int) $err[1] === 1062;
        if ($isDuplicate && $attempts < 5) {
            continue;
        }
        throw $e;
    }
}
```

### What's Missing ❌

#### 1. Beneficiary Name-Based Duplication Check
- No validation for duplicate first name + last name combinations
- No check for same person in same barangay
- No birth date comparison for identity verification

#### 2. Mobile Sync Duplication Validation
- **Location:** `submitSurveysBatch()` method
- **Current Behavior:** Only updates `is_submitted` flag (0 → 1)
- **Issue:** No duplication checks during mobile-to-web sync

#### 3. Web Survey Creation Validation
- No pre-insertion duplicate beneficiary check
- Relies solely on tag number uniqueness

## Problem Scenarios

### Scenario 1: Same Person, Multiple Surveys (Web)
**Current Behavior:**
1. Validator creates survey for "Juan Dela Cruz" from "Aplaya" born "1990-05-15"
2. Same validator creates another survey for "Juan Dela Cruz" from "Aplaya" born "1990-05-15"
3. System allows both entries with different tag numbers (e.g., A001, A002)

**Expected Behavior:**
- System should detect potential duplicate and warn/prevent creation

### Scenario 2: Mobile Sync Duplicate
**Current Behavior:**
1. Mobile app creates survey offline for "Maria Santos"
2. Web already has "Maria Santos" with same details
3. Sync proceeds without warning
4. Database now has duplicate beneficiary

**Expected Behavior:**
- Sync should detect duplicate and handle appropriately

### Scenario 3: Typo Variations
**Current Behavior:**
- "Juan Dela Cruz" and "Juan dela Cruz" treated as different people
- "Maria" and "Maria " (with trailing space) treated as different

**Expected Behavior:**
- Normalized comparison to catch variations

## Requirements

### Functional Requirements

#### FR-1: Duplicate Detection Criteria
The system shall consider a beneficiary as a potential duplicate if:
- **Exact Match:** `first_name` + `last_name` + `barangay` + `birth_date` match exactly
- **Soft Match:** `first_name` + `last_name` + `barangay` match (different birth dates)

#### FR-2: Web Survey Creation Validation
The system shall:
1. Check for duplicates BEFORE inserting into database
2. Return HTTP 422 with clear error message if duplicate found
3. Include the existing survey_id in the response
4. Allow admin override option (future enhancement)

#### FR-3: Mobile Sync Validation
The system shall:
1. Check for duplicates during `submitSurveysBatch` operation
2. Mark conflicting surveys with a flag
3. Return list of duplicate survey_ids to mobile app
4. Prevent submission of duplicate surveys

#### FR-4: Data Normalization
The system shall normalize data before comparison:
- Trim whitespace from names
- Convert to lowercase for comparison
- Handle null/empty values consistently
- Normalize special characters (e.g., "Ñ" vs "N")

#### FR-5: User Feedback
The system shall provide clear messages:
- "A beneficiary with this name and details already exists in [Barangay]"
- "Existing survey ID: [survey_id]"
- "Please verify if this is the same person"

### Non-Functional Requirements

#### NFR-1: Performance
- Duplicate check should complete within 500ms
- Use database indexes for efficient lookups
- Minimize impact on survey creation time

#### NFR-2: Data Integrity
- Use database transactions to prevent race conditions
- Maintain referential integrity
- Log all duplicate detection events

#### NFR-3: Backward Compatibility
- Existing surveys should not be affected
- No changes to database schema required initially
- Gradual rollout possible

## Implementation Plan

### Phase 1: Web Survey Creation Validation

#### Step 1.1: Create Duplicate Detection Service
**File:** `app/Services/BeneficiaryDuplicationService.php`

**Methods:**
```php
class BeneficiaryDuplicationService
{
    /**
     * Check if beneficiary already exists
     * 
     * @param array $beneficiaryData
     * @return array ['is_duplicate' => bool, 'existing_survey_id' => int|null, 'match_type' => string]
     */
    public function checkDuplicate(array $beneficiaryData): array;
    
    /**
     * Normalize name for comparison
     * 
     * @param string $name
     * @return string
     */
    protected function normalizeName(string $name): string;
    
    /**
     * Find exact matches
     * 
     * @param string $firstName
     * @param string $lastName
     * @param string $barangay
     * @param string $birthDate
     * @return Collection
     */
    protected function findExactMatches(string $firstName, string $lastName, string $barangay, string $birthDate): Collection;
    
    /**
     * Find soft matches (same name and barangay, different birth date)
     * 
     * @param string $firstName
     * @param string $lastName
     * @param string $barangay
     * @return Collection
     */
    protected function findSoftMatches(string $firstName, string $lastName, string $barangay): Collection;
}
```

#### Step 1.2: Integrate into createSurvey Method
**Location:** `app/Http/Controllers/ValidatorDashboardController.php`

**Changes:**
```php
public function createSurvey(Request $request)
{
    // ... existing validation code ...
    
    // NEW: Check for duplicate beneficiary
    $duplicationService = new BeneficiaryDuplicationService();
    $duplicateCheck = $duplicationService->checkDuplicate([
        'first_name' => trim($request->input('first_name')),
        'last_name' => trim($request->input('last_name')),
        'barangay' => trim($request->input('barangay')),
        'birth_date' => trim($request->input('birth_date')),
    ]);
    
    if ($duplicateCheck['is_duplicate']) {
        Log::warning('Duplicate beneficiary detected', [
            'validator_id' => $validator_id,
            'existing_survey_id' => $duplicateCheck['existing_survey_id'],
            'match_type' => $duplicateCheck['match_type'],
            'attempted_name' => $request->input('first_name') . ' ' . $request->input('last_name'),
        ]);
        
        return response()->json([
            'message' => 'A beneficiary with this name and details already exists.',
            'error_type' => 'duplicate_beneficiary',
            'existing_survey_id' => $duplicateCheck['existing_survey_id'],
            'match_type' => $duplicateCheck['match_type'],
        ], 422);
    }
    
    // ... continue with existing survey creation logic ...
}
```

#### Step 1.3: Add Frontend Handling
**Location:** `resources/js/Pages/SurveyForm.jsx` (or equivalent)

**Changes:**
- Catch 422 error with `error_type: 'duplicate_beneficiary'`
- Display modal with duplicate warning
- Show existing survey details
- Provide options: "Cancel" or "View Existing Survey"

### Phase 2: Mobile Sync Validation

#### Step 2.1: Update submitSurveysBatch Method
**Location:** `app/Http/Controllers/ValidatorDashboardController.php`

**Changes:**
```php
public function submitSurveysBatch(Request $request)
{
    $validator_id = session('validator_id');
    if (!$validator_id) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    $ids = $request->input('survey_ids');
    // ... existing validation ...
    
    // NEW: Check each survey for duplicates before submission
    $duplicationService = new BeneficiaryDuplicationService();
    $duplicates = [];
    $validIds = [];
    
    foreach ($ids as $surveyId) {
        // Get survey demographic data
        $demographic = DB::table('demographic')
            ->where('survey_id', $surveyId)
            ->first();
            
        if (!$demographic) {
            continue;
        }
        
        // Check for duplicates (excluding current survey)
        $duplicateCheck = $duplicationService->checkDuplicate([
            'first_name' => $demographic->first_name,
            'last_name' => $demographic->last_name,
            'barangay' => $demographic->barangay,
            'birth_date' => $demographic->birth_date,
        ], $surveyId); // Pass current survey_id to exclude from check
        
        if ($duplicateCheck['is_duplicate']) {
            $duplicates[] = [
                'survey_id' => $surveyId,
                'existing_survey_id' => $duplicateCheck['existing_survey_id'],
                'match_type' => $duplicateCheck['match_type'],
                'beneficiary_name' => $demographic->first_name . ' ' . $demographic->last_name,
            ];
        } else {
            $validIds[] = $surveyId;
        }
    }
    
    // Update only non-duplicate surveys
    if (!empty($validIds)) {
        $updated = DB::table('survey')
            ->where('validator_id', $validator_id)
            ->whereIn('survey_id', $validIds)
            ->where('is_submitted', 0)
            ->whereNull('deleted_at')
            ->update(['is_submitted' => 1]);
    }
    
    return response()->json([
        'updated' => count($validIds),
        'duplicates' => $duplicates,
        'has_duplicates' => !empty($duplicates),
    ]);
}
```

#### Step 2.2: Update Mobile App Sync Handler
**Location:** Mobile app sync service (Flutter/Dart)

**Changes:**
- Parse `duplicates` array from response
- Mark duplicate surveys with a flag in local database
- Show notification to user about duplicates
- Provide UI to review and resolve duplicates

### Phase 3: Database Optimization

#### Step 3.1: Add Composite Index
**File:** New migration `database/migrations/YYYY_MM_DD_add_beneficiary_duplicate_index.php`

```php
public function up(): void
{
    Schema::table('demographic', function (Blueprint $table) {
        // Add composite index for faster duplicate lookups
        $table->index(['first_name', 'last_name', 'barangay', 'birth_date'], 'idx_beneficiary_duplicate_check');
    });
}

public function down(): void
{
    Schema::table('demographic', function (Blueprint $table) {
        $table->dropIndex('idx_beneficiary_duplicate_check');
    });
}
```

#### Step 3.2: Add Duplicate Flag Column (Optional)
**File:** New migration `database/migrations/YYYY_MM_DD_add_duplicate_flag_to_survey.php`

```php
public function up(): void
{
    Schema::table('survey', function (Blueprint $table) {
        $table->boolean('is_potential_duplicate')->default(false)->after('is_submitted');
        $table->unsignedInteger('duplicate_of_survey_id')->nullable()->after('is_potential_duplicate');
    });
}
```

### Phase 4: Admin Resolution Interface

#### Step 4.1: Create Duplicate Management Page
**File:** `resources/js/Pages/AdminDuplicates.jsx`

**Features:**
- List all potential duplicate beneficiaries
- Side-by-side comparison view
- Merge duplicate records option
- Mark as "Not Duplicate" option
- Audit trail of resolution actions

## Testing Strategy

### Unit Tests

#### Test 1: Exact Match Detection
**File:** `tests/Unit/BeneficiaryDuplicationServiceTest.php`

```php
test('detects exact duplicate beneficiary', function () {
    // Create existing beneficiary
    $existingSurvey = createSurveyWithBeneficiary([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'barangay' => 'Aplaya',
        'birth_date' => '1990-05-15',
    ]);
    
    // Check for duplicate
    $service = new BeneficiaryDuplicationService();
    $result = $service->checkDuplicate([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'barangay' => 'Aplaya',
        'birth_date' => '1990-05-15',
    ]);
    
    expect($result['is_duplicate'])->toBeTrue();
    expect($result['existing_survey_id'])->toBe($existingSurvey->survey_id);
    expect($result['match_type'])->toBe('exact');
});
```

#### Test 2: Name Normalization
```php
test('normalizes names before comparison', function () {
    // Create with lowercase
    $existingSurvey = createSurveyWithBeneficiary([
        'first_name' => 'juan',
        'last_name' => 'dela cruz',
        'barangay' => 'Aplaya',
        'birth_date' => '1990-05-15',
    ]);
    
    // Check with uppercase
    $service = new BeneficiaryDuplicationService();
    $result = $service->checkDuplicate([
        'first_name' => 'JUAN',
        'last_name' => 'DELA CRUZ',
        'barangay' => 'Aplaya',
        'birth_date' => '1990-05-15',
    ]);
    
    expect($result['is_duplicate'])->toBeTrue();
});
```

#### Test 3: Soft Match Detection
```php
test('detects soft match with different birth dates', function () {
    $existingSurvey = createSurveyWithBeneficiary([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'barangay' => 'Balabag',
        'birth_date' => '1985-03-20',
    ]);
    
    $service = new BeneficiaryDuplicationService();
    $result = $service->checkDuplicate([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'barangay' => 'Balabag',
        'birth_date' => '1985-03-21', // Different date
    ]);
    
    expect($result['is_duplicate'])->toBeTrue();
    expect($result['match_type'])->toBe('soft');
});
```

### Integration Tests

#### Test 4: Web Survey Creation Rejection
**File:** `tests/Feature/SurveyDuplicationTest.php`

```php
test('createSurvey rejects duplicate beneficiary', function () {
    // Create first survey
    $firstResponse = $this->postJson('/validator/api/survey', [
        'first_name' => 'Pedro',
        'last_name' => 'Garcia',
        'barangay' => 'Cogon',
        'birth_date' => '1992-07-10',
        // ... other required fields
    ]);
    
    expect($firstResponse->status())->toBe(200);
    
    // Attempt to create duplicate
    $duplicateResponse = $this->postJson('/validator/api/survey', [
        'first_name' => 'Pedro',
        'last_name' => 'Garcia',
        'barangay' => 'Cogon',
        'birth_date' => '1992-07-10',
        // ... other required fields
    ]);
    
    expect($duplicateResponse->status())->toBe(422);
    expect($duplicateResponse->json('error_type'))->toBe('duplicate_beneficiary');
    expect($duplicateResponse->json('existing_survey_id'))->toBeInt();
});
```

#### Test 5: Mobile Sync Duplicate Detection
```php
test('submitSurveysBatch detects and reports duplicates', function () {
    // Create existing survey
    $existingSurvey = createSurveyWithBeneficiary([
        'first_name' => 'Ana',
        'last_name' => 'Reyes',
        'barangay' => 'Dawis',
        'birth_date' => '1988-11-25',
    ]);
    
    // Create unsubmitted survey with same details
    $duplicateSurvey = createSurveyWithBeneficiary([
        'first_name' => 'Ana',
        'last_name' => 'Reyes',
        'barangay' => 'Dawis',
        'birth_date' => '1988-11-25',
    ], ['is_submitted' => 0]);
    
    // Attempt batch submission
    $response = $this->postJson('/validator/api/submit-batch', [
        'survey_ids' => [$duplicateSurvey->survey_id],
    ]);
    
    expect($response->status())->toBe(200);
    expect($response->json('has_duplicates'))->toBeTrue();
    expect($response->json('duplicates'))->toHaveCount(1);
    expect($response->json('updated'))->toBe(0);
});
```

### Performance Tests

#### Test 6: Duplicate Check Performance
```php
test('duplicate check completes within 500ms', function () {
    // Create 1000 beneficiaries
    for ($i = 0; $i < 1000; $i++) {
        createSurveyWithBeneficiary([
            'first_name' => "Person{$i}",
            'last_name' => "Lastname{$i}",
            'barangay' => 'Aplaya',
            'birth_date' => '1990-01-01',
        ]);
    }
    
    $service = new BeneficiaryDuplicationService();
    
    $startTime = microtime(true);
    $result = $service->checkDuplicate([
        'first_name' => 'NewPerson',
        'last_name' => 'NewLastname',
        'barangay' => 'Aplaya',
        'birth_date' => '1990-01-01',
    ]);
    $endTime = microtime(true);
    
    $duration = ($endTime - $startTime) * 1000; // Convert to milliseconds
    
    expect($duration)->toBeLessThan(500);
});
```

## Rollout Plan

### Stage 1: Development & Testing (Week 1-2)
- [ ] Create `BeneficiaryDuplicationService` class
- [ ] Write unit tests for duplicate detection
- [ ] Implement name normalization logic
- [ ] Add composite index migration
- [ ] Test with sample data

### Stage 2: Web Integration (Week 3)
- [ ] Integrate service into `createSurvey` method
- [ ] Add error handling and logging
- [ ] Update frontend to handle duplicate errors
- [ ] Create duplicate warning modal
- [ ] Conduct integration testing

### Stage 3: Mobile Sync Integration (Week 4)
- [ ] Update `submitSurveysBatch` method
- [ ] Add duplicate detection logic
- [ ] Update mobile app sync handler
- [ ] Test mobile-to-web sync scenarios
- [ ] Handle edge cases

### Stage 4: Admin Tools (Week 5)
- [ ] Create duplicate management page
- [ ] Implement merge functionality
- [ ] Add resolution workflow
- [ ] Create audit trail
- [ ] User acceptance testing

### Stage 5: Production Deployment (Week 6)
- [ ] Deploy to staging environment
- [ ] Run performance tests
- [ ] Train validators on new workflow
- [ ] Deploy to production
- [ ] Monitor for issues

## Configuration Options

### Environment Variables
```env
# Enable/disable duplicate detection
BENEFICIARY_DUPLICATE_CHECK_ENABLED=true

# Match sensitivity (exact, soft, fuzzy)
BENEFICIARY_DUPLICATE_MATCH_TYPE=exact

# Allow admin override
BENEFICIARY_DUPLICATE_ALLOW_OVERRIDE=false

# Log duplicate attempts
BENEFICIARY_DUPLICATE_LOG_ATTEMPTS=true
```

### Config File
**File:** `config/beneficiary.php`

```php
return [
    'duplicate_detection' => [
        'enabled' => env('BENEFICIARY_DUPLICATE_CHECK_ENABLED', true),
        'match_type' => env('BENEFICIARY_DUPLICATE_MATCH_TYPE', 'exact'),
        'allow_override' => env('BENEFICIARY_DUPLICATE_ALLOW_OVERRIDE', false),
        'log_attempts' => env('BENEFICIARY_DUPLICATE_LOG_ATTEMPTS', true),
        
        // Fields to compare for duplicate detection
        'comparison_fields' => [
            'first_name',
            'last_name',
            'barangay',
            'birth_date',
        ],
        
        // Optional fields for enhanced matching
        'optional_fields' => [
            'middle_name',
            'contact_number',
        ],
    ],
];
```

## Logging & Monitoring

### Log Events

1. **Duplicate Detected:**
```php
Log::warning('Duplicate beneficiary detected', [
    'validator_id' => $validatorId,
    'existing_survey_id' => $existingSurveyId,
    'attempted_name' => $fullName,
    'match_type' => 'exact|soft',
    'timestamp' => now(),
]);
```

2. **Duplicate Allowed (Override):**
```php
Log::info('Duplicate beneficiary allowed by admin', [
    'admin_id' => $adminId,
    'existing_survey_id' => $existingSurveyId,
    'new_survey_id' => $newSurveyId,
    'reason' => $overrideReason,
]);
```

3. **Sync Duplicate Rejected:**
```php
Log::warning('Mobile sync duplicate rejected', [
    'validator_id' => $validatorId,
    'survey_id' => $surveyId,
    'existing_survey_id' => $existingSurveyId,
    'sync_batch_id' => $batchId,
]);
```

### Metrics to Track
- Number of duplicate attempts per day
- Number of duplicates prevented
- Average duplicate check time
- False positive rate
- Admin override frequency

## Edge Cases & Considerations

### Edge Case 1: Twins/Siblings
**Scenario:** Two people with same last name, same barangay, similar birth dates
**Solution:** Soft match warning, allow with confirmation

### Edge Case 2: Name Changes (Marriage)
**Scenario:** Same person, different last name
**Solution:** Not detected as duplicate (acceptable limitation)

### Edge Case 3: Data Entry Errors
**Scenario:** Typo in original entry, correct entry flagged as duplicate
**Solution:** Admin can mark as "Not Duplicate" and correct original

### Edge Case 4: Relocated Beneficiaries
**Scenario:** Same person moved to different barangay
**Solution:** Different barangay = not flagged as duplicate

### Edge Case 5: Offline Mobile Conflicts
**Scenario:** Two validators create same beneficiary offline
**Solution:** First to sync succeeds, second gets duplicate error

## Security Considerations

1. **Access Control:** Only authorized validators can create surveys
2. **Audit Trail:** All duplicate detections and resolutions logged
3. **Data Privacy:** Duplicate checks don't expose sensitive data
4. **SQL Injection:** Use parameterized queries for all database operations
5. **Rate Limiting:** Prevent abuse of duplicate check endpoint

## Future Enhancements

### Phase 2 Features
1. **Fuzzy Matching:** Use Levenshtein distance for name similarity
2. **Phonetic Matching:** Soundex/Metaphone for name variations
3. **Machine Learning:** Train model to detect duplicates with higher accuracy
4. **Bulk Duplicate Detection:** Scan existing database for duplicates
5. **Duplicate Merge Tool:** Combine duplicate records into single entry

### Phase 3 Features
1. **Real-time Duplicate Suggestions:** Show potential duplicates as user types
2. **Duplicate Score:** Confidence level (0-100%) for each match
3. **Historical Tracking:** Track beneficiary across multiple surveys over time
4. **Family Grouping:** Link related beneficiaries (household members)

## References

### Related Files
- `app/Http/Controllers/ValidatorDashboardController.php` - Main survey controller
- `app/Services/BeneficiaryDuplicationService.php` - New service (to be created)
- `database/migrations/2025_11_17_000001_create_survey_core_tables.php` - Schema
- `tests/Feature/SurveyValidationTest.php` - Existing tests

### Database Tables
- `survey` - Main survey table
- `demographic` - Beneficiary personal information
- `classification` - Beneficiary classification data

### API Endpoints
- `POST /validator/api/survey` - Create survey (web)
- `POST /validator/api/submit-batch` - Submit surveys (mobile sync)

## Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
| DevOps | | | |

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-13  
**Author:** Development Team  
**Status:** Draft - Pending Implementation
