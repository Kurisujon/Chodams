/**
 * usePrintWithPageBreaks Hook
 * 
 * React hook that integrates intelligent page break logic with the print system.
 * Automatically applies page breaks before printing and cleans up after.
 * 
 * Error Handling:
 * - Print style application failures: Logs error and continues
 * - Page break calculation failures: Logs error and continues with basic print
 * - Cleanup failures: Logs error but ensures cleanup completes
 * - Event listener failures: Logs warning and continues
 * 
 * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
 */

import { useEffect, useCallback } from 'react';
import { printStyleManager } from '../Services/PrintStyleManager';
import { PaperFormat } from '../Services/PaperConfiguration';

interface UsePrintWithPageBreaksOptions {
  paperFormat?: PaperFormat;
  enabled?: boolean;
}

/**
 * Hook for managing print with intelligent page breaks
 * 
 * Listens to beforeprint and afterprint events to apply and remove page breaks.
 * 
 * @param {UsePrintWithPageBreaksOptions} options - Configuration options
 * @returns {Object} Utility functions for manual control
 */
export function usePrintWithPageBreaks(options: UsePrintWithPageBreaksOptions = {}) {
  const { paperFormat = 'A4', enabled = true } = options;

  /**
   * Handles the beforeprint event
   * Applies print styles and intelligent page breaks
   * 
   * Error Handling:
   * - Style application failures: Logs error and continues with basic print
   * - Page break failures: Logs error and continues without page breaks
   */
  const handleBeforePrint = useCallback(() => {
    if (!enabled) return;

    try {
      // Apply print styles with the specified paper format
      try {
        printStyleManager.applyPrintStyles(paperFormat);
      } catch (styleError) {
        console.error('Error applying print styles:', styleError);
        // Continue - browser will use default print styles
      }

      // Wait a brief moment for styles to be applied and layout to stabilize
      setTimeout(() => {
        try {
          // Apply intelligent page breaks
          const breaksAdded = printStyleManager.applyIntelligentPageBreaks();
          console.log(`Print preparation complete. ${breaksAdded} page breaks added.`);
        } catch (pageBreakError) {
          console.error('Error applying page breaks:', pageBreakError);
          // Continue - browser will use default page breaks
        }
      }, 100);
    } catch (error) {
      console.error('Error preparing for print:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paperFormat,
        enabled
      });
      // Don't throw - allow print to continue with browser defaults
    }
  }, [paperFormat, enabled]);

  /**
   * Handles the afterprint event
   * Removes print styles and page breaks
   * 
   * Error Handling:
   * - Cleanup failures: Logs error but ensures cleanup completes
   */
  const handleAfterPrint = useCallback(() => {
    if (!enabled) return;

    try {
      // Clean up print styles and page breaks
      printStyleManager.removePrintStyles();
      console.log('Print cleanup complete.');
    } catch (error) {
      console.error('Error cleaning up after print:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw - cleanup errors shouldn't affect user
    }
  }, [enabled]);

  /**
   * Manually trigger print with page breaks
   * 
   * Error Handling:
   * - Print preparation failures: Logs error and opens print dialog anyway
   * - Print dialog failures: Logs error and shows user message
   */
  const triggerPrint = useCallback(() => {
    if (!enabled) {
      try {
        window.print();
      } catch (error) {
        console.error('Error opening print dialog:', error);
        alert('Could not open the print dialog. Please try using Ctrl+P (or Cmd+P on Mac).');
      }
      return;
    }

    try {
      // Apply styles and page breaks
      handleBeforePrint();

      // Wait for layout to stabilize before opening print dialog
      setTimeout(() => {
        try {
          window.print();
        } catch (printError) {
          console.error('Error opening print dialog:', printError);
          alert('Could not open the print dialog. Please try using Ctrl+P (or Cmd+P on Mac).');
          
          // Clean up since print dialog didn't open
          handleAfterPrint();
        }
      }, 200);
    } catch (error) {
      console.error('Error triggering print:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Try to open print dialog anyway
      try {
        window.print();
      } catch (printError) {
        console.error('Error opening print dialog after preparation failure:', printError);
        alert('An error occurred. Please try using Ctrl+P (or Cmd+P on Mac) to print.');
      }
    }
  }, [enabled, handleBeforePrint, handleAfterPrint]);

  /**
   * Set up event listeners for print events
   * 
   * Error Handling:
   * - Event listener failures: Logs warning and continues
   * - Cleanup failures: Logs warning but doesn't throw
   */
  useEffect(() => {
    if (!enabled) return;

    // Check if window is available
    if (typeof window === 'undefined') {
      console.warn('usePrintWithPageBreaks: window is not available');
      return;
    }

    // Add event listeners with error handling
    try {
      window.addEventListener('beforeprint', handleBeforePrint);
    } catch (error) {
      console.warn('Failed to add beforeprint listener:', error);
    }

    try {
      window.addEventListener('afterprint', handleAfterPrint);
    } catch (error) {
      console.warn('Failed to add afterprint listener:', error);
    }

    // Cleanup on unmount
    return () => {
      try {
        window.removeEventListener('beforeprint', handleBeforePrint);
      } catch (error) {
        console.warn('Error removing beforeprint listener:', error);
      }

      try {
        window.removeEventListener('afterprint', handleAfterPrint);
      } catch (error) {
        console.warn('Error removing afterprint listener:', error);
      }
      
      // Clean up any remaining print styles
      try {
        printStyleManager.removePrintStyles();
      } catch (error) {
        console.warn('Error cleaning up print styles on unmount:', error);
      }
    };
  }, [enabled, handleBeforePrint, handleAfterPrint]);

  return {
    triggerPrint,
    handleBeforePrint,
    handleAfterPrint,
  };
}

export default usePrintWithPageBreaks;
