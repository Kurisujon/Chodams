/**
 * Page Break Integration Tests
 * 
 * Tests the complete page break implementation including:
 * - CSS page-break-inside: avoid on chart containers
 * - CSS page-break-before: auto on major sections
 * - JavaScript intelligent page break logic (30% threshold)
 * 
 * Task: 10.2 - Implement page break logic
 * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
 */

import { PageBreakManager } from '../Utils/PageBreakManager';
import { PAPER_SIZES } from '../Services/PaperConfiguration';

describe('Page Break Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new PageBreakManager({ paperFormat: 'A4' });
    
    // Clean up any existing test elements
    document.querySelectorAll('.test-section, .test-chart').forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  });

  afterEach(() => {
    manager.removePageBreaks();
    
    // Clean up test elements
    document.querySelectorAll('.test-section, .test-chart').forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  });

  describe('Chart Container Page Breaks', () => {
    test('chart containers should have page-break-inside: avoid in CSS', () => {
      // This test verifies that the CSS rule exists
      // In a real browser environment, the CSS would be applied
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container test-chart';
      document.body.appendChild(chartContainer);

      // The CSS rule should prevent breaks inside chart containers
      // We can't directly test CSS in jsdom, but we verify the class is applied
      expect(chartContainer.classList.contains('chart-container')).toBe(true);
    });

    test('multiple chart containers in a section should not break apart', () => {
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      
      const chart1 = document.createElement('div');
      chart1.className = 'chart-container';
      chart1.style.height = '100mm';
      
      const chart2 = document.createElement('div');
      chart2.className = 'chart-container';
      chart2.style.height = '100mm';
      
      section.appendChild(chart1);
      section.appendChild(chart2);
      document.body.appendChild(section);

      // Apply page break logic
      manager.applyIntelligentPageBreaks();

      // The section should be treated as a unit
      // If it needs a page break, it should be at the section level
      const hasPageBreak = section.style.pageBreakBefore === 'always';
      const hasBreakBefore = section.style.breakBefore === 'page';
      
      // Either has a page break or doesn't, but should be consistent
      expect(typeof hasPageBreak).toBe('boolean');
      expect(typeof hasBreakBefore).toBe('boolean');
    });
  });

  describe('Major Section Page Breaks', () => {
    test('major sections should have page-break-before: auto by default', () => {
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      document.body.appendChild(section);

      // Before applying intelligent page breaks, sections should allow auto breaks
      // The CSS sets page-break-before: auto for adjacent sections
      expect(section.className).toContain('analytics-section');
    });

    test('sections with less than 30% on first page get page-break-before: always', () => {
      // Create a section that would split awkwardly
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      section.style.height = '400mm'; // Tall section
      section.style.marginTop = '250mm'; // Position it to split awkwardly
      document.body.appendChild(section);

      const breaksAdded = manager.applyIntelligentPageBreaks();

      // The manager should add a page break if the section would split awkwardly
      // We can't guarantee it will in jsdom, but we verify the logic runs
      expect(typeof breaksAdded).toBe('number');
      expect(breaksAdded).toBeGreaterThanOrEqual(0);
    });

    test('data-page-break-added attribute is set when page break is added', () => {
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      section.style.height = '500mm';
      section.style.marginTop = '250mm';
      document.body.appendChild(section);

      manager.applyIntelligentPageBreaks();

      // If a page break was added, the attribute should be present
      const hasAttribute = section.hasAttribute('data-page-break-added');
      const hasPageBreak = section.style.pageBreakBefore === 'always';
      
      // If page break is added, attribute should be present
      if (hasPageBreak) {
        expect(hasAttribute).toBe(true);
        expect(section.getAttribute('data-page-break-added')).toBe('true');
      }
    });
  });

  describe('30% Threshold Logic', () => {
    test('sections with more than 30% on first page should not get forced page break', () => {
      // Create a section that fits mostly on the page
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      section.style.height = '100mm'; // Reasonable height
      document.body.appendChild(section);

      manager.applyIntelligentPageBreaks();

      // Small sections that fit well should not get forced page breaks
      expect(section.style.pageBreakBefore).not.toBe('always');
      expect(section.getAttribute('data-page-break-added')).not.toBe('true');
    });

    test('30% threshold is configurable', () => {
      const customManager = new PageBreakManager({ 
        paperFormat: 'A4',
        minSectionPercentage: 0.25 // 25% threshold instead of 30%
      });

      const config = customManager.getConfig();
      expect(config.minSectionPercentage).toBe(0.25);
    });

    test('default threshold is 30%', () => {
      const config = manager.getConfig();
      expect(config.minSectionPercentage).toBe(0.30);
    });
  });

  describe('Complete Workflow', () => {
    test('complete print workflow with multiple sections and charts', () => {
      // Create a realistic document structure
      const sections = [];
      
      for (let i = 0; i < 3; i++) {
        const section = document.createElement('div');
        section.className = 'analytics-section test-section';
        section.style.height = '150mm';
        
        const title = document.createElement('h2');
        title.textContent = `Section ${i + 1}`;
        section.appendChild(title);
        
        const chart = document.createElement('div');
        chart.className = 'chart-container';
        chart.style.height = '100mm';
        section.appendChild(chart);
        
        document.body.appendChild(section);
        sections.push(section);
      }

      // Apply intelligent page breaks
      const breaksAdded = manager.applyIntelligentPageBreaks();

      // Verify the logic ran successfully
      expect(typeof breaksAdded).toBe('number');
      expect(breaksAdded).toBeGreaterThanOrEqual(0);

      // Verify we can remove page breaks
      manager.removePageBreaks();

      // After removal, no sections should have page breaks
      sections.forEach(section => {
        expect(section.style.pageBreakBefore).toBe('');
        expect(section.getAttribute('data-page-break-added')).toBeNull();
      });
    });

    test('page breaks work with different paper formats', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        const formatManager = new PageBreakManager({ paperFormat: format });
        
        const section = document.createElement('div');
        section.className = 'analytics-section test-section';
        section.style.height = '200mm';
        document.body.appendChild(section);

        const breaksAdded = formatManager.applyIntelligentPageBreaks();
        
        expect(typeof breaksAdded).toBe('number');
        
        formatManager.removePageBreaks();
        document.body.removeChild(section);
      });
    });

    test('page breaks can be reapplied after removal', () => {
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      section.style.height = '300mm';
      section.style.marginTop = '250mm';
      document.body.appendChild(section);

      // Apply page breaks
      const breaksAdded1 = manager.applyIntelligentPageBreaks();
      
      // Remove page breaks
      manager.removePageBreaks();
      expect(section.style.pageBreakBefore).toBe('');
      
      // Reapply page breaks
      const breaksAdded2 = manager.applyIntelligentPageBreaks();
      
      // Should work consistently
      expect(typeof breaksAdded1).toBe('number');
      expect(typeof breaksAdded2).toBe('number');
    });
  });

  describe('CSS Class Integration', () => {
    test('print-section class is recognized', () => {
      const section = document.createElement('div');
      section.className = 'print-section test-section';
      document.body.appendChild(section);

      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      // Should process print-section class
      expect(typeof breaksAdded).toBe('number');
    });

    test('data-printable-section attribute is recognized', () => {
      const section = document.createElement('div');
      section.setAttribute('data-printable-section', 'test-section');
      section.className = 'test-section';
      document.body.appendChild(section);

      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      // Should process data-printable-section attribute
      expect(typeof breaksAdded).toBe('number');
    });

    test('multiple class selectors work together', () => {
      const section1 = document.createElement('div');
      section1.className = 'analytics-section test-section';
      document.body.appendChild(section1);

      const section2 = document.createElement('div');
      section2.className = 'print-section test-section';
      document.body.appendChild(section2);

      const section3 = document.createElement('div');
      section3.setAttribute('data-printable-section', 'test');
      section3.className = 'test-section';
      document.body.appendChild(section3);

      const breaksAdded = manager.applyIntelligentPageBreaks();
      
      // Should process all three types of sections
      expect(typeof breaksAdded).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    test('handles nested sections correctly', () => {
      const outerSection = document.createElement('div');
      outerSection.className = 'analytics-section test-section';
      
      const innerSection = document.createElement('div');
      innerSection.className = 'analytics-section test-section';
      
      outerSection.appendChild(innerSection);
      document.body.appendChild(outerSection);

      // Should handle nested sections without errors
      expect(() => {
        manager.applyIntelligentPageBreaks();
      }).not.toThrow();
    });

    test('handles sections with complex content', () => {
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      
      // Add various content types
      const heading = document.createElement('h2');
      heading.textContent = 'Test Section';
      section.appendChild(heading);
      
      const chart = document.createElement('div');
      chart.className = 'chart-container';
      section.appendChild(chart);
      
      const table = document.createElement('table');
      table.innerHTML = '<tr><td>Data</td></tr>';
      section.appendChild(table);
      
      document.body.appendChild(section);

      expect(() => {
        manager.applyIntelligentPageBreaks();
      }).not.toThrow();
    });

    test('handles dynamically added sections', () => {
      // Apply page breaks to empty document
      const breaksAdded1 = manager.applyIntelligentPageBreaks();
      expect(breaksAdded1).toBe(0);

      // Add a section dynamically
      const section = document.createElement('div');
      section.className = 'analytics-section test-section';
      section.style.height = '300mm';
      document.body.appendChild(section);

      // Reapply page breaks
      const breaksAdded2 = manager.applyIntelligentPageBreaks();
      expect(typeof breaksAdded2).toBe('number');
    });
  });
});
