/**
 * PageBreakManager Utility
 * 
 * Manages intelligent page break placement to prevent awkward section splits.
 * Ensures that sections don't split with less than 30% of content on the first page.
 * 
 * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
 */

import { PAPER_SIZES, PaperFormat } from '../Services/PaperConfiguration';

/**
 * Configuration for page break calculations
 */
interface PageBreakConfig {
  paperFormat: PaperFormat;
  minSectionPercentage: number; // Minimum percentage of section that should appear on first page
}

/**
 * Section measurement data
 */
interface SectionMeasurement {
  element: HTMLElement;
  height: number;
  offsetTop: number;
  pageNumber: number;
  percentageOnFirstPage: number;
}

/**
 * PageBreakManager class
 * 
 * Analyzes section heights and positions to determine optimal page break placement.
 * Adds page-break-before: always to sections that would otherwise split awkwardly.
 */
export class PageBreakManager {
  private config: PageBreakConfig;
  private pageHeight: number;

  constructor(config?: Partial<PageBreakConfig>) {
    this.config = {
      paperFormat: config?.paperFormat || 'A4',
      minSectionPercentage: config?.minSectionPercentage || 0.30, // 30% minimum
    };

    // Calculate effective page height (paper height minus margins)
    const paperDimensions = PAPER_SIZES[this.config.paperFormat];
    this.pageHeight = paperDimensions.height - paperDimensions.marginTop - paperDimensions.marginBottom;
  }

  /**
   * Analyzes all major sections and applies page breaks where needed
   * 
   * Scans the document for sections with class 'analytics-section' or 'print-section'
   * and determines if they would split awkwardly across pages. If so, adds a
   * page-break-before: always style to force the section to start on a new page.
   * 
   * Error Handling:
   * - Missing sections: Returns 0 if no sections found
   * - Measurement failures: Skips problematic sections and continues
   * - DOM manipulation errors: Logs error and continues with remaining sections
   * 
   * @returns {number} Number of page breaks added
   */
  applyIntelligentPageBreaks(): number {
    try {
      const sections = this.findMajorSections();
      
      if (sections.length === 0) {
        console.warn('No major sections found for page break analysis');
        return 0;
      }

      // Sort by position so we never add a page break before the first section (avoids blank first page)
      const sorted = [...sections].sort((a, b) => {
        const topA = this.getOffsetTop(a);
        const topB = this.getOffsetTop(b);
        return topA - topB;
      });

      let breaksAdded = 0;

      sorted.forEach((section, index) => {
        try {
          // Never add page break before the first section - content must start on page 1
          if (index === 0) return;

          const measurement = this.measureSection(section);
          
          if (this.shouldAddPageBreak(measurement)) {
            this.addPageBreak(section);
            breaksAdded++;
          }
        } catch (sectionError) {
          console.error('Error processing section for page breaks:', {
            section: section.className || section.id,
            error: sectionError instanceof Error ? sectionError.message : 'Unknown error'
          });
          // Continue with next section
        }
      });

      return breaksAdded;
    } catch (error) {
      console.error('Error applying intelligent page breaks:', error);
      // Return 0 to indicate no breaks were added
      return 0;
    }
  }

