/**
 * Paper Configuration Types
 * 
 * Defines TypeScript interfaces and types for paper size detection,
 * configuration, and print layout management.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

/**
 * Standard paper format types
 * Supports A4 (international), Letter (US), and Legal (US) paper sizes
 */
export type PaperFormat = 'A4' | 'Letter' | 'Legal';

/**
 * Paper dimensions and margins in millimeters
 * All measurements are in mm for consistency
 */
export interface PaperDimensions {
  /** Paper width in millimeters */
  width: number;
  
  /** Paper height in millimeters */
  height: number;
  
  /** Top margin in millimeters */
  marginTop: number;
  
  /** Right margin in millimeters */
  marginRight: number;
  
  /** Bottom margin in millimeters */
  marginBottom: number;
  
  /** Left margin in millimeters */
  marginLeft: number;
}

/**
 * Complete paper configuration including format, dimensions, and printable area
 */
export interface PaperConfiguration {
  /** Paper format type (A4, Letter, or Legal) */
  format: PaperFormat;
  
  /** Paper dimensions and margins */
  dimensions: PaperDimensions;
  
  /** Page orientation */
  orientation: 'portrait' | 'landscape';
  
  /** Calculated printable area (dimensions minus margins) */
  printableArea: {
    /** Printable width in millimeters */
    width: number;
    
    /** Printable height in millimeters */
    height: number;
  };
}

/**
 * Standard paper sizes with dimensions and margins
 * 
 * A4: 210mm × 297mm (international standard)
 * Letter: 215.9mm × 279.4mm (8.5in × 11in, US standard)
 * Legal: 215.9mm × 355.6mm (8.5in × 14in, US legal)
 * 
 * All dimensions are in millimeters for consistency
 */
export const PAPER_SIZES: Record<PaperFormat, PaperDimensions> = {
  A4: {
    width: 210,
    height: 297,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20
  },
  Letter: {
    width: 215.9,  // 8.5 inches converted to mm
    height: 279.4,  // 11 inches converted to mm
    marginTop: 19.05,  // 0.75 inches converted to mm
    marginRight: 19.05,
    marginBottom: 19.05,
    marginLeft: 19.05
  },
  Legal: {
    width: 215.9,  // 8.5 inches converted to mm
    height: 355.6,  // 14 inches converted to mm
    marginTop: 19.05,  // 0.75 inches converted to mm
    marginRight: 19.05,
    marginBottom: 19.05,
    marginLeft: 19.05
  }
};
