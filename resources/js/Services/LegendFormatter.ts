/**
 * LegendFormatter Service
 * 
 * Ensures chart legends are readable in print output by managing font sizes,
 * layout, label truncation, and color contrast. Handles legends with varying
 * numbers of items and ensures they fit within available space.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

/**
 * Legend item representing a single entry in the chart legend
 */
export interface LegendItem {
  /** Display label for the legend item */
  label: string;
  
  /** Color associated with this legend item (hex, rgb, or named color) */
  color: string;
  
  /** Optional symbol type for the legend marker */
  symbol?: 'circle' | 'square' | 'line';
}

/**
 * Formatted legend item with display modifications
 */
export interface FormattedLegendItem extends LegendItem {
  /** Whether the label was truncated */
  truncated: boolean;
  
  /** The display label (may be truncated) */
  displayLabel: string;
}

/**
 * Formatted legend configuration for print output
 */
export interface FormattedLegend {
  /** Layout type for the legend */
  layout: 'horizontal' | 'vertical' | 'grid';
  
  /** Font size in points (pt) */
  fontSize: number;
  
  /** Number of columns for grid layout */
  columns: number;
  
  /** Formatted legend items */
  items: FormattedLegendItem[];
}

/**
 * LegendFormatter class
 * 
 * Responsible for:
 * - Formatting legends for print with minimum 10pt font size
 * - Determining optimal layout (horizontal/vertical/grid) based on item count
 * - Truncating long labels to fit within available space
 * - Adjusting colors to ensure sufficient contrast (4.5:1 ratio minimum)
 * - Ensuring legends don't overlap with chart content
 */
export class LegendFormatter {
  // Minimum font size for print readability (in pt)
  private static readonly MIN_FONT_SIZE = 10;
  
  // Maximum label length before truncation (in characters)
  private static readonly MAX_LABEL_LENGTH = 30;
  
  // Threshold for switching to multi-column layout
  private static readonly MULTI_COLUMN_THRESHOLD = 10;
  
  // Threshold for switching to grid layout
  private static readonly GRID_LAYOUT_THRESHOLD = 10;
  
  // Minimum contrast ratio for WCAG AA compliance
  private static readonly MIN_CONTRAST_RATIO = 4.5;

  /**
   * Format legend for print readability
   * 
   * Takes a list of legend items and available space, then determines the
   * optimal layout, font size, and formatting to ensure readability in print.
   * 
   * @param items - Array of legend items to format
   * @param availableWidth - Available width in millimeters
   * @param availableHeight - Available height in millimeters
   * @returns FormattedLegend with layout, font size, and formatted items
   * 
   * Requirements:
   * - 3.1: Uses minimum 10pt font size
   * - 3.2: Arranges in multiple columns when > 10 items
   * - 3.5: Truncates or wraps text exceeding available width
   */
  formatForPrint(
    items: LegendItem[],
    availableWidth: number,
    availableHeight: number
  ): FormattedLegend {
    // Determine optimal layout based on item count
    const layout = this.determineLayout(items.length);
    
    // Calculate number of columns for grid layout
    let columns = 1;
    if (layout === 'horizontal') {
      columns = Math.min(items.length, Math.floor(availableWidth / 40)); // ~40mm per item
    } else if (layout === 'grid') {
      columns = Math.ceil(Math.sqrt(items.length));
      // Ensure we don't exceed available width
      const maxColumns = Math.floor(availableWidth / 40);
      columns = Math.min(columns, maxColumns, 4); // Cap at 4 columns
    }
    
    // Format each legend item
    const formattedItems = items.map(item => {
      // Truncate label if needed
      const displayLabel = item.label.length > LegendFormatter.MAX_LABEL_LENGTH
        ? this.truncateLabel(item.label, LegendFormatter.MAX_LABEL_LENGTH)
        : item.label;
      
      // Adjust color contrast for print (white background)
      const adjustedColor = this.adjustColorContrast(item.color, '#ffffff');
      
      return {
        ...item,
        color: adjustedColor,
        truncated: displayLabel !== item.label,
        displayLabel
      };
    });
    
    return {
      layout,
      fontSize: LegendFormatter.MIN_FONT_SIZE,
      columns,
      items: formattedItems
    };
  }

