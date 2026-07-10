# CHODAMS Scoring System - Visual Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CHODAMS Application                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐         ┌──────────────────┐                   │
│  │   Controller   │────────▶│  Service Layer   │                   │
│  │   (HTTP/API)   │         │                  │                   │
│  └────────────────┘         └────────┬─────────┘                   │
│                                       │                              │
│                                       ▼                              │
│                      ┌────────────────────────────┐                 │
│                      │ BeneficiaryScoreService    │                 │
│                      ├────────────────────────────┤                 │
│                      │ • calculateAndSave()       │                 │
│                      │ • recalculateAll()         │                 │
│                      │ • extractSurveyData()      │                 │
│                      │ • validateSurveyData()     │                 │
│                      └────────────┬───────────────┘                 │
│                                   │                                  │
│                                   ▼                                  │
│                      ┌────────────────────────────┐                 │
│                      │    ScoreCalculator         │                 │
│                      ├────────────────────────────┤                 │
│                      │ • calculateScore()         │                 │
│                      │ • validateWeights()        │                 │
│                      │ • getCategoryCalculators() │                 │
│                      └────────────┬───────────────┘                 │
│                                   │                                  │
│                    ┌──────────────┼──────────────┐                  │
│                    │              │              │                  │
│         ┌──────────▼───┐  ┌──────▼──────┐  ┌───▼──────────┐       │
│         │   Income     │  │Classification│  │  Household   │       │
│         │  Calculator  │  │  Calculator  │  │  Calculator  │       │
│         └──────────────┘  └─────────────┘  └──────────────┘       │
│                                                                      │
│         ┌──────────────┐  ┌─────────────┐  ┌──────────────┐       │
│         │    House     │  │   Toilet    │  │    Water     │       │
│         │  Structure   │  │    Type     │  │    Source    │       │
│         │  Calculator  │  │  Calculator │  │  Calculator  │       │
│         └──────────────┘  └─────────────┘  └──────────────┘       │
│                                                                      │
│         ┌──────────────┐                                            │
│         │ Electricity  │                                            │
│         │    Source    │                                            │
│         │  Calculator  │                                            │
│         └──────────────┘                                            │
│                                                                      │
│                                   │                                  │
│                                   ▼                                  │
│                      ┌────────────────────────────┐                 │
│                      │      Database Layer        │                 │
│                      ├────────────────────────────┤                 │
│                      │ • Survey                   │                 │
│                      │ • Classification           │                 │
│                      │ • Household                │                 │
│                      │ • Economic                 │                 │
│                      └────────────────────────────┘                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────┐
│   Survey    │
│   Record    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  1. Extract Survey Data                 │
│     • Query classification table        │
│     • Query household table             │
│     • Query economic table              │
│     • Normalize data formats            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  2. Validate Survey Data                │
│     • Check valid income ranges         │
│     • Check valid classifications       │
│     • Check valid structure types       │
│     • Log warnings for invalid data     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  3. Calculate Score                     │
│     ┌─────────────────────────────────┐ │
│     │ For each category:              │ │
│     │   • Get survey value            │ │
│     │   • Lookup internal score       │ │
│     │   • Multiply by weight          │ │
│     │   • Multiply by 100             │ │
│     │   • Add to total                │ │
│     └─────────────────────────────────┘ │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  4. Persist Score                       │
│     • Begin transaction                 │
│     • Update priority_score             │
│     • Update score_calculated_at        │
│     • Commit transaction                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Return    │
│    Score    │
└─────────────┘
```

---

## Score Calculation Flow

```
Survey Data Input
       │
       ├─── Income Range ────────┐
       │    (15% weight)          │
       │                          │
       ├─── Classification ───────┤
       │    (15% weight)          │
       │                          │
       ├─── Household Info ───────┤
       │    (14% weight)          │
       │    • Owns lot?           ├──▶ Category
       │    • Owns house?         │    Calculators
       │    • Temporary?          │
       │                          │
       ├─── House Structure ──────┤
       │    (14% weight)          │
       │                          │
       ├─── Toilet Type ──────────┤
       │    (14% weight)          │
       │                          │
       ├─── Water Source ─────────┤
       │    (14% weight)          │
       │                          │
       └─── Electricity Source ───┘
            (14% weight)
                   │
                   ▼
         ┌─────────────────┐
         │  Sum All        │
         │  Contributions  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Priority Score │
         │    (0-100)      │
         └─────────────────┘
