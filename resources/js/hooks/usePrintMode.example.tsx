/**
 * Example usage of the usePrintMode hook
 * 
 * This file demonstrates how to use the usePrintMode hook
 * in a React component to detect print mode and adjust rendering.
 */

import React from 'react';
import { usePrintMode } from './usePrintMode';

/**
 * Example 1: Simple print mode indicator
 */
export function PrintModeIndicator() {
  const isPrinting = usePrintMode();
  
  return (
    <div>
      <p>Current mode: {isPrinting ? 'Print' : 'Screen'}</p>
    </div>
  );
}

/**
 * Example 2: Conditional rendering based on print mode
 */
export function ConditionalContent() {
  const isPrinting = usePrintMode();
  
  return (
    <div>
      {isPrinting ? (
        <div className="print-only">
          <h1>Print-optimized content</h1>
          <p>This content is shown only when printing</p>
        </div>
      ) : (
        <div className="screen-only">
          <h1>Screen content</h1>
          <button>Interactive button (hidden in print)</button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Adjusting chart dimensions for print
 */
export function ResponsiveChart() {
  const isPrinting = usePrintMode();
  
  // Use different dimensions for print vs screen
  const chartWidth = isPrinting ? 800 : 600;
  const chartHeight = isPrinting ? 600 : 400;
  
  return (
    <div>
      <h2>Analytics Chart</h2>
      <div 
        style={{ 
          width: chartWidth, 
          height: chartHeight,
          border: '1px solid #ccc'
        }}
      >
        Chart content (dimensions: {chartWidth}x{chartHeight})
      </div>
    </div>
  );
}

/**
 * Example 4: Applying print-specific styles
 */
export function StyledForPrint() {
  const isPrinting = usePrintMode();
  
  const containerStyle = isPrinting
    ? {
        fontSize: '12pt',
        color: '#000',
        backgroundColor: '#fff',
        padding: '20mm',
      }
    : {
        fontSize: '16px',
        color: '#333',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      };
  
  return (
    <div style={containerStyle}>
      <h1>Content with print-specific styling</h1>
      <p>This content adjusts its styling based on print mode</p>
    </div>
  );
}
