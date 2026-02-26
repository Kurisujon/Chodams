/**
 * Unit Tests for LegendFormatter
 * 
 * Tests the LegendFormatter class functionality including:
 * - Legend formatting for print with minimum font size
 * - Layout determination (horizontal/vertical/grid)
 * - Label truncation for long text
 * - Color contrast adjustment for readability
 * - Integration with print requirements
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LegendFormatter } from '../Services/LegendFormatter';

describe('LegendFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new LegendFormatter();
  });

  describe('formatForPrint()', () => {
    describe('Minimum font size (Requirement 3.1)', () => {
      it('should use minimum 10pt font size for small legend', () => {
        const items = [
          { label: 'Item 1', color: '#ff0000' },
          { label: 'Item 2', color: '#00ff00' }
        ];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        expect(formatted.fontSize).toBe(10);
      });

      it('should use minimum 10pt font size for large legend', () => {
        const items = Array.from({ length: 20 }, (_, i) => ({
          label: `Item ${i + 1}`,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        }));
        
        const formatted = formatter.formatForPrint(items, 150, 200);
        
        expect(formatted.fontSize).toBe(10);
      });

      it('should use minimum 10pt font size regardless of available space', () => {
        const items = [{ label: 'Test', color: '#000000' }];
        
        // Test with various available spaces
        const spaces = [
          { width: 50, height: 50 },
          { width: 100, height: 100 },
          { width: 200, height: 200 }
        ];
        
        spaces.forEach(space => {
          const formatted = formatter.formatForPrint(items, space.width, space.height);
          expect(formatted.fontSize).toBe(10);
        });
      });
    });

    describe('Multi-column layout (Requirement 3.2)', () => {
      it('should use horizontal layout for 5 or fewer items', () => {
        const items = Array.from({ length: 5 }, (_, i) => ({
          label: `Item ${i + 1}`,
          color: '#000000'
        }));
        
        const formatted = formatter.formatForPrint(items, 200, 100);
        
        expect(formatted.layout).toBe('horizontal');
      });

      it('should use vertical layout for 6-10 items', () => {
        const items = Array.from({ length: 8 }, (_, i) => ({
          label: `Item ${i + 1}`,
          color: '#000000'
        }));
        
        const formatted = formatter.formatForPrint(items, 200, 100);
        
        expect(formatted.layout).toBe('vertical');
      });

      it('should use grid layout for more than 10 items', () => {
        const items = Array.from({ length: 15 }, (_, i) => ({
          label: `Item ${i + 1}`,
          color: '#000000'
        }));
        
        const formatted = formatter.formatForPrint(items, 200, 200);
        
        expect(formatted.layout).toBe('grid');
      });

      it('should arrange in multiple columns for grid layout', () => {
        const items = Array.from({ length: 16 }, (_, i) => ({
          label: `Item ${i + 1}`,
          color: '#000000'
        }));
        
        const formatted = formatter.formatForPrint(items, 200, 200);
        
        expect(formatted.layout).toBe('grid');
        expect(formatted.columns).toBeGreaterThan(1);
      });

      it('should limit columns based on available width', () => {
        const items = Array.from({ length: 20 }, (_, i) => ({
          label: `Item ${i + 1}`,
          color: '#000000'
        }));
        
        // Narrow width should limit columns
        const formatted = formatter.formatForPrint(items, 80, 200);
        
        expect(formatted.columns).toBeLessThanOrEqual(4); // Max 4 columns
      });
    });

    describe('Label truncation (Requirement 3.5)', () => {
      it('should truncate labels exceeding 30 characters', () => {
        const longLabel = 'This is a very long label that exceeds the maximum length';
        const items = [{ label: longLabel, color: '#000000' }];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        expect(formatted.items[0].displayLabel).toHaveLength(30);
        expect(formatted.items[0].displayLabel).toMatch(/\.\.\.$/);
        expect(formatted.items[0].truncated).toBe(true);
      });

      it('should not truncate labels under 30 characters', () => {
        const shortLabel = 'Short label';
        const items = [{ label: shortLabel, color: '#000000' }];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        expect(formatted.items[0].displayLabel).toBe(shortLabel);
        expect(formatted.items[0].truncated).toBe(false);
      });

      it('should preserve original label in item data', () => {
        const longLabel = 'This is a very long label that exceeds the maximum length';
        const items = [{ label: longLabel, color: '#000000' }];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        expect(formatted.items[0].label).toBe(longLabel);
        expect(formatted.items[0].displayLabel).not.toBe(longLabel);
      });

      it('should handle labels exactly at 30 character limit', () => {
        const exactLabel = 'A'.repeat(30);
        const items = [{ label: exactLabel, color: '#000000' }];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        expect(formatted.items[0].displayLabel).toBe(exactLabel);
        expect(formatted.items[0].truncated).toBe(false);
      });
    });

    describe('Color contrast adjustment (Requirement 3.4)', () => {
      it('should adjust light colors for white background', () => {
        const lightColor = '#ffff00'; // Yellow - poor contrast on white
        const items = [{ label: 'Test', color: lightColor }];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        // Adjusted color should be darker than original
        expect(formatted.items[0].color).not.toBe(lightColor);
        expect(formatted.items[0].color.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
      });

      it('should keep dark colors with sufficient contrast', () => {
        const darkColor = '#000000'; // Black - excellent contrast on white
        const items = [{ label: 'Test', color: darkColor }];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        // Should keep black as is
        expect(formatted.items[0].color.toLowerCase()).toBe(darkColor);
      });

      it('should ensure minimum 4.5:1 contrast ratio', () => {
        const items = [
          { label: 'Red', color: '#ff0000' },
          { label: 'Green', color: '#00ff00' },
          { label: 'Blue', color: '#0000ff' },
          { label: 'Yellow', color: '#ffff00' }
        ];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        formatted.items.forEach(item => {
          const hasSufficientContrast = formatter.hasSufficientContrast(item.color, '#ffffff');
          expect(hasSufficientContrast).toBe(true);
        });
      });

      it('should handle various color formats', () => {
        const items = [
          { label: 'Hex', color: '#ff0000' },
          { label: 'RGB', color: 'rgb(255, 0, 0)' },
          { label: 'Named', color: 'red' }
        ];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        // All should be converted to hex format
        formatted.items.forEach(item => {
          expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });
    });

    describe('Complete formatting', () => {
      it('should format all aspects of legend items', () => {
        const items = [
          { label: 'Short', color: '#ff0000', symbol: 'circle' },
          { label: 'This is a very long label that needs truncation', color: '#ffff00', symbol: 'square' }
        ];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        expect(formatted.fontSize).toBe(10);
        expect(formatted.layout).toBe('horizontal');
        expect(formatted.items).toHaveLength(2);
        
        // First item should not be truncated
        expect(formatted.items[0].truncated).toBe(false);
        expect(formatted.items[0].displayLabel).toBe('Short');
        
        // Second item should be truncated
        expect(formatted.items[1].truncated).toBe(true);
        expect(formatted.items[1].displayLabel).toHaveLength(30);
        
        // Both should have adjusted colors
        formatted.items.forEach(item => {
          expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });

      it('should preserve symbol information', () => {
        const items = [
          { label: 'Circle', color: '#000000', symbol: 'circle' },
          { label: 'Square', color: '#000000', symbol: 'square' },
          { label: 'Line', color: '#000000', symbol: 'line' }
        ];
        
        const formatted = formatter.formatForPrint(items, 150, 100);
        
        expect(formatted.items[0].symbol).toBe('circle');
        expect(formatted.items[1].symbol).toBe('square');
        expect(formatted.items[2].symbol).toBe('line');
      });
    });
  });

  describe('determineLayout()', () => {
    it('should return horizontal for 1 item', () => {
      expect(formatter.determineLayout(1)).toBe('horizontal');
    });

    it('should return horizontal for 5 items', () => {
      expect(formatter.determineLayout(5)).toBe('horizontal');
    });

    it('should return vertical for 6 items', () => {
      expect(formatter.determineLayout(6)).toBe('vertical');
    });

    it('should return vertical for 10 items', () => {
      expect(formatter.determineLayout(10)).toBe('vertical');
    });

    it('should return grid for 11 items', () => {
      expect(formatter.determineLayout(11)).toBe('grid');
    });

    it('should return grid for 20 items', () => {
      expect(formatter.determineLayout(20)).toBe('grid');
    });

    it('should return grid for 50 items', () => {
      expect(formatter.determineLayout(50)).toBe('grid');
    });

    it('should handle edge case of 0 items', () => {
      const layout = formatter.determineLayout(0);
      expect(['horizontal', 'vertical', 'grid']).toContain(layout);
    });
  });

  describe('truncateLabel()', () => {
    it('should not truncate short labels', () => {
      const label = 'Short';
      expect(formatter.truncateLabel(label, 30)).toBe(label);
    });

    it('should truncate long labels with ellipsis', () => {
      const label = 'This is a very long label that exceeds the limit';
      const truncated = formatter.truncateLabel(label, 20);
      
      expect(truncated).toHaveLength(20);
      expect(truncated).toMatch(/\.\.\.$/);
      expect(truncated).toBe('This is a very lo...');
    });

    it('should handle labels exactly at max length', () => {
      const label = 'A'.repeat(30);
      expect(formatter.truncateLabel(label, 30)).toBe(label);
    });

    it('should handle labels one character over max length', () => {
      const label = 'A'.repeat(31);
      const truncated = formatter.truncateLabel(label, 30);
      
      expect(truncated).toHaveLength(30);
      expect(truncated).toMatch(/\.\.\.$/);
    });

    it('should handle very short max lengths', () => {
      const label = 'Hello World';
      const truncated = formatter.truncateLabel(label, 5);
      
      expect(truncated).toHaveLength(5);
      expect(truncated).toBe('He...');
    });

    it('should handle empty labels', () => {
      expect(formatter.truncateLabel('', 30)).toBe('');
    });

    it('should handle max length of 3 (minimum for ellipsis)', () => {
      const label = 'Hello';
      const truncated = formatter.truncateLabel(label, 3);
      
      expect(truncated).toBe('...');
    });
  });

  describe('adjustColorContrast()', () => {
    describe('Color parsing', () => {
      it('should parse hex colors', () => {
        const adjusted = formatter.adjustColorContrast('#000000', '#ffffff');
        expect(adjusted).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('should parse short hex colors', () => {
        const adjusted = formatter.adjustColorContrast('#000', '#fff');
        expect(adjusted).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('should parse rgb colors', () => {
        const adjusted = formatter.adjustColorContrast('rgb(0, 0, 0)', '#ffffff');
        expect(adjusted).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('should parse rgba colors', () => {
        const adjusted = formatter.adjustColorContrast('rgba(0, 0, 0, 0.5)', '#ffffff');
        expect(adjusted).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('should parse named colors', () => {
        const adjusted = formatter.adjustColorContrast('red', '#ffffff');
        expect(adjusted).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    describe('Contrast adjustment', () => {
      it('should keep black on white (excellent contrast)', () => {
        const adjusted = formatter.adjustColorContrast('#000000', '#ffffff');
        expect(adjusted.toLowerCase()).toBe('#000000');
      });

      it('should darken yellow for white background', () => {
        const adjusted = formatter.adjustColorContrast('#ffff00', '#ffffff');
        
        // Yellow should be darkened
        expect(adjusted.toLowerCase()).not.toBe('#ffff00');
        
        // Should have sufficient contrast
        expect(formatter.hasSufficientContrast(adjusted, '#ffffff')).toBe(true);
      });

      it('should darken light gray for white background', () => {
        const adjusted = formatter.adjustColorContrast('#cccccc', '#ffffff');
        
        // Light gray should be darkened
        expect(adjusted.toLowerCase()).not.toBe('#cccccc');
        
        // Should have sufficient contrast
        expect(formatter.hasSufficientContrast(adjusted, '#ffffff')).toBe(true);
      });

      it('should keep dark colors with sufficient contrast', () => {
        const darkColors = ['#000000', '#333333', '#0000ff', '#008000'];
        
        darkColors.forEach(color => {
          const adjusted = formatter.adjustColorContrast(color, '#ffffff');
          expect(formatter.hasSufficientContrast(adjusted, '#ffffff')).toBe(true);
        });
      });

      it('should handle edge case of white on white', () => {
        const adjusted = formatter.adjustColorContrast('#ffffff', '#ffffff');
        
        // Should be darkened significantly
        expect(adjusted.toLowerCase()).not.toBe('#ffffff');
        expect(formatter.hasSufficientContrast(adjusted, '#ffffff')).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should return safe default for invalid color', () => {
        const adjusted = formatter.adjustColorContrast('invalid-color', '#ffffff');
        expect(adjusted).toBe('#000000'); // Safe default
      });

      it('should handle malformed hex colors', () => {
        const adjusted = formatter.adjustColorContrast('#gggggg', '#ffffff');
        expect(adjusted).toBe('#000000'); // Safe default
      });

      it('should handle malformed rgb colors', () => {
        const adjusted = formatter.adjustColorContrast('rgb(999, 999, 999)', '#ffffff');
        expect(adjusted).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('hasSufficientContrast()', () => {
    it('should return true for black on white', () => {
      expect(formatter.hasSufficientContrast('#000000', '#ffffff')).toBe(true);
    });

    it('should return true for white on black', () => {
      expect(formatter.hasSufficientContrast('#ffffff', '#000000')).toBe(true);
    });

    it('should return false for yellow on white', () => {
      expect(formatter.hasSufficientContrast('#ffff00', '#ffffff')).toBe(false);
    });

    it('should return false for light gray on white', () => {
      expect(formatter.hasSufficientContrast('#cccccc', '#ffffff')).toBe(false);
    });

    it('should return true for dark blue on white', () => {
      expect(formatter.hasSufficientContrast('#0000ff', '#ffffff')).toBe(true);
    });

    it('should return true for dark green on white', () => {
      expect(formatter.hasSufficientContrast('#008000', '#ffffff')).toBe(true);
    });

    it('should return false for white on white', () => {
      expect(formatter.hasSufficientContrast('#ffffff', '#ffffff')).toBe(false);
    });

    it('should return false for black on black', () => {
      expect(formatter.hasSufficientContrast('#000000', '#000000')).toBe(false);
    });

    it('should handle invalid colors gracefully', () => {
      expect(formatter.hasSufficientContrast('invalid', '#ffffff')).toBe(false);
    });
  });

  describe('Getter methods', () => {
    it('should return minimum font size of 10pt', () => {
      expect(formatter.getMinFontSize()).toBe(10);
    });

    it('should return maximum label length of 30 characters', () => {
      expect(formatter.getMaxLabelLength()).toBe(30);
    });

    it('should return minimum contrast ratio of 4.5', () => {
      expect(formatter.getMinContrastRatio()).toBe(4.5);
    });

    it('should return consistent values across multiple calls', () => {
      expect(formatter.getMinFontSize()).toBe(formatter.getMinFontSize());
      expect(formatter.getMaxLabelLength()).toBe(formatter.getMaxLabelLength());
      expect(formatter.getMinContrastRatio()).toBe(formatter.getMinContrastRatio());
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle empty legend items array', () => {
      const formatted = formatter.formatForPrint([], 150, 100);
      
      expect(formatted.items).toHaveLength(0);
      expect(formatted.fontSize).toBe(10);
      expect(formatted.layout).toBeDefined();
    });

    it('should handle single legend item', () => {
      const items = [{ label: 'Single', color: '#000000' }];
      const formatted = formatter.formatForPrint(items, 150, 100);
      
      expect(formatted.items).toHaveLength(1);
      expect(formatted.layout).toBe('horizontal');
    });

    it('should handle very large number of items', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        label: `Item ${i + 1}`,
        color: '#000000'
      }));
      
      const formatted = formatter.formatForPrint(items, 200, 300);
      
      expect(formatted.items).toHaveLength(100);
      expect(formatted.layout).toBe('grid');
      expect(formatted.columns).toBeGreaterThan(1);
    });

    it('should handle very small available space', () => {
      const items = [{ label: 'Test', color: '#000000' }];
      const formatted = formatter.formatForPrint(items, 10, 10);
      
      // Should still produce valid output
      expect(formatted.fontSize).toBe(10);
      expect(formatted.items).toHaveLength(1);
    });

    it('should handle very large available space', () => {
      const items = [{ label: 'Test', color: '#000000' }];
      const formatted = formatter.formatForPrint(items, 1000, 1000);
      
      // Should still produce valid output
      expect(formatted.fontSize).toBe(10);
      expect(formatted.items).toHaveLength(1);
    });

    it('should handle items without symbol property', () => {
      const items = [
        { label: 'No Symbol', color: '#000000' }
      ];
      
      const formatted = formatter.formatForPrint(items, 150, 100);
      
      expect(formatted.items[0].symbol).toBeUndefined();
    });

    it('should handle special characters in labels', () => {
      const items = [
        { label: 'Test & Special <> Characters "quotes"', color: '#000000' }
      ];
      
      const formatted = formatter.formatForPrint(items, 150, 100);
      
      expect(formatted.items[0].displayLabel).toContain('&');
      expect(formatted.items[0].displayLabel).toContain('<>');
    });

    it('should handle unicode characters in labels', () => {
      const items = [
        { label: 'Test 中文 العربية 🎨', color: '#000000' }
      ];
      
      const formatted = formatter.formatForPrint(items, 150, 100);
      
      expect(formatted.items[0].displayLabel).toBeDefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should format legend for typical bar chart', () => {
      const items = [
        { label: 'Q1 Sales', color: '#3b82f6', symbol: 'square' },
        { label: 'Q2 Sales', color: '#10b981', symbol: 'square' },
        { label: 'Q3 Sales', color: '#f59e0b', symbol: 'square' },
        { label: 'Q4 Sales', color: '#ef4444', symbol: 'square' }
      ];
      
      const formatted = formatter.formatForPrint(items, 170, 100);
      
      expect(formatted.layout).toBe('horizontal');
      expect(formatted.fontSize).toBe(10);
      expect(formatted.items).toHaveLength(4);
      
      // All items should have sufficient contrast
      formatted.items.forEach(item => {
        expect(formatter.hasSufficientContrast(item.color, '#ffffff')).toBe(true);
      });
    });

    it('should format legend for line chart with many series', () => {
      const items = Array.from({ length: 12 }, (_, i) => ({
        label: `Series ${i + 1}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        symbol: 'line'
      }));
      
      const formatted = formatter.formatForPrint(items, 170, 150);
      
      expect(formatted.layout).toBe('grid');
      expect(formatted.fontSize).toBe(10);
      expect(formatted.columns).toBeGreaterThan(1);
    });

    it('should format legend for pie chart with long category names', () => {
      const items = [
        { label: 'Very Long Category Name That Exceeds Maximum Length', color: '#ff0000', symbol: 'circle' },
        { label: 'Another Extremely Long Category Name', color: '#00ff00', symbol: 'circle' },
        { label: 'Short', color: '#0000ff', symbol: 'circle' }
      ];
      
      const formatted = formatter.formatForPrint(items, 150, 100);
      
      expect(formatted.items[0].truncated).toBe(true);
      expect(formatted.items[1].truncated).toBe(true);
      expect(formatted.items[2].truncated).toBe(false);
      
      // All should fit within 30 characters
      formatted.items.forEach(item => {
        expect(item.displayLabel.length).toBeLessThanOrEqual(30);
      });
    });
  });
});
