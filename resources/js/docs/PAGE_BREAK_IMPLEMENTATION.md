# Page Break Implementation Guide

## Overview

This document describes the complete page break logic implementation for the admin analytics print functionality. The implementation ensures that charts and sections print correctly without awkward splits across pages.

**Task:** 10.2 - Implement page break logic  
**Requirements:** 5.4 - Prevent awkward splits (less than 30% of section on page)

## Implementation Components

### 1. CSS Page Break Rules

The print stylesheet (`resources/css/print-analytics.css`) implements the following page break rules:

#### Chart Containers
```css
.chart-container,
.graph-container,
.analytics-chart {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-bottom: 16pt;
  max-width: 100%;
}
```

**Purpose:** Prevents page breaks from occurring inside chart containers, ensuring charts remain intact on a single page.

#### Major Sections
```css
/* Allow breaks between sections - auto allows browser to decide */
.analytics-section + .analytics-section,
.print-section + .print-section {
  page-break-before: auto;
  break-before: auto;
}
```

**Purpose:** Allows the browser to automatically determine optimal page break placement between adjacent sections.

#### Intelligent Page Break Markers
```css
/* Sections marked for page break by PageBreakManager */
.analytics-section[data-page-break-added="true"],
.print-section[data-page-break-added="true"],
[data-printable-section][data-page-break-added="true"] {
  page-break-before: always;
  break-before: page;
}
```

**Purpose:** Forces page breaks for sections that would otherwise split awkwardly (less than 30% on first page).

### 2. JavaScript Page Break Manager

The `PageBreakManager` class (`resources/js/Utils/PageBreakManager.ts`) implements intelligent page break logic:

#### Key Features

1. **30% Threshold Detection**
   - Analyzes section heights and positions
   - Calculates what percentage of a section would appear on the first page
   - Adds `page-break-before: always` if less than 30% would appear

2. **Paper Format Awareness**
   - Supports A4, Letter, and Legal paper formats
   - Calculates page height based on paper dimensions and margins
   - Adjusts page break logic for different paper sizes

3. **Section Detection**
   - Finds sections with class `.analytics-section`
   - Finds sections with class `.print-section`
   - Finds sections with attribute `[data-printable-section]`

#### Usage Example

```javascript
import { PageBreakManager } from '../Utils/PageBreakManager';

// Create manager instance
const manager = new PageBreakManager({ paperFormat: 'A4' });

// Apply intelligent page breaks
const breaksAdded = manager.applyIntelligentPageBreaks();
console.log(`Added ${breaksAdded} page breaks`);

// Later, remove page breaks
manager.removePageBreaks();
```

#### React Hook

```javascript
import { usePageBreakManager } from '../Utils/PageBreakManager';

function MyComponent() {
  const { applyPageBreaks, removePageBreaks } = usePageBreakManager('A4');
  
  const handlePrint = () => {
    applyPageBreaks();
    window.print();
    removePageBreaks();
  };
  
  return <button onClick={handlePrint}>Print</button>;
}
```

### 3. Integration with Print System

The `PrintStyleManager` (`resources/js/Services/PrintStyleManager.ts`) automatically integrates the page break logic:

```typescript
applyPrintStyles(format?: PaperFormat): void {
  // ... other print setup ...
  
  // Initialize page break manager with the current paper format
  this.pageBreakManager = new PageBreakManager({ paperFormat: format });
  
  // Apply intelligent page breaks
  this.applyIntelligentPageBreaks();
}

removePrintStyles(): void {
  // Remove intelligent page breaks if manager exists
  if (this.pageBreakManager) {
    this.pageBreakManager.removePageBreaks();
    this.pageBreakManager = null;
  }
  
  // ... other cleanup ...
}
```

## How It Works

### Step-by-Step Process

1. **User initiates print**
   - User clicks print button or presses Ctrl+P / Cmd+P
   - Browser triggers `@media print` styles

2. **CSS applies base rules**
   - `page-break-inside: avoid` prevents breaks inside charts
   - `page-break-before: auto` allows natural breaks between sections

3. **JavaScript analyzes layout**
   - `PageBreakManager` scans all major sections
   - Calculates section heights and positions
   - Determines which page each section starts on

4. **Intelligent page breaks added**
   - For sections that would split awkwardly (< 30% on first page)
   - Adds `page-break-before: always` style
   - Adds `data-page-break-added="true"` attribute

5. **Browser renders print output**
   - Respects all page break rules
   - Sections start on new pages when needed
   - Charts remain intact without splits

6. **Cleanup after print**
   - Removes dynamically added page breaks
   - Restores normal screen layout

### Example Scenario

