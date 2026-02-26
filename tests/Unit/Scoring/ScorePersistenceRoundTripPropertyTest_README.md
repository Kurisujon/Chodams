# Score Persistence Round Trip Property Test

## Overview
This property-based test validates **Property 13: Score Persistence Round Trip** from the beneficiary scoring system design.

**Feature**: beneficiary-scoring-system, Property 13: Score Persistence Round Trip  
**Validates**: Requirements 10.2, 10.3

## Property Statement
*For any beneficiary with calculated survey data, after computing and saving the Priority_Score to the database, retrieving the beneficiary should return the same score value.*

## Test Cases Implemented

### 1. `calculated_score_persists_correctly_to_database()`
- **Iterations**: 100
- **Purpose**: Validates that calculated scores persist exactly to the database
- **Verification**:
  - Returned score matches calculated score
  - Persisted score matches calculated score
  - `score_calculated_at` timestamp is set

### 2. `score_precision_is_maintained_through_persistence()`
- **Iterations**: 50
- **Purpose**: Validates that score precision is maintained (2 decimal places)
- **Verification**:
  - Retrieved score matches calculated score within 0.01 tolerance

### 3. `multiple_save_operations_produce_consistent_results()`
- **Iterations**: 30 (with 5 saves per iteration)
- **Purpose**: Validates that recalculating and saving multiple times produces consistent results
- **Verification**:
  - All save operations produce identical scores
  - Final persisted score matches all calculated scores

### 4. `score_retrieval_is_independent_of_calculation()`
- **Iterations**: 50
- **Purpose**: Validates that scores can be retrieved without recalculation
- **Verification**:
  - Score is available directly from database
  - Retrieved score matches calculated score

### 5. `score_persists_with_missing_data()`
- **Iterations**: 50
- **Purpose**: Validates that scores persist correctly even with incomplete data
- **Verification**:
  - Scores persist correctly when some survey fields are missing
  - Partial scores are handled properly

### 6. `score_timestamp_is_updated_on_recalculation()`
- **Iterations**: 30
- **Purpose**: Validates that `score_calculated_at` timestamp updates on recalculation
- **Verification**:
  - Timestamp is set on first calculation
  - Timestamp is updated on subsequent calculations

## Running the Test

### Prerequisites
- MySQL database must be running
- Database connection configured in `.env` or `phpunit.xml`
- All database migrations must be run

### Command
```bash
php artisan test tests/Unit/Scoring/ScorePersistenceRoundTripPropertyTest.php
```

### Expected Output
All 6 tests should pass, validating that:
- Scores persist correctly to the database
- Precision is maintained
- Multiple saves are consistent
- Retrieval works independently
- Missing data is handled
- Timestamps are updated

## Database Requirements

The test requires the following tables:
- `survey` - Main survey table with `priority_score` and `score_calculated_at` columns
- `classification` - Classification data
- `household` - Household information
- `economic` - Economic/income data

## Test Data Generation

The test uses the following helper functions:
- `generateRandomSurveyData()` - Generates complete random survey data
- `generateSurveyDataWithMissingFields()` - Generates survey data with random missing fields

## Notes

- The test uses `RefreshDatabase` trait to ensure clean state between iterations
- Each iteration creates a new survey with related data
- Data is cleaned up after each iteration to prevent database bloat
- The test validates both the service layer and database persistence
- Total iterations: 280 (100 + 50 + 30 + 50 + 50 + 30)

## Troubleshooting

### Database Connection Error
If you see "No connection could be made because the target machine actively refused it":
1. Ensure MySQL/MariaDB is running
2. Check database credentials in `.env`
3. Verify database exists

### SQLite Driver Not Found
If you see "could not find driver" with SQLite:
1. Enable SQLite extension in `php.ini`
2. Or use MySQL instead (recommended for this test)

### Aria Recovery Failed
If MySQL fails to start with Aria recovery error:
1. Run `aria_chk -r` on Aria tables
2. Delete `aria_log.########` files
3. Or reinstall XAMPP/MySQL

## Implementation Details

The test creates realistic survey data by:
1. Creating a survey record
2. Adding classification data (mapped from text to numeric values)
3. Adding household data (ownership, structure, utilities)
4. Adding economic data (income ranges)

The test then:
1. Calculates the expected score using `ScoreCalculator`
2. Uses `BeneficiaryScoreService` to calculate and save
3. Retrieves the survey from database
4. Compares all values for equality

This ensures the entire persistence pipeline works correctly.
