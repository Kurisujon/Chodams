/**
 * GraphPrintAdapter Service
 * 
 * Adapts chart/graph rendering for print output with proper sizing and resolution.
 * Handles dimension calculation, aspect ratio preservation, and scaling for different
 * paper formats while maintaining minimum readable dimensions.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.3
 */

import { PaperFormat, PAPER_SIZES, PaperDimensions } from './PaperConfiguration';

/**
 * Chart dimensions with scale factor for high-DPI rendering
 */
export interface ChartDimensions {
  /** Chart width in millimeters */
  width: number;
  
  /** Chart height in millimeters */
  height: number;
  
  /** Scale factor for high-DPI rendering (e.g., 2 for 300 DPI) */
  scale: number;
}

/**
 * GraphPrintAdapter class
 * 
 * Responsible for:
 * - Calculating optimal chart dimensions for print based on paper format
 * - Maintaining aspect ratios to prevent stretching
 * - Ensuring minimum readable dimensions (100mm width minimum)
 * - Scaling charts proportionally when they exceed printable area
 */
export class GraphPrintAdapter {
  // Minimum dimensions to ensure readability (in mm)
  private static readonly MIN_WIDTH = 100;  // mm
  private static readonly MIN_HEIGHT = 60;  // mm
  
  // Reserved space for titles, legends, and labels (in mm)
  private static readonly RESERVED_HEIGHT = 40;  // mm
  
  // Percentage of printable width to use for charts
  private static readonly WIDTH_USAGE_RATIO = 0.9;  // 90%
  
  // Scale factor for high-DPI rendering (2x for 300 DPI equivalent)
  private static readonly DPI_SCALE = 2;