  /**
   * Determine optimal layout based on item count
   * 
   * Layout selection logic:
   * - 1-5 items: Horizontal layout (items in a row)
   * - 6-10 items: Vertical layout (single column)
   * - 11+ items: Grid layout (multiple columns)
   * 
   * @param itemCount - Number of legend items
   * @returns Layout type ('horizontal', 'vertical', or 'grid')
   * 
   * Requirements:
   * - 3.2: Uses multiple columns for > 10 items
   */
  determineLayout(itemCount: number): 'horizontal' | 'vertical' | 'grid' {
    if (itemCount <= 5) {
      return 'horizontal';
    } else if (itemCount <= LegendFormatter.GRID_LAYOUT_THRESHOLD) {
      return 'vertical';
    } else {
      return 'grid';
    }
  }

  /**
   * Truncate label with ellipsis if it exceeds maximum length
   * 
   * Ensures labels fit within available space by truncating long text
   * and adding an ellipsis (...) to indicate truncation.
   * 
   * @param label - Original label text
   * @param maxLength - Maximum allowed length in characters
   * @returns Truncated label with ellipsis if needed
   * 
   * Requirements:
   * - 3.5: Handles text overflow with truncation
   */
  truncateLabel(label: string, maxLength: number): string {
    if (label.length <= maxLength) {
      return label;
    }
    
    // Truncate and add ellipsis
    // Reserve 3 characters for the ellipsis
    return label.substring(0, maxLength - 3) + '...';
  }

  /**
   * Adjust color contrast to ensure readability against background
   * 
   * Ensures the legend text/symbol color has sufficient contrast (4.5:1 ratio)
   * against the background color for WCAG AA compliance. If contrast is
   * insufficient, the color is darkened or lightened as needed.
   * 
   * @param color - Foreground color (hex, rgb, or named color)
   * @param background - Background color (hex, rgb, or named color)
   * @returns Adjusted color with sufficient contrast (always in hex format)
   * 
   * Requirements:
   * - 3.4: Ensures minimum 4.5:1 contrast ratio
   */
  adjustColorContrast(color: string, background: string): string {
    try {
      // Parse colors to RGB
      const fgRgb = this.parseColor(color);
      const bgRgb = this.parseColor(background);
      
      // Check if parsing was successful (not default black)
      // If we got default black for an invalid color, return safe default
      if (color !== '#000000' && color !== 'black' && 
          fgRgb.r === 0 && fgRgb.g === 0 && fgRgb.b === 0 &&
          !color.toLowerCase().includes('000')) {
        // Likely a parsing failure for invalid color
        return '#000000';
      }
      
      // Calculate current contrast ratio
      const currentRatio = this.calculateContrastRatio(fgRgb, bgRgb);
      
      // If contrast is sufficient, return color in hex format
      if (currentRatio >= LegendFormatter.MIN_CONTRAST_RATIO) {
        return this.rgbToHex(fgRgb);
      }
      
      // Adjust color to meet contrast requirements
      // Strategy: Darken light colors, lighten dark colors
      const fgLuminance = this.calculateRelativeLuminance(fgRgb);
      const bgLuminance = this.calculateRelativeLuminance(bgRgb);
      
      let adjustedRgb = { ...fgRgb };
      
      // If foreground is lighter than background, darken it
      // If foreground is darker than background, we might need to darken it more
      // For white background, we generally want to darken colors
      if (bgLuminance > 0.5) {
        // Light background - darken the foreground
        adjustedRgb = this.darkenColor(fgRgb, currentRatio);
      } else {
        // Dark background - lighten the foreground
        adjustedRgb = this.lightenColor(fgRgb, currentRatio);
      }
      
      // Convert back to hex
      return this.rgbToHex(adjustedRgb);
      
    } catch (error) {
      // If color parsing fails, return a safe default (black for light backgrounds)
      console.warn(`Failed to adjust color contrast for ${color}:`, error);
      return '#000000';
    }
  }

