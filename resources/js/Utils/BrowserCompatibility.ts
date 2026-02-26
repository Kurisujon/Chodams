/**
 * BrowserCompatibility Utility
 * 
 * Detects browser type/version and applies browser-specific workarounds
 * for print functionality
 * 
 * Requirements:
 * - 8.1: Support printing in Chrome, Firefox, Safari, and Edge
 * - 8.2: Apply browser-specific workarounds
 * - 8.4: Provide user guidance on recommended browser settings
 */

export interface BrowserInfo {
  name: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Unknown'
  version: number
  isSupported: boolean
  printSupport: 'full' | 'partial' | 'limited'
  knownIssues: string[]
  recommendations: string[]
}

export class BrowserCompatibility {
  private static browserInfo: BrowserInfo | null = null

  /**
   * Detect the current browser and version
   */
  static detectBrowser(): BrowserInfo {
    if (this.browserInfo) {
      return this.browserInfo
    }

    const userAgent = navigator.userAgent
    let name: BrowserInfo['name'] = 'Unknown'
    let version = 0
    let isSupported = false
    let printSupport: BrowserInfo['printSupport'] = 'limited'
    const knownIssues: string[] = []
    const recommendations: string[] = []

    // Detect Edge (must check before Chrome as Edge includes Chrome in UA)
    if (userAgent.indexOf('Edg/') > -1 || userAgent.indexOf('Edge/') > -1) {
      name = 'Edge'
      const match = userAgent.match(/Edg\/(\d+)/) || userAgent.match(/Edge\/(\d+)/)
      version = match ? parseInt(match[1], 10) : 0
      
      if (version >= 79) {
        // Chromium-based Edge
        isSupported = true
        printSupport = 'full'
      } else {
        // Legacy Edge
        isSupported = true
        printSupport = 'partial'
        knownIssues.push('Legacy Edge has limited CSS @page support')
        knownIssues.push('Some print styles may not render correctly')
        recommendations.push('Update to latest Edge version for best results')
      }
    }
    // Detect Chrome
    else if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
      name = 'Chrome'
      const match = userAgent.match(/Chrome\/(\d+)/)
      version = match ? parseInt(match[1], 10) : 0
      
      if (version >= 90) {
        isSupported = true
        printSupport = 'full'
      } else {
        isSupported = true
        printSupport = 'partial'
        knownIssues.push('Older Chrome versions may have print preview issues')
        recommendations.push('Update Chrome to version 90 or later')
      }
    }
    // Detect Firefox
    else if (userAgent.indexOf('Firefox') > -1) {
      name = 'Firefox'
      const match = userAgent.match(/Firefox\/(\d+)/)
      version = match ? parseInt(match[1], 10) : 0
      
      if (version >= 88) {
        isSupported = true
        printSupport = 'full'
        knownIssues.push('Firefox may render fonts slightly smaller than other browsers')
        recommendations.push('Check print preview before printing')
      } else {
        isSupported = true
        printSupport = 'partial'
        knownIssues.push('Older Firefox versions have limited @page size support')
        knownIssues.push('Page breaks may not work as expected')
        recommendations.push('Update Firefox to version 88 or later')
      }
    }
    // Detect Safari
    else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      name = 'Safari'
      const match = userAgent.match(/Version\/(\d+)/)
      version = match ? parseInt(match[1], 10) : 0
      