  /**
   * Calculate optimal dimensions for print based on paper format and aspect ratio
   * 
   * This method:
   * 1. Calculates the printable area (paper size minus margins)
   * 2. Reserves space for titles, legends, and labels
   * 3. Calculates chart dimensions maintaining the original aspect ratio
   * 4. Scales down if the chart exceeds available space
   * 5. Ensures minimum readable dimensions are maintained
   * 
   * Error Handling:
   * - Invalid paper format: Falls back to A4
   * - Invalid aspect ratio: Uses 16:9 as default
   * - Calculation errors: Returns safe minimum dimensions
   * 
   * @param paperFormat - The paper format (A4, Letter, or Legal)
   * @param chartType - The type of chart (for future optimization)
   * @param originalAspectRatio - The original width/height ratio of the chart
   * @returns ChartDimensions with width, height, and scale factor
   * 
   * Requirements:
   * - 2.1: Maintains original aspect ratio
   * - 2.2: Scales proportionally when exceeding printable width
   * - 2.3: Scales proportionally when exceeding printable height
   * - 2.4: Applies maximum width constraints based on paper format
   * - 2.5: Applies maximum height constraints based on paper format
   * - 4.3: Maintains minimum 100mm width
   */
  calculatePrintDimensions(
    paperFormat: PaperFormat,
    chartType: string,
    originalAspectRatio: number
  ): ChartDimensions {
    try {
      // Validate and sanitize inputs
      let validFormat = paperFormat;
      if (!PAPER_SIZES[paperFormat]) {
        console.warn(`Invalid paper format "${paperFormat}", falling back to A4`);
        validFormat = 'A4';
      }

      let validAspectRatio = originalAspectRatio;
      if (!originalAspectRatio || originalAspectRatio <= 0 || !isFinite(originalAspectRatio)) {
        console.warn(`Invalid aspect ratio ${originalAspectRatio}, using default 16:9`);
        validAspectRatio = 16 / 9; // Default to 16:9 aspect ratio
      }

      // Get paper dimensions for the specified format
      const paper: PaperDimensions = PAPER_SIZES[validFormat];
      
      // Calculate printable area (paper size minus margins)
      const printableWidth = paper.width - paper.marginLeft - paper.marginRight;
      const printableHeight = paper.height - paper.marginTop - paper.marginBottom;
      
      // Validate printable area
      if (printableWidth <= 0 || printableHeight <= 0) {
        console.error('Invalid printable area calculated:', { printableWidth, printableHeight });
        throw new Error('Invalid printable area');
      }

      // Reserve space for titles, legends, and labels
      const availableHeight = printableHeight - GraphPrintAdapter.RESERVED_HEIGHT;
      
      if (availableHeight <= 0) {
        console.error('No available height after reserving space for titles');
        throw new Error('Insufficient space for chart');
      }

      // Calculate initial chart dimensions
      // Start with 90% of printable width to leave some breathing room
      let chartWidth = printableWidth * GraphPrintAdapter.WIDTH_USAGE_RATIO;
      let chartHeight = chartWidth / validAspectRatio;
      
      // If height exceeds available space, scale down proportionally
      if (chartHeight > availableHeight) {
        chartHeight = availableHeight;
        chartWidth = chartHeight * validAspectRatio;
      }
      
      // Ensure minimum readable dimensions while maintaining aspect ratio
      // Strategy: Try to enforce minimums, but if that breaks aspect ratio or exceeds space,
      // prioritize aspect ratio and fitting on page
      
      const needsMinWidth = chartWidth < GraphPrintAdapter.MIN_WIDTH;
      const needsMinHeight = chartHeight < GraphPrintAdapter.MIN_HEIGHT;
      
      if (needsMinWidth || needsMinHeight) {
        // Calculate what dimensions would be if we enforced minimums
        const widthIfMinEnforced = GraphPrintAdapter.MIN_WIDTH;
        const heightFromMinWidth = widthIfMinEnforced / validAspectRatio;
        
        const heightIfMinEnforced = GraphPrintAdapter.MIN_HEIGHT;
        const widthFromMinHeight = heightIfMinEnforced * validAspectRatio;
        
        // Check which minimum enforcement would work better
        if (needsMinWidth && heightFromMinWidth <= availableHeight) {
          // We can enforce minimum width and maintain aspect ratio
          chartWidth = widthIfMinEnforced;
          chartHeight = heightFromMinWidth;
        } else if (needsMinHeight && widthFromMinHeight <= printableWidth) {
          // We can enforce minimum height and maintain aspect ratio
          chartHeight = heightIfMinEnforced;
          chartWidth = widthFromMinHeight;
        } else {
          // Can't enforce both minimums while maintaining aspect ratio and fitting on page
          // Prioritize aspect ratio and fitting on page over minimum dimensions
          // This handles extreme aspect ratios (very wide or very tall charts)
          
          // Try to get as close to minimums as possible while maintaining aspect ratio
          if (needsMinWidth) {
            // Try to use minimum width, but scale down if needed
            chartWidth = Math.min(GraphPrintAdapter.MIN_WIDTH, printableWidth);
            chartHeight = chartWidth / validAspectRatio;
            
            // If height still exceeds, scale down proportionally
            if (chartHeight > availableHeight) {
              chartHeight = availableHeight;
              chartWidth = chartHeight * validAspectRatio;
            }
          }
          
          if (needsMinHeight && chartHeight < GraphPrintAdapter.MIN_HEIGHT) {
            // Try to use minimum height, but scale down if needed
            chartHeight = Math.min(GraphPrintAdapter.MIN_HEIGHT, availableHeight);
            chartWidth = chartHeight * validAspectRatio;
            
            // If width exceeds, scale down proportionally
            if (chartWidth > printableWidth) {
              chartWidth = printableWidth;
              chartHeight = chartWidth / validAspectRatio;
            }
          }
        }
      }
      
      // Final safety check: ensure we don't exceed printable area
      // This maintains aspect ratio while ensuring we fit on the page
      if (chartWidth > printableWidth) {
        const scaleFactor = printableWidth / chartWidth;
        chartWidth = printableWidth;
        chartHeight = chartHeight * scaleFactor;
      }
      
      if (chartHeight > availableHeight) {
        const scaleFactor = availableHeight / chartHeight;
        chartHeight = availableHeight;
        chartWidth = chartWidth * scaleFactor;
      }

      // Validate final dimensions
      if (chartWidth <= 0 || chartHeight <= 0 || !isFinite(chartWidth) || !isFinite(chartHeight)) {
        console.error('Invalid final dimensions calculated:', { chartWidth, chartHeight });
        throw new Error('Invalid chart dimensions');
      }
      
      return {
        width: chartWidth,
        height: chartHeight,
        scale: GraphPrintAdapter.DPI_SCALE
      };
    } catch (error) {
      console.error('Error calculating print dimensions:', {
        paperFormat,
        chartType,
        originalAspectRatio,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return safe minimum dimensions as fallback
      return {
        width: GraphPrintAdapter.MIN_WIDTH,
        height: GraphPrintAdapter.MIN_HEIGHT,
        scale: GraphPrintAdapter.DPI_SCALE
      };
    }
  }

  /**
   * Maintain aspect ratio when fitting dimensions into available space
   * 
   * This helper method ensures that when a chart needs to be scaled to fit
   * within available space, it maintains its original proportions without
   * stretching or distorting.
   * 
   * @param availableWidth - Available width in millimeters
   * @param availableHeight - Available height in millimeters
   * @param originalRatio - Original width/height aspect ratio
   * @returns Object with fitted width and height maintaining aspect ratio
   * 
   * Requirements:
   * - 2.1: Maintains original aspect ratio
   * - 2.2: Scales proportionally when exceeding width
   * - 2.3: Scales proportionally when exceeding height
   */
  maintainAspectRatio(
    availableWidth: number,
    availableHeight: number,
    originalRatio: number
  ): { width: number; height: number } {
    // Start by trying to use full available width
    let width = availableWidth;
    let height = width / originalRatio;
    
    // If height exceeds available space, scale down based on height instead
    if (height > availableHeight) {
      height = availableHeight;
      width = height * originalRatio;
    }
    
    return { width, height };
  }

  /**
   * Calculate printable area for a given paper format
   * 
   * Returns the usable area after subtracting margins from paper dimensions.
   * This is useful for determining maximum chart sizes and layout constraints.
   * 
   * @param paperFormat - The paper format (A4, Letter, or Legal)
   * @returns Object with printable width and height in millimeters
   */
  getPrintableArea(paperFormat: PaperFormat): { width: number; height: number } {
    const paper: PaperDimensions = PAPER_SIZES[paperFormat];
    
    return {
      width: paper.width - paper.marginLeft - paper.marginRight,
      height: paper.height - paper.marginTop - paper.marginBottom
    };
  }

  /**
   * Get maximum chart dimensions for a given paper format
   * 
   * Returns the maximum dimensions a chart can have while fitting on the page
   * and leaving space for titles, legends, and labels.
   * 
   * @param paperFormat - The paper format (A4, Letter, or Legal)
   * @returns Object with maximum width and height in millimeters
   */
  getMaxChartDimensions(paperFormat: PaperFormat): { width: number; height: number } {
    const printableArea = this.getPrintableArea(paperFormat);
    
    return {
      width: printableArea.width * GraphPrintAdapter.WIDTH_USAGE_RATIO,
      height: printableArea.height - GraphPrintAdapter.RESERVED_HEIGHT
    };
  }

  /**
   * Get minimum chart dimensions for readability
   * 
   * Returns the minimum dimensions that ensure charts remain readable
   * when printed, even with sparse data.
   * 
   * @returns Object with minimum width and height in millimeters
   * 
   * Requirements:
   * - 4.3: Minimum 100mm width for readability
   */
  getMinChartDimensions(): { width: number; height: number } {
    return {
      width: GraphPrintAdapter.MIN_WIDTH,
      height: GraphPrintAdapter.MIN_HEIGHT
    };
  }

  /**
   * Calculate scale factor for high-DPI rendering
   * 
   * Returns the scale factor to use for rendering charts at print quality
   * (300 DPI equivalent).
   * 
   * @returns Scale factor (2 for 300 DPI)
   */
  getScaleFactor(): number {
    return GraphPrintAdapter.DPI_SCALE;
  }
}

// Export singleton instance for convenience
export const graphPrintAdapter = new GraphPrintAdapter();

// Export class for testing and custom instances
export default GraphPrintAdapter;
