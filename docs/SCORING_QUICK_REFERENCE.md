# CHODAMS Scoring - Quick Reference

## Formula
Total Score = Σ (Category Internal Score × Weight × 100)

---

## Category Weights

| Category | Weight | Max |
|----------|--------|-----|
| Income Range | 15% | 15.0 |
| Classification | 15% | 15.0 |
| Household Info | 14% | 14.0 |
| House Structure | 14% | 14.0 |
| Toilet Type | 14% | 14.0 |
| Water Source | 14% | 14.0 |
| Electricity | 14% | 14.0 |

---

## Point Tables

### Income (15%)
| Range (₱) | Points |
|-----------|--------|
| 0-2,999 | 4.50 |
| 3,000-5,999 | 3.75 |
| 6,000-8,999 | 3.00 |
| 9,000-12,999 | 2.25 |
| 13,000+ | 1.50 |

### Classification (15%)
| Type | Points |
|------|--------|
| Homeless | 7.50 |
| Displaced | 3.75 |
| Double-up | 2.25 |
| Tenure upgrade | 1.50 |

### Household (14% - Cumulative)
| Condition | Points |
|-----------|--------|
| No lot | +2.80 |
| No house | +4.20 |
| Temporary | +7.00 |

### House Structure (14%)
| Type | Points |
|------|--------|
| Makeshift | 4.20 |
| Amakan/Nipa | 3.50 |
| Amakan/metal | 2.10 |
| Wood/metal | 2.10 |
| Concrete/wood | 1.40 |
| Full concrete | 0.42 |
| Others | 0.28 |

### Toilet (14%)
| Type | Points |
|------|--------|
| None | 5.60 |
| Open pit | 4.20 |
| Water sealed | 2.80 |
| Others | 1.40 |

### Water (14%)
| Source | Points |
|--------|--------|
| Surface water | 4.20 |
| Rainwater | 3.50 |
| Spring | 2.80 |
| Deep well | 2.10 |
| Others | 0.84 |
| NAWASA | 0.56 |

### Electricity (14%)
| Source | Points |
|--------|--------|
| Candle/Lamp | 4.20 |
| Tapping | 3.50 |
| Solar | 2.80 |
| Own meter | 2.10 |
| Others | 1.40 |

---

## Priority Levels

| Score | Level | Action |
|-------|-------|--------|
| 35-45 | Critical | Immediate |
| 25-34 | High | Priority |
| 15-24 | Medium | Standard |
| 0-14 | Low | Lower priority |

---

## Common Scores

**Maximum (44.2)**: Homeless, ₱0-2999, makeshift, no toilet, surface water, candle, no property, temporary

**High (29.2)**: Displaced, ₱3000-5999, Amakan/Nipa, open pit, rainwater, tapping, no property

**Medium (17.85)**: Double-up, ₱6000-8999, wood/metal, water sealed, deep well, solar, no lot

**Low (8.88)**: Tenure upgrade, ₱13000+, concrete/wood, water sealed, NAWASA, own meter, owns property

---

## Commands

**Recalculate all**:  
`php artisan beneficiary:recalculate-scores`

**Specific survey**:  
`php artisan beneficiary:recalculate-scores --survey=123`

**Updated only**:  
`php artisan beneficiary:recalculate-scores --updated-only`

---

## Database Fields

**priority_score**: DECIMAL(5,2) - Calculated score  
**score_calculated_at**: TIMESTAMP - Calculation time

---

## File Locations

**Services**:
- app/Services/BeneficiaryScoreService.php
- app/Services/Scoring/*.php

**Models**: app/Models/Survey.php  
**Exceptions**: app/Exceptions/ScoreCalculationException.php  
**Tests**: tests/Unit/Scoring/  
**Docs**: docs/SCORING_*.md

---

## Performance

- Single: < 100ms
- Batch: < 200ms/survey
- Transaction: < 50ms

---

**Version**: 1.0 | April 2026
