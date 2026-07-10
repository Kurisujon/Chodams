# CHODAMS Scoring System - Technical Guide

## Architecture

### Design Patterns
- **Strategy Pattern**: CategoryCalculatorInterface for extensibility
- **Service Layer**: Business logic separation
- **Repository Pattern**: Eloquent models for data access

### Component Layers
1. **BeneficiaryScoreService**: Orchestration, validation, persistence
2. **ScoreCalculator**: Category coordination, weight validation
3. **Category Calculators**: Individual score computation (7 calculators)

### Data Flow
Survey → Extract → Validate → Calculate → Save → Return Score

---

## Class Reference

### BeneficiaryScoreService
**Location**: app/Services/BeneficiaryScoreService.php

**Methods:**
- **calculateAndSave(Survey)**: Calculate and persist score, returns float
- **recalculateAll()**: Batch recalculation, returns count
- **extractSurveyData(Survey)**: Normalize data from tables
- **validateSurveyData(array)**: Validate against allowed values

### ScoreCalculator
**Location**: app/Services/Scoring/ScoreCalculator.php

**Methods:**
- **calculateScore(array)**: Sum all category contributions
- **validateWeights()**: Ensure weights = 100%
- **getCategoryCalculators()**: Return all 7 calculators

### Category Calculators
**Location**: app/Services/Scoring/

Each implements:
- **calculate(array)**: Return contribution (0 to max points)
- **getWeight()**: Return category weight (decimal)
- **getName()**: Return category name

**Calculators:**
1. IncomeRangeCalculator (15%)
2. ClassificationCalculator (15%)
3. HouseholdInfoCalculator (14%)
4. HouseStructureCalculator (14%)
5. ToiletTypeCalculator (14%)
6. WaterSourceCalculator (14%)
7. ElectricitySourceCalculator (14%)

---

## Database Schema

### Survey Table
**Primary Key**: survey_id

**Score Columns:**
- priority_score: DECIMAL(5,2)
- score_calculated_at: TIMESTAMP NULL

**Indexes:**
- survey_id (primary)
- priority_score (sorting)
- score_calculated_at (filtering)

### Related Tables
- **classification**: survey_id, classification (1-4)
- **household**: survey_id, ownership, structure, utilities
- **economic**: survey_id, combine_monthly_income

---

## API Reference

### Endpoints (Proposed)

**POST /api/surveys/{id}/calculate-score**  
Calculate score for specific survey

**POST /api/surveys/recalculate-all**  
Recalculate all surveys

**GET /api/surveys/{id}/score-breakdown**  
Get detailed score breakdown by category

**GET /api/surveys?priority={level}**  
Filter surveys by priority level

---

## Testing

### Test Structure
**Framework**: Pest PHP  
**Location**: tests/Unit/Scoring/

**Coverage:**
- Unit tests for each calculator
- Integration tests for service methods
- Property-based tests with Eris
- Edge cases and error scenarios

### Running Tests
- All tests: `php vendor/bin/pest tests/Unit/Scoring/`
- Specific file: `php vendor/bin/pest tests/Unit/Scoring/IncomeRangeCalculatorTest.php`
- With coverage: `php vendor/bin/pest --coverage`

---

## Deployment

### Prerequisites
- PHP >= 8.0
- Laravel >= 9.0
- MySQL >= 5.7 or MariaDB >= 10.3

### Steps
1. Run migrations
2. Calculate initial scores
3. Configure environment variables
4. Set up scheduled tasks

### Environment Config
- SCORING_ENABLED: true/false
- SCORING_LOG_LEVEL: warning/error/info
- SCORING_BATCH_SIZE: number

### Scheduled Tasks
- Daily: Recalculate updated surveys
- Weekly: Data quality checks
- Monthly: Score distribution reports

---

## Troubleshooting

### Weights Don't Sum to 100%
**Cause**: Calculator weights incorrect  
**Fix**: Verify all weight constants sum to 1.0

### Score Not Updating
**Cause**: score_calculated_at not checked  
**Fix**: Use needsScoreRecalculation() method

### Slow Batch Processing
**Cause**: Large dataset, inefficient queries  
**Fix**: Use chunking, eager loading, caching, queues

### Calculation Fails Silently
**Cause**: Missing error logging  
**Fix**: Enable detailed logging, check application logs

---

## Performance

### Benchmarks
- Single: < 100ms
- Batch: < 200ms per survey

### Optimization
- Eager load relationships
- Process in chunks
- Use database indexes
- Implement caching
- Queue-based processing

---

## Maintenance

### Monthly
- Review logs
- Check score distribution
- Verify data quality

### Quarterly
- Full recalculation
- Review criteria
- Update documentation

### Annually
- Audit algorithm
- Review weights
- Analyze trends

---

**Version**: 1.0  
**Last Updated**: April 2026
