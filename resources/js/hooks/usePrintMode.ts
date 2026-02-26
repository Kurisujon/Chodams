import { useState, useEffect } from 'react';

/**
 * Custom hook to detect print mode state
 * 
 * Uses window.matchMedia('print') and beforeprint/afterprint events
 * to track when the browser is in print mode.
 * 
 * Error Handling:
 * - Browser API unavailable: Returns false and logs warning
 * - Event listener failures: Continues with available listeners
 * - Cleanup errors: Logs but doesn't throw
 * 
 * @returns {boolean} True when in print mode, false otherwise
 * 
 * @example
 * function MyComponent() {
 *   const isPrinting = usePrintMode();
 *   
 *   return (
 *     <div>
 *       {isPrinting ? 'Print view' : 'Screen view'}
 *     </div>
 *   );
 * }
 */
export function usePrintMode(): boolean {
  const [isPrinting, setIsPrinting] = useState(false);
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('usePrintMode: window is not available');
      return;
    }

    // Check if matchMedia is available
    if (!window.matchMedia) {
      console.warn('usePrintMode: matchMedia is not supported in this browser');
      return;
    }

    let printMediaQuery: MediaQueryList | null = null;
    
    try {
      // Create media query for print
      printMediaQuery = window.matchMedia('print');
      
      // Handler for media query changes
      const handlePrintChange = (e: MediaQueryListEvent) => {
        try {
          setIsPrinting(e.matches);
        } catch (error) {
          console.error('Error in handlePrintChange:', error);
        }
      };
      
      // Handlers for print events
      const handleBeforePrint = () => {
        try {
          setIsPrinting(true);
        } catch (error) {
          console.error('Error in handleBeforePrint:', error);
        }
      };
      
      const handleAfterPrint = () => {
        try {
          setIsPrinting(false);
        } catch (error) {
          console.error('Error in handleAfterPrint:', error);
        }
      };
      
      // Check initial state
      try {
        setIsPrinting(printMediaQuery.matches);
      } catch (error) {
        console.error('Error setting initial print state:', error);
      }
      
      // Listen for media query changes
      try {
        printMediaQuery.addEventListener('change', handlePrintChange);
      } catch (error) {
        console.warn('Failed to add media query change listener:', error);
      }
      
      // Listen for beforeprint/afterprint events
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
      
      // Cleanup listeners on unmount
      return () => {
        try {
          if (printMediaQuery) {
            printMediaQuery.removeEventListener('change', handlePrintChange);
          }
        } catch (error) {
          console.warn('Error removing media query listener:', error);
        }

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
      };
    } catch (error) {
      console.error('Error setting up usePrintMode hook:', error);
      return; // Return empty cleanup function
    }
  }, []);
  
  return isPrinting;
}
