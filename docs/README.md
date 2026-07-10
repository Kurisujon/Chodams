# CHODAMS Documentation

## Scoring System Documentation

### 1. [SCORING_SYSTEM.md](./SCORING_SYSTEM.md) - User Guide
**For**: Administrators, policy makers, users

**Contents**: System overview, point allocation, examples, usage, validation, FAQ

**Use when**: Understanding how scores work, interpreting results, using the system

---

### 2. [SCORING_TECHNICAL_GUIDE.md](./SCORING_TECHNICAL_GUIDE.md) - Developer Guide
**For**: Developers, technical staff

**Contents**: Architecture, class reference, database schema, testing, deployment, troubleshooting

**Use when**: Developing, maintaining, or debugging the system

---

### 3. [SCORING_QUICK_REFERENCE.md](./SCORING_QUICK_REFERENCE.md) - Cheat Sheet
**For**: Everyone

**Contents**: Point tables, commands, common scores, file locations

**Use when**: Quick lookups, reminders

---

### 4. [SCORING_DIAGRAMS.md](./SCORING_DIAGRAMS.md) - Visual Guide
**For**: Visual learners, presentations

**Contents**: Architecture diagrams, flowcharts, data flows

**Use when**: Visual explanations, training, presentations

---

## Quick Start

### For Administrators
1. Read SCORING_SYSTEM.md (Overview, Point Allocation, Examples)
2. Keep SCORING_QUICK_REFERENCE.md handy
3. Review SCORING_DIAGRAMS.md for visuals

### For Developers
1. Read SCORING_TECHNICAL_GUIDE.md (Architecture, Classes, Testing)
2. Review code in app/Services/Scoring/
3. Run tests: `php vendor/bin/pest tests/Unit/Scoring/`

### For Analysts
1. Read SCORING_SYSTEM.md (Point Allocation, Examples)
2. Use SCORING_QUICK_REFERENCE.md for ranges
3. Query by priority levels (Critical: 35+, High: 25-34, Medium: 15-24, Low: 0-14)

---

## Key Concepts

**Priority Score**: 0-100 value indicating housing need (higher = greater need)

**Category Weight**: Percentage contribution to total (all sum to 100%)

**Priority Levels**:
- Critical (35-45): Immediate assistance
- High (25-34): Priority assistance
- Medium (15-24): Standard processing
- Low (0-14): Lower priority

---

## Common Tasks

### Calculate Score
Use BeneficiaryScoreService to calculate and save scores.

### Recalculate All
Run: `php artisan beneficiary:recalculate-scores`

### Query by Priority
Use Survey model with orderByScore scope, filter by score ranges.

### Add New Category
1. Create calculator class
2. Define weight (total = 100%)
3. Implement calculate method
4. Add to ScoreCalculator
5. Write tests

---

## Scoring Summary

### 7 Categories, 100% Weight

| Category | Weight | Max |
|----------|--------|-----|
| Income | 15% | 15.0 |
| Classification | 15% | 15.0 |
| Household | 14% | 14.0 |
| House Structure | 14% | 14.0 |
| Toilet | 14% | 14.0 |
| Water | 14% | 14.0 |
| Electricity | 14% | 14.0 |

### Score Range
- Theoretical Max: 100 points
- Practical Max: ~44 points (worst conditions)
- Practical Min: ~9 points (best conditions)

---

## System Files

**Services**: app/Services/BeneficiaryScoreService.php, app/Services/Scoring/*.php  
**Models**: app/Models/Survey.php  
**Exceptions**: app/Exceptions/ScoreCalculationException.php  
**Tests**: tests/Unit/Scoring/  
**Docs**: docs/SCORING_*.md

---

## Support

**Technical Issues**: Review SCORING_TECHNICAL_GUIDE.md troubleshooting section  
**Policy Questions**: Review SCORING_SYSTEM.md overview and FAQ  
**Development**: Check SCORING_TECHNICAL_GUIDE.md class reference

---

**Version**: 1.0 | April 2026 | CHODAMS v1.0
