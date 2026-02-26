/**
 * PrintHandlerService
 * 
 * Core service for coordinating print functionality across the admin dashboard.
 * Manages section isolation, metadata injection, and cleanup for print operations.
 * 
 * Requirements: 1.1, 2.1, 3.1, 5.1, 5.2, 5.3, 5.4
 */

import { PaperFormat } from './PaperConfiguration';
import { printStyleManager } from './PrintStyleManager';
import { graphPrintAdapter } from './GraphPrintAdapter';

/**
 * Print section identifiers for different dashboard areas
 */
export enum PrintSection {
  BY_YEAR_SUMMARY = 'by-year-summary',
  SUMMARY_AND_SUBCLASS_GROUP = 'summary-and-subclass-group',
  SUBCLASS_DISPLACED = 'subclass-displaced',
  SUBCLASS_DOUBLE_UP = 'subclass-double-up',
  SUBCLASS_HOMELESS = 'subclass-homeless',
  FILTERED_ANALYTICS = 'filtered-analytics',
  FULL_DASHBOARD = 'full-dashboard'
}

/**
 * Filter state for metadata display
 */
export interface FilterState {
  barangay?: string;
  classification?: string;
  income?: string;
  water?: string;
  electricity?: string;
}

/**
 * Print metadata to be included in output
 */
export interface PrintMetadata {
  title: string;
  timestamp: Date;
  filters?: FilterState;
}

/**
 * Options for print preparation
 */
export interface PrintOptions {
  includeFilters?: boolean;
  includeTimestamp?: boolean;
  paperFormat?: PaperFormat;
  /**
   * When true, do NOT hide other sections via display:none.
   * This avoids layout issues for complex dashboards that already
   * use CSS (.no-print, .print-include, .print-only) to control
   * what appears on paper.
   */
  skipIsolation?: boolean;
}

/**
 * Current print state
 */
export interface PrintState {
  isPrinting: boolean;
  currentSection: string | null;
  metadata: PrintMetadata | null;
}

/**
 * PrintHandlerService class
 * 
 * Responsible for:
 * - Isolating specific sections for printing
 * - Injecting print metadata (timestamps, filters, titles)
 * - Managing print state lifecycle
 * - Coordinating with existing print infrastructure
 * - Cleaning up after print operations
 */
export class PrintHandlerService {
  private printState: PrintState = {
    isPrinting: false,
    currentSection: null,
    metadata: null
  };

  private originalDisplayStates: Map<Element, string> = new Map();
  private metadataElement: HTMLElement | null = null;

