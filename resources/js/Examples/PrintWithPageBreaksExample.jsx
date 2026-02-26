/**
 * Example: Using Print with Intelligent Page Breaks
 * 
 * This example demonstrates how to use the print system with intelligent
 * page break logic to prevent awkward section splits.
 * 
 * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
 */

import React from 'react';
import { usePrintWithPageBreaks } from '../Hooks/usePrintWithPageBreaks';
import PrintableSection from '../Components/PrintableSection';

/**
 * Example Analytics Dashboard with Print Support
 */
export default function AnalyticsDashboardExample() {
  // Initialize print with page breaks hook
  // This automatically handles beforeprint and afterprint events
  const { triggerPrint } = usePrintWithPageBreaks({
    paperFormat: 'A4', // or 'Letter', 'Legal'
    enabled: true,
  });

  return (
    <div className="analytics-dashboard">
      {/* Print Button */}
      <div className="no-print">
        <button
          onClick={triggerPrint}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Print Analytics Report
        </button>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="print-header print-visible">
        <h1 className="print-header-title">Analytics Report</h1>
        <p className="print-header-date">
          Generated: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Analytics Sections */}
      {/* Each section is wrapped in PrintableSection for intelligent page breaks */}
      
      <PrintableSection
        id="summary"
        title="Executive Summary"
        category="summary"
        className="analytics-section mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="summary-card">
            <h3>Total Users</h3>
            <p className="text-3xl font-bold">1,234</p>
          </div>
          <div className="summary-card">
            <h3>Active Sessions</h3>
            <p className="text-3xl font-bold">567</p>
          </div>
        </div>
      </PrintableSection>

      <PrintableSection
        id="user-growth"
        title="User Growth Chart"
        category="chart"
        className="analytics-section mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">User Growth</h2>
        <div className="chart-container">
          {/* Your chart component here */}
          <div className="h-64 bg-gray-100 flex items-center justify-center">
            [Line Chart: User Growth Over Time]
          </div>
        </div>
      </PrintableSection>

      <PrintableSection
        id="revenue"
        title="Revenue Analysis"
        category="chart"
        className="analytics-section mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">Revenue Analysis</h2>
        <div className="chart-container">
          {/* Your chart component here */}
          <div className="h-64 bg-gray-100 flex items-center justify-center">
            [Bar Chart: Revenue by Category]
          </div>
        </div>
      </PrintableSection>

      <PrintableSection
        id="data-table"
        title="Detailed Data"
        category="table"
        className="analytics-section mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">Detailed Data</h2>
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Users</th>
              <th>Revenue</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-01-01</td>
              <td>100</td>
              <td>$1,000</td>
              <td>5%</td>
            </tr>
            {/* More rows... */}
          </tbody>
        </table>
      </PrintableSection>

      {/* Print Footer - Only visible when printing */}
      <div className="print-footer print-visible">
        {/* Page numbers will be added automatically via CSS */}
      </div>
    </div>
  );
}

/**
 * Example: Manual Control of Page Breaks
 * 
 * For more advanced use cases, you can manually control when page breaks
 * are applied and removed.
 */
export function ManualPageBreakExample() {
  const { handleBeforePrint, handleAfterPrint } = usePrintWithPageBreaks({
    paperFormat: 'Letter',
    enabled: false, // Disable automatic handling
  });

  const handleCustomPrint = () => {
    // Apply print styles and page breaks
    handleBeforePrint();

    // Wait for layout to stabilize
    setTimeout(() => {
      // Open print dialog
      window.print();

      // Clean up after printing
      // Note: This will also be called automatically by afterprint event
      handleAfterPrint();
    }, 300);
  };

  return (
    <div>
      <button onClick={handleCustomPrint}>
        Custom Print
      </button>
      
      {/* Your content here */}
    </div>
  );
}

/**
 * Example: Using PageBreakManager Directly
 * 
 * For even more control, you can use the PageBreakManager directly
 * without the React hook.
 */
export function DirectPageBreakExample() {
  const handlePrint = () => {
    // Import the manager
    const { pageBreakManager } = require('../Utils/PageBreakManager');
    
    // Set paper format
    pageBreakManager.setPaperFormat('A4');
    
    // Apply intelligent page breaks
    const breaksAdded = pageBreakManager.applyIntelligentPageBreaks();
    console.log(`Added ${breaksAdded} page breaks`);
    
    // Print
    window.print();
    
    // Clean up
    pageBreakManager.removePageBreaks();
  };

  return (
    <div>
      <button onClick={handlePrint}>
        Print with Direct Control
      </button>
      
      {/* Your content here */}
    </div>
  );
}

/**
 * CSS Classes for Page Break Control
 * 
 * You can also use CSS classes to control page breaks:
 * 
 * - .analytics-section - Automatically gets page break logic applied
 * - .print-section - Alternative class for sections
 * - [data-printable-section] - Sections with this attribute
 * - .print-page-break - Forces a page break before element
 * - .page-break-before - Forces a page break before element
 * 
 * Example:
 * 
 * <div className="analytics-section">
 *   <!-- This section will get intelligent page break logic -->
 * </div>
 * 
 * <div className="print-page-break">
 *   <!-- This will always start on a new page -->
 * </div>
 */
