/**
 * Unit Tests for GraphPrintAdapter
 * 
 * Tests the GraphPrintAdapter class functionality including:
 * - Dimension calculation for different paper formats
 * - Aspect ratio preservation
 * - Minimum dimension constraints
 * - Printable area calculations
 * - Scaling logic
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphPrintAdapter } from '../Services/GraphPrintAdapter';
import { PAPER_SIZES } from '../Services/PaperConfiguration';

describe('GraphPrintAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new GraphPrintAdapter();
  });

  describe('calculatePrintDimensions()', () => {
    describe('Aspect ratio preservation (Requirement 2.1)', () => {
      it('should maintain aspect ratio for standard 16:9 chart on A4', () => {
        const aspectRatio = 16 / 9;
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', aspectRatio);
        
        const calculatedRatio = dimensions.width / dimensions.height;
        const tolerance = 0.01; // 1% tolerance
        
        expect(Math.abs(calculatedRatio - aspectRatio)).toBeLessThanOrEqual(tolerance * aspectRatio);
      });

      it('should maintain aspect ratio for square chart (1:1) on Letter', () => {
        const aspectRatio = 1;
        const dimensions = adapter.calculatePrintDimensions('Letter', 'bar', aspectRatio);
        
        const calculatedRatio = dimensions.width / dimensions.height;
        const tolerance = 0.01;
        
        expect(Math.abs(calculatedRatio - aspectRatio)).toBeLessThanOrEqual(tolerance * aspectRatio);
      });

      it('should maintain aspect ratio for wide chart (3:1) on Legal', () => {
        const aspectRatio = 3;
        const dimensions = adapter.calculatePrintDimensions('Legal', 'area', aspectRatio);
        
        const calculatedRatio = dimensions.width / dimensions.height;
        const tolerance = 0.01;
        
        expect(Math.abs(calculatedRatio - aspectRatio)).toBeLessThanOrEqual(tolerance * aspectRatio);
      });

      it('should maintain aspect ratio for tall chart (1:2) on A4', () => {
        const aspectRatio = 0.5; // 1:2 ratio
        const dimensions = adapter.calculatePrintDimensions('A4', 'bar', aspectRatio);
        
        const calculatedRatio = dimensions.width / dimensions.height;
        const tolerance = 0.01;
        
        expect(Math.abs(calculatedRatio - aspectRatio)).toBeLessThanOrEqual(tolerance * aspectRatio);
      });
    });

    describe('Printable area constraints (Requirements 2.2, 2.3)', () => {
      it('should not exceed printable width for A4', () => {
        const paper = PAPER_SIZES.A4;
        const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
        
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', 2);
        
        expect(dimensions.width).toBeLessThanOrEqual(printableWidth);
      });

      it('should not exceed printable width for Letter', () => {
        const paper = PAPER_SIZES.Letter;
        const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
        
        const dimensions = adapter.calculatePrintDimensions('Letter', 'bar', 2);
        
        expect(dimensions.width).toBeLessThanOrEqual(printableWidth);
      });

      it('should not exceed printable width for Legal', () => {
        const paper = PAPER_SIZES.Legal;
        const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
        
        const dimensions = adapter.calculatePrintDimensions('Legal', 'area', 2);
        
        expect(dimensions.width).toBeLessThanOrEqual(printableWidth);
      });

      it('should not exceed available height (printable height minus reserved space)', () => {
        const paper = PAPER_SIZES.A4;
        const printableHeight = paper.height - paper.marginTop - paper.marginBottom;
        const reservedHeight = 40; // From GraphPrintAdapter.RESERVED_HEIGHT
        const availableHeight = printableHeight - reservedHeight;
        
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', 0.5); // Tall chart
        
        expect(dimensions.height).toBeLessThanOrEqual(availableHeight);
      });

      it('should scale down wide charts that exceed printable width', () => {
        // Very wide aspect ratio that would exceed printable width
        const aspectRatio = 10; // 10:1 ratio
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', aspectRatio);
        
        const paper = PAPER_SIZES.A4;
        const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
        
        expect(dimensions.width).toBeLessThanOrEqual(printableWidth);
        
        // Should still maintain aspect ratio
        const calculatedRatio = dimensions.width / dimensions.height;
        const tolerance = 0.01;
        expect(Math.abs(calculatedRatio - aspectRatio)).toBeLessThanOrEqual(tolerance * aspectRatio);
      });

      it('should scale down tall charts that exceed available height', () => {
        // Very tall aspect ratio that would exceed available height
        const aspectRatio = 0.1; // 1:10 ratio
        const dimensions = adapter.calculatePrintDimensions('A4', 'bar', aspectRatio);
        
        const paper = PAPER_SIZES.A4;
        const printableHeight = paper.height - paper.marginTop - paper.marginBottom;
        const reservedHeight = 40;
        const availableHeight = printableHeight - reservedHeight;
        
        expect(dimensions.height).toBeLessThanOrEqual(availableHeight);
        
        // Should still maintain aspect ratio
        const calculatedRatio = dimensions.width / dimensions.height;
        const tolerance = 0.01;
        expect(Math.abs(calculatedRatio - aspectRatio)).toBeLessThanOrEqual(tolerance * aspectRatio);
      });
    });

    describe('Maximum dimension constraints (Requirements 2.4, 2.5)', () => {
      it('should respect A4 maximum width constraint (170mm printable)', () => {
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', 2);
        expect(dimensions.width).toBeLessThanOrEqual(170); // 210 - 20 - 20
      });

      it('should respect Letter maximum width constraint (~177.8mm printable)', () => {
        const dimensions = adapter.calculatePrintDimensions('Letter', 'line', 2);
        expect(dimensions.width).toBeLessThanOrEqual(177.8);
      });

      it('should respect Legal maximum width constraint (~177.8mm printable)', () => {
        const dimensions = adapter.calculatePrintDimensions('Legal', 'line', 2);
        expect(dimensions.width).toBeLessThanOrEqual(177.8);
      });

      it('should respect A4 maximum height constraint (257mm printable, minus 40mm reserved)', () => {
        const dimensions = adapter.calculatePrintDimensions('A4', 'bar', 0.5);
        expect(dimensions.height).toBeLessThanOrEqual(217); // 257 - 40
      });

      it('should respect Letter maximum height constraint (~241.3mm printable, minus 40mm reserved)', () => {
        const dimensions = adapter.calculatePrintDimensions('Letter', 'bar', 0.5);
        expect(dimensions.height).toBeLessThanOrEqual(201.3); // 241.3 - 40
      });

      it('should respect Legal maximum height constraint (~317.5mm printable, minus 40mm reserved)', () => {
        const dimensions = adapter.calculatePrintDimensions('Legal', 'bar', 0.5);
        expect(dimensions.height).toBeLessThanOrEqual(277.5); // 317.5 - 40
      });
    });

    describe('Minimum dimension constraints (Requirement 4.3)', () => {
      it('should enforce minimum width of 100mm for reasonable aspect ratios', () => {
        // Realistic tall chart aspect ratio (portrait orientation)
        // This simulates a bar chart with few bars (sparse data)
        const aspectRatio = 0.7; // Slightly taller than wide
        const dimensions = adapter.calculatePrintDimensions('A4', 'bar', aspectRatio);
        
        expect(dimensions.width).toBeGreaterThanOrEqual(100);
      });

      it('should enforce minimum height of 60mm for reasonable aspect ratios', () => {
        // Realistic wide chart aspect ratio (landscape orientation)
        // This simulates a line chart with few data points
        const aspectRatio = 2.5; // Wider than tall
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', aspectRatio);
        
        expect(dimensions.height).toBeGreaterThanOrEqual(60);
      });

      it('should maintain minimum width even for filtered analytics with sparse data', () => {
        // Simulate sparse data scenario with realistic aspect ratio
        const aspectRatio = 0.5; // Taller than wide (portrait bar chart)
        const dimensions = adapter.calculatePrintDimensions('A4', 'bar', aspectRatio);
        
        expect(dimensions.width).toBeGreaterThanOrEqual(100);
      });

      it('should apply minimum dimensions to all paper formats with realistic ratios', () => {
        const formats = ['A4', 'Letter', 'Legal'];
        const aspectRatio = 0.8; // Realistic portrait ratio
        
        formats.forEach(format => {
          const dimensions = adapter.calculatePrintDimensions(format, 'bar', aspectRatio);
          expect(dimensions.width).toBeGreaterThanOrEqual(100);
          expect(dimensions.height).toBeGreaterThanOrEqual(60);
        });
      });
    });

    describe('Filtered analytics layout consistency (Requirements 4.1, 4.2)', () => {
      it('should apply identical constraint calculation for filtered and full analytics', () => {
        // Requirement 4.1: Same layout constraints for filtered analytics
        // The adapter doesn't distinguish between filtered and full data - it applies
        // the same constraint calculation logic based on paper format and aspect ratio
        
        const paperFormat = 'A4';
        const chartType = 'bar';
        const aspectRatio = 1.5;
        
        // Simulate "full analytics" render
        const fullAnalyticsDimensions = adapter.calculatePrintDimensions(
          paperFormat,
          chartType,
          aspectRatio
        );
        
        // Simulate "filtered analytics" render with same parameters
        // (In reality, filtered data would have the same aspect ratio if it's the same chart type)
        const filteredAnalyticsDimensions = adapter.calculatePrintDimensions(
          paperFormat,
          chartType,
          aspectRatio
        );
        
        // Should produce identical results - same constraint calculation
        expect(filteredAnalyticsDimensions.width).toBe(fullAnalyticsDimensions.width);
        expect(filteredAnalyticsDimensions.height).toBe(fullAnalyticsDimensions.height);
        expect(filteredAnalyticsDimensions.scale).toBe(fullAnalyticsDimensions.scale);
      });

      it('should maintain proportional scaling for sparse data without stretching', () => {
        // Requirement 4.2: Proportional scaling for sparse data
        // When filtered analytics have fewer data points, the aspect ratio changes
        // but the adapter maintains proportional dimensions without stretching
        
        const paperFormat = 'A4';
        const chartType = 'bar';
        
        // Simulate full analytics with many data points (wider chart)
        const fullDataAspectRatio = 2.0; // Wide chart
        const fullDimensions = adapter.calculatePrintDimensions(
          paperFormat,
          chartType,
          fullDataAspectRatio
        );
        
        // Simulate filtered analytics with fewer data points (narrower chart)
        const sparseDataAspectRatio = 0.8; // Narrower due to fewer bars
        const sparseDimensions = adapter.calculatePrintDimensions(
          paperFormat,
          chartType,
          sparseDataAspectRatio
        );
        
        // Both should maintain their respective aspect ratios (no stretching)
        const fullCalculatedRatio = fullDimensions.width / fullDimensions.height;
        const sparseCalculatedRatio = sparseDimensions.width / sparseDimensions.height;
        
        const tolerance = 0.01; // 1% tolerance
        expect(Math.abs(fullCalculatedRatio - fullDataAspectRatio))
          .toBeLessThanOrEqual(tolerance * fullDataAspectRatio);
        expect(Math.abs(sparseCalculatedRatio - sparseDataAspectRatio))
          .toBeLessThanOrEqual(tolerance * sparseDataAspectRatio);
        
        // Sparse data should still meet minimum dimensions
        expect(sparseDimensions.width).toBeGreaterThanOrEqual(100);
        expect(sparseDimensions.height).toBeGreaterThanOrEqual(60);
      });

      it('should apply same paper format constraints regardless of data density', () => {
        // Requirement 4.1: Same layout constraints
        // Paper format constraints should be applied consistently
        
        const paperFormat = 'Letter';
        const paper = PAPER_SIZES[paperFormat];
        const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
        const printableHeight = paper.height - paper.marginTop - paper.marginBottom;
        const availableHeight = printableHeight - 40; // Reserved space
        
        // Test with different data densities (different aspect ratios)
        const aspectRatios = [0.5, 1.0, 1.5, 2.0, 2.5]; // Sparse to dense
        
        aspectRatios.forEach(ratio => {
          const dimensions = adapter.calculatePrintDimensions(paperFormat, 'bar', ratio);
          
          // All should respect the same paper format constraints
          expect(dimensions.width).toBeLessThanOrEqual(printableWidth);
          expect(dimensions.height).toBeLessThanOrEqual(availableHeight);
          
          // All should use the same scale factor
          expect(dimensions.scale).toBe(2);
        });
      });

      it('should maintain minimum readable dimensions for very sparse filtered data', () => {
        // Requirement 4.2: Proportional scaling with minimum dimensions
        // Even with very sparse data (few data points), charts should remain readable
        
        const paperFormat = 'A4';
        const chartType = 'bar';
        
        // Simulate sparse data with realistic aspect ratio (e.g., 3-5 bars)
        const sparseAspectRatio = 0.6; // Narrower chart due to fewer bars
        const dimensions = adapter.calculatePrintDimensions(
          paperFormat,
          chartType,
          sparseAspectRatio
        );
        
        // Should enforce minimum width for readability
        expect(dimensions.width).toBeGreaterThanOrEqual(100);
        
        // Should still maintain proportional scaling (aspect ratio preserved)
        const calculatedRatio = dimensions.width / dimensions.height;
        const tolerance = 0.01;
        expect(Math.abs(calculatedRatio - sparseAspectRatio))
          .toBeLessThanOrEqual(tolerance * sparseAspectRatio);
      });

      it('should apply consistent constraint logic across all paper formats for filtered data', () => {
        // Requirement 4.1: Same layout constraints
        // Filtered analytics should use the same constraint calculation on all paper formats
        
        const formats = ['A4', 'Letter', 'Legal'];
        const sparseDataAspectRatio = 0.6; // Simulates filtered data with fewer points
        
        formats.forEach(format => {
          const dimensions = adapter.calculatePrintDimensions(format, 'bar', sparseDataAspectRatio);
          const paper = PAPER_SIZES[format];
          const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
          const printableHeight = paper.height - paper.marginTop - paper.marginBottom;
          const availableHeight = printableHeight - 40;
          
          // Should respect paper format constraints
          expect(dimensions.width).toBeLessThanOrEqual(printableWidth);
          expect(dimensions.height).toBeLessThanOrEqual(availableHeight);
          
          // Should maintain minimum dimensions
          expect(dimensions.width).toBeGreaterThanOrEqual(100);
          expect(dimensions.height).toBeGreaterThanOrEqual(60);
          
          // Should maintain aspect ratio
          const calculatedRatio = dimensions.width / dimensions.height;
          const tolerance = 0.01;
          expect(Math.abs(calculatedRatio - sparseDataAspectRatio))
            .toBeLessThanOrEqual(tolerance * sparseDataAspectRatio);
        });
      });
    });

    describe('Scale factor for high-DPI rendering', () => {
      it('should return scale factor of 2 for 300 DPI equivalent', () => {
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', 1.5);
        expect(dimensions.scale).toBe(2);
      });

      it('should apply consistent scale factor across all paper formats', () => {
        const formats = ['A4', 'Letter', 'Legal'];
        
        formats.forEach(format => {
          const dimensions = adapter.calculatePrintDimensions(format, 'line', 1.5);
          expect(dimensions.scale).toBe(2);
        });
      });
    });

    describe('Different chart types', () => {
      it('should handle line charts', () => {
        const dimensions = adapter.calculatePrintDimensions('A4', 'line', 1.5);
        expect(dimensions.width).toBeGreaterThan(0);
        expect(dimensions.height).toBeGreaterThan(0);
      });

      it('should handle bar charts', () => {
        const dimensions = adapter.calculatePrintDimensions('A4', 'bar', 1.5);
        expect(dimensions.width).toBeGreaterThan(0);
        expect(dimensions.height).toBeGreaterThan(0);
      });

      it('should handle pie charts', () => {
        const dimensions = adapter.calculatePrintDimensions('A4', 'pie', 1);
        expect(dimensions.width).toBeGreaterThan(0);
        expect(dimensions.height).toBeGreaterThan(0);
      });

      it('should handle area charts', () => {
        const dimensions = adapter.calculatePrintDimensions('A4', 'area', 1.5);
        expect(dimensions.width).toBeGreaterThan(0);
        expect(dimensions.height).toBeGreaterThan(0);
      });
    });
  });

  describe('maintainAspectRatio()', () => {
    it('should maintain aspect ratio when fitting within available space', () => {
      const availableWidth = 150;
      const availableHeight = 100;
      const aspectRatio = 2; // 2:1 ratio
      
      const result = adapter.maintainAspectRatio(availableWidth, availableHeight, aspectRatio);
      
      const calculatedRatio = result.width / result.height;
      expect(calculatedRatio).toBeCloseTo(aspectRatio, 2);
    });

    it('should scale based on width when height fits', () => {
      const availableWidth = 100;
      const availableHeight = 100;
      const aspectRatio = 2; // 2:1 ratio (width > height)
      
      const result = adapter.maintainAspectRatio(availableWidth, availableHeight, aspectRatio);
      
      expect(result.width).toBe(availableWidth);
      expect(result.height).toBe(availableWidth / aspectRatio);
    });

    it('should scale based on height when width would exceed available space', () => {
      const availableWidth = 50;
      const availableHeight = 100;
      const aspectRatio = 2; // 2:1 ratio
      
      const result = adapter.maintainAspectRatio(availableWidth, availableHeight, aspectRatio);
      
      // Should use height as constraint since width-based would exceed
      expect(result.height).toBeLessThanOrEqual(availableHeight);
      expect(result.width).toBeLessThanOrEqual(availableWidth);
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2);
    });

    it('should handle square aspect ratio (1:1)', () => {
      const availableWidth = 100;
      const availableHeight = 100;
      const aspectRatio = 1;
      
      const result = adapter.maintainAspectRatio(availableWidth, availableHeight, aspectRatio);
      
      expect(result.width).toBe(result.height);
    });

    it('should handle tall aspect ratios (height > width)', () => {
      const availableWidth = 100;
      const availableHeight = 100;
      const aspectRatio = 0.5; // 1:2 ratio (height > width)
      
      const result = adapter.maintainAspectRatio(availableWidth, availableHeight, aspectRatio);
      
      expect(result.height).toBeGreaterThan(result.width);
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2);
    });
  });

  describe('getPrintableArea()', () => {
    it('should calculate correct printable area for A4', () => {
      const printableArea = adapter.getPrintableArea('A4');
      
      expect(printableArea.width).toBe(170); // 210 - 20 - 20
      expect(printableArea.height).toBe(257); // 297 - 20 - 20
    });

    it('should calculate correct printable area for Letter', () => {
      const printableArea = adapter.getPrintableArea('Letter');
      
      expect(printableArea.width).toBeCloseTo(177.8, 1); // 215.9 - 19.05 - 19.05
      expect(printableArea.height).toBeCloseTo(241.3, 1); // 279.4 - 19.05 - 19.05
    });

    it('should calculate correct printable area for Legal', () => {
      const printableArea = adapter.getPrintableArea('Legal');
      
      expect(printableArea.width).toBeCloseTo(177.8, 1); // 215.9 - 19.05 - 19.05
      expect(printableArea.height).toBeCloseTo(317.5, 1); // 355.6 - 19.05 - 19.05
    });

    it('should return positive values for all paper formats', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        const printableArea = adapter.getPrintableArea(format);
        expect(printableArea.width).toBeGreaterThan(0);
        expect(printableArea.height).toBeGreaterThan(0);
      });
    });
  });

  describe('getMaxChartDimensions()', () => {
    it('should return max dimensions that account for reserved space', () => {
      const maxDimensions = adapter.getMaxChartDimensions('A4');
      const printableArea = adapter.getPrintableArea('A4');
      
      // Width should be 90% of printable width
      expect(maxDimensions.width).toBeCloseTo(printableArea.width * 0.9, 1);
      
      // Height should be printable height minus 40mm reserved
      expect(maxDimensions.height).toBe(printableArea.height - 40);
    });

    it('should return smaller max width than printable width (90% usage)', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        const maxDimensions = adapter.getMaxChartDimensions(format);
        const printableArea = adapter.getPrintableArea(format);
        
        expect(maxDimensions.width).toBeLessThan(printableArea.width);
        expect(maxDimensions.width).toBeCloseTo(printableArea.width * 0.9, 1);
      });
    });

    it('should reserve 40mm height for titles and legends', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        const maxDimensions = adapter.getMaxChartDimensions(format);
        const printableArea = adapter.getPrintableArea(format);
        
        expect(maxDimensions.height).toBe(printableArea.height - 40);
      });
    });
  });

  describe('getMinChartDimensions()', () => {
    it('should return minimum width of 100mm', () => {
      const minDimensions = adapter.getMinChartDimensions();
      expect(minDimensions.width).toBe(100);
    });

    it('should return minimum height of 60mm', () => {
      const minDimensions = adapter.getMinChartDimensions();
      expect(minDimensions.height).toBe(60);
    });

    it('should return consistent values across multiple calls', () => {
      const min1 = adapter.getMinChartDimensions();
      const min2 = adapter.getMinChartDimensions();
      
      expect(min1.width).toBe(min2.width);
      expect(min1.height).toBe(min2.height);
    });
  });

  describe('getScaleFactor()', () => {
    it('should return scale factor of 2 for 300 DPI', () => {
      const scaleFactor = adapter.getScaleFactor();
      expect(scaleFactor).toBe(2);
    });

    it('should return consistent value across multiple calls', () => {
      const scale1 = adapter.getScaleFactor();
      const scale2 = adapter.getScaleFactor();
      
      expect(scale1).toBe(scale2);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very small aspect ratios', () => {
      // Extreme but still somewhat realistic aspect ratio (very tall chart)
      const dimensions = adapter.calculatePrintDimensions('A4', 'bar', 0.3);
      
      // Should still produce valid dimensions that fit on page
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.height).toBeLessThanOrEqual(217); // Available height for A4
    });

    it('should handle very large aspect ratios', () => {
      // Extreme but still somewhat realistic aspect ratio (very wide chart)
      const dimensions = adapter.calculatePrintDimensions('A4', 'line', 4);
      
      // Should still produce valid dimensions that fit on page
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.width).toBeLessThanOrEqual(170); // Printable width for A4
    });

    it('should handle aspect ratio of exactly 1', () => {
      const dimensions = adapter.calculatePrintDimensions('A4', 'pie', 1);
      
      expect(dimensions.width).toBeCloseTo(dimensions.height, 1);
    });

    it('should produce valid dimensions for all combinations of paper formats and aspect ratios', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      const aspectRatios = [0.5, 1, 1.5, 2, 3];
      
      formats.forEach(format => {
        aspectRatios.forEach(ratio => {
          const dimensions = adapter.calculatePrintDimensions(format, 'line', ratio);
          
          expect(dimensions.width).toBeGreaterThan(0);
          expect(dimensions.height).toBeGreaterThan(0);
          expect(dimensions.scale).toBe(2);
          
          // Should maintain aspect ratio
          const calculatedRatio = dimensions.width / dimensions.height;
          const tolerance = 0.01;
          expect(Math.abs(calculatedRatio - ratio)).toBeLessThanOrEqual(tolerance * ratio);
        });
      });
    });
  });

  describe('Integration with PaperConfiguration', () => {
    it('should use correct paper dimensions from PAPER_SIZES', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        const dimensions = adapter.calculatePrintDimensions(format, 'line', 1.5);
        const paper = PAPER_SIZES[format];
        const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
        
        // Chart width should not exceed printable width
        expect(dimensions.width).toBeLessThanOrEqual(printableWidth);
      });
    });

    it('should respect margin constraints from PAPER_SIZES', () => {
      const formats = ['A4', 'Letter', 'Legal'];
      
      formats.forEach(format => {
        const printableArea = adapter.getPrintableArea(format);
        const paper = PAPER_SIZES[format];
        
        const expectedWidth = paper.width - paper.marginLeft - paper.marginRight;
        const expectedHeight = paper.height - paper.marginTop - paper.marginBottom;
        
        expect(printableArea.width).toBeCloseTo(expectedWidth, 1);
        expect(printableArea.height).toBeCloseTo(expectedHeight, 1);
      });
    });
  });
});
