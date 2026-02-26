import { describe, it, expect } from 'vitest'
import { ColorContrastManager } from '../Utils/ColorContrastManager'

describe('ColorContrastManager', () => {
  describe('Color Conversion', () => {
    it('converts hex to RGB correctly', () => {
      expect(ColorContrastManager.hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(ColorContrastManager.hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(ColorContrastManager.hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(ColorContrastManager.hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(ColorContrastManager.hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('handles hex colors without # prefix', () => {
      expect(ColorContrastManager.hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(ColorContrastManager.hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 })
    })

    it('handles 3-digit hex colors', () => {
      expect(ColorContrastManager.hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(ColorContrastManager.hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(ColorContrastManager.hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('returns null for invalid hex colors', () => {
      expect(ColorContrastManager.hexToRgb('invalid')).toBeNull()
      expect(ColorContrastManager.hexToRgb('#GG0000')).toBeNull()
      expect(ColorContrastManager.hexToRgb('#12')).toBeNull()
    })

    it('converts RGB to hex correctly', () => {
      expect(ColorContrastManager.rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff')
      expect(ColorContrastManager.rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
      expect(ColorContrastManager.rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
    })

    it('clamps RGB values to valid range', () => {
      expect(ColorContrastManager.rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080')
    })

    it('converts RGB to HSL correctly', () => {
      const white = ColorContrastManager.rgbToHsl({ r: 255, g: 255, b: 255 })
      expect(white.l).toBeCloseTo(100, 0)
      
      const black = ColorContrastManager.rgbToHsl({ r: 0, g: 0, b: 0 })
      expect(black.l).toBeCloseTo(0, 0)
      
      const red = ColorContrastManager.rgbToHsl({ r: 255, g: 0, b: 0 })
      expect(red.h).toBeCloseTo(0, 0)
      expect(red.s).toBeCloseTo(100, 0)
      expect(red.l).toBeCloseTo(50, 0)
    })

    it('converts HSL to RGB correctly', () => {
      const white = ColorContrastManager.hslToRgb({ h: 0, s: 0, l: 100 })
      expect(white.r).toBeCloseTo(255, 0)
      expect(white.g).toBeCloseTo(255, 0)
      expect(white.b).toBeCloseTo(255, 0)
      
      const black = ColorContrastManager.hslToRgb({ h: 0, s: 0, l: 0 })
      expect(black.r).toBeCloseTo(0, 0)
      expect(black.g).toBeCloseTo(0, 0)
      expect(black.b).toBeCloseTo(0, 0)
    })
  })

  describe('Contrast Ratio Calculation', () => {
    it('calculates contrast ratio for black and white', () => {
      const ratio = ColorContrastManager.calculateContrastRatio('#000000', '#FFFFFF')
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('calculates contrast ratio for same colors', () => {
      const ratio = ColorContrastManager.calculateContrastRatio('#FFFFFF', '#FFFFFF')
      expect(ratio).toBeCloseTo(1, 0)
    })

    it('calculates contrast ratio symmetrically', () => {
      const ratio1 = ColorContrastManager.calculateContrastRatio('#000000', '#FFFFFF')
      const ratio2 = ColorContrastManager.calculateContrastRatio('#FFFFFF', '#000000')
      expect(ratio1).toBeCloseTo(ratio2, 1)
    })

    it('calculates contrast ratio for typical colors', () => {
      // Dark emerald on white should have good contrast
      const ratio = ColorContrastManager.calculateContrastRatio('#065f46', '#FFFFFF')
      expect(ratio).toBeGreaterThan(4.5)
    })

    it('throws error for invalid color formats', () => {
      expect(() => {
        ColorContrastManager.calculateContrastRatio('invalid', '#FFFFFF')
      }).toThrow('Invalid color format')
    })
  })

  describe('Contrast Requirement Checking', () => {
    it('identifies colors that meet 4.5:1 contrast requirement', () => {
      // Black on white meets requirement
      expect(ColorContrastManager.meetsContrastRequirement('#000000', '#FFFFFF')).toBe(true)
      
      // Dark emerald on white meets requirement
      expect(ColorContrastManager.meetsContrastRequirement('#065f46', '#FFFFFF')).toBe(true)
    })

    it('identifies colors that do not meet 4.5:1 contrast requirement', () => {
      // Light gray on white does not meet requirement
      expect(ColorContrastManager.meetsContrastRequirement('#CCCCCC', '#FFFFFF')).toBe(false)
      
      // Light yellow on white does not meet requirement
      expect(ColorContrastManager.meetsContrastRequirement('#FFFF99', '#FFFFFF')).toBe(false)
    })

    it('supports custom minimum ratio', () => {
      const color = '#888888' // Medium gray with ~3.5:1 contrast
      
      // Meets 3:1 but not 4.5:1
      expect(ColorContrastManager.meetsContrastRequirement(color, '#FFFFFF', 3)).toBe(true)
      expect(ColorContrastManager.meetsContrastRequirement(color, '#FFFFFF', 4.5)).toBe(false)
    })

    it('handles invalid colors gracefully', () => {
      expect(ColorContrastManager.meetsContrastRequirement('invalid', '#FFFFFF')).toBe(false)
    })
  })

  describe('Color Adjustment for Contrast', () => {
    it('returns original color if it already meets requirement', () => {
      const darkColor = '#000000'
      const adjusted = ColorContrastManager.adjustColorForContrast(darkColor, '#FFFFFF')
      expect(adjusted).toBe(darkColor)
    })

    it('darkens light colors to meet contrast requirement', () => {
      const lightColor = '#FFFF99' // Light yellow
      const adjusted = ColorContrastManager.adjustColorForContrast(lightColor, '#FFFFFF')
      
      // Adjusted color should meet requirement
      expect(ColorContrastManager.meetsContrastRequirement(adjusted, '#FFFFFF')).toBe(true)
      
      // Adjusted color should be darker
      const originalRgb = ColorContrastManager.hexToRgb(lightColor)
      const adjustedRgb = ColorContrastManager.hexToRgb(adjusted)
      const originalHsl = ColorContrastManager.rgbToHsl(originalRgb)
      const adjustedHsl = ColorContrastManager.rgbToHsl(adjustedRgb)
      expect(adjustedHsl.l).toBeLessThan(originalHsl.l)
    })

    it('adjusts colors to meet custom minimum ratio', () => {
      const color = '#999999'
      const adjusted = ColorContrastManager.adjustColorForContrast(color, '#FFFFFF', 7)
      
      // Should meet the higher requirement
      expect(ColorContrastManager.meetsContrastRequirement(adjusted, '#FFFFFF', 7)).toBe(true)
    })

    it('handles invalid colors gracefully', () => {
      const result = ColorContrastManager.adjustColorForContrast('invalid', '#FFFFFF')
      expect(result).toBe('invalid')
    })
  })

  describe('Print-Friendly Color Utilities', () => {
    it('identifies colors too light for print', () => {
      expect(ColorContrastManager.isTooLightForPrint('#FFFF99')).toBe(true)
      expect(ColorContrastManager.isTooLightForPrint('#CCCCCC')).toBe(true)
      expect(ColorContrastManager.isTooLightForPrint('#000000')).toBe(false)
      expect(ColorContrastManager.isTooLightForPrint('#065f46')).toBe(false)
    })

    it('gets print-friendly version of colors', () => {
      const lightColor = '#FFFF99'
      const printFriendly = ColorContrastManager.getPrintFriendlyColor(lightColor)
      
      // Should meet print requirement
      expect(ColorContrastManager.meetsContrastRequirement(printFriendly, '#FFFFFF')).toBe(true)
    })

    it('returns print-friendly palette with good contrast', () => {
      const palette = ColorContrastManager.getPrintFriendlyPalette()
      
      // Should have multiple colors
      expect(palette.length).toBeGreaterThan(5)
      
      // All colors should meet contrast requirement
      palette.forEach(color => {
        expect(ColorContrastManager.meetsContrastRequirement(color, '#FFFFFF')).toBe(true)
      })
    })

    it('batch adjusts colors for print', () => {
      const colors = ['#FFFF99', '#CCCCCC', '#FF99FF', '#99FFFF']
      const adjusted = ColorContrastManager.adjustColorsForPrint(colors)
      
      // All adjusted colors should meet requirement
      adjusted.forEach(color => {
        expect(ColorContrastManager.meetsContrastRequirement(color, '#FFFFFF')).toBe(true)
      })
    })
  })

  describe('Requirement Validation', () => {
    it('validates Requirement 5.3: minimum 4.5:1 contrast ratio', () => {
      const testColors = [
        '#065f46', // Dark emerald
        '#1e40af', // Dark blue
        '#b91c1c', // Dark red
        '#000000', // Black
      ]
      
      testColors.forEach(color => {
        const ratio = ColorContrastManager.calculateContrastRatio(color, '#FFFFFF')
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      })
    })

    it('validates Requirement 3.4: legend text contrast of 4.5:1', () => {
      const legendColors = ColorContrastManager.getPrintFriendlyPalette()
      
      legendColors.forEach(color => {
        expect(ColorContrastManager.meetsContrastRequirement(color, '#FFFFFF', 4.5)).toBe(true)
      })
    })

    it('adjusts non-compliant colors to meet requirements', () => {
      const nonCompliantColors = [
        '#FFFF99', // Light yellow
        '#CCCCCC', // Light gray
        '#FF99FF', // Light magenta
        '#99FFFF', // Light cyan
      ]
      
      nonCompliantColors.forEach(color => {
        // Original should not meet requirement
        expect(ColorContrastManager.meetsContrastRequirement(color, '#FFFFFF')).toBe(false)
        
        // Adjusted should meet requirement
        const adjusted = ColorContrastManager.getPrintFriendlyColor(color)
        expect(ColorContrastManager.meetsContrastRequirement(adjusted, '#FFFFFF')).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles pure colors correctly', () => {
      expect(ColorContrastManager.calculateContrastRatio('#FF0000', '#FFFFFF')).toBeGreaterThan(1)
      expect(ColorContrastManager.calculateContrastRatio('#00FF00', '#FFFFFF')).toBeGreaterThan(1)
      expect(ColorContrastManager.calculateContrastRatio('#0000FF', '#FFFFFF')).toBeGreaterThan(1)
    })

    it('handles grayscale colors correctly', () => {
      const grays = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF']
      
      grays.forEach(gray => {
        const ratio = ColorContrastManager.calculateContrastRatio(gray, '#FFFFFF')
        expect(ratio).toBeGreaterThan(0)
        expect(ratio).toBeLessThanOrEqual(21)
      })
    })

    it('handles colors with similar luminance', () => {
      const ratio = ColorContrastManager.calculateContrastRatio('#808080', '#7F7F7F')
      expect(ratio).toBeCloseTo(1, 0)
    })

    it('preserves hue when adjusting lightness', () => {
      const blue = '#99CCFF' // Light blue
      const adjusted = ColorContrastManager.adjustColorForContrast(blue, '#FFFFFF')
      
      const originalHsl = ColorContrastManager.rgbToHsl(ColorContrastManager.hexToRgb(blue))
      const adjustedHsl = ColorContrastManager.rgbToHsl(ColorContrastManager.hexToRgb(adjusted))
      
      // Hue should be similar (within 10 degrees)
      expect(Math.abs(adjustedHsl.h - originalHsl.h)).toBeLessThan(10)
    })
  })
})
