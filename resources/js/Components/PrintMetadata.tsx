/**
 * PrintMetadata Component
 * 
 * Displays metadata information for printed documents including:
 * - Document title
 * - Generation timestamp
 * - Applied filter information
 * 
 * The component is hidden in screen view and only visible when printing.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import React from 'react';
import { FilterState } from '../Services/PrintHandlerService';

/**
 * Props for the PrintMetadata component
 */
export interface PrintMetadataProps {
  /** The title of the document being printed */
  title: string;
  
  /** The timestamp when the print was generated (defaults to current time) */
  timestamp?: Date;
  
  /** Filter state to display in the metadata */
  filters?: FilterState;
  
  /** Additional CSS classes to apply to the container */
  className?: string;
}

/**
 * PrintMetadata Component
 * 
 * Renders metadata information that appears at the top of printed documents.
 * Hidden on screen, visible only in print mode via CSS media queries.
 * 
 * Requirements:
 * - 5.1: Display generation timestamp
 * - 5.2: Display applied filter values
 * - 5.3: Display document title
 * - 5.4: Show "All data included" when no filters are applied
 * 
 * @example
 * ```tsx
 * <PrintMetadata 
 *   title="Classification Summary by Year"
 *   timestamp={new Date()}
 *   filters={{ barangay: 'Zone_I', classification: 'Displaced' }}
 * />
 * ```
 */
export default function PrintMetadata({
  title,
  timestamp = new Date(),
  filters,
  className = ''
}: PrintMetadataProps): JSX.Element {
  
  /**
   * Format timestamp for display
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Check if any filters are active
   * 
   * @param filterState - Filter state to check
   * @returns True if any filter has a value
   */
  const hasActiveFilters = (filterState?: FilterState): boolean => {
    if (!filterState) return false;
    
    return !!(
      filterState.barangay ||
      filterState.classification ||
      filterState.income ||
      filterState.water ||
      filterState.electricity
    );
  };

  /**
   * Format barangay name for display
   * 
   * @param barangay - Barangay filter value
   * @returns Formatted barangay name
   */
  const formatBarangay = (barangay: string): string => {
    return barangay.replace(/_/g, ' ');
  };

  /**
   * Format income range for display
   * 
   * @param income - Income filter value
   * @returns Formatted income range
   */
  const formatIncomeRange = (income: string): string => {
    const rangeMap: Record<string, string> = {
      '0_2999': '₱0 - ₱2,999',
      '3000_5999': '₱3,000 - ₱5,999',
      '6000_8999': '₱6,000 - ₱8,999',
      '9000_12999': '₱9,000 - ₱12,999',
      '13000_plus': '₱13,000+'
    };

    return rangeMap[income] || income;
  };

  /**
   * Format water filter for display
   * 
   * @param water - Water filter value
   * @returns Formatted water filter
   */
  const formatWaterFilter = (water: string): string => {
    const waterMap: Record<string, string> = {
      'has': 'With water source',
      'none': 'No water source'
    };

    return waterMap[water] || water;
  };

  /**
   * Format electricity filter for display
   * 
   * @param electricity - Electricity filter value
   * @returns Formatted electricity filter
   */
  const formatElectricityFilter = (electricity: string): string => {
    const electricityMap: Record<string, string> = {
      'has': 'With electricity',
      'none': 'No electricity'
    };

    return electricityMap[electricity] || electricity;
  };

  const formattedDate = formatTimestamp(timestamp);
  const hasFilters = hasActiveFilters(filters);

  return (
    <div 
      className={`print-metadata ${className}`}
      data-print-metadata="true"
    >
      {/* Document header with title and timestamp */}
      <div className="metadata-header">
        <h1 className="metadata-title">{title}</h1>
        <p className="metadata-timestamp">Generated: {formattedDate}</p>
      </div>

      {/* Filter information section */}
      <div className="metadata-filters">
        {hasFilters ? (
          <>
            <h2 className="metadata-filters-title">Applied Filters:</h2>
            <ul className="metadata-filters-list">
              {filters?.barangay && (
                <li>
                  <strong>Barangay:</strong> {formatBarangay(filters.barangay)}
                </li>
              )}
              {filters?.classification && (
                <li>
                  <strong>Classification:</strong> {filters.classification}
                </li>
              )}
              {filters?.income && (
                <li>
                  <strong>Income Range:</strong> {formatIncomeRange(filters.income)}
                </li>
              )}
              {filters?.water && (
                <li>
                  <strong>Water Source:</strong> {formatWaterFilter(filters.water)}
                </li>
              )}
              {filters?.electricity && (
                <li>
                  <strong>Electricity:</strong> {formatElectricityFilter(filters.electricity)}
                </li>
              )}
            </ul>
          </>
        ) : (
          <p className="metadata-all-data">All data included (no filters applied)</p>
        )}
      </div>

      {/* Inline styles for print-only visibility */}
      <style>{`
        /* Hide metadata on screen, show only in print */
        @media screen {
          .print-metadata {
            display: none !important;
          }
        }

        /* Show and style metadata in print mode */
        @media print {
          .print-metadata {
            display: block !important;
            margin-bottom: 20px;
            padding: 15px;
            border-bottom: 2px solid #333;
            page-break-after: avoid;
          }

          .metadata-header {
            margin-bottom: 15px;
          }

          .metadata-title {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 8px 0;
            color: #000;
          }

          .metadata-timestamp {
            font-size: 10pt;
            color: #666;
            margin: 0;
          }

          .metadata-filters {
            margin-top: 12px;
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

          .metadata-filters-list strong {
            font-weight: 600;
          }

          .metadata-all-data {
            font-size: 10pt;
            font-style: italic;
            color: #666;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
