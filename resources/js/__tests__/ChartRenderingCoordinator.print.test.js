/**
 * ChartRenderingCoordinator Print Mode Integration Tests
 * 
 * Tests the integration between ChartRenderingCoordinator and GraphPrintAdapter
 * to ensure charts are properly adapted for print output.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ChartRenderingCoordinator from '../Services/ChartRenderingCoordinator';
import { GraphPrintAdapter } from '../Services/GraphPrintAdapter';

describe('ChartRenderingCoordinator Print Mode Integration', () => {
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

  describe('GraphPrintAdapter Integration', () => {
    it('should initialize GraphPrintAdapter when entering print mode', () => {
      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify GraphPrintAdapter was initialized
      expect(coordinator.graphPrintAdapter).toBeDefined();
      expect(coordinator.graphPrintAdapter).toBeInstanceOf(GraphPrintAdapter);
    });

    it('should apply print dimensions to registered charts', () => {
      // Register a mock chart
      const chartId = 'test-chart';
      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
          resize: vi.fn()
        },
        config: {
          chartType: 'bar'
        }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify print dimensions were applied
      const entry = coordinator.chartRegistry.get(chartId);
      expect(entry.originalDimensions).toBeDefined();
      expect(entry.originalDimensions.width).toBe(600);
      expect(entry.originalDimensions.height).toBe(400);

      // Verify canvas dimensions were modified
      expect(mockCanvas.style.width).not.toBe('600px');
      expect(mockCanvas.style.height).not.toBe('400px');

      // Verify chart was resized
      expect(entry.chartInstance.resize).toHaveBeenCalled();
    });

    it('should pass original dimensions and chart type to GraphPrintAdapter', () => {
      // Spy on calculatePrintDimensions
      const calculateSpy = vi.spyOn(GraphPrintAdapter.prototype, 'calculatePrintDimensions');

      // Register a mock chart
      const chartId = 'test-chart';
      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
          resize: vi.fn()
        },
        config: {
          chartType: 'line'
        }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify calculatePrintDimensions was called with correct parameters
      expect(calculateSpy).toHaveBeenCalled();
      const callArgs = calculateSpy.mock.calls[0];
      expect(callArgs[0]).toBe('A4'); // Default paper format
      expect(callArgs[1]).toBe('line'); // Chart type
      expect(callArgs[2]).toBe(600 / 400); // Aspect ratio (1.5)

      calculateSpy.mockRestore();
    });

    it('should apply scale factor for high-DPI rendering', () => {
      // Register a mock chart
      const chartId = 'test-chart';
      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
          resize: vi.fn()
        },
        config: {
          chartType: 'bar'
        }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify scale factor was applied (canvas dimensions should be 2x style dimensions)
      const styleWidth = parseFloat(mockCanvas.style.width);
      const styleHeight = parseFloat(mockCanvas.style.height);
      
      // Canvas dimensions should be 2x style dimensions (scale factor of 2)
      expect(mockCanvas.width).toBeCloseTo(styleWidth * 2, 0);
      expect(mockCanvas.height).toBeCloseTo(styleHeight * 2, 0);
    });

    it('should restore original dimensions after print', () => {
      // Register a mock chart
      const chartId = 'test-chart';
      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
          resize: vi.fn()
        },
        config: {
          chartType: 'bar'
        }
      });

      // Store original dimensions
      const originalWidth = mockCanvas.style.width;
      const originalHeight = mockCanvas.style.height;
      const originalCanvasWidth = mockCanvas.width;
      const originalCanvasHeight = mockCanvas.height;

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify dimensions changed
      expect(mockCanvas.style.width).not.toBe(originalWidth);
      expect(mockCanvas.style.height).not.toBe(originalHeight);

      // Trigger afterprint event
      coordinator._handleAfterPrint();

      // Verify dimensions were restored
      expect(mockCanvas.style.width).toBe(originalWidth);
      expect(mockCanvas.style.height).toBe(originalHeight);
      expect(mockCanvas.width).toBe(originalCanvasWidth);
      expect(mockCanvas.height).toBe(originalCanvasHeight);
    });

    it('should handle multiple charts in print mode', () => {
      // Register multiple mock charts
      const charts = ['chart1', 'chart2', 'chart3'];
      charts.forEach(chartId => {
        const canvas = {
          width: 600,
          height: 400,
          style: { width: '600px', height: '400px' },
          getBoundingClientRect: vi.fn(() => ({ width: 600, height: 400 }))
        };

        coordinator.chartRegistry.set(chartId, {
          id: chartId,
          canvasRef: { current: canvas },
          chartInstance: { resize: vi.fn() },
          config: { chartType: 'bar' }
        });
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify all charts have print dimensions applied
      charts.forEach(chartId => {
        const entry = coordinator.chartRegistry.get(chartId);
        expect(entry.originalDimensions).toBeDefined();
        expect(entry.chartInstance.resize).toHaveBeenCalled();
      });
    });

    it('should handle charts with different aspect ratios', () => {
      // Register charts with different aspect ratios
      const charts = [
        { id: 'wide-chart', width: 800, height: 400, ratio: 2 },
        { id: 'tall-chart', width: 400, height: 800, ratio: 0.5 },
        { id: 'square-chart', width: 600, height: 600, ratio: 1 }
      ];

      charts.forEach(({ id, width, height }) => {
        const canvas = {
          width,
          height,
          style: { width: `${width}px`, height: `${height}px` },
          getBoundingClientRect: vi.fn(() => ({ width, height }))
        };

        coordinator.chartRegistry.set(id, {
          id,
          canvasRef: { current: canvas },
          chartInstance: { resize: vi.fn() },
          config: { chartType: 'bar' }
        });
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify all charts were processed
      charts.forEach(({ id }) => {
        const entry = coordinator.chartRegistry.get(id);
        expect(entry.originalDimensions).toBeDefined();
        expect(entry.chartInstance.resize).toHaveBeenCalled();
      });
    });

    it('should gracefully handle missing GraphPrintAdapter', () => {
      // Mock GraphPrintAdapter constructor to throw error
      const originalAdapter = GraphPrintAdapter;
      global.GraphPrintAdapter = vi.fn(() => {
        throw new Error('Failed to initialize');
      });

      // Register a mock chart
      const chartId = 'test-chart';
      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: { resize: vi.fn() },
        config: { chartType: 'bar' }
      });

      // Trigger beforeprint event - should not throw
      expect(() => coordinator._handleBeforePrint()).not.toThrow();

      // Restore original
      global.GraphPrintAdapter = originalAdapter;
    });
  });

  describe('Requirements Validation', () => {
    it('should maintain aspect ratio when applying print dimensions (Requirement 2.1)', () => {
      // Register a chart with known aspect ratio
      const originalWidth = 800;
      const originalHeight = 400;
      const originalRatio = originalWidth / originalHeight; // 2:1

      const canvas = {
        width: originalWidth,
        height: originalHeight,
        style: { width: `${originalWidth}px`, height: `${originalHeight}px` },
        getBoundingClientRect: vi.fn(() => ({ width: originalWidth, height: originalHeight }))
      };

      coordinator.chartRegistry.set('test-chart', {
        id: 'test-chart',
        canvasRef: { current: canvas },
        chartInstance: { resize: vi.fn() },
        config: { chartType: 'bar' }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Calculate new aspect ratio
      const newWidth = parseFloat(canvas.style.width);
      const newHeight = parseFloat(canvas.style.height);
      const newRatio = newWidth / newHeight;

      // Verify aspect ratio is maintained (within 1% tolerance)
      expect(Math.abs(newRatio - originalRatio)).toBeLessThan(originalRatio * 0.01);
    });

    it('should apply calculated print dimensions from GraphPrintAdapter (Requirements 2.2, 2.3, 2.4, 2.5)', () => {
      // Register a mock chart
      coordinator.chartRegistry.set('test-chart', {
        id: 'test-chart',
        canvasRef: mockCanvasRef,
        chartInstance: { resize: vi.fn() },
        config: { chartType: 'bar' }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify dimensions were changed (indicating GraphPrintAdapter was used)
      expect(mockCanvas.style.width).not.toBe('600px');
      expect(mockCanvas.style.height).not.toBe('400px');

      // Verify dimensions are reasonable for print (converted from mm to px)
      const widthPx = parseFloat(mockCanvas.style.width);
      const heightPx = parseFloat(mockCanvas.style.height);

      // Should be within reasonable print dimensions (100mm to 200mm = ~378px to 756px at 96 DPI)
      expect(widthPx).toBeGreaterThan(300);
      expect(widthPx).toBeLessThan(800);
      expect(heightPx).toBeGreaterThan(200);
      expect(heightPx).toBeLessThan(800);
    });

    it('should apply high-quality interpolation for raster images (Requirement 6.4)', () => {
      // Create a mock canvas with getContext method
      const mockContext = {
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low'
      };

      const canvas = {
        width: 600,
        height: 400,
        style: { width: '600px', height: '400px' },
        getBoundingClientRect: vi.fn(() => ({ width: 600, height: 400 })),
        getContext: vi.fn(() => mockContext)
      };

      const canvasRef = { current: canvas };

      // Register a mock chart
      coordinator.chartRegistry.set('test-chart', {
        id: 'test-chart',
        canvasRef: canvasRef,
        chartInstance: { resize: vi.fn() },
        config: { chartType: 'bar' }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify getContext was called
      expect(canvas.getContext).toHaveBeenCalledWith('2d');

      // Verify high-quality interpolation settings were applied
      expect(mockContext.imageSmoothingEnabled).toBe(true);
      expect(mockContext.imageSmoothingQuality).toBe('high');
    });

    it('should apply 2x scale factor for 300 DPI output (Requirement 6.1)', () => {
      // Register a mock chart
      coordinator.chartRegistry.set('test-chart', {
        id: 'test-chart',
        canvasRef: mockCanvasRef,
        chartInstance: { resize: vi.fn() },
        config: { chartType: 'bar' }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Get the style dimensions (in pixels)
      const styleWidth = parseFloat(mockCanvas.style.width);
      const styleHeight = parseFloat(mockCanvas.style.height);

      // Verify canvas dimensions are 2x the style dimensions (scale factor of 2)
      // This provides 300 DPI equivalent output
      expect(mockCanvas.width).toBeCloseTo(styleWidth * 2, 0);
      expect(mockCanvas.height).toBeCloseTo(styleHeight * 2, 0);
    });
  });

  describe('Color Preservation (Task 1.1)', () => {
    it('should store original colors before print mode modifications', () => {
      // Register a doughnut chart with color arrays
      const chartId = 'doughnut-chart';
      const originalBackgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];
      const originalBorderColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
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
                display: true
              }
            }
          }
        },
        config: {
          chartType: 'doughnut'
        }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify originalColors was stored
      const entry = coordinator.chartRegistry.get(chartId);
      expect(entry.originalColors).toBeDefined();
      expect(entry.originalColors.datasets).toBeDefined();
      expect(entry.originalColors.datasets).toHaveLength(1);

      // Verify backgroundColor was deep copied
      expect(entry.originalColors.datasets[0].backgroundColor).toEqual(originalBackgroundColors);
      expect(entry.originalColors.datasets[0].backgroundColor).not.toBe(originalBackgroundColors);

      // Verify borderColor was deep copied
      expect(entry.originalColors.datasets[0].borderColor).toEqual(originalBorderColors);
      expect(entry.originalColors.datasets[0].borderColor).not.toBe(originalBorderColors);
    });

    it('should store original colors for charts with multiple datasets', () => {
      // Register a chart with multiple datasets
      const chartId = 'multi-dataset-chart';
      const dataset1Colors = { backgroundColor: '#FF6384', borderColor: '#FF0000' };
      const dataset2Colors = { backgroundColor: '#36A2EB', borderColor: '#0000FF' };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
          resize: vi.fn(),
          update: vi.fn(),
          data: {
            datasets: [
              { ...dataset1Colors, label: 'Dataset 1' },
              { ...dataset2Colors, label: 'Dataset 2' }
            ]
          },
          options: {
            plugins: {
              legend: {
                display: true
              }
            }
          }
        },
        config: {
          chartType: 'bar'
        }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Verify originalColors was stored for all datasets
      const entry = coordinator.chartRegistry.get(chartId);
      expect(entry.originalColors).toBeDefined();
      expect(entry.originalColors.datasets).toHaveLength(2);

      // Verify first dataset colors
      expect(entry.originalColors.datasets[0].backgroundColor).toBe(dataset1Colors.backgroundColor);
      expect(entry.originalColors.datasets[0].borderColor).toBe(dataset1Colors.borderColor);

      // Verify second dataset colors
      expect(entry.originalColors.datasets[1].backgroundColor).toBe(dataset2Colors.backgroundColor);
      expect(entry.originalColors.datasets[1].borderColor).toBe(dataset2Colors.borderColor);
    });

    it('should handle charts with no color properties', () => {
      // Register a chart with no color properties
      const chartId = 'no-colors-chart';

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
          resize: vi.fn(),
          update: vi.fn(),
          data: {
            datasets: [{ label: 'Dataset 1' }]
          },
          options: {
            plugins: {
              legend: {
                display: true
              }
            }
          }
        },
        config: {
          chartType: 'bar'
        }
      });

      // Trigger beforeprint event - should not throw
      expect(() => coordinator._handleBeforePrint()).not.toThrow();

      // Verify originalColors was still created but with empty color objects
      const entry = coordinator.chartRegistry.get(chartId);
      expect(entry.originalColors).toBeDefined();
      expect(entry.originalColors.datasets).toHaveLength(1);
      expect(entry.originalColors.datasets[0]).toEqual({});
    });

    it('should store colors BEFORE any print mode modifications', () => {
      // Register a doughnut chart
      const chartId = 'doughnut-chart';
      const originalColors = ['#FF6384', '#36A2EB', '#FFCE56'];

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: {
          resize: vi.fn(),
          update: vi.fn(),
          data: {
            datasets: [{
              backgroundColor: [...originalColors],
              borderColor: [...originalColors]
            }],
            labels: ['Red', 'Blue', 'Yellow']
          },
          options: {
            plugins: {
              legend: {
                display: true
              }
            }
          }
        },
        config: {
          chartType: 'doughnut'
        }
      });

      // Trigger beforeprint event
      coordinator._handleBeforePrint();

      // Get the stored colors
      const entry = coordinator.chartRegistry.get(chartId);
      const storedColors = entry.originalColors.datasets[0].backgroundColor;

      // Verify stored colors match the original colors (not modified colors)
      expect(storedColors).toEqual(originalColors);
    });
  });
});