```
Page 1:
┌─────────────────────────┐
│ Section 1 (full)        │
│ ┌─────────────────────┐ │
│ │ Chart A             │ │
│ └─────────────────────┘ │
│                         │
│ Section 2 (starts)      │
│ ┌─────────────────────┐ │
│ │ Chart B (top 20%)   │ │ <- Would split awkwardly!
└─────────────────────────┘

After PageBreakManager:
Page 1:
┌─────────────────────────┐
│ Section 1 (full)        │
│ ┌─────────────────────┐ │
│ │ Chart A             │ │
│ └─────────────────────┘ │
└─────────────────────────┘

Page 2:
┌─────────────────────────┐
│ Section 2 (full)        │ <- Forced to new page
│ ┌─────────────────────┐ │
│ │ Chart B (complete)  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Configuration

### Default Settings

- **Paper Format:** A4 (210mm × 297mm)
- **Minimum Section Percentage:** 30% (0.30)
- **Margins:** 20mm (A4), 19.05mm (Letter/Legal)

### Customization

```javascript
const manager = new PageBreakManager({
  paperFormat: 'Letter',           // A4, Letter, or Legal
  minSectionPercentage: 0.25       // 25% threshold instead of 30%
});
```

## CSS Classes Reference

### Section Classes

- `.analytics-section` - Main analytics section container
- `.print-section` - Alternative section container
- `[data-printable-section]` - Sections with this attribute

### Chart Classes

- `.chart-container` - Main chart container
- `.graph-container` - Alternative chart container
- `.analytics-chart` - Analytics-specific chart

### Page Break Control Classes

- `.print-page-break` - Forces page break before element
- `.page-break-before` - Forces page break before element
- `[data-page-break-added="true"]` - Dynamically added page break marker

## Testing

### Unit Tests

Location: `resources/js/__tests__/PageBreakManager.test.js`

Tests cover:
- Constructor initialization
- Section detection
- Page break application
- Page break removal
- Paper format handling
- Edge cases

### Integration Tests

Location: `resources/js/__tests__/PageBreakIntegration.test.js`

Tests cover:
- Chart container page breaks
- Major section page breaks
- 30% threshold logic
- Complete workflow
- CSS class integration
- Edge cases

### Running Tests

```bash
# Run all page break tests
npm test -- PageBreak

# Run specific test file
npm test -- PageBreakManager.test.js
npm test -- PageBreakIntegration.test.js
```

## Browser Compatibility

The page break implementation works across all major browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Edge (Legacy)

### Browser-Specific Notes

**Firefox:**
- Supports `@page` rules with some limitations
- May require `-moz-` prefixes for some properties

**Safari:**
- Requires `-webkit-print-color-adjust: exact` for color preservation
- `break-inside` support may vary

**Edge (Legacy):**
- Limited `@page` support
- Falls back to standard page break properties

## Troubleshooting

### Issue: Page breaks not working

**Solution:**
1. Verify sections have correct classes (`.analytics-section`, `.print-section`)
2. Check that `PageBreakManager` is initialized
3. Ensure `applyIntelligentPageBreaks()` is called before printing

### Issue: Charts still splitting across pages

**Solution:**
1. Verify chart containers have `.chart-container` class
2. Check CSS is loaded: `resources/css/print-analytics.css`
3. Ensure charts are not too tall for a single page

### Issue: Too many page breaks

**Solution:**
1. Adjust `minSectionPercentage` threshold (increase from 0.30 to 0.40)
2. Reduce section heights
3. Use larger paper format (Legal instead of Letter)

### Issue: Page breaks in wrong places

**Solution:**
1. Call `removePageBreaks()` before reapplying
2. Ensure sections are properly measured (visible in DOM)
3. Check for CSS conflicts with `page-break-*` properties

## Performance Considerations

- **Section Scanning:** O(n) where n is number of sections
- **Measurement:** Uses `getBoundingClientRect()` - triggers layout
- **Optimization:** Only scans sections with specific classes/attributes

### Best Practices

1. **Minimize DOM queries:** Reuse manager instance
2. **Batch operations:** Apply all page breaks at once
3. **Clean up:** Always call `removePageBreaks()` after printing
4. **Lazy initialization:** Create manager only when needed

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic threshold adjustment** based on content type
2. **Multi-column layout support** for legends and tables
3. **Orphan/widow control** for text-heavy sections
4. **Print preview** with visual page break indicators
5. **User preferences** for page break behavior

## References

- **Requirements:** `.kiro/specs/admin-analytics-print-fix/requirements.md`
- **Design:** `.kiro/specs/admin-analytics-print-fix/design.md`
- **Tasks:** `.kiro/specs/admin-analytics-print-fix/tasks.md`
- **CSS:** `resources/css/print-analytics.css`
- **TypeScript:** `resources/js/Utils/PageBreakManager.ts`
- **Tests:** `resources/js/__tests__/PageBreakManager.test.js`

## Summary

The page break implementation successfully addresses Requirement 5.4 by:

✅ Adding `page-break-inside: avoid` to chart containers  
✅ Adding `page-break-before: auto` to major sections  
✅ Preventing awkward splits (less than 30% of section on page)  
✅ Supporting multiple paper formats (A4, Letter, Legal)  
✅ Providing comprehensive test coverage  
✅ Integrating seamlessly with the print system  

The implementation ensures professional, readable print output for admin analytics reports.
