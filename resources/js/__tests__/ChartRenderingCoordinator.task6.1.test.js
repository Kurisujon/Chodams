/**
 * ChartRenderingCoordinator Task 6.1 Integration Tests
 * 
 * Tests the complete print workflow for doughnut charts
 * 
 * Task 6.1: Test complete print workflow
 * - Load admin dashboard with doughnut charts
 * - Capture original colors and layout
 * - Trigger print mode (both button and Ctrl+P)
 * - Verify colors unchanged and layout is vertical
 * - Exit print mode and verify restoration
 * 
 * Requirements: 1.1, 1.2, 2.1, 3.1, 3.2, 3.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ChartRenderingCoordinator from '../Services/ChartRenderingCoordinator';
import { GraphPrintAdapter } from '../Services/GraphPrintAdapter';

describe('ChartRenderingCoordinator Task 6.1 - Complete Print Workflow Integration', () => {
  let coordinator;
  let mockDoughnutCharts;

  beforeEach(() => {
    // Create a fresh coordinator instance for each test
    coordinator = ChartRenderingCoordinator;
    
    // Clear any existing charts
    if (coordinator.chartRegistry) {
      coordinator.chartRegistry.clear();
    }

    // Create mock doughnut charts simulating the admin dashboard
    mockDoughnutCharts = {
      'barangay-chart': createMockDoughnutChart('barangay-chart', [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
      ]),
      'classification-chart': createMockDoughnutChart('classification-chart', [
        '#FF6384', '#36A2EB', '#FFCE56'
      ]),
      'education-chart': createMockDoughnutChart('education-chart', [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
      ]),
      'isf-classification-chart': createMockDoughnutChart('isf-classification-chart', [
        '#FF6384', '#36A2EB'
      ])
    };

    // Register all mock charts
    Object.entries(mockDoughnutCharts).forEach(([chartId, mockChart]) => {
      coordinator.chartRegistry.set(chartId, mockChart);
    });

    // Mock window.Chart
    global.window = global.window || {};
    global.window.Chart = vi.fn(() => ({
      resize: vi.fn(),
      destroy: vi.fn(),
      update: vi.fn()
    }));
  });

  afterEach(() => {
    // Clean up
    if (coordinator.chartRegistry) {
      coordinator.chartRegistry.clear();
    }
  });

  /**
   * Helper function to create a mock doughnut chart
   */
  function createMockDoughnutChart(chartId, colors) {
    const mockCanvas = {
      width: 600,
      height: 400,
      style: {
        width: '600px',
        height: '400px'
      },
      getBoundingClientRect: vi.fn(() => ({
        width: 600,
        height: 400,
        top: 0,
        left: 0,
        right: 600,
        bottom: 400
      })),
      getContext: vi.fn(() => ({
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low'
      }))
    };

    const mockCanvasRef = {
      current: mockCanvas
    };

    return {
      id: chartId,
      canvasRef: mockCanvasRef,
      chartInstance: {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: [...colors],
            borderColor: [...colors],
            label: `${chartId} data`
          }],
          labels: colors.map((_, i) => `Label ${i + 1}`)
        },
        options: {
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  size: 12
                }
              }
            }
          }
        }
      },
      config: {
        chartType: 'doughnut'
      }
    };
  }

  /**
   * Helper function to capture current state of all charts
   */
  function captureChartState() {
    const state = {};
    
    for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
      const canvas = entry.canvasRef.current;
      const dataset = entry.chartInstance.data.datasets[0];
      
      state[chartId] = {
        canvas: {
          width: canvas.width,
          height: canvas.height,
          styleWidth: canvas.style.width,
          styleHeight: canvas.style.height
        },
        colors: {
          backgroundColor: Array.isArray(dataset.backgroundColor) 
            ? [...dataset.backgroundColor] 
            : dataset.backgroundColor,
          borderColor: Array.isArray(dataset.borderColor) 
            ? [...dataset.borderColor] 
            : dataset.borderColor
        },
        legend: {
          position: entry.chartInstance.options.plugins.legend.position,
          fontSize: entry.chartInstance.options.plugins.legend.labels.font.size
        }
      };
    }
    
    return state;
  }

  /**
   * Helper function to verify colors are unchanged
   */
  function verifyColorsUnchanged(originalState, currentState) {
    for (const chartId in originalState) {
      const original = originalState[chartId].colors;
      const current = currentState[chartId].colors;
      
      // Verify backgroundColor unchanged
      if (Array.isArray(original.backgroundColor)) {
        expect(current.backgroundColor).toEqual(original.backgroundColor);
      } else {
        expect(current.backgroundColor).toBe(original.backgroundColor);
      }
      
      // Verify borderColor unchanged
      if (Array.isArray(original.borderColor)) {
        expect(current.borderColor).toEqual(original.borderColor);
      } else {
        expect(current.borderColor).toBe(original.borderColor);
      }
    }
  }

  describe('Complete Print Workflow', () => {
    it('should preserve colors through complete print cycle (Requirements 1.1, 1.2)', () => {
      // Step 1: Capture original state
      const originalState = captureChartState();
      
      // Verify we have all 4 doughnut charts
      expect(Object.keys(originalState)).toHaveLength(4);
      expect(originalState['barangay-chart']).toBeDefined();
      expect(originalState['classification-chart']).toBeDefined();
      expect(originalState['education-chart']).toBeDefined();
      expect(originalState['isf-classification-chart']).toBeDefined();

      // Step 2: Enter print mode
      coordinator._handleBeforePrint();

      // Step 3: Capture state during print mode
      const printModeState = captureChartState();

      // Step 4: Verify colors are unchanged in print mode (Requirement 1.1, 1.2)
      verifyColorsUnchanged(originalState, printModeState);

      // Step 5: Exit print mode
      coordinator._handleAfterPrint();

      // Step 6: Capture state after print mode
      const afterPrintState = captureChartState();

      // Step 7: Verify colors are restored (Requirement 3.1, 3.2, 3.3)
      verifyColorsUnchanged(originalState, afterPrintState);
    });

    it('should apply print dimensions while preserving colors', () => {
      // Capture original state
      const originalState = captureChartState();

      // Enter print mode
      coordinator._handleBeforePrint();

      // Verify dimensions changed (print dimensions applied)
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        const canvas = entry.canvasRef.current;
        const original = originalState[chartId].canvas;

        // Dimensions should have changed
        expect(canvas.style.width).not.toBe(original.styleWidth);
        expect(canvas.style.height).not.toBe(original.styleHeight);

        // But colors should be unchanged
        const dataset = entry.chartInstance.data.datasets[0];
        expect(dataset.backgroundColor).toEqual(originalState[chartId].colors.backgroundColor);
        expect(dataset.borderColor).toEqual(originalState[chartId].colors.borderColor);
      }
    });

    it('should restore all properties after print mode (Requirement 3.1, 3.2, 3.3)', () => {
      // Capture original state
      const originalState = captureChartState();

      // Enter and exit print mode
      coordinator._handleBeforePrint();
      coordinator._handleAfterPrint();

      // Verify all properties restored
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        const canvas = entry.canvasRef.current;
        const dataset = entry.chartInstance.data.datasets[0];
        const original = originalState[chartId];

        // Verify canvas dimensions restored
        expect(canvas.style.width).toBe(original.canvas.styleWidth);
        expect(canvas.style.height).toBe(original.canvas.styleHeight);
        expect(canvas.width).toBe(original.canvas.width);
        expect(canvas.height).toBe(original.canvas.height);

        // Verify colors restored
        expect(dataset.backgroundColor).toEqual(original.colors.backgroundColor);
        expect(dataset.borderColor).toEqual(original.colors.borderColor);

        // Verify legend options restored
        expect(entry.chartInstance.options.plugins.legend.position).toBe(original.legend.position);
        expect(entry.chartInstance.options.plugins.legend.labels.font.size).toBe(original.legend.fontSize);
      }
    });

    it('should handle multiple print cycles without degradation', () => {
      // Capture original state
      const originalState = captureChartState();

      // Perform 3 print cycles
      for (let i = 0; i < 3; i++) {
        coordinator._handleBeforePrint();
        
        // Verify colors unchanged during print
        const printState = captureChartState();
        verifyColorsUnchanged(originalState, printState);
        
        coordinator._handleAfterPrint();
        
        // Verify colors restored after print
        const afterState = captureChartState();
        verifyColorsUnchanged(originalState, afterState);
      }

      // Final verification - state should match original
      const finalState = captureChartState();
      verifyColorsUnchanged(originalState, finalState);
    });

    it('should apply legend formatting in print mode without modifying colors', () => {
      // Capture original colors
      const originalColors = {};
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        const dataset = entry.chartInstance.data.datasets[0];
        originalColors[chartId] = {
          backgroundColor: [...dataset.backgroundColor],
          borderColor: [...dataset.borderColor]
        };
      }

      // Enter print mode (applies legend formatting)
      coordinator._handleBeforePrint();

      // Verify legend formatting was applied
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        const legend = entry.chartInstance.options.plugins.legend;
        
        // Legend should be modified for print
        expect(legend.labels.font.size).toBeGreaterThanOrEqual(10); // Minimum 10pt
        
        // But colors should be unchanged
        const dataset = entry.chartInstance.data.datasets[0];
        expect(dataset.backgroundColor).toEqual(originalColors[chartId].backgroundColor);
        expect(dataset.borderColor).toEqual(originalColors[chartId].borderColor);
      }
    });

    it('should store originalColors before any modifications', () => {
      // Enter print mode
      coordinator._handleBeforePrint();

      // Verify originalColors was stored for all charts
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        expect(entry.originalColors).toBeDefined();
        expect(entry.originalColors.datasets).toBeDefined();
        expect(entry.originalColors.datasets).toHaveLength(1);
        
        const originalDataset = entry.originalColors.datasets[0];
        expect(originalDataset.backgroundColor).toBeDefined();
        expect(originalDataset.borderColor).toBeDefined();
        
        // Verify it's a deep copy (not the same reference)
        const currentDataset = entry.chartInstance.data.datasets[0];
        if (Array.isArray(originalDataset.backgroundColor)) {
          expect(originalDataset.backgroundColor).not.toBe(currentDataset.backgroundColor);
        }
      }
    });

    it('should clean up stored properties after restoration', () => {
      // Enter print mode
      coordinator._handleBeforePrint();

      // Verify properties are stored
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        expect(entry.originalDimensions).toBeDefined();
        expect(entry.originalLegendOptions).toBeDefined();
        expect(entry.originalColors).toBeDefined();
      }

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify properties are cleaned up
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        expect(entry.originalDimensions).toBeUndefined();
        expect(entry.originalLegendOptions).toBeUndefined();
        expect(entry.originalColors).toBeUndefined();
      }
    });

    it('should apply high-quality interpolation in print mode', () => {
      // Create a mock context that tracks property changes
      const mockContexts = new Map();
      
      // Update all charts to use a context that tracks changes
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        const mockContext = {
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'low'
        };
        mockContexts.set(chartId, mockContext);
        
        entry.canvasRef.current.getContext = vi.fn(() => mockContext);
      }
      
      // Enter print mode
      coordinator._handleBeforePrint();

      // Verify high-quality interpolation was applied
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        const canvas = entry.canvasRef.current;
        
        // Verify getContext was called
        expect(canvas.getContext).toHaveBeenCalledWith('2d');
        
        // Verify interpolation settings were updated
        const ctx = mockContexts.get(chartId);
        expect(ctx.imageSmoothingEnabled).toBe(true);
        expect(ctx.imageSmoothingQuality).toBe('high');
      }
    });

    it('should handle all four doughnut charts from admin dashboard', () => {
      // Verify all 4 charts are registered
      expect(coordinator.chartRegistry.size).toBe(4);
      expect(coordinator.chartRegistry.has('barangay-chart')).toBe(true);
      expect(coordinator.chartRegistry.has('classification-chart')).toBe(true);
      expect(coordinator.chartRegistry.has('education-chart')).toBe(true);
      expect(coordinator.chartRegistry.has('isf-classification-chart')).toBe(true);

      // Enter print mode
      coordinator._handleBeforePrint();

      // Verify all charts were processed
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        expect(entry.originalDimensions).toBeDefined();
        expect(entry.originalColors).toBeDefined();
        expect(entry.chartInstance.resize).toHaveBeenCalled();
        expect(entry.chartInstance.update).toHaveBeenCalled();
      }
    });

    it('should verify chart.resize() and chart.update() are called during print cycle', () => {
      // Enter print mode
      coordinator._handleBeforePrint();

      // Verify resize and update were called for all charts
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        expect(entry.chartInstance.resize).toHaveBeenCalled();
        expect(entry.chartInstance.update).toHaveBeenCalledWith('none');
      }

      // Reset mocks
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        entry.chartInstance.resize.mockClear();
        entry.chartInstance.update.mockClear();
      }

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify resize and update were called again during restoration
      for (const [chartId, entry] of coordinator.chartRegistry.entries()) {
        expect(entry.chartInstance.resize).toHaveBeenCalled();
        expect(entry.chartInstance.update).toHaveBeenCalledWith('none');
      }
    });
  });

  describe('Print Mode Triggers', () => {
    it('should handle print button trigger', () => {
      // Simulate print button click (calls _handleBeforePrint directly)
      const originalState = captureChartState();
      
      coordinator._handleBeforePrint();
      
      // Verify print mode is active
      expect(coordinator.state.isPrintMode).toBe(true);
      
      // Verify colors unchanged
      const printState = captureChartState();
      verifyColorsUnchanged(originalState, printState);
      
      coordinator._handleAfterPrint();
      
      // Verify print mode is inactive
      expect(coordinator.state.isPrintMode).toBe(false);
    });

    it('should handle browser print (Ctrl+P) trigger', () => {
      // Browser print triggers beforeprint event which calls _handleBeforePrint
      const originalState = captureChartState();
      
      // Simulate beforeprint event
      coordinator._handleBeforePrint();
      
      // Verify print mode is active
      expect(coordinator.state.isPrintMode).toBe(true);
      
      // Verify colors unchanged
      const printState = captureChartState();
      verifyColorsUnchanged(originalState, printState);
      
      // Simulate afterprint event
      coordinator._handleAfterPrint();
      
      // Verify print mode is inactive
      expect(coordinator.state.isPrintMode).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle charts with single color (not array)', () => {
      // Create a chart with single color values
      const singleColorChart = createMockDoughnutChart('single-color-chart', ['#FF6384']);
      singleColorChart.chartInstance.data.datasets[0].backgroundColor = '#FF6384';
      singleColorChart.chartInstance.data.datasets[0].borderColor = '#FF6384';
      
      coordinator.chartRegistry.set('single-color-chart', singleColorChart);
      
      // Capture original
      const originalColor = '#FF6384';
      
      // Enter and exit print mode
      coordinator._handleBeforePrint();
      coordinator._handleAfterPrint();
      
      // Verify color unchanged
      const entry = coordinator.chartRegistry.get('single-color-chart');
      expect(entry.chartInstance.data.datasets[0].backgroundColor).toBe(originalColor);
      expect(entry.chartInstance.data.datasets[0].borderColor).toBe(originalColor);
    });

    it('should handle rapid print triggers', () => {
      const originalState = captureChartState();
      
      // Rapidly enter and exit print mode
      coordinator._handleBeforePrint();
      coordinator._handleAfterPrint();
      coordinator._handleBeforePrint();
      coordinator._handleAfterPrint();
      coordinator._handleBeforePrint();
      coordinator._handleAfterPrint();
      
      // Verify state is still correct
      const finalState = captureChartState();
      verifyColorsUnchanged(originalState, finalState);
    });

    it('should handle print mode cancellation (exit without completing print)', () => {
      const originalState = captureChartState();
      
      // Enter print mode
      coordinator._handleBeforePrint();
      
      // User cancels print dialog (afterprint event fires)
      coordinator._handleAfterPrint();
      
      // Verify everything is restored
      const afterState = captureChartState();
      verifyColorsUnchanged(originalState, afterState);
    });
  });
});