  /**
   * Finds all major sections in the document
   * 
   * Looks for elements with classes:
   * - .analytics-section
   * - .print-section
   * - [data-printable-section]
   * 
   * @returns {HTMLElement[]} Array of section elements
   */
  private findMajorSections(): HTMLElement[] {
    const selectors = [
      '.analytics-section',
      '.print-section',
      '[data-printable-section]',
    ];

    const sections: HTMLElement[] = [];
    
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      elements.forEach((el) => {
        // Avoid duplicates
        if (!sections.includes(el)) {
          sections.push(el);
        }
      });
    });

    return sections;
  }

  /**
   * Measures a section's dimensions and position
   * 
   * Error Handling:
   * - Invalid element: Throws error with context
   * - getBoundingClientRect failures: Falls back to offsetHeight
   * - Calculation errors: Returns safe default values
   * 
   * @param {HTMLElement} element - Section element to measure
   * @returns {SectionMeasurement} Measurement data
   */
  private measureSection(element: HTMLElement): SectionMeasurement {
    try {
      if (!element) {
        throw new Error('Cannot measure null or undefined element');
      }

      let height: number;
      let offsetTop: number;

      // Try to get dimensions using getBoundingClientRect
      try {
        const rect = element.getBoundingClientRect();
        height = rect.height;
      } catch (rectError) {
        console.warn('getBoundingClientRect failed, using offsetHeight:', rectError);
        // Fallback to offsetHeight
        height = element.offsetHeight || 0;
      }

      // Get offset from top of document
      try {
        offsetTop = this.getOffsetTop(element);
      } catch (offsetError) {
        console.warn('getOffsetTop failed, using 0:', offsetError);
        offsetTop = 0;
      }

      // Validate measurements
      if (height <= 0) {
        console.warn('Section has zero or negative height:', {
          element: element.className || element.id,
          height
        });
        // Use a minimum height to avoid division by zero
        height = 1;
      }

      // Calculate which page this section starts on
      const pageNumber = Math.floor(offsetTop / this.pageHeight) + 1;
      
      // Calculate position within the current page
      const positionInPage = offsetTop % this.pageHeight;
      
      // Calculate how much space is left on the current page
      const spaceLeftOnPage = this.pageHeight - positionInPage;
      
      // Calculate what percentage of the section would appear on the first page
      const percentageOnFirstPage = Math.min(spaceLeftOnPage / height, 1.0);

      return {
        element,
        height,
        offsetTop,
        pageNumber,
        percentageOnFirstPage,
      };
    } catch (error) {
      console.error('Error measuring section:', {
        element: element?.className || element?.id || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return safe default values that won't trigger a page break
      return {
        element,
        height: 1,
        offsetTop: 0,
        pageNumber: 1,
        percentageOnFirstPage: 1.0,
      };
    }
  }

  /**
   * Gets the offset from the top of the document
   * 
   * Error Handling:
   * - Null elements in chain: Stops traversal safely
   * - Invalid offsetTop values: Uses 0 as fallback
   * 
   * @param {HTMLElement} element - Element to measure
   * @returns {number} Offset in pixels
   */
  private getOffsetTop(element: HTMLElement): number {
    try {
      let offsetTop = 0;
      let currentElement: HTMLElement | null = element;

      // Traverse up the DOM tree, accumulating offsets
      while (currentElement) {
        const currentOffset = currentElement.offsetTop;
        
        // Validate offset value
        if (typeof currentOffset === 'number' && !isNaN(currentOffset)) {
          offsetTop += currentOffset;
        }
        
        currentElement = currentElement.offsetParent as HTMLElement | null;
        
        // Safety check to prevent infinite loops
        if (offsetTop > 1000000) {
          console.warn('Offset calculation exceeded reasonable bounds, stopping');
          break;
        }
      }

      return offsetTop;
    } catch (error) {
      console.error('Error calculating offset top:', error);
      return 0;
    }
  }

  /**
   * Determines if a page break should be added before a section
   * 
   * A page break is added if:
   * 1. The section would split across pages
   * 2. Less than the minimum percentage (default 30%) would appear on the first page
   * 
   * @param {SectionMeasurement} measurement - Section measurement data
   * @returns {boolean} True if page break should be added
   */
  private shouldAddPageBreak(measurement: SectionMeasurement): boolean {
    // If the entire section fits on the current page, no break needed
    if (measurement.percentageOnFirstPage >= 1.0) {
      return false;
    }

    // If less than minimum percentage would appear on first page, add break
    if (measurement.percentageOnFirstPage < this.config.minSectionPercentage) {
      return true;
    }

    return false;
  }

  /**
   * Adds a page break before a section
   * 
   * Error Handling:
   * - Invalid element: Logs error and returns without throwing
   * - Style application failures: Tries both properties, logs failures
   * 
   * @param {HTMLElement} element - Section element
   */
  private addPageBreak(element: HTMLElement): void {
    try {
      if (!element) {
        console.error('Cannot add page break to null or undefined element');
        return;
      }

      // Try to set page break styles
      try {
        element.style.pageBreakBefore = 'always';
      } catch (styleError) {
        console.warn('Failed to set pageBreakBefore style:', styleError);
      }

      try {
        element.style.breakBefore = 'page';
      } catch (styleError) {
        console.warn('Failed to set breakBefore style:', styleError);
      }

      // Mark element as having a page break
      try {
        element.setAttribute('data-page-break-added', 'true');
      } catch (attrError) {
        console.warn('Failed to set page break attribute:', attrError);
      }
    } catch (error) {
      console.error('Error adding page break:', {
        element: element?.className || element?.id || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw - this shouldn't break the entire print process
    }
  }

  /**
   * Removes all page breaks that were added by this manager
   * 
   * Error Handling:
   * - Query selector failures: Logs error and continues
   * - Style removal failures: Logs warning for each element
   * - Ensures cleanup completes even if individual operations fail
   */
  removePageBreaks(): void {
    try {
      const elements = document.querySelectorAll<HTMLElement>('[data-page-break-added="true"]');
      
      if (elements.length === 0) {
        return; // Nothing to clean up
      }

      elements.forEach((element) => {
        try {
          // Try to remove styles
          try {
            element.style.pageBreakBefore = '';
          } catch (styleError) {
            console.warn('Failed to remove pageBreakBefore style:', styleError);
          }

          try {
            element.style.breakBefore = '';
          } catch (styleError) {
            console.warn('Failed to remove breakBefore style:', styleError);
          }

          // Try to remove attribute
          try {
            element.removeAttribute('data-page-break-added');
          } catch (attrError) {
            console.warn('Failed to remove page break attribute:', attrError);
          }
        } catch (elementError) {
          console.error('Error removing page break from element:', {
            element: element.className || element.id || 'unknown',
            error: elementError instanceof Error ? elementError.message : 'Unknown error'
          });
          // Continue with next element
        }
      });
    } catch (error) {
      console.error('Error removing page breaks:', error);
      // Don't throw - cleanup should be safe
    }
  }

  /**
   * Updates the paper format and recalculates page height
   * 
   * @param {PaperFormat} paperFormat - New paper format
   */
  setPaperFormat(paperFormat: PaperFormat): void {
    this.config.paperFormat = paperFormat;
    
    const paperDimensions = PAPER_SIZES[paperFormat];
    this.pageHeight = paperDimensions.height - paperDimensions.marginTop - paperDimensions.marginBottom;
  }

  /**
   * Gets the current configuration
   * 
   * @returns {PageBreakConfig} Current configuration
   */
  getConfig(): PageBreakConfig {
    return { ...this.config };
  }

  /**
   * Converts pixels to millimeters
   * 
   * @param {number} pixels - Pixel value
   * @returns {number} Millimeter value
   */
  private pixelsToMm(pixels: number): number {
    // Assuming 96 DPI (standard for web)
    return (pixels * 25.4) / 96;
  }

  /**
   * Converts millimeters to pixels
   * 
   * @param {number} mm - Millimeter value
   * @returns {number} Pixel value
   */
  private mmToPixels(mm: number): number {
    // Assuming 96 DPI (standard for web)
    return (mm * 96) / 25.4;
  }
}

/**
 * Hook for using PageBreakManager in React components
 * 
 * @param {PaperFormat} paperFormat - Paper format to use
 * @returns {Object} Manager instance and utility functions
 */
export function usePageBreakManager(paperFormat: PaperFormat = 'A4') {
  const manager = new PageBreakManager({ paperFormat });

  const applyPageBreaks = () => {
    return manager.applyIntelligentPageBreaks();
  };

  const removePageBreaks = () => {
    manager.removePageBreaks();
  };

  return {
    applyPageBreaks,
    removePageBreaks,
    manager,
  };
}

// Export singleton instance for convenience
export const pageBreakManager = new PageBreakManager();

export default PageBreakManager;
