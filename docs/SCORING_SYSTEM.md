# CHODAMS Beneficiary Priority Scoring System

## Overview

The CHODAMS scoring system calculates a priority score (0-100 points) for housing beneficiaries based on socioeconomic conditions. Higher scores indicate greater need for housing assistance.

### Score Interpretation

| Score Range | Priority Level | Action |
|-------------|---------------|--------|
| 35-45 | Critical | Immediate assistance |
| 25-34 | High | Priority assistance |
| 15-24 | Medium | Standard processing |
| 0-14 | Low | Lower priority |

---

## Scoring Categories

Seven categories contribute to the final score:

| Category | Weight | Max Points |
|----------|--------|------------|
| Income Range | 15% | 15.0 |
| Classification | 15% | 15.0 |
| Household Info | 14% | 14.0 |
| House Structure | 14% | 14.0 |
| Toilet Type | 14% | 14.0 |
| Water Source | 14% | 14.0 |
| Electricity Source | 14% | 14.0 |

---

## Point Allocation

### 1. Income Range (15%)

| Income (₱/month) | Points |
|------------------|--------|
| 0 - 2,999 | 4.50 |
| 3,000 - 5,999 | 3.75 |
| 6,000 - 8,999 | 3.00 |
| 9,000 - 12,999 | 2.25 |
| 13,000+ | 1.50 |

### 2. Classification (15%)

| Type | Points |
|------|--------|
| Homeless | 7.50 |
| Displaced | 3.75 |
| Double-up | 2.25 |
| Upgrading of land tenure | 1.50 |

### 3. Household Info (14% - Cumulative)

| Condition | Points |
|-----------|--------|
| Does NOT own lot | +2.80 |
| Does NOT own house | +4.20 |
| Lives in temporary housing | +7.00 |

### 4. House Structure (14%)

| Type | Points |
|------|--------|
| Makeshift/Salvaged/Improvised | 4.20 |
| Amakan and Nipa | 3.50 |
| Amakan and metal roof | 2.10 |
| Wood and metal roof | 2.10 |
| Concrete and wood | 1.40 |
| Full Concrete | 0.42 |
| Others | 0.28 |

### 5. Toilet Type (14%)

| Type | Points |
|------|--------|
| No Toilet | 5.60 |
| Open Pit/Antipolo | 4.20 |
| Water Sealed | 2.80 |
| Others | 1.40 |

### 6. Water Source (14%)

| Source | Points |
|--------|--------|
| Surface water (river, lake, dam) | 4.20 |
| Rainwater | 3.50 |
| Spring | 2.80 |
| Deep Well | 2.10 |
| Others | 0.84 |
| Community Water System (NAWASA) | 0.56 |

### 7. Electricity Source (14%)

| Source | Points |
|--------|--------|
| Candle/Lamp | 4.20 |
| Tapping to neighbor | 3.50 |
| Solar Panel | 2.80 |
| With own meter | 2.10 |
| Others | 1.40 |

---

## Calculation Examples

### Critical Priority (44.2 points)
Homeless family, ₱2,500/month income, makeshift house, no toilet, surface water, candle lighting, no property ownership, temporary housing.

### High Priority (29.2 points)
Displaced family, ₱5,000/month income, Amakan/Nipa house, open pit toilet, rainwater, tapping electricity, no property ownership.

### Medium Priority (17.85 points)
Double-up family, ₱8,000/month income, wood/metal house, water sealed toilet, deep well, solar panel, no lot ownership only.

### Low Priority (9.86 points)
Land tenure upgrade, ₱15,000/month income, concrete/wood house, water sealed toilet, NAWASA water, own meter, owns property.

---

## System Architecture

**Three-Layer Design:**
1. **Service Layer**: BeneficiaryScoreService orchestrates calculation
2. **Calculator Layer**: ScoreCalculator coordinates categories
3. **Category Calculators**: Seven independent calculators

**Process Flow:**
1. Extract survey data from database
2. Validate data quality
3. Calculate score using all categories
4. Save score with timestamp
5. Return final score

---

## Data Validation

**Valid Values:**
- Income: 0-2999, 3000-5999, 6000-8999, 9000-12999, 13000+
- Classification: Homeless, Displaced, Double-up, Upgrading of land tenure
- House: Full Concrete, Wood/metal, Amakan/Nipa, Amakan/metal, Concrete/wood, Makeshift, Others
- Toilet: Water Sealed, Open Pit/Antipolo, No Toilet, Others
- Water: NAWASA, Deep Well, Spring, Rainwater, Surface water, Others
- Electricity: Own meter, Solar Panel, Candle/Lamp, Tapping, Others

**Invalid Data Handling:**
- Logged as warnings
- Treated as missing (0 points)
- Calculation continues

---

## Usage

**Calculate Score:**
Use BeneficiaryScoreService to calculate and save scores for surveys.

**Recalculate All:**
Use artisan command: `php artisan beneficiary:recalculate-scores`

**Query by Priority:**
Use Survey model with orderByScore scope to sort by priority.

**Check Recalculation Need:**
Use needsScoreRecalculation method on survey instance.

---

## Error Handling

**ScoreCalculationException** provides:
- Error message
- Context information (survey ID, error details)
- Original exception

**Common Errors:**
- Database connection failure → Transaction rolled back
- Invalid data → Warning logged, calculation continues
- Weight validation failure → Calculation aborted

---

## Performance

**Targets:**
- Single calculation: < 100ms
- Batch processing: < 200ms per survey

**Optimization:**
- Use eager loading for relationships
- Process in chunks for large batches
- Implement caching for lookup data
- Add database indexes

---

## Maintenance

**Adding New Category:**
1. Create calculator class
2. Define weight (ensure total = 100%)
3. Implement calculation logic
4. Update documentation
5. Recalculate all scores

**Modifying Points:**
1. Update calculator constants
2. Run tests
3. Recalculate all scores
4. Update documentation
5. Notify stakeholders

---

## FAQ

**Q: Why is max score ~44 points, not 100?**  
A: Weighted design ensures no single category dominates. Maximum depends on highest-scoring options in each category.

**Q: What if data is incomplete?**  
A: Missing fields contribute 0 points. Calculation continues with available data.

**Q: How often to recalculate?**  
A: When data updates, scoring rules change, or during periodic audits (quarterly recommended).

**Q: Can beneficiaries see scores?**  
A: Policy decision for administrators based on transparency and communication strategies.

**Q: How are ties handled?**  
A: Equal scores = equal priority. Additional criteria (date, family size) can be applied.

---

**Version**: 1.0  
**Last Updated**: April 2026  
**System**: CHODAMS v1.0
