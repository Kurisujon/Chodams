/**
 * PrintStyleManager Service
 * 
 * Manages print-specific CSS rules and paper size detection for analytics printing.
 * Handles detection of paper format from browser, applies print-specific styles,
 * and provides cleanup functionality.
 * 
 * Requirements: 1.1, 1.5, 5.4
 */

import { PaperFormat, PAPER_SIZES } from './PaperConfiguration';
import { PageBreakManager } from '../Utils/PageBreakManager';

/**
 * PrintStyleManager class
 * 
 * Responsible for:
 * - Detecting paper size from browser print settings
 * - Applying print-specific styles dynamically
 * - Managing print style lifecycle (apply/remove)
 * - Providing fallback to A4 when detection fails
 */
export class PrintStyleManager {
  private styleElement: HTMLStyleElement | null = null;
  private detectedPaperSize: PaperFormat | null = null;
  private pageBreakManager: PageBreakManager | null = null;

  /**
   * Detects the current paper size from browser print settings
   * 
   * Uses CSS media queries and matchMedia API to detect paper dimensions.
   * Falls back to A4 if detection fails or returns invalid format.
   * 
   * @returns {PaperFormat} The detected paper format (A4, Letter, or Legal)
   * 
   * Requirements: 1.1 - Paper size detection
   * Requirements: 1.5 - Fallback to A4 when detection fails
   */
  detectPaperSize(): PaperFormat {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.matchMedia) {
        console.warn('Browser environment not available, defaulting to A4');
        this.detectedPaperSize = 'A4';
        return this.detectedPaperSize;
      }

      // Try to detect Letter size (8.5in × 11in)
      // Note: Browser support for size detection in matchMedia is limited
      const isLetter = window.matchMedia('print and (width: 8.5in) and (height: 11in)').matches;
      if (isLetter) {
        this.detectedPaperSize = 'Letter';
        return this.detectedPaperSize;
      }

      // Try to detect Legal size (8.5in × 14in)
      const isLegal = window.matchMedia('print and (width: 8.5in) and (height: 14in)').matches;
      if (isLegal) {
        this.detectedPaperSize = 'Legal';
        return this.detectedPaperSize;
      }

      // Try to detect A4 size (210mm × 297mm)
      const isA4 = window.matchMedia('print and (width: 210mm) and (height: 297mm)').matches;
      if (isA4) {
        this.detectedPaperSize = 'A4';
        return this.detectedPaperSize;
      }

      // Alternative detection: Check page dimensions if available
      // Some browsers expose @page size through getComputedStyle
      if (typeof document !== 'undefined') {
        const pageWidth = this.getPageWidth();
        const pageHeight = this.getPageHeight();

        if (pageWidth && pageHeight) {
          // Check if dimensions match Letter (within tolerance)
          if (this.dimensionsMatch(pageWidth, pageHeight, 215.9, 279.4)) {
            this.detectedPaperSize = 'Letter';
            return this.detectedPaperSize;
          }

          // Check if dimensions match Legal (within tolerance)
          if (this.dimensionsMatch(pageWidth, pageHeight, 215.9, 355.6)) {
            this.detectedPaperSize = 'Legal';
            return this.detectedPaperSize;
          }

          // Check if dimensions match A4 (within tolerance)
          if (this.dimensionsMatch(pageWidth, pageHeight, 210, 297)) {
            this.detectedPaperSize = 'A4';
            return this.detectedPaperSize;
          }
        }
      }

