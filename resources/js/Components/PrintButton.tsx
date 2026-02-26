/**
 * PrintButton Component
 * 
 * A reusable button component for triggering print functionality on dashboard sections.
 * Integrates with PrintHandlerService to prepare sections for printing.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * Error Handling:
 * - Chart rendering failures: Shows user-friendly error message
 * - Missing section elements: Alerts user with specific error
 * - Print preparation timeout: Cleans up and notifies user
 * - General errors: Logs context and shows generic error message
 */

import React, { useState } from 'react';
import { printHandlerService, PrintOptions } from '../Services/PrintHandlerService';

/**
 * Props for the PrintButton component
 */
export interface PrintButtonProps {
  /** The ID of the section to print (must match a data-print-section attribute) */
  sectionId?: string;
  
  /** Array of section IDs to print together (alternative to sectionId) */
  sectionIds?: string[];
  
  /** The label text to display on the button */
  label?: string;
  
  /** Optional icon element to display before the label */
  icon?: React.ReactNode;
  
  /** Additional CSS classes to apply to the button */
  className?: string;
  
  /** Print options to pass to the PrintHandlerService */
  printOptions?: PrintOptions;
  
  /** Callback function called when print is triggered */
  onPrintStart?: () => void;
  
  /** Callback function called after print dialog is closed */
  onPrintEnd?: () => void;
  
  /** Callback function called when an error occurs */
  onError?: (error: Error) => void;
  
  /** Whether the button should be disabled */
  disabled?: boolean;
}

/**
 * PrintButton Component
 * 
 * Displays a button that triggers print functionality for a specific dashboard section.
 * Shows a loading state while preparing the section for printing.
 * Styled with emerald theme to match the dashboard design.
 * 
 * @example
 * ```tsx
 * <PrintButton 
 *   sectionId="by-year-summary"
 *   label="Print Summary"
 *   icon={<PrinterIcon />}
 *   printOptions={{ includeFilters: true, includeTimestamp: true }}
 * />
 * ```
 */
export default function PrintButton({
  sectionId,
  sectionIds,
  label = 'Print',
  icon,
  className = '',
  printOptions = {},
  onPrintStart,
  onPrintEnd,
  onError,
  disabled = false
}: PrintButtonProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupTimeoutRef = React.useRef<number | null>(null);

  /**
   * Cleanup function to ensure state is reset
   */
  const forceCleanup = React.useCallback(() => {
    try {
      printHandlerService.cleanupAfterPrint();
    } catch (e) {
      console.error('Error in force cleanup:', e);
    }
    setIsLoading(false);
  }, []);

  /**
   * Handle print button click
   * 
   * 1. Set loading state
   * 2. Call onPrintStart callback if provided
   * 3. Prepare section for printing using PrintHandlerService
   * 4. Open browser print dialog
   * 5. Clean up after print dialog closes
   * 6. Call onPrintEnd callback if provided
   * 
   * Requirements:
   * - 7.4: Print button click opens browser print dialog
   * 
   * Error Handling:
   * - Validates button state before proceeding
   * - Catches and logs all errors with context
   * - Shows user-friendly error messages
   * - Ensures cleanup happens even on error
   * - Calls onError callback if provided
   */
  const handlePrint = async () => {
    if (isLoading || disabled) {
      return;
    }

    // Clear any previous errors
    setError(null);
    
    let afterPrintHandler: (() => void) | null = null;

    try {
      setIsLoading(true);
      
      // Call onPrintStart callback
      if (onPrintStart) {
        try {
          onPrintStart();
        } catch (callbackError) {
          console.error('Error in onPrintStart callback:', callbackError);
          // Continue - callback error shouldn't block printing
        }
      }

      // Prepare section for printing with timeout protection
      try {
        await printHandlerService.prepareSectionForPrint(sectionId, printOptions);
      } catch (prepError) {
        const errorMessage = prepError instanceof Error ? prepError.message : 'Unknown error';
        
        // Determine user-friendly error message based on error type
        let userMessage = 'An error occurred while preparing the print. Please try again.';
        
        if (errorMessage.includes('not found')) {
          userMessage = `The section "${sectionId}" could not be found. Please refresh the page and try again.`;
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          userMessage = 'Print preparation took too long. Please try again or contact support if the issue persists.';
        } else if (errorMessage.includes('chart') || errorMessage.includes('render')) {
          userMessage = 'Some charts could not be prepared for printing. The print may be incomplete.';
        }
        
        setError(userMessage);
        
        // Call onError callback if provided
        if (onError) {
          onError(prepError instanceof Error ? prepError : new Error(errorMessage));
        }
        
        // Show alert to user
        alert(userMessage);
        
        // Clean up and return early
        printHandlerService.cleanupAfterPrint();
        setIsLoading(false);
        return;
      }

      // Set up cleanup after print dialog closes
      // The afterprint event fires when the print dialog is closed (including cancel)
      afterPrintHandler = () => {
        try {
          printHandlerService.cleanupAfterPrint();
        } catch (cleanupError) {
          console.error('Error during print cleanup:', cleanupError);
          // Continue - cleanup errors shouldn't be shown to user
        }
        
        setIsLoading(false);
        
        // Call onPrintEnd callback
        if (onPrintEnd) {
          try {
            onPrintEnd();
          } catch (callbackError) {
            console.error('Error in onPrintEnd callback:', callbackError);
            // Continue - callback error shouldn't affect user
          }
        }
        
        // Remove event listener
        if (afterPrintHandler) {
          window.removeEventListener('afterprint', afterPrintHandler);
        }
      };

      window.addEventListener('afterprint', afterPrintHandler);

      // Open browser print dialog
      try {
        window.print();
      } catch (printError) {
        console.error('Error opening print dialog:', printError);
        alert('Could not open the print dialog. Please try using Ctrl+P (or Cmd+P on Mac) instead.');
        
        // Clean up since print dialog didn't open
        if (afterPrintHandler) {
          window.removeEventListener('afterprint', afterPrintHandler);
        }
        printHandlerService.cleanupAfterPrint();
        setIsLoading(false);
        return;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Unexpected error during print operation:', {
        sectionId,
        error: errorMessage,
        printOptions
      });
      
      // Clean up on error
      try {
        printHandlerService.cleanupAfterPrint();
      } catch (cleanupError) {
        console.error('Error during error cleanup:', cleanupError);
      }
      
      // Remove event listener if it was added
      if (afterPrintHandler) {
        window.removeEventListener('afterprint', afterPrintHandler);
      }
      
      setIsLoading(false);
      
      // Show user-friendly error message
      const userMessage = 'An unexpected error occurred. Please refresh the page and try again.';
      setError(userMessage);
      alert(userMessage);
      
      // Call onError callback if provided
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  };

  /**
   * Default printer icon SVG
   * Simple printer icon that matches the dashboard style
   */
  const defaultIcon = (
    <svg 
      className="w-4 h-4" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" 
      />
    </svg>
  );

  /**
   * Loading spinner SVG
   * Animated spinner shown during print preparation
   */
  const loadingSpinner = (
    <svg 
      className="animate-spin w-4 h-4" 
      fill="none" 
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      onClick={handlePrint}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
        border border-transparent rounded-md 
        font-semibold text-xs text-white uppercase tracking-widest 
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition ease-in-out duration-150
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      aria-label={`Print ${label}`}
      title={isLoading ? 'Preparing print...' : `Print ${label}`}
    >
      {/* Show loading spinner or icon */}
      {isLoading ? loadingSpinner : (icon || defaultIcon)}
      
      {/* Button label */}
      <span>{isLoading ? 'Preparing...' : label}</span>
    </button>
  );
}
