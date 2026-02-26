/**
 * Unit tests for PrintMetadata component
 * 
 * Tests cover:
 * - Basic rendering with title and timestamp
 * - Filter display (individual and combined)
 * - "All data included" message when no filters
 * - Print-only visibility (hidden on screen)
 * - Edge cases and error handling
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrintMetadata from '../Components/PrintMetadata';
import { FilterState } from '../Services/PrintHandlerService';

describe('PrintMetadata Component', () => {
  describe('Basic Rendering', () => {
    it('renders with title', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const title = container.querySelector('.metadata-title');
      expect(title).toHaveTextContent('Test Report');
    });

    it('renders with default timestamp', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const timestamp = container.querySelector('.metadata-timestamp');
      expect(timestamp).toHaveTextContent('Generated:');
    });

    it('renders with custom timestamp', () => {
      const customDate = new Date('2024-01-15T10:30:00');
      const { container } = render(
        <PrintMetadata title="Test Report" timestamp={customDate} />
      );
      
      const timestamp = container.querySelector('.metadata-timestamp');
      expect(timestamp).toHaveTextContent('Generated:');
      expect(timestamp).toHaveTextContent('January 15, 2024');
    });

    it('has print-metadata data attribute', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const metadata = container.querySelector('[data-print-metadata="true"]');
      expect(metadata).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" className="custom-class" />
      );
      
      const metadata = container.querySelector('.print-metadata');
      expect(metadata).toHaveClass('custom-class');
    });
  });

  describe('Filter Display - No Filters', () => {
    it('shows "All data included" when no filters provided', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const allDataMessage = container.querySelector('.metadata-all-data');
      expect(allDataMessage).toHaveTextContent('All data included (no filters applied)');
    });

    it('shows "All data included" when filters object is empty', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" filters={{}} />
      );
      
      const allDataMessage = container.querySelector('.metadata-all-data');
      expect(allDataMessage).toHaveTextContent('All data included (no filters applied)');
    });

    it('does not show filter list when no filters', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).not.toBeInTheDocument();
    });
  });

  describe('Filter Display - Individual Filters', () => {
    it('displays barangay filter', () => {
      const filters: FilterState = {
        barangay: 'Zone_I'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Barangay:');
      expect(filterList).toHaveTextContent('Zone I');
    });

    it('displays classification filter', () => {
      const filters: FilterState = {
        classification: 'Displaced'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Classification:');
      expect(filterList).toHaveTextContent('Displaced');
    });

    it('displays income filter with formatted range', () => {
      const filters: FilterState = {
        income: '3000_5999'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Income Range:');
      expect(filterList).toHaveTextContent('₱3,000 - ₱5,999');
    });

    it('displays water filter with formatted text', () => {
      const filters: FilterState = {
        water: 'has'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Water Source:');
      expect(filterList).toHaveTextContent('With water source');
    });

    it('displays electricity filter with formatted text', () => {
      const filters: FilterState = {
        electricity: 'none'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Electricity:');
      expect(filterList).toHaveTextContent('No electricity');
    });
  });

  describe('Filter Display - Multiple Filters', () => {
    it('displays all filters when multiple are provided', () => {
      const filters: FilterState = {
        barangay: 'Zone_II',
        classification: 'Homeless',
        income: '0_2999',
        water: 'none',
        electricity: 'has'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Barangay:');
      expect(filterList).toHaveTextContent('Zone II');
      expect(filterList).toHaveTextContent('Classification:');
      expect(filterList).toHaveTextContent('Homeless');
      expect(filterList).toHaveTextContent('Income Range:');
      expect(filterList).toHaveTextContent('₱0 - ₱2,999');
      expect(filterList).toHaveTextContent('Water Source:');
      expect(filterList).toHaveTextContent('No water source');
      expect(filterList).toHaveTextContent('Electricity:');
      expect(filterList).toHaveTextContent('With electricity');
    });

    it('shows filter title when filters are present', () => {
      const filters: FilterState = {
        barangay: 'Zone_I'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterTitle = container.querySelector('.metadata-filters-title');
      expect(filterTitle).toHaveTextContent('Applied Filters:');
    });

    it('does not show "All data included" when filters are present', () => {
      const filters: FilterState = {
        barangay: 'Zone_I'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const allDataMessage = container.querySelector('.metadata-all-data');
      expect(allDataMessage).not.toBeInTheDocument();
    });
  });

  describe('Filter Formatting', () => {
    it('formats barangay with underscores replaced by spaces', () => {
      const filters: FilterState = {
        barangay: 'Zone_III_A'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Zone III A');
      expect(filterList).not.toHaveTextContent('Zone_III_A');
    });

    it('formats all income ranges correctly', () => {
      const incomeRanges = [
        { value: '0_2999', expected: '₱0 - ₱2,999' },
        { value: '3000_5999', expected: '₱3,000 - ₱5,999' },
        { value: '6000_8999', expected: '₱6,000 - ₱8,999' },
        { value: '9000_12999', expected: '₱9,000 - ₱12,999' },
        { value: '13000_plus', expected: '₱13,000+' }
      ];

      incomeRanges.forEach(({ value, expected }) => {
        const { container } = render(
          <PrintMetadata title="Test Report" filters={{ income: value }} />
        );
        
        const filterList = container.querySelector('.metadata-filters-list');
        expect(filterList).toHaveTextContent(expected);
      });
    });

    it('formats water filter values correctly', () => {
      const waterValues = [
        { value: 'has', expected: 'With water source' },
        { value: 'none', expected: 'No water source' }
      ];

      waterValues.forEach(({ value, expected }) => {
        const { container } = render(
          <PrintMetadata title="Test Report" filters={{ water: value }} />
        );
        
        const filterList = container.querySelector('.metadata-filters-list');
        expect(filterList).toHaveTextContent(expected);
      });
    });

    it('formats electricity filter values correctly', () => {
      const electricityValues = [
        { value: 'has', expected: 'With electricity' },
        { value: 'none', expected: 'No electricity' }
      ];

      electricityValues.forEach(({ value, expected }) => {
        const { container } = render(
          <PrintMetadata title="Test Report" filters={{ electricity: value }} />
        );
        
        const filterList = container.querySelector('.metadata-filters-list');
        expect(filterList).toHaveTextContent(expected);
      });
    });

    it('handles unknown income range values', () => {
      const filters: FilterState = {
        income: 'unknown_range'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('unknown_range');
    });
  });

  describe('Print-Only Visibility', () => {
    it('has print-metadata class', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const metadata = container.querySelector('.print-metadata');
      expect(metadata).toBeInTheDocument();
    });

    it('includes style tag for print media queries', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('@media screen');
      expect(styleTag?.textContent).toContain('@media print');
    });

    it('has display none for screen in styles', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('display: none !important');
    });

    it('has display block for print in styles', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" />
      );
      
      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('display: block !important');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string title', () => {
      const { container } = render(
        <PrintMetadata title="" />
      );
      
      const title = container.querySelector('.metadata-title');
      expect(title).toHaveTextContent('');
    });

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(200);
      const { container } = render(
        <PrintMetadata title={longTitle} />
      );
      
      const title = container.querySelector('.metadata-title');
      expect(title).toHaveTextContent(longTitle);
    });

    it('handles special characters in title', () => {
      const specialTitle = 'Report <>&"\'';
      const { container } = render(
        <PrintMetadata title={specialTitle} />
      );
      
      const title = container.querySelector('.metadata-title');
      expect(title).toHaveTextContent(specialTitle);
    });

    it('handles filters with undefined values', () => {
      const filters: FilterState = {
        barangay: undefined,
        classification: 'Displaced'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).not.toHaveTextContent('Barangay:');
      expect(filterList).toHaveTextContent('Classification:');
    });

    it('handles filters with empty string values', () => {
      const filters: FilterState = {
        barangay: '',
        classification: 'Displaced'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).not.toHaveTextContent('Barangay:');
      expect(filterList).toHaveTextContent('Classification:');
    });

    it('handles invalid date object', () => {
      const invalidDate = new Date('invalid');
      const { container } = render(
        <PrintMetadata title="Test Report" timestamp={invalidDate} />
      );
      
      const timestamp = container.querySelector('.metadata-timestamp');
      expect(timestamp).toBeInTheDocument();
      // Should not crash, even with invalid date
    });
  });

  describe('Requirement Validation', () => {
    it('validates Requirement 5.1: includes generation timestamp', () => {
      const testDate = new Date('2024-01-15T14:30:00');
      const { container } = render(
        <PrintMetadata title="Test Report" timestamp={testDate} />
      );
      
      const timestamp = container.querySelector('.metadata-timestamp');
      expect(timestamp).toHaveTextContent('Generated:');
      expect(timestamp).toHaveTextContent('January 15, 2024');
    });

    it('validates Requirement 5.2: includes applied filter values', () => {
      const filters: FilterState = {
        barangay: 'Zone_I',
        classification: 'Displaced',
        income: '3000_5999'
      };
      
      const { container } = render(
        <PrintMetadata title="Test Report" filters={filters} />
      );
      
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Zone I');
      expect(filterList).toHaveTextContent('Displaced');
      expect(filterList).toHaveTextContent('₱3,000 - ₱5,999');
    });

    it('validates Requirement 5.3: includes document title', () => {
      const { container } = render(
        <PrintMetadata title="Classification Summary by Year" />
      );
      
      const title = container.querySelector('.metadata-title');
      expect(title).toHaveTextContent('Classification Summary by Year');
    });

    it('validates Requirement 5.4: shows "All data included" when no filters', () => {
      const { container } = render(
        <PrintMetadata title="Test Report" filters={{}} />
      );
      
      const allDataMessage = container.querySelector('.metadata-all-data');
      expect(allDataMessage).toHaveTextContent('All data included (no filters applied)');
    });

    it('validates all requirements together', () => {
      const testDate = new Date('2024-01-15T14:30:00');
      const filters: FilterState = {
        barangay: 'Zone_II',
        classification: 'Homeless'
      };
      
      const { container } = render(
        <PrintMetadata 
          title="Filtered Analytics Report" 
          timestamp={testDate}
          filters={filters}
        />
      );
      
      // Requirement 5.3: Document title
      const title = container.querySelector('.metadata-title');
      expect(title).toHaveTextContent('Filtered Analytics Report');
      
      // Requirement 5.1: Timestamp
      const timestamp = container.querySelector('.metadata-timestamp');
      expect(timestamp).toHaveTextContent('Generated:');
      expect(timestamp).toHaveTextContent('January 15, 2024');
      
      // Requirement 5.2: Filter values
      const filterList = container.querySelector('.metadata-filters-list');
      expect(filterList).toHaveTextContent('Barangay:');
      expect(filterList).toHaveTextContent('Zone II');
      expect(filterList).toHaveTextContent('Classification:');
      expect(filterList).toHaveTextContent('Homeless');
      
      // Should not show "All data included" when filters are present
      const allDataMessage = container.querySelector('.metadata-all-data');
      expect(allDataMessage).not.toBeInTheDocument();
    });
  });
});
