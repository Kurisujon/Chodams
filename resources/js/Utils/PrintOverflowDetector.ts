/**
 * PrintOverflowDetector
 * 
 * Utility for detecting content that exceeds page boundaries
 * and providing warnings/suggestions for print optimization
 * 
 * Requirements:
 * - 7.4: Display warnings if graphs exceed page boundaries or are truncated
 */

export interface PaperDimensions {
  width: number  // in mm
  height: number // in mm
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

export interface ContentDimensions {
  width: number  // in mm
  height: number // in mm
}

export interface OverflowWarning {
  type: 'width' | 'height' | 'both'
  severity: 'warning' | 'error'
  message: string
  suggestions: string[]
  contentId?: string
}

export const PAPER_SIZES: Record<string, PaperDimensions> = {
  A4: {
    width: 210,
    height: 297,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20
  },
  Letter: {
    width: 215.9,
    height: 279.4,
    marginTop: 19.05,
    marginRight: 19.05,
    marginBottom: 19.05,
    marginLeft: 19.05
  },
  Legal: {
    width: 215.9,
    height: 355.6,
    marginTop: 19.05,
    marginRight: 19.05,
    marginBottom: 19.05,
    marginLeft: 19.05
  }
}

export class PrintOverflowDetector {
  /**
   * Calculate printable area for a given paper size
   */
  static getPrintableArea(paperSize: string): ContentDimensions {
    const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4
    
    return {
      width: paper.width - paper.marginLeft - paper.marginRight,
      height: paper.height - paper.marginTop - paper.marginBottom
    }
  }

  /**
   * Check if content exceeds page boundaries
   */
  static checkOverflow(
    content: ContentDimensions,
    paperSize: string,
    contentId?: string
  ): OverflowWarning | null {
    const printableArea = this.getPrintableArea(paperSize)
    
    const widthExceeds = content.width > printableArea.width
    const heightExceeds = content.height > printableArea.height
    
    if (!widthExceeds && !heightExceeds) {
      return null
    }

    const type = widthExceeds && heightExceeds ? 'both' : widthExceeds ? 'width' : 'height'
    const severity = type === 'both' ? 'error' : 'warning'
    
    let message = ''
    const suggestions: string[] = []
    
    if (type === 'both') {
      message = `Content exceeds page boundaries in both width (${Math.round(content.width)}mm > ${Math.round(printableArea.width)}mm) and height (${Math.round(content.height)}mm > ${Math.round(printableArea.height)}mm)`
      suggestions.push('Use landscape orientation')
      suggestions.push('Select a larger paper format (Legal)')
      suggestions.push('Split content into multiple pages')
      suggestions.push('Reduce content size or complexity')
    } else if (type === 'width') {
      message = `Content width (${Math.round(content.width)}mm) exceeds printable area (${Math.round(printableArea.width)}mm)`
      suggestions.push('Use landscape orientation')
      suggestions.push('Reduce chart width')
      suggestions.push('Select a larger paper format')
    } else {
      message = `Content height (${Math.round(content.height)}mm) exceeds printable area (${Math.round(printableArea.height)}mm)`
      suggestions.push('Content will be split across multiple pages')
      suggestions.push('Select a larger paper format (Legal)')
      suggestions.push('Reduce content height')
    }
    
    return {
      type,
      severity,
      message,
      suggestions,
      contentId
    }
  }

  /**
   * Check multiple content items for overflow
   */
  static checkMultipleOverflows(
    contents: Array<{ dimensions: ContentDimensions; id?: string }>,
    paperSize: string
  ): OverflowWarning[] {
    const warnings: OverflowWarning[] = []
    
    contents.forEach(content => {
      const warning = this.checkOverflow(content.dimensions, paperSize, content.id)
      if (warning) {
        warnings.push(warning)
      }
    })
    
    return warnings
  }

  /**
   * Estimate number of pages needed for content
   */
  static estimatePageCount(
    contents: ContentDimensions[],
    paperSize: string
  ): number {
    const printableArea = this.getPrintableArea(paperSize)
    
    let totalHeight = 0
    let pageCount = 1
    
    contents.forEach(content => {
      // Add spacing between sections
      const sectionHeight = content.height + 10 // 10mm spacing
      
      if (totalHeight + sectionHeight > printableArea.height) {
        // Need a new page
        pageCount++
        totalHeight = sectionHeight
      } else {
        totalHeight += sectionHeight
      }
    })
    
    return pageCount
  }

  /**
   * Get optimal paper size for content
   */
  static getOptimalPaperSize(content: ContentDimensions): string {
    // Try each paper size from smallest to largest
    const sizes = ['A4', 'Letter', 'Legal']
    
    for (const size of sizes) {
      const printableArea = this.getPrintableArea(size)
      if (content.width <= printableArea.width && content.height <= printableArea.height) {
        return size
      }
    }
    
    // If nothing fits, return Legal (largest)
    return 'Legal'
  }

  /**
   * Check if landscape orientation would help
   */
  static wouldLandscapeHelp(
    content: ContentDimensions,
    paperSize: string
  ): boolean {
    const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4
    
    // In landscape, width and height are swapped
    const landscapePrintableWidth = paper.height - paper.marginTop - paper.marginBottom
    const landscapePrintableHeight = paper.width - paper.marginLeft - paper.marginRight
    
    const portraitFits = content.width <= (paper.width - paper.marginLeft - paper.marginRight) &&
                         content.height <= (paper.height - paper.marginTop - paper.marginBottom)
    
    const landscapeFits = content.width <= landscapePrintableWidth &&
                          content.height <= landscapePrintableHeight
    
    return !portraitFits && landscapeFits
  }

  /**
   * Generate comprehensive print report
   */
  static generatePrintReport(
    contents: Array<{ dimensions: ContentDimensions; id?: string; title?: string }>,
    paperSize: string
  ): {
    warnings: OverflowWarning[]
    pageCount: number
    optimalPaperSize: string
    landscapeRecommended: boolean
    summary: string
  } {
    const warnings = this.checkMultipleOverflows(contents, paperSize)
    const pageCount = this.estimatePageCount(contents.map(c => c.dimensions), paperSize)
    
    // Find the largest content to determine optimal paper size
    const largestContent = contents.reduce((largest, current) => {
      const currentSize = current.dimensions.width * current.dimensions.height
      const largestSize = largest.dimensions.width * largest.dimensions.height
      return currentSize > largestSize ? current : largest
    }, contents[0])
    
    const optimalPaperSize = largestContent ? this.getOptimalPaperSize(largestContent.dimensions) : paperSize
    const landscapeRecommended = largestContent ? this.wouldLandscapeHelp(largestContent.dimensions, paperSize) : false
    
    let summary = `Print report: ${contents.length} section(s), estimated ${pageCount} page(s)`
    if (warnings.length > 0) {
      summary += `, ${warnings.length} warning(s)`
    }
    if (optimalPaperSize !== paperSize) {
      summary += `. Recommended paper size: ${optimalPaperSize}`
    }
    if (landscapeRecommended) {
      summary += `. Landscape orientation recommended`
    }
    
    return {
      warnings,
      pageCount,
      optimalPaperSize,
      landscapeRecommended,
      summary
    }
  }
}

export default PrintOverflowDetector
