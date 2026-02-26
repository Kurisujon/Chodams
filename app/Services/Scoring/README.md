# Beneficiary Scoring System

This directory contains the implementation of the beneficiary priority scoring system for CHODAMS.

## Overview

The scoring system calculates a priority score (0-100%) for each beneficiary based on 7 weighted categories of demographic and socioeconomic data.

## Architecture

### CategoryCalculatorInterface

The base interface that all category calculators must implement:

- `calculate(array $surveyData): float` - Calculate the contribution of this category to the total score
- `getWeight(): float` - Get the weight of this category (as decimal, e.g., 0.15 for 15%)
- `getName(): string` - Get the name of this category

### Category Calculators

Each category has its own calculator implementing `CategoryCalculatorInterface`:

1. **IncomeRangeCalculator** (15% weight)
2. **ClassificationCalculator** (15% weight)
3. **HouseholdInfoCalculator** (14% weight)
4. **HouseStructureCalculator** (14% weight)
5. **ToiletTypeCalculator** (14% weight)
6. **WaterSourceCalculator** (14% weight)
7. **ElectricitySourceCalculator** (14% weight)

### ScoreCalculator

The main calculator that orchestrates all category calculators to produce the final score.

## Testing

Tests are located in `tests/Unit/Scoring/` and use:

- **Pest PHP** - Testing framework
- **Eris** - Property-based testing library

### Running Tests

```bash
# Run all scoring tests
php vendor/bin/pest tests/Unit/Scoring/

# Run specific test file
php vendor/bin/pest tests/Unit/Scoring/CategoryCalculatorInterfaceTest.php
```

### Test Helpers

`ScoringTestHelpers.php` provides utility functions for generating test data:

- `generateRandomSurveyData()` - Generate random valid survey data
- `generateSurveyDataWithMissingFields()` - Generate data with missing fields
- Various Eris generators for property-based testing

## Development

When adding new category calculators:

1. Implement `CategoryCalculatorInterface`
2. Define the weight constant
3. Implement scoring logic in `calculate()` method
4. Handle missing data by returning 0.0
5. Write property-based tests to validate correctness
6. Write unit tests for specific examples and edge cases
