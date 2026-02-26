/**
 * ColorContrastManager
 * 
 * Utility for ensuring print-friendly colors with sufficient contrast ratios.
 * Implements WCAG 2.1 contrast ratio calculations and adjustments.
 * 
 * Requirements:
 * - 5.3: Print-friendly colors with minimum 4.5:1 contrast ratio
 * - 3.4: Legend text contrast of at least 4.5:1
 */

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export class ColorContrastManager {
  /**
   * Calculate relative luminance of a color
   * Based on WCAG 2.1 formula
   */
  private static getRelativeLuminance(rgb: RGB): number {
    const { r, g, b } = rgb
    
    // Normalize RGB values to 0-1 range
    const rsRGB = r / 255
    const gsRGB = g / 255
    const bsRGB = b / 255
    
    // Apply gamma correction
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)
    
    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
  }

  /**
   * Calculate contrast ratio between two colors
   * Returns a value between 1 and 21
   */
  static calculateContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) {
      throw new Error('Invalid color format')
    }
    
    const lum1 = this.getRelativeLuminance(rgb1)
    const lum2 = this.getRelativeLuminance(rgb2)
    
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Check if contrast ratio meets WCAG AA standard (4.5:1)
   */
  static meetsContrastRequirement(
    foreground: string,
    background: string,
    minRatio: number = 4.5
  ): boolean {
    try {
      const ratio = this.calculateContrastRatio(foreground, background)
      return ratio >= minRatio
    } catch (error) {
      console.warn('Failed to calculate contrast ratio:', error)
      return false
    }
  }

  /**
   * Adjust color to meet minimum contrast ratio
   * Returns adjusted color as hex string
   */
  static adjustColorForContrast(
    foreground: string,
    background: string,
    minRatio: number = 4.5
  ): string {
    // Check if already meets requirement
    if (this.meetsContrastRequirement(foreground, background, minRatio)) {
      return foreground
    }

    const bgRgb = this.hexToRgb(background)
    if (!bgRgb) {
      return foreground
    }

    const bgLuminance = this.getRelativeLuminance(bgRgb)
    const fgRgb = this.hexToRgb(foreground)
    if (!fgRgb) {
      return foreground
    }

    // Convert to HSL for easier manipulation
    const hsl = this.rgbToHsl(fgRgb)
    
    // Determine if we need to darken or lighten
    const shouldDarken = bgLuminance > 0.5
    
    // Binary search for optimal lightness
    let minL = 0
    let maxL = 100
    let iterations = 0
    const maxIterations = 20
    
    while (iterations < maxIterations) {
      const testL = shouldDarken ? minL + (hsl.l - minL) / 2 : hsl.l + (maxL - hsl.l) / 2
      const testRgb = this.hslToRgb({ ...hsl, l: testL })
      const testHex = this.rgbToHex(testRgb)
      
      const ratio = this.calculateContrastRatio(testHex, background)
      
      if (Math.abs(ratio - minRatio) < 0.1) {
        return testHex
      }
      
      if (ratio < minRatio) {
        if (shouldDarken) {
          maxL = testL
        } else {
          minL = testL
        }
      } else {
        if (shouldDarken) {
          minL = testL
        } else {
          maxL = testL
        }
      }
      
      iterations++
    }
    
    // Return best attempt
    const finalRgb = this.hslToRgb({ ...hsl, l: shouldDarken ? minL : maxL })
    return this.rgbToHex(finalRgb)
  }

  /**
   * Get print-friendly version of a color
   * Ensures sufficient contrast against white background
   */
  static getPrintFriendlyColor(color: string): string {
    return this.adjustColorForContrast(color, '#FFFFFF', 4.5)
  }

  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): RGB | null {
    // Remove # if present
    hex = hex.replace(/^#/, '')
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    
    if (hex.length !== 6) {
      return null
    }
    
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return null
    }
    
    return { r, g, b }
  }

  /**
   * Convert RGB to hex color
   */
  static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
  }

  /**
   * Convert RGB to HSL
   */
  static rgbToHsl(rgb: RGB): HSL {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    
    let h = 0
    let s = 0
    const l = (max + min) / 2
    
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
      
      switch (max) {
        case r:
          h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / delta + 2) / 6
          break
        case b:
          h = ((r - g) / delta + 4) / 6
          break
      }
    }
    
    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    }
  }

  /**
   * Convert HSL to RGB
   */
  static hslToRgb(hsl: HSL): RGB {
    const h = hsl.h / 360
    const s = hsl.s / 100
    const l = hsl.l / 100
    
    let r, g, b
    
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    return {
      r: r * 255,
      g: g * 255,
      b: b * 255
    }
  }

  /**
   * Check if a color is too light for print (against white background)
   */
  static isTooLightForPrint(color: string): boolean {
    return !this.meetsContrastRequirement(color, '#FFFFFF', 4.5)
  }

  /**
   * Get a set of print-friendly colors for charts
   * Returns colors that have good contrast against white
   */
  static getPrintFriendlyPalette(): string[] {
    return [
      '#065f46', // Dark emerald (primary)
      '#1e40af', // Dark blue
      '#b91c1c', // Dark red
      '#92400e', // Dark amber
      '#6b21a8', // Dark purple
      '#0f766e', // Dark teal
      '#be123c', // Dark rose
      '#4338ca', // Dark indigo
      '#15803d', // Dark green
      '#9a3412', // Dark orange
    ]
  }

  /**
   * Batch adjust colors for print
   */
  static adjustColorsForPrint(colors: string[]): string[] {
    return colors.map(color => this.getPrintFriendlyColor(color))
  }
}

export default ColorContrastManager
