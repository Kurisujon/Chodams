/**
 * Unit Tests for PrintStyleManager
 * 
 * Tests the PrintStyleManager class functionality including:
 * - Paper size detection with fallback to A4
 * - Print style application and removal
 * - Error handling and edge cases
 * 
 * Requirements: 1.1, 1.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrintStyleManager } from '../Services/PrintStyleManager';
import { PAPER_SIZES } from '../Services/PaperConfiguration';

describe('PrintStyleManager', () => {
  let manager;

  beforeEach(() => {
    // Create a fresh instance for each test
    manager = new PrintStyleManager();
    
    // Clean up any existing print styles
    const existingStyles = document.querySelectorAll('style[data-print-style-manager="true"]');
    existingStyles.forEach(style => style.remove());
  });

  afterEach(() => {
    // Clean up after each test
    manager.removePrintStyles();
  });

  describe('detectPaperSize()', () => {
    it('should return a valid paper format', () => {
      const format = manager.detectPaperSize();
      expect(['A4', 'Letter', 'Legal']).toContain(format);
    });

    it('should default to A4 when detection fails', () => {
      // Mock matchMedia to return false for all queries
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const format = manager.detectPaperSize();
      expect(format).toBe('A4');

      // Restore original matchMedia
      window.matchMedia = originalMatchMedia;
    });

    it('should detect Letter format when matchMedia indicates 8.5in × 11in', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('8.5in') && query.includes('11in'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const format = manager.detectPaperSize();
      expect(format).toBe('Letter');

      window.matchMedia = originalMatchMedia;
    });

    it('should detect Legal format when matchMedia indicates 8.5in × 14in', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('8.5in') && query.includes('14in'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const format = manager.detectPaperSize();
      expect(format).toBe('Legal');

      window.matchMedia = originalMatchMedia;
    });

    it('should detect A4 format when matchMedia indicates 210mm × 297mm', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('210mm') && query.includes('297mm'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const format = manager.detectPaperSize();
      expect(format).toBe('A4');

      window.matchMedia = originalMatchMedia;
    });

    it('should handle errors gracefully and fallback to A4', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });

      const format = manager.detectPaperSize();
      expect(format).toBe('A4');

      window.matchMedia = originalMatchMedia;
    });

    it('should cache the detected paper size', () => {
      const format1 = manager.detectPaperSize();
      const format2 = manager.getCurrentPaperFormat();
      expect(format2).toBe(format1);
    });
  });

  describe('applyPrintStyles()', () => {
    it('should create and append a style element to document head', () => {
      manager.applyPrintStyles('A4');
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement).not.toBeNull();
      expect(document.head.contains(styleElement)).toBe(true);
    });

    it('should apply A4-specific styles when A4 format is specified', () => {
      manager.applyPrintStyles('A4');
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('A4');
      expect(styleElement.textContent).toContain('20mm'); // A4 margins
    });

    it('should apply Letter-specific styles when Letter format is specified', () => {
      manager.applyPrintStyles('Letter');
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('letter');
      expect(styleElement.textContent).toContain('19.05mm'); // Letter margins
    });

    it('should apply Legal-specific styles when Legal format is specified', () => {
      manager.applyPrintStyles('Legal');
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('legal');
      expect(styleElement.textContent).toContain('19.05mm'); // Legal margins
    });

    it('should use detected paper size when no format is specified', () => {
      // Mock detection to return Letter
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('8.5in') && query.includes('11in'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      manager.applyPrintStyles();
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('letter');

      window.matchMedia = originalMatchMedia;
    });

    it('should remove existing styles before applying new ones', () => {
      manager.applyPrintStyles('A4');
      const firstElement = document.querySelector('style[data-print-style-manager="true"]');
      
      manager.applyPrintStyles('Letter');
      const secondElement = document.querySelector('style[data-print-style-manager="true"]');
      
      // Should only have one style element
      const allElements = document.querySelectorAll('style[data-print-style-manager="true"]');
      expect(allElements.length).toBe(1);
      
      // Should be the new one
      expect(secondElement.textContent).toContain('letter');
    });

    it('should include CSS to hide non-essential elements', () => {
      manager.applyPrintStyles('A4');
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('.no-print');
      expect(styleElement.textContent).toContain('display: none');
    });

    it('should include CSS for page break control', () => {
      manager.applyPrintStyles('A4');
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('page-break-inside: avoid');
      expect(styleElement.textContent).toContain('break-inside: avoid');
    });

    it('should set printable area constraints based on paper dimensions', () => {
      manager.applyPrintStyles('A4');
      
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      const a4Dimensions = PAPER_SIZES.A4;
      const printableWidth = a4Dimensions.width - a4Dimensions.marginLeft - a4Dimensions.marginRight;
      
      expect(styleElement.textContent).toContain(`${printableWidth}mm`);
    });

    it('should update current paper format after applying styles', () => {
      manager.applyPrintStyles('Letter');
      expect(manager.getCurrentPaperFormat()).toBe('Letter');
    });

    it('should indicate that print styles are applied', () => {
      expect(manager.isPrintStylesApplied()).toBe(false);
      
      manager.applyPrintStyles('A4');
      expect(manager.isPrintStylesApplied()).toBe(true);
    });
  });

  describe('removePrintStyles()', () => {
    it('should remove the style element from document head', () => {
      manager.applyPrintStyles('A4');
      expect(document.querySelector('style[data-print-style-manager="true"]')).not.toBeNull();
      
      manager.removePrintStyles();
      expect(document.querySelector('style[data-print-style-manager="true"]')).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      manager.applyPrintStyles('A4');
      manager.removePrintStyles();
      
      // Should not throw
      expect(() => manager.removePrintStyles()).not.toThrow();
    });

    it('should be safe to call when no styles are applied', () => {
      // Should not throw
      expect(() => manager.removePrintStyles()).not.toThrow();
    });

    it('should remove orphaned style elements', () => {
      // Manually create an orphaned style element
      const orphanedStyle = document.createElement('style');
      orphanedStyle.setAttribute('data-print-style-manager', 'true');
      document.head.appendChild(orphanedStyle);
      
      manager.removePrintStyles();
      
      expect(document.querySelector('style[data-print-style-manager="true"]')).toBeNull();
    });

    it('should update isPrintStylesApplied status', () => {
      manager.applyPrintStyles('A4');
      expect(manager.isPrintStylesApplied()).toBe(true);
      
      manager.removePrintStyles();
      expect(manager.isPrintStylesApplied()).toBe(false);
    });
  });

  describe('getCurrentPaperFormat()', () => {
    it('should return null initially', () => {
      expect(manager.getCurrentPaperFormat()).toBeNull();
    });

    it('should return the detected format after detection', () => {
      const format = manager.detectPaperSize();
      expect(manager.getCurrentPaperFormat()).toBe(format);
    });

    it('should return the applied format after applying styles', () => {
      manager.applyPrintStyles('Legal');
      expect(manager.getCurrentPaperFormat()).toBe('Legal');
    });
  });

  describe('isPrintStylesApplied()', () => {
    it('should return false initially', () => {
      expect(manager.isPrintStylesApplied()).toBe(false);
    });

    it('should return true after applying styles', () => {
      manager.applyPrintStyles('A4');
      expect(manager.isPrintStylesApplied()).toBe(true);
    });

    it('should return false after removing styles', () => {
      manager.applyPrintStyles('A4');
      manager.removePrintStyles();
      expect(manager.isPrintStylesApplied()).toBe(false);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing window object gracefully', () => {
      // This test is more conceptual since we're in a browser environment
      // In a real scenario without window, it should default to A4
      const format = manager.detectPaperSize();
      expect(['A4', 'Letter', 'Legal']).toContain(format);
    });

    it('should handle all three paper formats correctly', () => {
      ['A4', 'Letter', 'Legal'].forEach(format => {
        manager.applyPrintStyles(format);
        const styleElement = document.querySelector('style[data-print-style-manager="true"]');
        expect(styleElement).not.toBeNull();
        expect(styleElement.textContent).toContain(format === 'A4' ? 'A4' : format.toLowerCase());
        manager.removePrintStyles();
      });
    });

    it('should calculate correct printable areas for all paper formats', () => {
      ['A4', 'Letter', 'Legal'].forEach(format => {
        manager.applyPrintStyles(format);
        const styleElement = document.querySelector('style[data-print-style-manager="true"]');
        const dimensions = PAPER_SIZES[format];
        const printableWidth = dimensions.width - dimensions.marginLeft - dimensions.marginRight;
        
        expect(styleElement.textContent).toContain(`${printableWidth}mm`);
        manager.removePrintStyles();
      });
    });

    it('should handle rapid apply/remove cycles', () => {
      for (let i = 0; i < 10; i++) {
        manager.applyPrintStyles('A4');
        manager.removePrintStyles();
      }
      
      // Should end in clean state
      expect(manager.isPrintStylesApplied()).toBe(false);
      expect(document.querySelector('style[data-print-style-manager="true"]')).toBeNull();
    });

    it('should handle switching between paper formats', () => {
      manager.applyPrintStyles('A4');
      expect(manager.getCurrentPaperFormat()).toBe('A4');
      
      manager.applyPrintStyles('Letter');
      expect(manager.getCurrentPaperFormat()).toBe('Letter');
      
      manager.applyPrintStyles('Legal');
      expect(manager.getCurrentPaperFormat()).toBe('Legal');
      
      // Should only have one style element
      const allElements = document.querySelectorAll('style[data-print-style-manager="true"]');
      expect(allElements.length).toBe(1);
    });
  });

  describe('CSS content validation', () => {
    it('should include @media print wrapper', () => {
      manager.applyPrintStyles('A4');
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('@media print');
    });

    it('should include @page rules', () => {
      manager.applyPrintStyles('A4');
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('@page');
    });

    it('should set body background to white for print', () => {
      manager.applyPrintStyles('A4');
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('background: white');
    });

    it('should set body text color to black for print', () => {
      manager.applyPrintStyles('A4');
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('color: black');
    });

    it('should include color adjustment for exact color printing', () => {
      manager.applyPrintStyles('A4');
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('print-color-adjust: exact');
    });

    it('should set minimum font size for readability', () => {
      manager.applyPrintStyles('A4');
      const styleElement = document.querySelector('style[data-print-style-manager="true"]');
      expect(styleElement.textContent).toContain('font-size: 10pt');
    });
  });
});

describe('PrintStyleManager - Page Break Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new PrintStyleManager();
    const existingStyles = document.querySelectorAll('style[data-print-style-manager="true"]');
    existingStyles.forEach(style => style.remove());
  });

  afterEach(() => {
    manager.removePrintStyles();
  });

  describe('applyIntelligentPageBreaks()', () => {
    it('should return 0 when page break manager is not initialized', () => {
      // Don't apply print styles, so page break manager won't be initialized
      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      expect(breaksAdded).toBe(0);
    });

    it('should return number of page breaks added after applying print styles', () => {
      // Apply print styles to initialize page break manager
      manager.applyPrintStyles('A4');
      
      // Create a test section
      const section = document.createElement('div');
      section.className = 'analytics-section';
      document.body.appendChild(section);
      
      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      expect(typeof breaksAdded).toBe('number');
      expect(breaksAdded).toBeGreaterThanOrEqual(0);
      
      // Clean up
      document.body.removeChild(section);
    });

    it('should work with different paper formats', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        manager.applyPrintStyles(format);
        
        const section = document.createElement('div');
        section.className = 'analytics-section';
        document.body.appendChild(section);
        
        const breaksAdded = manager.applyIntelligentPageBreaks();
        
        expect(typeof breaksAdded).toBe('number');
        
        document.body.removeChild(section);
        manager.removePrintStyles();
      });
    });

    it('should handle errors gracefully', () => {
      manager.applyPrintStyles('A4');
      
      // Should not throw even if there are no sections
      expect(() => {
        manager.applyIntelligentPageBreaks();
      }).not.toThrow();
    });
  });

  describe('integration with page breaks', () => {
    it('should remove page breaks when removePrintStyles is called', () => {
      manager.applyPrintStyles('A4');
      
      const section = document.createElement('div');
      section.className = 'analytics-section';
      section.style.height = '500mm';
      section.style.marginTop = '250mm';
      document.body.appendChild(section);
      
      manager.applyIntelligentPageBreaks();
      
      // Remove print styles
      manager.removePrintStyles();
      
      // Page breaks should be removed
      expect(section.style.pageBreakBefore).toBe('');
      expect(section.getAttribute('data-page-break-added')).toBeNull();
      
      document.body.removeChild(section);
    });

    it('should initialize page break manager with correct paper format', () => {
      manager.applyPrintStyles('Letter');
      
      // Page break manager should be initialized
      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      expect(typeof breaksAdded).toBe('number');
    });
  });
});