```

---

## Category Weight Distribution

```
Total Score (100%)
│
├─ Income Range (15%) ──────────────────────────────────────────
│  └─ Max: 15.0 points
│
├─ Classification (15%) ────────────────────────────────────────
│  └─ Max: 15.0 points
│
├─ Household Info (14%) ────────────────────────────────────────
│  └─ Max: 14.0 points (cumulative)
│
├─ House Structure (14%) ───────────────────────────────────────
│  └─ Max: 14.0 points
│
├─ Toilet Type (14%) ───────────────────────────────────────────
│  └─ Max: 14.0 points
│
├─ Water Source (14%) ──────────────────────────────────────────
│  └─ Max: 14.0 points
│
└─ Electricity Source (14%) ────────────────────────────────────
   └─ Max: 14.0 points
```

---

## Score Distribution Chart

```
Points
  │
45│  ████ Maximum Score (44.2)
  │  ████
40│  ████
  │  ████
35│  ████ ─────────────────────── Critical Priority
  │  ████
30│  ████ ████ Typical High (29.2)
  │  ████ ████
25│  ████ ████ ─────────────────── High Priority
  │  ████ ████
20│  ████ ████
  │  ████ ████
15│  ████ ████ ████ ─────────────── Medium Priority
  │  ████ ████ ████
10│  ████ ████ ████ ████ Minimum (8.88)
  │  ████ ████ ████ ████
 5│  ████ ████ ████ ████
  │  ████ ████ ████ ████
 0└──┴────┴────┴────┴────────────── Low Priority
     Max  High  Med  Min
```

---

## Category Contribution Breakdown

### Maximum Score Scenario (44.2 points)

```
Category                Points    ████████████████████████
─────────────────────────────────────────────────────────
Income (0-2999)          4.50     ████████
Classification (Homeless) 7.50    ██████████████
Household (All 3)       14.00     ████████████████████████████
House (Makeshift)        4.20     ████████
Toilet (None)            5.60     ██████████
Water (Surface)          4.20     ████████
Electricity (Candle)     4.20     ████████
─────────────────────────────────────────────────────────
TOTAL                   44.20
```

### Typical High Priority (29.2 points)

```
Category                Points    ████████████████████████
─────────────────────────────────────────────────────────
Income (3000-5999)       3.75     ███████
Classification (Displaced) 3.75   ███████
Household (No lot+house) 7.00     █████████████
House (Amakan/Nipa)      3.50     ██████
Toilet (Open Pit)        4.20     ████████
Water (Rainwater)        3.50     ██████
Electricity (Tapping)    3.50     ██████
─────────────────────────────────────────────────────────
TOTAL                   29.20
```

---

## Database Entity Relationship

```
┌─────────────────────────┐
│        Survey           │
│─────────────────────────│
│ survey_id (PK)          │
│ validator_id            │
│ interviewed_by          │
│ date_interviewed        │
│ is_submitted            │
│ priority_score          │◀─── Calculated Score
│ score_calculated_at     │◀─── Timestamp
│ created_at              │
│ updated_at              │
└────────┬────────────────┘
         │
         │ 1:1
         │
    ┌────┴────┬────────┬────────┐
    │         │        │        │
    ▼         ▼        ▼        ▼
┌──────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐
│Classification│ │Household│ │Economic│ │Demographic│
│──────────│ │────────│ │──────────│ │────────────│
│survey_id │ │survey_id│ │survey_id│ │survey_id  │
│classification│ │lot_own │ │income   │ │...        │
│          │ │house_own│ │         │ │           │
│          │ │temp_area│ │         │ │           │
│          │ │structure│ │         │ │           │
│          │ │toilet   │ │         │ │           │
│          │ │water    │ │         │ │           │
│          │ │electric │ │         │ │           │
└──────────┘ └────────┘ └──────────┘ └────────────┘
```

---

## Calculation Algorithm Flowchart

```
                    START
                      │
                      ▼
            ┌─────────────────┐
            │ Load Survey     │
            │ with Relations  │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Extract Data    │
            │ from Tables     │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Validate Data   │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Initialize      │
            │ totalScore = 0  │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ For Each        │◀────────┐
            │ Calculator      │         │
            └────────┬────────┘         │
                     │                  │
                     ▼                  │
            ┌─────────────────┐         │
            │ Get Survey      │         │
            │ Value           │         │
            └────────┬────────┘         │
                     │                  │
                     ▼                  │
            ┌─────────────────┐         │
         ┌──│ Value Missing?  │         │
         │  └────────┬────────┘         │
         │           │ No               │
         │ Yes       ▼                  │
         │  ┌─────────────────┐         │
         │  │ Lookup Internal │         │
         │  │ Score           │         │
         │  └────────┬────────┘         │
         │           │                  │
         │           ▼                  │
         │  ┌─────────────────┐         │
         │  │ contribution =  │         │
         │  │ internal_score  │         │
         │  │ × weight × 100  │         │
         │  └────────┬────────┘         │
         │           │                  │
         └──────────▶│                  │
                     ▼                  │
            ┌─────────────────┐         │
            │ totalScore +=   │         │
            │ contribution    │         │
            └────────┬────────┘         │
                     │                  │
                     ▼                  │
            ┌─────────────────┐         │
            │ More            │         │
            │ Calculators?    │─────────┘
            └────────┬────────┘
                     │ No
                     ▼
            ┌─────────────────┐
            │ Begin           │
            │ Transaction     │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Save Score to   │
            │ Database        │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Commit          │
            │ Transaction     │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Return Score    │
            └────────┬────────┘
                     │
                     ▼
                    END
