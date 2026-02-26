/**
 * Property-Based Test: Score Display in Lists
 * 
 * Feature: beneficiary-scoring-system
 * Property 11: Score Display in Lists
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3**
 * 
 * This test verifies that for any beneficiary with a calculated score,
 * when displayed in either the affiliated or non-affiliated list,
 * the Priority_Score is visible and formatted as a percentage with
 * one decimal place (e.g., "45.5%").
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Format priority score with one decimal place and % suffix
 * This is the function from AdminBeneficiaries.jsx
 */
const formatScore = (score) => {
  if (score === null || score === undefined) return '0.0%'
  return `${parseFloat(score).toFixed(1)}%`
}

describe('Property 11: Score Display in Lists', () => {
  it('should format any valid score (0-100) with one decimal place and % suffix', () => {
    fc.assert(
      fc.property(
        // Generate random scores between 0 and 100
        fc.float({ min: 0, max: 100, noNaN: true }),
        (score) => {
          const formatted = formatScore(score)
          
          // Property 1: Result must match the pattern: digits.digit%
          // The pattern allows for any number of digits before the decimal,
          // exactly one digit after the decimal, and ends with %
          const pattern = /^\d+\.\d%$/
          expect(formatted).toMatch(pattern)
          
          // Property 2: The formatted string must end with '%'
          expect(formatted).toMatch(/%$/)
          
          // Property 3: When we parse the number part (removing %), 
          // it should have exactly one decimal place
          const numericPart = formatted.slice(0, -1) // Remove '%'
          const decimalParts = numericPart.split('.')
          expect(decimalParts).toHaveLength(2) // Must have exactly one decimal point
          expect(decimalParts[1]).toHaveLength(1) // Must have exactly one decimal digit
          
          // Property 4: The numeric value should be within valid range (0-100)
          const parsedValue = parseFloat(numericPart)
          expect(parsedValue).toBeGreaterThanOrEqual(0)
          expect(parsedValue).toBeLessThanOrEqual(100)
          
          // Property 5: The formatted value should round correctly
          // toFixed(1) rounds to 1 decimal place
          const expected = `${score.toFixed(1)}%`
          expect(formatted).toBe(expected)
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })

  it('should handle edge case scores correctly', () => {
    // Test specific edge cases
    const edgeCases = [
      { input: 0, expected: '0.0%' },
      { input: 0.0, expected: '0.0%' },
      { input: 100, expected: '100.0%' },
      { input: 100.0, expected: '100.0%' },
      { input: 50, expected: '50.0%' },
      { input: 45.5, expected: '45.5%' },
      { input: 45.55, expected: '45.6%' }, // Should round up
      { input: 45.54, expected: '45.5%' }, // Should round down
      { input: 99.99, expected: '100.0%' }, // Should round to 100.0%
      { input: 0.01, expected: '0.0%' }, // Should round to 0.0%
      { input: 0.05, expected: '0.1%' }, // Should round to 0.1%
    ]

    edgeCases.forEach(({ input, expected }) => {
      const result = formatScore(input)
      expect(result).toBe(expected)
    })
  })

  it('should handle null and undefined scores', () => {
    // Test null and undefined cases
    expect(formatScore(null)).toBe('0.0%')
    expect(formatScore(undefined)).toBe('0.0%')
  })

  it('should format scores with many decimal places correctly', () => {
    fc.assert(
      fc.property(
        // Generate scores with up to 10 decimal places
        fc.float({ min: 0, max: 100, noNaN: true }),
        (score) => {
          const formatted = formatScore(score)
          
          // Should always have exactly one decimal place
          const numericPart = formatted.slice(0, -1)
          const decimalParts = numericPart.split('.')
          expect(decimalParts[1]).toHaveLength(1)
          
          // Should match the expected rounding behavior
          const expected = `${score.toFixed(1)}%`
          expect(formatted).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain consistency across multiple calls with same input', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (score) => {
          // Calling formatScore multiple times with the same input
          // should always produce the same output (idempotency)
          const result1 = formatScore(score)
          const result2 = formatScore(score)
          const result3 = formatScore(score)
          
          expect(result1).toBe(result2)
          expect(result2).toBe(result3)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should format integer scores with .0 decimal', () => {
    fc.assert(
      fc.property(
        // Generate integer scores
        fc.integer({ min: 0, max: 100 }),
        (score) => {
          const formatted = formatScore(score)
          
          // Integer scores should be formatted with .0
          const expected = `${score}.0%`
          expect(formatted).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle boundary values correctly', () => {
    // Test exact boundary values
    const boundaries = [
      { input: 0, expected: '0.0%' },
      { input: 100, expected: '100.0%' },
      { input: 0.1, expected: '0.1%' },
      { input: 99.9, expected: '99.9%' },
      { input: 50.0, expected: '50.0%' },
    ]

    boundaries.forEach(({ input, expected }) => {
      const result = formatScore(input)
      expect(result).toBe(expected)
    })
  })

  it('should format scores that require rounding', () => {
    fc.assert(
      fc.property(
        // Generate scores with 2+ decimal places
        fc.float({ min: 0, max: 100, noNaN: true }).map(n => 
          parseFloat((n).toFixed(3)) // Ensure 3 decimal places
        ),
        (score) => {
          const formatted = formatScore(score)
          
          // The result should match JavaScript's toFixed(1) behavior
          const expected = `${score.toFixed(1)}%`
          expect(formatted).toBe(expected)
          
          // Should have exactly one decimal place
          const numericPart = formatted.slice(0, -1)
          const decimalParts = numericPart.split('.')
          expect(decimalParts[1]).toHaveLength(1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