      // Fallback to A4 (international standard)
      console.warn('Paper size detection failed, defaulting to A4');
      this.detectedPaperSize = 'A4';
      return this.detectedPaperSize;

    } catch (error) {
      // Handle any errors during detection
      console.error('Error detecting paper size:', error);
      console.warn('Falling back to A4 paper format');
      this.detectedPaperSize = 'A4';
      return this.detectedPaperSize;
    }
  }

  /**
   * Gets the page width from browser if available
   * @returns {number | null} Page width in mm or null if not available
   */
  private getPageWidth(): number | null {
    try {
      // Try to get from window.innerWidth during print
      if (window.matchMedia('print').matches && window.innerWidth) {
        // Convert pixels to mm (assuming 96 DPI)
        return (window.innerWidth * 25.4) / 96;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Gets the page height from browser if available
   * @returns {number | null} Page height in mm or null if not available
   */
  private getPageHeight(): number | null {
    try {
      // Try to get from window.innerHeight during print
      if (window.matchMedia('print').matches && window.innerHeight) {
        // Convert pixels to mm (assuming 96 DPI)
        return (window.innerHeight * 25.4) / 96;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Checks if dimensions match expected values within tolerance
   * @param {number} width - Detected width in mm
   * @param {number} height - Detected height in mm
   * @param {number} expectedWidth - Expected width in mm
   * @param {number} expectedHeight - Expected height in mm
   * @returns {boolean} True if dimensions match within 5mm tolerance
   */
  private dimensionsMatch(
    width: number,
    height: number,
    expectedWidth: number,
    expectedHeight: number
  ): boolean {
    const tolerance = 5; // 5mm tolerance
    return (
      Math.abs(width - expectedWidth) <= tolerance &&
      Math.abs(height - expectedHeight) <= tolerance
    );
  }

  /**
   * Applies print-specific styles to the document
   * 
   * Creates and injects a style element with print-specific CSS rules
   * including paper size constraints, margins, and print optimizations.
   * Also applies intelligent page breaks to prevent awkward section splits.
   * 
   * Error Handling:
   * - Paper size detection failures: Falls back to A4
   * - Style injection failures: Throws error with context
   * - Page break application failures: Logs warning and continues
   * 
   * @param {PaperFormat} paperFormat - Optional paper format to use (defaults to detected)
   * 
   * Requirements: 1.1 - Apply paper-specific layout constraints
   * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
   */
  applyPrintStyles(paperFormat?: PaperFormat): void {
    try {
      // Use provided format or detect it
      let format: PaperFormat;
      try {
        format = paperFormat || this.detectPaperSize();
      } catch (detectionError) {
        console.error('Paper size detection failed, using A4:', detectionError);
        format = 'A4';
      }

      const dimensions = PAPER_SIZES[format];

      if (!dimensions) {
        console.error(`Invalid paper format: ${format}, falling back to A4`);
        format = 'A4';
      }

      // Remove existing style element if present
      try {
        this.removePrintStyles();
      } catch (removeError) {
        console.warn('Error removing existing print styles:', removeError);
        // Continue - we'll create new styles anyway
      }

      // Create new style element
      try {
        this.styleElement = document.createElement('style');
        this.styleElement.setAttribute('data-print-style-manager', 'true');
        
        // Generate print-specific CSS
        const css = this.generatePrintCSS(format, dimensions);
        this.styleElement.textContent = css;

        // Append to document head
        if (!document.head) {
          throw new Error('document.head is not available');
        }
        
        document.head.appendChild(this.styleElement);
      } catch (styleError) {
        console.error('Failed to create or inject style element:', styleError);
        throw new Error('Failed to apply print styles: ' + (styleError instanceof Error ? styleError.message : 'Unknown error'));
      }

      // Store the applied format
      this.detectedPaperSize = format;

      // Initialize page break manager with the current paper format
      try {
        this.pageBreakManager = new PageBreakManager({ paperFormat: format });
      } catch (pageBreakError) {
        console.error('Failed to initialize page break manager:', pageBreakError);
        // Continue without page break manager - not critical
        this.pageBreakManager = null;
      }

      console.log(`Print styles applied for ${format} paper format`);

    } catch (error) {
      console.error('Error applying print styles:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paperFormat
      });
      throw new Error('Failed to apply print styles');
    }
  }

  /**
   * Generates print-specific CSS rules for the given paper format
   * @param {PaperFormat} format - Paper format
   * @param {PaperDimensions} dimensions - Paper dimensions
   * @returns {string} CSS rules as string
   */
  private generatePrintCSS(format: PaperFormat, dimensions: any): string {
    return `
      /* Print-specific styles for ${format} paper */
      @media print {
        /* Set page size and margins */
        @page {
          size: ${format === 'A4' ? 'A4' : format === 'Letter' ? 'letter' : 'legal'};
          margin: ${dimensions.marginTop}mm ${dimensions.marginRight}mm ${dimensions.marginBottom}mm ${dimensions.marginLeft}mm;
        }

        /* Ensure body uses full page */
        body {
          margin: 0;
          padding: 0;
          background: white;
          color: black;
        }

        /* Prevent blank first page: dashboard and app root use full height which reserves a page in print */
        #root,
        .admin-dashboard-root,
        .admin-dashboard-main {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }

        /* Each subclass table on its own page (Subclass Displaced, Double-Up, Homeless) */
        .print-page-break {
          page-break-before: always !important;
          break-before: page !important;
        }
        /* Subclass tables: one per page, full width */
        [data-print-element="subclass-tables"] {
          display: block !important;
        }
        [data-print-element="subclass-tables"] > .print-page-break {
          max-width: 100% !important;
          width: 100% !important;
        }

        /* Set printable area constraints */
        .printable-content {
          max-width: ${dimensions.width - dimensions.marginLeft - dimensions.marginRight}mm;
          max-height: ${dimensions.height - dimensions.marginTop - dimensions.marginBottom}mm;
        }

        /* Hide non-essential elements */
        .no-print,
        nav,
        .sidebar,
        button:not(.print-visible),
        .interactive-controls {
          display: none !important;
        }

        /* Ensure charts and graphs fit within printable area */
        .chart-container,
        .graph-container {
          max-width: ${dimensions.width - dimensions.marginLeft - dimensions.marginRight}mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Prevent awkward page breaks */
        .analytics-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Ensure readable text */
        body, p, span, div {
          font-size: 10pt;
          line-height: 1.4;
        }

        /* High contrast for print */
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `;
  }

  /**
   * Removes print-specific styles from the document
   * 
   * Cleans up the injected style element and resets internal state.
   * Also removes any intelligent page breaks that were added.
   * Safe to call multiple times.
   * 
   * Requirements: 1.5 - Style lifecycle management
   * Requirements: 5.4 - Clean up page breaks
   */
  removePrintStyles(): void {
    try {
      // Remove intelligent page breaks if manager exists
      if (this.pageBreakManager) {
        this.pageBreakManager.removePageBreaks();
        this.pageBreakManager = null;
      }

      // Remove style element if it exists
      if (this.styleElement && this.styleElement.parentNode) {
        this.styleElement.parentNode.removeChild(this.styleElement);
        this.styleElement = null;
      }

      // Also remove any orphaned style elements
      const orphanedStyles = document.querySelectorAll('style[data-print-style-manager="true"]');
      orphanedStyles.forEach(style => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      });

      console.log('Print styles removed');

    } catch (error) {
      console.error('Error removing print styles:', error);
      // Don't throw - cleanup should be safe
    }
  }

  /**
   * Applies intelligent page breaks to prevent awkward section splits
   * 
   * Should be called after the document is fully rendered and before printing.
   * Analyzes section heights and adds page breaks where less than 30% of a
   * section would appear on the first page.
   * 
   * Error Handling:
   * - Page break manager not initialized: Logs warning and returns 0
   * - Page break application failures: Logs error and returns 0
   * 
   * @returns {number} Number of page breaks added
   * 
   * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
   */
  applyIntelligentPageBreaks(): number {
    if (!this.pageBreakManager) {
      console.warn('Page break manager not initialized. Call applyPrintStyles first.');
      return 0;
    }

    try {
      const breaksAdded = this.pageBreakManager.applyIntelligentPageBreaks();
      console.log(`Applied ${breaksAdded} intelligent page breaks`);
      return breaksAdded;
    } catch (error) {
      console.error('Error applying intelligent page breaks:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return 0 to indicate no breaks were added
      return 0;
    }
  }

  /**
   * Gets the currently detected or applied paper format
   * @returns {PaperFormat | null} Current paper format or null if not detected
   */
  getCurrentPaperFormat(): PaperFormat | null {
    return this.detectedPaperSize;
  }

  /**
   * Checks if print styles are currently applied
   * @returns {boolean} True if print styles are active
   */
  isPrintStylesApplied(): boolean {
    return this.styleElement !== null && document.head.contains(this.styleElement);
  }
}

// Export singleton instance for convenience
export const printStyleManager = new PrintStyleManager();

// Export class for testing and custom instances
export default PrintStyleManager;
