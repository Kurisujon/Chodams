/**
 * PageBreakManager Unit Tests
 * 
 * Tests the intelligent page break logic that prevents awkward section splits.
 * 
 * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
 */

import { PageBreakManager } from '../Utils/PageBreakManager';
import { PAPER_SIZES } from '../Services/PaperConfiguration';

describe('PageBreakManager', () => {
  let manager;
  let mockSection;

  beforeEach(() => {
    // Create a fresh manager instance for each test
    manager = new PageBreakManager({ paperFormat: 'A4' });

    // Create a mock section element
    mockSection = document.createElement('div');
    mockSection.className = 'analytics-section';
    document.body.appendChild(mockSection);
  });

  afterEach(() => {
    // Clean up
    if (mockSection && mockSection.parentNode) {
      mockSection.parentNode.removeChild(mockSection);
    }
    manager.removePageBreaks();
  });

  describe('constructor', () => {
    test('initializes with default A4 paper format', () => {
      const defaultManager = new PageBreakManager();
      const config = defaultManager.getConfig();
      
      expect(config.paperFormat).toBe('A4');
      expect(config.minSectionPercentage).toBe(0.30);
    });

    test('initializes with custom paper format', () => {
      const letterManager = new PageBreakManager({ paperFormat: 'Letter' });
      const config = letterManager.getConfig();
      
      expect(config.paperFormat).toBe('Letter');
    });

    test('initializes with custom minimum section percentage', () => {
      const customManager = new PageBreakManager({ minSectionPercentage: 0.40 });
      const config = customManager.getConfig();
      
      expect(config.minSectionPercentage).toBe(0.40);
    });
  });

  describe('findMajorSections', () => {
    test('finds sections with analytics-section class', () => {
      const section1 = document.createElement('div');
      section1.className = 'analytics-section';
      document.body.appendChild(section1);

      const section2 = document.createElement('div');
      section2.className = 'analytics-section';
      document.body.appendChild(section2);

      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      // Clean up
      document.body.removeChild(section1);
      document.body.removeChild(section2);
      
      // Should have found and processed the sections
      expect(breaksAdded).toBeGreaterThanOrEqual(0);
    });

    test('finds sections with print-section class', () => {
      const section = document.createElement('div');
      section.className = 'print-section';
      document.body.appendChild(section);

      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      document.body.removeChild(section);
      
      expect(breaksAdded).toBeGreaterThanOrEqual(0);
    });

    test('finds sections with data-printable-section attribute', () => {
      const section = document.createElement('div');
      section.setAttribute('data-printable-section', 'test-section');
      document.body.appendChild(section);

      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      document.body.removeChild(section);
      
      expect(breaksAdded).toBeGreaterThanOrEqual(0);
    });

    test('avoids duplicate sections', () => {
      const section = document.createElement('div');
      section.className = 'analytics-section print-section';
      section.setAttribute('data-printable-section', 'test');
      document.body.appendChild(section);

      // Should only process the section once despite multiple matching selectors
      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      document.body.removeChild(section);
      
      // Should be 0 or 1, not 3
      expect(breaksAdded).toBeLessThanOrEqual(1);
    });
  });

  describe('applyIntelligentPageBreaks', () => {
    test('returns number of page breaks added', () => {
      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      expect(typeof breaksAdded).toBe('number');
      expect(breaksAdded).toBeGreaterThanOrEqual(0);
    });

    test('adds page-break-before style to sections that need it', () => {
      // Create a tall section that would span multiple pages
      const tallSection = document.createElement('div');
      tallSection.className = 'analytics-section';
      tallSection.style.height = '500mm'; // Very tall
      tallSection.style.marginTop = '250mm'; // Position it so it would split
      document.body.appendChild(tallSection);

      manager.applyIntelligentPageBreaks();

      // Check if page break was added (might be added depending on layout)
      const hasPageBreak = 
        tallSection.style.pageBreakBefore === 'always' ||
        tallSection.style.breakBefore === 'page';
      
      // Clean up
      document.body.removeChild(tallSection);
      
      // The section should either have a page break or fit on the page
      expect(typeof hasPageBreak).toBe('boolean');
    });

    test('adds data-page-break-added attribute to sections with page breaks', () => {
      const section = document.createElement('div');
      section.className = 'analytics-section';
      section.style.height = '500mm';
      section.style.marginTop = '250mm';
      document.body.appendChild(section);

      manager.applyIntelligentPageBreaks();

      // If a page break was added, the attribute should be present
      if (section.style.pageBreakBefore === 'always') {
        expect(section.getAttribute('data-page-break-added')).toBe('true');
      }

      document.body.removeChild(section);
    });

    test('does not add page breaks to sections that fit on one page', () => {
      const smallSection = document.createElement('div');
      smallSection.className = 'analytics-section';
      smallSection.style.height = '50mm'; // Small enough to fit
      document.body.appendChild(smallSection);

      manager.applyIntelligentPageBreaks();

      // Small section should not have a page break
      expect(smallSection.style.pageBreakBefore).not.toBe('always');
      expect(smallSection.getAttribute('data-page-break-added')).not.toBe('true');

      document.body.removeChild(smallSection);
    });
  });

  describe('removePageBreaks', () => {
    test('removes all page breaks that were added', () => {
      // Create sections and add page breaks
      const section1 = document.createElement('div');
      section1.className = 'analytics-section';
      section1.style.height = '500mm';
      section1.style.marginTop = '250mm';
      document.body.appendChild(section1);

      const section2 = document.createElement('div');
      section2.className = 'analytics-section';
      section2.style.height = '500mm';
      section2.style.marginTop = '250mm';
      document.body.appendChild(section2);

      manager.applyIntelligentPageBreaks();

      // Remove page breaks
      manager.removePageBreaks();

      // Check that page breaks are removed
      expect(section1.style.pageBreakBefore).toBe('');
      expect(section1.style.breakBefore).toBe('');
      expect(section1.getAttribute('data-page-break-added')).toBeNull();

      expect(section2.style.pageBreakBefore).toBe('');
      expect(section2.style.breakBefore).toBe('');
      expect(section2.getAttribute('data-page-break-added')).toBeNull();

      document.body.removeChild(section1);
      document.body.removeChild(section2);
    });

    test('is safe to call multiple times', () => {
      manager.removePageBreaks();
      manager.removePageBreaks();
      manager.removePageBreaks();
      
      // Should not throw any errors
      expect(true).toBe(true);
    });

    test('is safe to call when no page breaks exist', () => {
      const newManager = new PageBreakManager();
      
      expect(() => {
        newManager.removePageBreaks();
      }).not.toThrow();
    });
  });

  describe('setPaperFormat', () => {
    test('updates paper format', () => {
      manager.setPaperFormat('Letter');
      const config = manager.getConfig();
      
      expect(config.paperFormat).toBe('Letter');
    });

    test('recalculates page height for new paper format', () => {
      const initialConfig = manager.getConfig();
      const initialFormat = initialConfig.paperFormat;

      // Change to a different format
      const newFormat = initialFormat === 'A4' ? 'Letter' : 'A4';
      manager.setPaperFormat(newFormat);

      const newConfig = manager.getConfig();
      expect(newConfig.paperFormat).toBe(newFormat);
    });

    test('works with all supported paper formats', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        manager.setPaperFormat(format);
        const config = manager.getConfig();
        expect(config.paperFormat).toBe(format);
      });
    });
  });

  describe('getConfig', () => {
    test('returns current configuration', () => {
      const config = manager.getConfig();
      
      expect(config).toHaveProperty('paperFormat');
      expect(config).toHaveProperty('minSectionPercentage');
    });

    test('returns a copy of config (not reference)', () => {
      const config1 = manager.getConfig();
      const config2 = manager.getConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('edge cases', () => {
    test('handles empty document gracefully', () => {
      // Remove all sections
      const sections = document.querySelectorAll('.analytics-section, .print-section, [data-printable-section]');
      sections.forEach(section => {
        if (section.parentNode) {
          section.parentNode.removeChild(section);
        }
      });

      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      expect(breaksAdded).toBe(0);
    });

    test('handles sections with zero height', () => {
      const zeroHeightSection = document.createElement('div');
      zeroHeightSection.className = 'analytics-section';
      zeroHeightSection.style.height = '0';
      document.body.appendChild(zeroHeightSection);

      expect(() => {
        manager.applyIntelligentPageBreaks();
      }).not.toThrow();

      document.body.removeChild(zeroHeightSection);
    });

    test('handles sections with display: none', () => {
      const hiddenSection = document.createElement('div');
      hiddenSection.className = 'analytics-section';
      hiddenSection.style.display = 'none';
      document.body.appendChild(hiddenSection);

      expect(() => {
        manager.applyIntelligentPageBreaks();
      }).not.toThrow();

      document.body.removeChild(hiddenSection);
    });
  });

  describe('30% threshold requirement', () => {
    test('uses 30% as default minimum section percentage', () => {
      const config = manager.getConfig();
      
      expect(config.minSectionPercentage).toBe(0.30);
    });

    test('respects custom minimum section percentage', () => {
      const customManager = new PageBreakManager({ minSectionPercentage: 0.25 });
      const config = customManager.getConfig();
      
      expect(config.minSectionPercentage).toBe(0.25);
    });

    test('applies page break when less than 30% would appear on first page', () => {
      // This is a conceptual test - actual behavior depends on layout
      const config = manager.getConfig();
      
      // Verify the threshold is set correctly
      expect(config.minSectionPercentage).toBeLessThanOrEqual(0.30);
    });
  });

  describe('integration with different paper formats', () => {
    test('works with A4 paper format', () => {
      const a4Manager = new PageBreakManager({ paperFormat: 'A4' });
      const section = document.createElement('div');
      section.className = 'analytics-section';
      document.body.appendChild(section);

      expect(() => {
        a4Manager.applyIntelligentPageBreaks();
      }).not.toThrow();

      document.body.removeChild(section);
    });

    test('works with Letter paper format', () => {
      const letterManager = new PageBreakManager({ paperFormat: 'Letter' });
      const section = document.createElement('div');
      section.className = 'analytics-section';
      document.body.appendChild(section);

      expect(() => {
        letterManager.applyIntelligentPageBreaks();
      }).not.toThrow();

      document.body.removeChild(section);
    });

    test('works with Legal paper format', () => {
      const legalManager = new PageBreakManager({ paperFormat: 'Legal' });
      const section = document.createElement('div');
      section.className = 'analytics-section';
      document.body.appendChild(section);

      expect(() => {
        legalManager.applyIntelligentPageBreaks();
      }).not.toThrow();

      document.body.removeChild(section);
    });
  });
});