      if (version >= 14) {
        isSupported = true
        printSupport = 'partial'
        knownIssues.push('Safari has limited support for break-inside CSS property')
        knownIssues.push('Page breaks may not work perfectly')
        recommendations.push('Use Chrome or Firefox for best print results')
        recommendations.push('Enable "Print Backgrounds" in Safari print dialog')
      } else {
        isSupported = false
        printSupport = 'limited'
        knownIssues.push('Older Safari versions have poor print CSS support')
        knownIssues.push('Many print styles may not render correctly')
        recommendations.push('Update Safari to version 14 or later')
        recommendations.push('Consider using Chrome or Firefox for printing')
      }
    }

    this.browserInfo = {
      name,
      version,
      isSupported,
      printSupport,
      knownIssues,
      recommendations
    }

    return this.browserInfo
  }

  /**
   * Apply browser-specific workarounds
   */
  static applyWorkarounds(): void {
    const browser = this.detectBrowser()

    switch (browser.name) {
      case 'Firefox':
        this.applyFirefoxWorkarounds()
        break
      case 'Safari':
        this.applySafariWorkarounds()
        break
      case 'Edge':
        if (browser.version < 79) {
          this.applyLegacyEdgeWorkarounds()
        }
        break
      case 'Chrome':
        // Chrome generally works well, minimal workarounds needed
        break
    }
  }

  /**
   * Firefox-specific workarounds
   */
  private static applyFirefoxWorkarounds(): void {
    // Firefox renders fonts slightly smaller, so we adjust
    const style = document.createElement('style')
    style.setAttribute('data-browser-workaround', 'firefox')
    style.textContent = `
      @media print {
        @-moz-document url-prefix() {
          body {
            font-size: 11pt !important;
          }
          
          .chart-legend,
          .legend {
            font-size: 11pt !important;
          }
        }
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Safari-specific workarounds
   */
  private static applySafariWorkarounds(): void {
    // Safari needs explicit color adjustment
    const style = document.createElement('style')
    style.setAttribute('data-browser-workaround', 'safari')
    style.textContent = `
      @media print {
        @supports (-webkit-appearance: none) {
          * {
            -webkit-print-color-adjust: exact !important;
          }
          
          .chart-container,
          .graph-container,
          canvas,
          svg {
            -webkit-print-color-adjust: exact !important;
          }
          
          /* Safari has issues with break-inside, use page-break-inside instead */
          .chart-container,
          .analytics-section,
          .print-section {
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
        }
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Legacy Edge-specific workarounds
   */
  private static applyLegacyEdgeWorkarounds(): void {
    const style = document.createElement('style')
    style.setAttribute('data-browser-workaround', 'legacy-edge')
    style.textContent = `
      @media print {
        /* Legacy Edge needs explicit page size */
        @page {
          size: A4 portrait;
        }
        
        /* Force color printing */
        * {
          color-adjust: exact !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Remove all browser workarounds
   */
  static removeWorkarounds(): void {
    const workarounds = document.querySelectorAll('style[data-browser-workaround]')
    workarounds.forEach(style => {
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    })
  }

  /**
   * Check if current browser is supported
   */
  static isSupported(): boolean {
    return this.detectBrowser().isSupported
  }

  /**
   * Get print support level
   */
  static getPrintSupport(): 'full' | 'partial' | 'limited' {
    return this.detectBrowser().printSupport
  }

  /**
   * Get known issues for current browser
   */
  static getKnownIssues(): string[] {
    return this.detectBrowser().knownIssues
  }

  /**
   * Get recommendations for current browser
   */
  static getRecommendations(): string[] {
    return this.detectBrowser().recommendations
  }

  /**
   * Get user-friendly browser compatibility message
   */
  static getCompatibilityMessage(): string {
    const browser = this.detectBrowser()
    
    if (browser.printSupport === 'full') {
      return `${browser.name} ${browser.version} has full print support. You should have a great printing experience.`
    } else if (browser.printSupport === 'partial') {
      return `${browser.name} ${browser.version} has partial print support. Most features will work, but some limitations may apply.`
    } else {
      return `${browser.name} ${browser.version} has limited print support. For best results, please use Chrome, Firefox, or Edge.`
    }
  }

  /**
   * Show browser compatibility warning if needed
   */
  static showCompatibilityWarning(): boolean {
    const browser = this.detectBrowser()
    return browser.printSupport !== 'full' || browser.knownIssues.length > 0
  }

  /**
   * Get recommended browser for printing
   */
  static getRecommendedBrowser(): string {
    return 'Chrome (version 90+) or Firefox (version 88+)'
  }

  /**
   * Check if specific feature is supported
   */
  static isFeatureSupported(feature: 'page-size' | 'break-inside' | 'color-adjust' | 'high-dpi'): boolean {
    const browser = this.detectBrowser()
    
    switch (feature) {
      case 'page-size':
        // All modern browsers support @page size
        return browser.version >= 90 || (browser.name === 'Firefox' && browser.version >= 88)
      
      case 'break-inside':
        // Safari has poor support for break-inside
        return browser.name !== 'Safari'
      
      case 'color-adjust':
        // All modern browsers support color-adjust
        return browser.isSupported
      
      case 'high-dpi':
        // All modern browsers support high-DPI printing
        return browser.isSupported
      
      default:
        return false
    }
  }
}

export default BrowserCompatibility
