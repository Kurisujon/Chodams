# Services

This directory contains service layer classes that encapsulate business logic.

## BeneficiaryScoreService

The `BeneficiaryScoreService` is responsible for calculating and managing priority scores for beneficiaries in the CHODAMS system.

### Usage

```php
use App\Services\BeneficiaryScoreService;
use App\Models\Survey;

// Create service instance
$service = new BeneficiaryScoreService();

// Calculate and save score for a single survey
$survey = Survey::find($surveyId);
$score = $service->calculateAndSave($survey);

// Recalculate scores for all surveys
$count = $service->recalculateAll();
```

### Methods

#### `calculateAndSave(Survey $survey): float`

Calculates the priority score for a survey and persists it to the database.

**Parameters:**
- `$survey` - The Survey model instance

**Returns:**
- `float` - The calculated priority score (0-100)

**Throws:**
- `ScoreCalculationException` - If calculation or persistence fails

**Example:**
```php
try {
    $score = $service->calculateAndSave($survey);
    echo "Score calculated: {$score}%";
} catch (ScoreCalculationException $e) {
    Log::error('Score calculation failed', $e->getContext());
}
```

#### `recalculateAll(): int`

Recalculates priority scores for all surveys in the database.

**Returns:**
- `int` - Number of surveys successfully recalculated

**Example:**
```php
$count = $service->recalculateAll();
echo "Recalculated {$count} surveys";
```

### Error Handling

The service uses the `ScoreCalculationException` for error handling. This exception includes context information about the failure:

```php
try {
    $service->calculateAndSave($survey);
} catch (ScoreCalculationException $e) {
    // Get error context
    $context = $e->getContext();
    
    // Context may include:
    // - survey_id: The ID of the survey
    // - calculated_score: The score that was calculated (if persistence failed)
    // - error: The underlying error message
}
```

### Logging

The service logs the following events:

- **Warning**: Invalid survey data detected
- **Warning**: Invalid field values (e.g., invalid income range)
- **Error**: Score calculation failures
- **Error**: Database persistence failures

All logs include relevant context such as survey ID and error details.

### Data Validation

The service validates survey data before calculation:

- Income ranges must be one of: `0-2999`, `3000-5999`, `6000-8999`, `9000-12999`, `13000+`
- Classifications must be one of: `Displaced`, `Double-up`, `Homeless`, `Upgrading of land tenure`
- House structures must be valid structure types
- Toilet types must be valid toilet types
- Water sources must be valid water sources
- Electricity sources must be valid electricity sources
- Boolean fields (`owns_lot`, `owns_house`, `temporary_housing`) must be boolean values

Invalid data is logged but does not prevent calculation - invalid fields are treated as missing data (0% contribution).

### Database Transactions

The `calculateAndSave()` method uses database transactions to ensure data consistency. If score persistence fails, the transaction is rolled back and a `ScoreCalculationException` is thrown.

### Performance

The service is designed to complete individual score calculations within 500ms (as per requirement 10.5). Batch recalculation processes surveys sequentially and continues even if individual calculations fail.