```

---

## Priority Level Distribution

```
Score Range Distribution
─────────────────────────────────────────────────────────

CRITICAL (35-45)
│████████│ 8-10% of beneficiaries
│        │ Immediate assistance required
│        │ Severe housing need
└────────┘

HIGH (25-34)
│████████████████│ 20-25% of beneficiaries
│                │ Priority assistance
│                │ Significant housing need
└────────────────┘

MEDIUM (15-24)
│████████████████████████│ 40-45% of beneficiaries
│                        │ Standard processing
│                        │ Moderate housing need
└────────────────────────┘

LOW (0-14)
│████████████████│ 25-30% of beneficiaries
│                │ Lower priority
│                │ Basic needs met
└────────────────┘
```

---

## Category Internal Score Mapping

### Example: Income Range Calculator

```
Input: income_range = "0-2999"
                │
                ▼
        ┌───────────────┐
        │ Lookup Table  │
        ├───────────────┤
        │ 0-2999   →0.30│◀── Internal Score
        │ 3000-5999→0.25│
        │ 6000-8999→0.20│
        │ 9000-12999→0.15│
        │ 13000+   →0.10│
        └───────┬───────┘
                │
                ▼
        internal_score = 0.30
                │
                ▼
        contribution = 0.30 × 0.15 × 100
                │
                ▼
        contribution = 4.5 points
```

---

## Error Handling Flow

```
                    START
                      │
                      ▼
            ┌─────────────────┐
            │ Try Calculate   │
            │ Score           │
            └────────┬────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌─────────┐           ┌──────────┐
    │ Success │           │  Error   │
    └────┬────┘           └─────┬────┘
         │                      │
         │                      ▼
         │             ┌─────────────────┐
         │             │ Catch Exception │
         │             └────────┬────────┘
         │                      │
         │                      ▼
         │             ┌─────────────────┐
         │             │ Log Error with  │
         │             │ Context         │
         │             └────────┬────────┘
         │                      │
         │                      ▼
         │             ┌─────────────────┐
         │             │ Rollback        │
         │             │ Transaction     │
         │             └────────┬────────┘
         │                      │
         │                      ▼
         │             ┌─────────────────┐
         │             │ Throw           │
         │             │ ScoreCalculation│
         │             │ Exception       │
         │             └────────┬────────┘
         │                      │
         └──────────────────────┘
                      │
                      ▼
                    END
```

---

## Testing Strategy Pyramid

```
                    ┌──────────────┐
                    │   E2E Tests  │
                    │   (Manual)   │
                    └──────┬───────┘
                           │
                  ┌────────┴────────┐
                  │  Integration    │
                  │     Tests       │
                  │  (Service Layer)│
                  └────────┬────────┘
                           │
              ┌────────────┴────────────┐
              │     Unit Tests          │
              │  (Calculator Classes)   │
              │  • Property-based       │
              │  • Example-based        │
              │  • Edge cases           │
              └─────────────────────────┘
```

---

## Deployment Workflow

```
┌─────────────────┐
│  Development    │
│  Environment    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run Tests       │
│ • Unit          │
│ • Integration   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Code Review     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Merge to Main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Staging Deploy  │
│ • Run migrations│
│ • Test scoring  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Production      │
│ Deploy          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Recalculate     │
│ All Scores      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Monitor Logs    │
└─────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: April 2026