  /**
   * Prepare a specific section for printing
   * 
   * This method:
   * 1. Identifies the target section by ID
   * 2. Hides all other dashboard sections
   * 3. Applies print-specific styles
   * 4. Adds metadata if requested
   * 5. Updates print state
   * 
   * @param sectionId - The ID of the section to print
   * @param options - Print options (filters, timestamp, paper format)
   * @returns Promise that resolves when preparation is complete
   * 
   * Requirements:
   * - 1.1: Isolate by year summary section
   * - 2.1: Isolate subclass table sections
   * - 3.1: Isolate filtered analytics section
   * 
   * Error Handling:
   * - Missing section elements: Logs error and throws with context
   * - Print style application failures: Falls back to basic print
   * - Metadata retrieval failures: Continues without metadata
   * - Timeout: 5 second limit for print preparation
   */
  async prepareSectionForPrint(
    sectionId: string,
    options: PrintOptions = {}
  ): Promise<void> {
    const PRINT_PREPARATION_TIMEOUT = 5000; // 5 seconds
    
    try {
      // Wrap preparation in timeout promise
      await this.withTimeout(
        this.performPrintPreparation(sectionId, options),
        PRINT_PREPARATION_TIMEOUT,
        'Print preparation timed out'
      );

      console.log(`Section "${sectionId}" prepared for printing`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error preparing section for print:', {
        sectionId,
        error: errorMessage,
        options
      });
      
      // Clean up on error
      this.cleanupAfterPrint();
      
      // Re-throw with additional context
      throw new Error(`Failed to prepare section "${sectionId}" for printing: ${errorMessage}`);
    }
  }

  /**
   * Performs the actual print preparation logic
   * Separated from prepareSectionForPrint to enable timeout wrapping
   * 
   * @param sectionId - The ID of the section to print
   * @param options - Print options
   */
  private async performPrintPreparation(
    sectionId: string,
    options: PrintOptions
  ): Promise<void> {
    // Validate section exists
    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) {
      console.error(`Section element not found: ${sectionId}`);
      throw new Error(`Section with ID "${sectionId}" not found. Please ensure the section exists in the DOM.`);
    }

    // Update print state
    this.printState.isPrinting = true;
    this.printState.currentSection = sectionId;

    // Apply print styles with error handling
    try {
      const paperFormat = options.paperFormat || 'A4';
      printStyleManager.applyPrintStyles(paperFormat);
    } catch (styleError) {
      console.error('Failed to apply print styles, using fallback:', styleError);
      // Continue with basic print - don't fail completely
    }

    // Hide all sections except the target section, unless isolation is skipped
    if (!options.skipIsolation) {
      try {
        this.isolateSection(sectionElement);
      } catch (isolationError) {
        console.error('Failed to isolate section:', isolationError);
        // Continue - section may still be printable
      }
    }

    // Add metadata if requested with error handling.
    // Skip the separate metadata header for sections where it creates a blank first page,
    // specifically the By Year + Global ISF summary group and the Filtered Analytics report.
    const shouldAddMetadata =
      (options.includeTimestamp || options.includeFilters) &&
      sectionId !== PrintSection.SUMMARY_AND_SUBCLASS_GROUP &&
      sectionId !== PrintSection.FILTERED_ANALYTICS;

    if (shouldAddMetadata) {
      try {
        const metadata: PrintMetadata = {
          title: this.getSectionTitle(sectionId),
          timestamp: new Date(),
          filters: options.includeFilters ? this.getCurrentFilters() : undefined
        };
        
        this.printState.metadata = metadata;
        this.addPrintMetadata(metadata);
      } catch (metadataError) {
        console.error('Failed to add print metadata:', metadataError);
        // Continue without metadata - not critical for printing
      }
    }

    // Wait for layout to stabilize
    await this.waitForLayoutStabilization();

    // Apply intelligent page breaks with error handling (only when isolation is enabled)
    if (!options.skipIsolation) {
      try {
        printStyleManager.applyIntelligentPageBreaks();
      } catch (pageBreakError) {
        console.error('Failed to apply intelligent page breaks:', pageBreakError);
        // Continue - browser will use default page breaks
      }
    }
  }

  /**
   * Wraps a promise with a timeout
   * 
   * @param promise - Promise to wrap
   * @param timeoutMs - Timeout in milliseconds
   * @param timeoutMessage - Error message for timeout
   * @returns Promise that rejects if timeout is exceeded
   */
  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Isolate a specific section by hiding all other content
   * 
   * Stores original display states so they can be restored later.
   * Marks the target section as printable.
   * 
   * @param targetSection - The section element to isolate
   */
  private isolateSection(targetSection: Element): void {
    // Clear any previous display state tracking
    this.originalDisplayStates.clear();

    // Get the target section ID
    const targetId = targetSection.id;

    // Find all top-level sections in the dashboard that have data-print-section attribute
    const allPrintSections = document.querySelectorAll('[data-print-section]');

    allPrintSections.forEach(section => {
      const sectionId = section.id;
      
      // Skip if this is the target section or if target contains this section
      if (section === targetSection || targetSection.contains(section)) {
        return;
      }
      
      // Hide sections that are NOT part of the target
      // Store original display state (both computed and inline)
      const htmlElement = section as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      const inlineDisplay = htmlElement.style.display;
      
      // Store the inline display value (empty string if not set)
      this.originalDisplayStates.set(section, inlineDisplay);

      // Hide the section
      htmlElement.style.display = 'none';
    });

    // Also hide other major dashboard sections that don't have data-print-section
    const otherSections = document.querySelectorAll('.analytics-section, .dashboard-section');
    otherSections.forEach(section => {
      if (section !== targetSection && !targetSection.contains(section) && !section.contains(targetSection)) {
        const htmlElement = section as HTMLElement;
        const inlineDisplay = htmlElement.style.display;
        this.originalDisplayStates.set(section, inlineDisplay);
        htmlElement.style.display = 'none';
      }
    });

    // Mark target section as printable
    targetSection.setAttribute('data-print-active', 'true');
    
    // Store original display state of target section before modifying
    const targetHtmlElement = targetSection as HTMLElement;
    const targetInlineDisplay = targetHtmlElement.style.display;
    if (!this.originalDisplayStates.has(targetSection)) {
      this.originalDisplayStates.set(targetSection, targetInlineDisplay);
    }
    
    // Ensure target section is visible
    targetHtmlElement.style.display = 'block';
    
    // Make sure all children of target section are visible
    const childSections = targetSection.querySelectorAll('[data-print-section]');
    childSections.forEach(child => {
      const childHtmlElement = child as HTMLElement;
      const childInlineDisplay = childHtmlElement.style.display;
      if (!this.originalDisplayStates.has(child)) {
        this.originalDisplayStates.set(child, childInlineDisplay);
      }
      childHtmlElement.style.display = 'block';
    });
  }

  /**
   * Add print metadata to the document
   * 
   * Creates a metadata element with:
   * - Document title
   * - Generation timestamp
   * - Applied filters (if any)
   * 
   * The metadata is only visible in print mode.
   * 
   * @param metadata - The metadata to display
   * 
   * Requirements:
   * - 5.1: Include generation timestamp
   * - 5.2: Include applied filters
   * - 5.3: Include document title
   * - 5.4: Show "All data included" when no filters
   */
  addPrintMetadata(metadata: PrintMetadata): void {
    // Remove any existing metadata
    this.removeMetadataElement();

    // Create metadata container
    this.metadataElement = document.createElement('div');
    this.metadataElement.setAttribute('data-print-metadata', 'true');
    this.metadataElement.className = 'print-metadata';
    
    // Apply styles (hidden on screen, visible in print)
    this.metadataElement.style.display = 'none';
    
    // Build metadata content
    const metadataHTML = this.buildMetadataHTML(metadata);
    this.metadataElement.innerHTML = metadataHTML;

    // Insert at the beginning of the body
    document.body.insertBefore(this.metadataElement, document.body.firstChild);

    // Add print-specific styles for metadata
    this.addMetadataStyles();
  }

  /**
   * Build HTML content for print metadata
   * 
   * @param metadata - The metadata to format
   * @returns HTML string for metadata display
   */
  private buildMetadataHTML(metadata: PrintMetadata): string {
    const formattedDate = this.formatTimestamp(metadata.timestamp);
    
    let html = `
      <div class="metadata-header">
        <h1 class="metadata-title">${this.escapeHtml(metadata.title)}</h1>
        <p class="metadata-timestamp">Generated: ${formattedDate}</p>
      </div>
    `;

    // Add filter information if present
    if (metadata.filters) {
      const hasActiveFilters = this.hasActiveFilters(metadata.filters);
      
      if (hasActiveFilters) {
        html += '<div class="metadata-filters">';
        html += '<h2 class="metadata-filters-title">Applied Filters:</h2>';
        html += '<ul class="metadata-filters-list">';
        
        if (metadata.filters.barangay) {
          html += `<li><strong>Barangay:</strong> ${this.escapeHtml(metadata.filters.barangay.replace(/_/g, ' '))}</li>`;
        }
        if (metadata.filters.classification) {
          html += `<li><strong>Classification:</strong> ${this.escapeHtml(metadata.filters.classification)}</li>`;
        }
        if (metadata.filters.income) {
          html += `<li><strong>Income Range:</strong> ${this.escapeHtml(this.formatIncomeRange(metadata.filters.income))}</li>`;
        }
        if (metadata.filters.water) {
          html += `<li><strong>Water Source:</strong> ${this.escapeHtml(this.formatWaterFilter(metadata.filters.water))}</li>`;
        }
        if (metadata.filters.electricity) {
          html += `<li><strong>Electricity:</strong> ${this.escapeHtml(this.formatElectricityFilter(metadata.filters.electricity))}</li>`;
        }
        
        html += '</ul>';
        html += '</div>';
      } else {
        html += '<div class="metadata-filters">';
        html += '<p class="metadata-all-data">All data included (no filters applied)</p>';
        html += '</div>';
      }
    }

    return html;
  }

  /**
   * Add CSS styles for metadata display
   */
  private addMetadataStyles(): void {
    // Check if styles already exist
    if (document.querySelector('style[data-print-metadata-styles]')) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-print-metadata-styles', 'true');
    styleElement.textContent = `
      @media print {
        .print-metadata {
          display: block !important;
          margin-bottom: 4pt !important; /* Minimize blank space */
          padding: 4pt 0 !important; /* Minimal padding */
          border-bottom: 1pt solid #333 !important; /* Thinner border */
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        
        /* Prevent blank page - ensure content flows immediately after metadata */
        .print-metadata + * {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }

        .metadata-header {
          margin-bottom: 6pt !important; /* Reduced from 15px */
        }

        .metadata-title {
          font-size: 14pt !important; /* Reduced from 18pt */
          font-weight: bold;
          margin: 0 0 4pt 0 !important; /* Reduced spacing */
          color: #000;
        }

        .metadata-timestamp {
          font-size: 9pt !important; /* Slightly smaller */
          color: #666;
          margin: 0;
        }

        .metadata-filters {
          margin-top: 6pt !important; /* Reduced from 12px */
        }

        .metadata-filters-title {
          font-size: 12pt;
          font-weight: bold;
          margin: 0 0 8px 0;
          color: #000;
        }

        .metadata-filters-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .metadata-filters-list li {
          font-size: 10pt;
          margin-bottom: 4px;
          color: #333;
        }

        .metadata-all-data {
          font-size: 10pt;
          font-style: italic;
          color: #666;
          margin: 0;
        }
      }

      @media screen {
        .print-metadata {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(styleElement);
  }

  /**
   * Clean up after printing
   * 
   * This method:
   * 1. Restores original display states for all sections
   * 2. Removes print metadata
   * 3. Removes print styles
   * 4. Resets print state
   * 5. Triggers chart re-rendering
   * 
   * Safe to call multiple times.
   * 
   * Requirements:
   * - Restore normal view after printing
   * - Clean up temporary elements and styles
   */
  cleanupAfterPrint(): void {
    try {
      console.log('Starting print cleanup...');
      
      // Restore original display states by removing inline styles
      // This allows CSS classes to take effect again
      this.originalDisplayStates.forEach((originalDisplay, element) => {
        const htmlElement = element as HTMLElement;
        
        // If the original display was from CSS (not inline), remove the inline style
        if (originalDisplay === '' || !htmlElement.style.display) {
          htmlElement.style.removeProperty('display');
        } else {
          htmlElement.style.display = originalDisplay;
        }
      });
      this.originalDisplayStates.clear();

      // Remove print-active attributes
      const activeSections = document.querySelectorAll('[data-print-active]');
      activeSections.forEach(section => {
        section.removeAttribute('data-print-active');
        // Also remove any inline display styles from the active section
        (section as HTMLElement).style.removeProperty('display');
      });

      // Remove inline display styles from any child sections that were modified
      // This ensures ALL sections return to their CSS-defined display state
      const allPrintSections = document.querySelectorAll('[data-print-section]');
      allPrintSections.forEach(section => {
        const htmlElement = section as HTMLElement;
        // Remove any inline display style that might have been set during print isolation
        // This allows CSS classes to control display again
        if (htmlElement.style.display === 'block' || htmlElement.style.display === 'none') {
          htmlElement.style.removeProperty('display');
        }
      });

      // Also ensure any other dashboard sections that might have been hidden are restored
      // This is a safety net for sections that don't have data-print-section attribute
      const allDashboardSections = document.querySelectorAll('.analytics-section, .dashboard-section, [id*="summary"], [id*="analytics"]');
      allDashboardSections.forEach(section => {
        const htmlElement = section as HTMLElement;
        // Only remove display:none that we might have set, not other display values
        if (htmlElement.style.display === 'none') {
          htmlElement.style.removeProperty('display');
        }
      });

      // Remove metadata
      this.removeMetadataElement();

      // Remove print styles
      printStyleManager.removePrintStyles();

      // Reset print state
      this.printState = {
        isPrinting: false,
        currentSection: null,
        metadata: null
      };

      // CRITICAL: Ensure all sections are visible and layout is stable before re-rendering charts
      // Force a layout recalculation to ensure display changes are applied
      void document.body.offsetHeight; // Force reflow
      
      // Wait for DOM to fully update before re-rendering charts
      // This is critical because charts that were hidden (display: none) have 0x0 dimensions
      // and need time for the browser to recalculate their container dimensions
      requestAnimationFrame(() => {
        // Force another reflow to ensure all sections are properly laid out
        void document.body.offsetHeight;
        
        // First re-render attempt - immediate
        this.triggerChartRerender();
        
        // Second attempt after a short delay - gives hidden sections time to become visible
        setTimeout(() => {
          void document.body.offsetHeight; // Force reflow again
          this.triggerChartRerender();
        }, 100);
        
        // Third attempt after longer delay - ensures all charts have time to restore
        setTimeout(() => {
          void document.body.offsetHeight; // Force reflow again
          this.triggerChartRerender();
        }, 400);
      });

      console.log('Print cleanup complete');
    } catch (error) {
      console.error('Error during print cleanup:', error);
      // Don't throw - cleanup should be safe
    }
  }

  /**
   * Trigger re-rendering of all charts on the page
   * This is necessary because canvas elements can lose their context after print operations
   */
  private triggerChartRerender(): void {
    try {
      console.log('Triggering chart re-render...');
      
      // Dispatch a custom event that the chart coordinator can listen to
      const event = new CustomEvent('charts:rerender', {
        bubbles: true,
        detail: { reason: 'print-cleanup' }
      });
      window.dispatchEvent(event);

      // Also trigger a resize event which many chart libraries listen to
      window.dispatchEvent(new Event('resize'));
      
      // Force a reflow to ensure layout is recalculated
      document.body.offsetHeight;
      
      console.log('Chart re-render triggered');
    } catch (error) {
      console.error('Error triggering chart re-render:', error);
      // Don't throw - this is a nice-to-have
    }
  }

  /**
   * Get current print state
   * 
   * @returns Current print state including section and metadata
   */
  getPrintState(): PrintState {
    return { ...this.printState };
  }

  /**
   * Remove metadata element from DOM
   */
  private removeMetadataElement(): void {
    if (this.metadataElement && this.metadataElement.parentNode) {
      this.metadataElement.parentNode.removeChild(this.metadataElement);
      this.metadataElement = null;
    }

    // Also remove any orphaned metadata elements
    const orphanedMetadata = document.querySelectorAll('[data-print-metadata]');
    orphanedMetadata.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // Remove metadata styles
    const metadataStyles = document.querySelector('style[data-print-metadata-styles]');
    if (metadataStyles && metadataStyles.parentNode) {
      metadataStyles.parentNode.removeChild(metadataStyles);
    }
  }

  /**
   * Get the title for a section based on its ID
   * 
   * @param sectionId - The section ID
   * @returns Human-readable section title
   */
  private getSectionTitle(sectionId: string): string {
    const titleMap: Record<string, string> = {
      [PrintSection.BY_YEAR_SUMMARY]: 'Classification Summary by Year',
      [PrintSection.SUMMARY_AND_SUBCLASS_GROUP]: 'Summary Report - By Year, Global ISF & Subclass Tables',
      [PrintSection.SUBCLASS_DISPLACED]: 'Displaced Families - Detailed Report',
      [PrintSection.SUBCLASS_DOUBLE_UP]: 'Double-up Families - Detailed Report',
      [PrintSection.SUBCLASS_HOMELESS]: 'Homeless Families - Detailed Report',
      [PrintSection.FILTERED_ANALYTICS]: 'Filtered Analytics Report',
      [PrintSection.FULL_DASHBOARD]: 'Admin Dashboard - Complete Report'
    };

    return titleMap[sectionId] || 'Dashboard Report';
  }

  /**
   * Get current filter state from the dashboard
   * 
   * Attempts to read filter values from the window object where they are stored
   * by the component before printing.
   * Returns empty object if filters cannot be determined.
   * 
   * Error Handling:
   * - Missing filter state: Returns empty object with warning
   * - Invalid filter data: Sanitizes and returns valid filters only
   * - Window object unavailable: Returns empty object
   * 
   * @returns Current filter state
   */
  private getCurrentFilters(): FilterState {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('Window object not available, cannot retrieve filter state');
        return {};
      }

      // Check if filter state was stored by the component
      if ((window as any).__printFilterState) {
        const filterState = (window as any).__printFilterState;
        
        // Validate and sanitize filter state
        const sanitizedFilters = this.sanitizeFilterState(filterState);
        
        // Clean up the stored state
        delete (window as any).__printFilterState;
        
        return sanitizedFilters;
      }
      
      // Return empty filters if not available
      console.warn('Filter state not found on window object, using empty filters');
      return {};
    } catch (error) {
      console.error('Error retrieving filter state:', error);
      // Return empty filters as fallback
      return {};
    }
  }

  /**
   * Sanitizes filter state to ensure valid data
   * 
   * @param filterState - Raw filter state from window object
   * @returns Sanitized filter state with only valid string values
   */
  private sanitizeFilterState(filterState: any): FilterState {
    const sanitized: FilterState = {};

    try {
      // Validate each filter field
      if (typeof filterState.barangay === 'string' && filterState.barangay.trim()) {
        sanitized.barangay = filterState.barangay.trim();
      }
      
      if (typeof filterState.classification === 'string' && filterState.classification.trim()) {
        sanitized.classification = filterState.classification.trim();
      }
      
      if (typeof filterState.income === 'string' && filterState.income.trim()) {
        sanitized.income = filterState.income.trim();
      }
      
      if (typeof filterState.water === 'string' && filterState.water.trim()) {
        sanitized.water = filterState.water.trim();
      }
      
      if (typeof filterState.electricity === 'string' && filterState.electricity.trim()) {
        sanitized.electricity = filterState.electricity.trim();
      }
    } catch (error) {
      console.error('Error sanitizing filter state:', error);
      // Return whatever we managed to sanitize
    }

    return sanitized;
  }

  /**
   * Check if any filters are active
   * 
   * @param filters - Filter state to check
   * @returns True if any filter has a value
   */
  private hasActiveFilters(filters: FilterState): boolean {
    return !!(
      filters.barangay ||
      filters.classification ||
      filters.income ||
      filters.water ||
      filters.electricity
    );
  }

  /**
   * Format timestamp for display
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatTimestamp(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Format income range for display
   * 
   * @param income - Income filter value
   * @returns Formatted income range
   */
  private formatIncomeRange(income: string): string {
    const rangeMap: Record<string, string> = {
      '0_2999': '₱0 - ₱2,999',
      '3000_5999': '₱3,000 - ₱5,999',
      '6000_8999': '₱6,000 - ₱8,999',
      '9000_12999': '₱9,000 - ₱12,999',
      '13000_plus': '₱13,000+'
    };

    return rangeMap[income] || income;
  }

  /**
   * Format water filter for display
   * 
   * @param water - Water filter value
   * @returns Formatted water filter
   */
  private formatWaterFilter(water: string): string {
    const waterMap: Record<string, string> = {
      'has': 'With water source',
      'none': 'No water source'
    };

    return waterMap[water] || water;
  }

  /**
   * Format electricity filter for display
   * 
   * @param electricity - Electricity filter value
   * @returns Formatted electricity filter
   */
  private formatElectricityFilter(electricity: string): string {
    const electricityMap: Record<string, string> = {
      'has': 'With electricity',
      'none': 'No electricity'
    };

    return electricityMap[electricity] || electricity;
  }

  /**
   * Prepare multiple sections for printing as a group
   * 
   * This method:
   * 1. Identifies all target sections by their IDs
   * 2. Hides all other dashboard sections
   * 3. Shows all target sections
   * 4. Applies print-specific styles
   * 5. Adds metadata if requested
   * 
   * @param sectionIds - Array of section IDs to print together
   * @param options - Print options (filters, timestamp, paper format)
   * @returns Promise that resolves when preparation is complete
   */
  async prepareMultipleSectionsForPrint(
    sectionIds: string[],
    options: PrintOptions = {}
  ): Promise<void> {
    const PRINT_PREPARATION_TIMEOUT = 5000; // 5 seconds
    
    try {
      // Wrap preparation in timeout promise
      await this.withTimeout(
        this.performMultipleSectionsPrintPreparation(sectionIds, options),
        PRINT_PREPARATION_TIMEOUT,
        'Print preparation timed out'
      );

      console.log(`Sections "${sectionIds.join(', ')}" prepared for printing`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error preparing sections for print:', {
        sectionIds,
        error: errorMessage,
        options
      });
      
      // Clean up on error
      this.cleanupAfterPrint();
      
      // Re-throw with additional context
      throw new Error(`Failed to prepare sections for printing: ${errorMessage}`);
    }
  }

  /**
   * Performs the actual print preparation logic for multiple sections
   * 
   * @param sectionIds - Array of section IDs to print
   * @param options - Print options
   */
  private async performMultipleSectionsPrintPreparation(
    sectionIds: string[],
    options: PrintOptions
  ): Promise<void> {
    // Validate all sections exist
    const sectionElements: Element[] = [];
    for (const sectionId of sectionIds) {
      const element = document.querySelector(`[data-print-section="${sectionId}"]`);
      if (!element) {
        console.error(`Section element not found: ${sectionId}`);
        throw new Error(`Section with ID "${sectionId}" not found. Please ensure the section exists in the DOM.`);
      }
      sectionElements.push(element);
    }

    // Update print state
    this.printState.isPrinting = true;
    this.printState.currentSection = sectionIds.join(', ');

    // Apply print styles with error handling
    try {
      const paperFormat = options.paperFormat || 'A4';
      printStyleManager.applyPrintStyles(paperFormat);
    } catch (styleError) {
      console.error('Failed to apply print styles, using fallback:', styleError);
      // Continue with basic print - don't fail completely
    }

    // Hide all sections except the target sections, unless isolation is skipped
    if (!options.skipIsolation) {
      try {
        this.isolateMultipleSections(sectionElements);
      } catch (isolationError) {
        console.error('Failed to isolate sections:', isolationError);
        // Continue - sections may still be printable
      }
    }

    // Add metadata if requested with error handling.
    // Skip the separate title page when printing only heavy analytics sections
    // where the metadata header can cause an extra blank first page.
    const isOnlyHeavyAnalyticsSection =
      sectionIds.length === 1 &&
      (sectionIds[0] === PrintSection.SUMMARY_AND_SUBCLASS_GROUP ||
       sectionIds[0] === PrintSection.FILTERED_ANALYTICS);

    if ((options.includeTimestamp || options.includeFilters) && !isOnlyHeavyAnalyticsSection) {
      try {
        const metadata: PrintMetadata = {
          title: this.getMultipleSectionsTitle(sectionIds),
          timestamp: new Date(),
          filters: options.includeFilters ? this.getCurrentFilters() : undefined
        };
        
        this.printState.metadata = metadata;
        this.addPrintMetadata(metadata);
      } catch (metadataError) {
        console.error('Failed to add print metadata:', metadataError);
        // Continue without metadata - not critical for printing
      }
    }

    // Wait for layout to stabilize
    await this.waitForLayoutStabilization();

    // Apply intelligent page breaks with error handling (only when isolation is enabled)
    if (!options.skipIsolation) {
      try {
        printStyleManager.applyIntelligentPageBreaks();
      } catch (pageBreakError) {
        console.error('Failed to apply intelligent page breaks:', pageBreakError);
        // Continue - browser will use default page breaks
      }
    }
  }

  /**
   * Isolate multiple sections by hiding all other content
   * 
   * @param targetSections - Array of section elements to isolate
   */
  private isolateMultipleSections(targetSections: Element[]): void {
    // Clear any previous display state tracking
    this.originalDisplayStates.clear();

    // Find all top-level sections in the dashboard
    const allSections = document.querySelectorAll(
      '[data-print-section], .analytics-section, .dashboard-section'
    );

    allSections.forEach(section => {
      const isTargetSection = targetSections.some(target => 
        target === section || target.contains(section)
      );
      
      if (!isTargetSection) {
        // Store original display state
        const computedStyle = window.getComputedStyle(section as HTMLElement);
        this.originalDisplayStates.set(section, computedStyle.display);

        // Hide the section
        (section as HTMLElement).style.display = 'none';
      }
    });

    // Mark target sections as printable
    targetSections.forEach(section => {
      section.setAttribute('data-print-active', 'true');
      (section as HTMLElement).style.display = 'block';
    });
  }

  /**
   * Get combined title for multiple sections
   * 
   * @param sectionIds - Array of section IDs
   * @returns Combined title
   */
  private getMultipleSectionsTitle(sectionIds: string[]): string {
    if (sectionIds.length === 1) {
      return this.getSectionTitle(sectionIds[0]);
    }
    
    // Check for specific combinations
    const hasYearSummary = sectionIds.includes('by-year-summary');
    const hasSubclasses = sectionIds.some(id => 
      id.includes('subclass-displaced') || 
      id.includes('subclass-double-up') || 
      id.includes('subclass-homeless')
    );
    
    if (hasYearSummary && hasSubclasses) {
      return 'Classification Summary Report - By Year & Subclass Details';
    }
    
    return 'Dashboard Report - Multiple Sections';
  }

  /**
   * Escape HTML to prevent XSS
   * 
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Wait for layout to stabilize before printing
   * 
   * Gives the browser time to apply styles and recalculate layout.
   * 
   * @returns Promise that resolves after a brief delay
   */
  private waitForLayoutStabilization(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 150);
    });
  }
}

// Export singleton instance for convenience
export const printHandlerService = new PrintHandlerService();

// Export class for testing and custom instances
export default PrintHandlerService;
