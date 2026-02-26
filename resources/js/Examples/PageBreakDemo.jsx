import React, { useState } from 'react';
import { usePageBreakManager } from '../Utils/PageBreakManager';

/**
 * Page Break Demo Component
 * 
 * Demonstrates the page break implementation for admin analytics printing.
 * Shows how chart containers and major sections handle page breaks.
 * 
 * Task: 10.2 - Implement page break logic
 * Requirements: 5.4 - Prevent awkward splits (less than 30% of section on page)
 */
export default function PageBreakDemo() {
  const [paperFormat, setPaperFormat] = useState('A4');
  const [showPageBreaks, setShowPageBreaks] = useState(false);
  const { applyPageBreaks, removePageBreaks } = usePageBreakManager(paperFormat);

  const handleApplyPageBreaks = () => {
    const breaksAdded = applyPageBreaks();
    setShowPageBreaks(true);
    alert(`Applied ${breaksAdded} intelligent page breaks`);
  };

  const handleRemovePageBreaks = () => {
    removePageBreaks();
    setShowPageBreaks(false);
    alert('Removed all page breaks');
  };

  const handlePrint = () => {
    applyPageBreaks();
    window.print();
    removePageBreaks();
  };

  return (
    <div className="page-break-demo p-8">
      {/* Control Panel - Hidden in print */}
      <div className="no-print mb-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-emerald-700">
          Page Break Demo
        </h1>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Paper Format:
            </label>
            <select
              value={paperFormat}
              onChange={(e) => setPaperFormat(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyPageBreaks}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Apply Page Breaks
            </button>
            
            <button
              onClick={handleRemovePageBreaks}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Remove Page Breaks
            </button>
            
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Print
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>Status:</strong> {showPageBreaks ? 'Page breaks applied' : 'No page breaks'}
          </p>
          <p className="mb-2">
            <strong>Current Format:</strong> {paperFormat}
          </p>
          <p>
            <strong>How it works:</strong> Sections with less than 30% on the first page 
            will automatically get a page break to prevent awkward splits.
          </p>
        </div>
      </div>

      {/* Demo Content - Printable */}
      
      {/* Section 1 - Small section that fits on one page */}
      <div className="analytics-section mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700">
          Section 1: Executive Summary
        </h2>
        
        <p className="mb-4 text-gray-700">
          This is a small section that should fit comfortably on one page.
          It demonstrates the <code>page-break-inside: avoid</code> rule.
        </p>

        <div className="chart-container bg-gray-100 p-4 rounded-lg">
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">Chart A</p>
              <p className="text-sm text-gray-500">Small chart (fits on page)</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>CSS Applied:</strong> <code>page-break-inside: avoid</code> on 
            <code>.chart-container</code> prevents this chart from splitting across pages.
          </p>
        </div>
      </div>

      {/* Section 2 - Medium section */}
      <div className="analytics-section mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700">
          Section 2: User Analytics
        </h2>
        
        <p className="mb-4 text-gray-700">
          This section contains multiple charts and demonstrates how the page break
          manager handles sections that might split awkwardly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="chart-container bg-gray-100 p-4 rounded-lg">
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-600">Chart B</p>
                <p className="text-sm text-gray-500">User Growth</p>
              </div>
            </div>
          </div>

          <div className="chart-container bg-gray-100 p-4 rounded-lg">
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-600">Chart C</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>CSS Applied:</strong> <code>page-break-before: auto</code> allows
            the browser to decide if this section should start on a new page.
          </p>
        </div>
      </div>

      {/* Section 3 - Large section that might need page break */}
      <div className="analytics-section mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700">
          Section 3: Revenue Analysis
        </h2>
        
        <p className="mb-4 text-gray-700">
          This is a larger section with multiple charts. If less than 30% of this
          section would appear on the first page, the PageBreakManager will add
          a <code>page-break-before: always</code> to force it to start on a new page.
        </p>

        <div className="chart-container bg-gray-100 p-4 rounded-lg mb-4">
          <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">Chart D</p>
              <p className="text-sm text-gray-500">Revenue Trends (Large)</p>
            </div>
          </div>
        </div>

        <div className="chart-container bg-gray-100 p-4 rounded-lg mb-4">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">Chart E</p>
              <p className="text-sm text-gray-500">Revenue by Category</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Intelligent Page Break:</strong> If this section would split with
            less than 30% on the first page, JavaScript adds 
            <code>page-break-before: always</code> and 
            <code>data-page-break-added="true"</code>.
          </p>
        </div>
      </div>

      {/* Section 4 - Another large section */}
      <div className="analytics-section mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700">
          Section 4: Detailed Metrics
        </h2>
        
        <p className="mb-4 text-gray-700">
          This section demonstrates how multiple large sections are handled.
          Each section is analyzed independently for optimal page break placement.
        </p>

        <div className="chart-container bg-gray-100 p-4 rounded-lg mb-4">
          <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">Chart F</p>
              <p className="text-sm text-gray-500">Detailed Metrics (Very Large)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="summary-card p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm font-semibold text-emerald-700">Total Users</p>
            <p className="text-2xl font-bold text-emerald-900">12,345</p>
          </div>
          
          <div className="summary-card p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-700">Active Sessions</p>
            <p className="text-2xl font-bold text-blue-900">8,901</p>
          </div>
          
          <div className="summary-card p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-semibold text-purple-700">Conversion Rate</p>
            <p className="text-2xl font-bold text-purple-900">23.4%</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Summary Cards:</strong> These also have 
            <code>page-break-inside: avoid</code> to prevent splitting.
          </p>
        </div>
      </div>

      {/* Section 5 - Final section */}
      <div className="analytics-section mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-emerald-700">
          Section 5: Conclusion
        </h2>
        
        <p className="mb-4 text-gray-700">
          This final section demonstrates that the page break logic works correctly
          for all sections in the document, regardless of their position.
        </p>

        <div className="chart-container bg-gray-100 p-4 rounded-lg mb-4">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">Chart G</p>
              <p className="text-sm text-gray-500">Summary Chart</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">
            Page Break Implementation Summary
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ <code>page-break-inside: avoid</code> on chart containers</li>
            <li>✅ <code>page-break-before: auto</code> on major sections</li>
            <li>✅ Intelligent 30% threshold detection</li>
            <li>✅ Support for A4, Letter, and Legal paper formats</li>
            <li>✅ Automatic cleanup after printing</li>
          </ul>
        </div>
      </div>

      {/* Print Instructions */}
      <div className="no-print mt-8 p-6 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-bold mb-4">How to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Select a paper format from the dropdown above</li>
          <li>Click "Apply Page Breaks" to see the intelligent page break logic in action</li>
          <li>Click "Print" or press Ctrl+P / Cmd+P to open the print dialog</li>
          <li>In the print preview, verify that:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Charts don't split across pages</li>
              <li>Sections with less than 30% on first page start on new page</li>
              <li>Page breaks appear in logical places</li>
            </ul>
          </li>
          <li>Try different paper formats to see how the layout adapts</li>
        </ol>
      </div>
    </div>
  );
}