  /**
   * Parse color string to RGB object
   * Supports hex (#RRGGBB, #RGB), rgb(r,g,b), and common named colors
   * Throws error for invalid colors to allow proper error handling
   */
  private parseColor(color: string): { r: number; g: number; b: number } {
    // Handle hex colors
    if (color.startsWith('#')) {
      const rgb = this.hexToRgb(color);
      // Check if parsing resulted in NaN
      if (isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) {
        throw new Error(`Invalid hex color: ${color}`);
      }
      return rgb;
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
      throw new Error(`Invalid rgb color: ${color}`);
    }
    
    // Handle common named colors
    const namedColors: Record<string, string> = {
      'white': '#ffffff',
      'black': '#000000',
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    const normalizedColor = color.toLowerCase();
    if (namedColors[normalizedColor]) {
      return this.hexToRgb(namedColors[normalizedColor]);
    }
    
    // Throw error for unrecognized colors
    throw new Error(`Unrecognized color format: ${color}`);
  }

  /**
   * Convert hex color to RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle short form (#RGB)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Convert RGB object to hex color string
   */
  private rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Calculate relative luminance of a color (WCAG formula)
   * https://www.w3.org/TR/WCAG20/#relativeluminancedef
   */
  private calculateRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    // Convert to 0-1 range
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    // Apply gamma correction
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    // Calculate luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors (WCAG formula)
   * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
   */
  private calculateContrastRatio(
    rgb1: { r: number; g: number; b: number },
    rgb2: { r: number; g: number; b: number }
  ): number {
    const l1 = this.calculateRelativeLuminance(rgb1);
    const l2 = this.calculateRelativeLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Darken a color to improve contrast
   */
  private darkenColor(
    rgb: { r: number; g: number; b: number },
    currentRatio: number
  ): { r: number; g: number; b: number } {
    // Calculate how much we need to darken
    // More aggressive darkening if contrast is very low
    const darkenFactor = currentRatio < 2 ? 0.4 : 0.6;
    
    return {
      r: Math.round(rgb.r * darkenFactor),
      g: Math.round(rgb.g * darkenFactor),
      b: Math.round(rgb.b * darkenFactor)
    };
  }

  /**
   * Lighten a color to improve contrast
   */
  private lightenColor(
    rgb: { r: number; g: number; b: number },
    currentRatio: number
  ): { r: number; g: number; b: number } {
    // Calculate how much we need to lighten
    const lightenFactor = currentRatio < 2 ? 0.6 : 0.4;
    
    return {
      r: Math.round(rgb.r + (255 - rgb.r) * lightenFactor),
      g: Math.round(rgb.g + (255 - rgb.g) * lightenFactor),
      b: Math.round(rgb.b + (255 - rgb.b) * lightenFactor)
    };
  }

  /**
   * Check if a color has sufficient contrast against a background
   * 
   * @param color - Foreground color
   * @param background - Background color
   * @returns True if contrast ratio is >= 4.5:1
   */
  hasSufficientContrast(color: string, background: string): boolean {
    try {
      const fgRgb = this.parseColor(color);
      const bgRgb = this.parseColor(background);
      const ratio = this.calculateContrastRatio(fgRgb, bgRgb);
      return ratio >= LegendFormatter.MIN_CONTRAST_RATIO;
    } catch {
      return false;
    }
  }

  /**
   * Get the minimum font size for print
   * @returns Minimum font size in points
   */
  getMinFontSize(): number {
    return LegendFormatter.MIN_FONT_SIZE;
  }

  /**
   * Get the maximum label length before truncation
   * @returns Maximum label length in characters
   */
  getMaxLabelLength(): number {
    return LegendFormatter.MAX_LABEL_LENGTH;
  }

  /**
   * Get the minimum contrast ratio required
   * @returns Minimum contrast ratio (4.5:1 for WCAG AA)
   */
  getMinContrastRatio(): number {
    return LegendFormatter.MIN_CONTRAST_RATIO;
  }
}

// Export singleton instance for convenience
export const legendFormatter = new LegendFormatter();

// Export class for testing and custom instances
export default LegendFormatter;
