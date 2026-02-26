/**
 * ChartRenderingCoordinator Task 2.1 Tests
 * 
 * Tests for color restoration in _handleAfterPrint method
 * 
 * Task 2.1: Modify `_handleAfterPrint` to restore original colors
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ChartRenderingCoordinator from '../Services/ChartRenderingCoordinator';

describe('ChartRenderingCoordinator Task 2.1 - Color Restoration', () => {
  let coordinator;
  let mockCanvas;
  let mockCanvasRef;

  beforeEach(() => {
    // Create a fresh coordinator instance for each test
    coordinator = ChartRenderingCoordinator;
    
    // Mock canvas element
    mockCanvas = {
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

    // Mock canvas ref
    mockCanvasRef = {
      current: mockCanvas
    };

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

  describe('Color Restoration - Requirement 3.1, 3.2, 3.5', () => {
    it('should restore backgroundColor arrays after print mode', () => {
      // Register a doughnut chart with color arrays
      const chartId = 'doughnut-chart';
      const originalBackgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];
      const originalBorderColors = ['#FF0000', '#0000FF', '#FFFF00', '#00FFFF'];

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: [...originalBackgroundColors],
            borderColor: [...originalBorderColors]
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Enter print mode (stores original colors)
      coordinator._handleBeforePrint();

      // Verify colors were stored
      const entry = coordinator.chartRegistry.get(chartId);
      expect(entry.originalColors).toBeDefined();

      // Simulate color modification during print mode
      mockChartInstance.data.datasets[0].backgroundColor = ['#000000', '#111111', '#222222', '#333333'];
      mockChartInstance.data.datasets[0].borderColor = ['#444444', '#555555', '#666666', '#777777'];

      // Exit print mode (should restore colors)
      coordinator._handleAfterPrint();

      // Verify backgroundColor was restored
      expect(mockChartInstance.data.datasets[0].backgroundColor).toEqual(originalBackgroundColors);
      
      // Verify borderColor was restored
      expect(mockChartInstance.data.datasets[0].borderColor).toEqual(originalBorderColors);
    });

    it('should restore single color values (non-array) after print mode', () => {
      // Register a chart with single color values
      const chartId = 'bar-chart';
      const originalBackgroundColor = '#FF6384';
      const originalBorderColor = '#FF0000';

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: originalBackgroundColor,
            borderColor: originalBorderColor
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'bar'
        }
      });

      // Enter print mode
      coordinator._handleBeforePrint();

      // Simulate color modification
      mockChartInstance.data.datasets[0].backgroundColor = '#000000';
      mockChartInstance.data.datasets[0].borderColor = '#111111';

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify colors were restored
      expect(mockChartInstance.data.datasets[0].backgroundColor).toBe(originalBackgroundColor);
      expect(mockChartInstance.data.datasets[0].borderColor).toBe(originalBorderColor);
    });

    it('should restore colors for multiple datasets', () => {
      // Register a chart with multiple datasets
      const chartId = 'multi-dataset-chart';
      const dataset1 = {
        backgroundColor: ['#FF6384', '#36A2EB'],
        borderColor: ['#FF0000', '#0000FF']
      };
      const dataset2 = {
        backgroundColor: ['#FFCE56', '#4BC0C0'],
        borderColor: ['#FFFF00', '#00FFFF']
      };

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [
            { ...dataset1, label: 'Dataset 1' },
            { ...dataset2, label: 'Dataset 2' }
          ]
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'bar'
        }
      });

      // Enter print mode
      coordinator._handleBeforePrint();

      // Simulate color modifications
      mockChartInstance.data.datasets[0].backgroundColor = ['#000000', '#111111'];
      mockChartInstance.data.datasets[0].borderColor = ['#222222', '#333333'];
      mockChartInstance.data.datasets[1].backgroundColor = ['#444444', '#555555'];
      mockChartInstance.data.datasets[1].borderColor = ['#666666', '#777777'];

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify first dataset colors were restored
      expect(mockChartInstance.data.datasets[0].backgroundColor).toEqual(dataset1.backgroundColor);
      expect(mockChartInstance.data.datasets[0].borderColor).toEqual(dataset1.borderColor);

      // Verify second dataset colors were restored
      expect(mockChartInstance.data.datasets[1].backgroundColor).toEqual(dataset2.backgroundColor);
      expect(mockChartInstance.data.datasets[1].borderColor).toEqual(dataset2.borderColor);
    });
  });

  describe('originalColors Cleanup - Requirement 3.3', () => {
    it('should delete originalColors after restoration', () => {
      // Register a chart
      const chartId = 'test-chart';
      const originalColors = ['#FF6384', '#36A2EB', '#FFCE56'];

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: [...originalColors],
            borderColor: [...originalColors]
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Enter print mode
      coordinator._handleBeforePrint();

      // Verify originalColors exists
      const entryBefore = coordinator.chartRegistry.get(chartId);
      expect(entryBefore.originalColors).toBeDefined();

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify originalColors was deleted
      const entryAfter = coordinator.chartRegistry.get(chartId);
      expect(entryAfter.originalColors).toBeUndefined();
    });
  });

  describe('Chart Update - Requirement 3.4', () => {
    it('should call chart.update() to apply restored colors', () => {
      // Register a chart
      const chartId = 'test-chart';
      const originalColors = ['#FF6384', '#36A2EB', '#FFCE56'];

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: [...originalColors],
            borderColor: [...originalColors]
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Enter print mode
      coordinator._handleBeforePrint();

      // Clear the mock call history
      mockChartInstance.update.mockClear();

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify update was called
      expect(mockChartInstance.update).toHaveBeenCalled();
      
      // Verify update was called with 'none' mode to skip animations
      expect(mockChartInstance.update).toHaveBeenCalledWith('none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle charts with no originalColors gracefully', () => {
      // Register a chart without going through beforePrint
      const chartId = 'test-chart';

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: ['#FF6384', '#36A2EB'],
            borderColor: ['#FF0000', '#0000FF']
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Exit print mode without entering it first - should not throw
      expect(() => coordinator._handleAfterPrint()).not.toThrow();
    });

    it('should handle charts with missing datasets gracefully', () => {
      // Register a chart with no datasets
      const chartId = 'test-chart';

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: []
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Enter and exit print mode - should not throw
      expect(() => coordinator._handleBeforePrint()).not.toThrow();
      expect(() => coordinator._handleAfterPrint()).not.toThrow();
    });

    it('should handle partial color properties (only backgroundColor)', () => {
      // Register a chart with only backgroundColor
      const chartId = 'test-chart';
      const originalBackgroundColor = ['#FF6384', '#36A2EB'];

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: [...originalBackgroundColor]
            // No borderColor
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Enter print mode
      coordinator._handleBeforePrint();

      // Modify backgroundColor
      mockChartInstance.data.datasets[0].backgroundColor = ['#000000', '#111111'];

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify backgroundColor was restored
      expect(mockChartInstance.data.datasets[0].backgroundColor).toEqual(originalBackgroundColor);
      
      // Verify borderColor is still undefined
      expect(mockChartInstance.data.datasets[0].borderColor).toBeUndefined();
    });

    it('should handle partial color properties (only borderColor)', () => {
      // Register a chart with only borderColor
      const chartId = 'test-chart';
      const originalBorderColor = ['#FF0000', '#0000FF'];

      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            borderColor: [...originalBorderColor]
            // No backgroundColor
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true
            }
          }
        }
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Enter print mode
      coordinator._handleBeforePrint();

      // Modify borderColor
      mockChartInstance.data.datasets[0].borderColor = ['#222222', '#333333'];

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify borderColor was restored
      expect(mockChartInstance.data.datasets[0].borderColor).toEqual(originalBorderColor);
      
      // Verify backgroundColor is still undefined
      expect(mockChartInstance.data.datasets[0].backgroundColor).toBeUndefined();
    });
  });

  describe('Integration - Full Print Cycle', () => {
    it('should preserve and restore colors through complete print cycle', () => {
      // Register multiple doughnut charts
      const charts = [
        {
          id: 'barangay-chart',
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          borderColor: ['#FF0000', '#0000FF', '#FFFF00']
        },
        {
          id: 'classification-chart',
          backgroundColor: ['#4BC0C0', '#9966FF', '#FF9F40'],
          borderColor: ['#00FFFF', '#9900FF', '#FF6600']
        },
        {
          id: 'education-chart',
          backgroundColor: ['#FF6384', '#36A2EB'],
          borderColor: ['#FF0000', '#0000FF']
        }
      ];

      charts.forEach(({ id, backgroundColor, borderColor }) => {
        const mockChartInstance = {
          resize: vi.fn(),
          update: vi.fn(),
          data: {
            datasets: [{
              backgroundColor: [...backgroundColor],
              borderColor: [...borderColor]
            }]
          },
          options: {
            plugins: {
              legend: {
                display: true
              }
            }
          }
        };

        coordinator.chartRegistry.set(id, {
          id,
          canvasRef: mockCanvasRef,
          chartInstance: mockChartInstance,
          config: {
            chartType: 'doughnut'
          }
        });
      });

      // Enter print mode
      coordinator._handleBeforePrint();

      // Simulate color modifications during print
      charts.forEach(({ id }) => {
        const entry = coordinator.chartRegistry.get(id);
        entry.chartInstance.data.datasets[0].backgroundColor = ['#000000'];
        entry.chartInstance.data.datasets[0].borderColor = ['#111111'];
      });

      // Exit print mode
      coordinator._handleAfterPrint();

      // Verify all charts have their original colors restored
      charts.forEach(({ id, backgroundColor, borderColor }) => {
        const entry = coordinator.chartRegistry.get(id);
        expect(entry.chartInstance.data.datasets[0].backgroundColor).toEqual(backgroundColor);
        expect(entry.chartInstance.data.datasets[0].borderColor).toEqual(borderColor);
        expect(entry.originalColors).toBeUndefined(); // Should be cleaned up
      });
    });
  });
});
