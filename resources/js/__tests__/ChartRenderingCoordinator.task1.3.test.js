/**
 * ChartRenderingCoordinator Task 1.3 Test
 * 
 * Verifies that _applyLegendFormatting does NOT modify dataset colors
 * 
 * Requirements: 1.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ChartRenderingCoordinator from '../Services/ChartRenderingCoordinator';

describe('ChartRenderingCoordinator Task 1.3: _applyLegendFormatting color preservation', () => {
  let coordinator;
  let mockCanvas;
  let mockCanvasRef;

  beforeEach(() => {
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
    if (coordinator.chartRegistry) {
      coordinator.chartRegistry.clear();
    }
  });

  describe('Color Preservation in _applyLegendFormatting', () => {
    it('should NOT modify backgroundColor when applying legend formatting', () => {
      // Register a doughnut chart with specific colors
      const chartId = 'test-doughnut';
      const originalBackgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];
      
      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: [...originalBackgroundColors],
            borderColor: [...originalBackgroundColors]
          }],
          labels: ['Red', 'Blue', 'Yellow', 'Teal']
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

      // Trigger beforeprint to apply legend formatting
      coordinator._handleBeforePrint();

      // Verify backgroundColor was NOT modified
      const dataset = mockChartInstance.data.datasets[0];
      expect(dataset.backgroundColor).toEqual(originalBackgroundColors);
      
      // Verify each color individually
      originalBackgroundColors.forEach((color, index) => {
        expect(dataset.backgroundColor[index]).toBe(color);
      });
    });

    it('should NOT modify borderColor when applying legend formatting', () => {
      // Register a doughnut chart with specific colors
      const chartId = 'test-doughnut';
      const originalBorderColors = ['#FF0000', '#0000FF', '#FFFF00', '#00FFFF'];
      
      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            borderColor: [...originalBorderColors]
          }],
          labels: ['Red', 'Blue', 'Yellow', 'Cyan']
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

      // Trigger beforeprint to apply legend formatting
      coordinator._handleBeforePrint();

      // Verify borderColor was NOT modified
      const dataset = mockChartInstance.data.datasets[0];
      expect(dataset.borderColor).toEqual(originalBorderColors);
      
      // Verify each color individually
      originalBorderColors.forEach((color, index) => {
        expect(dataset.borderColor[index]).toBe(color);
      });
    });

    it('should NOT modify colors for charts with multiple datasets', () => {
      // Register a bar chart with multiple datasets
      const chartId = 'test-bar';
      const dataset1Colors = {
        backgroundColor: '#FF6384',
        borderColor: '#FF0000'
      };
      const dataset2Colors = {
        backgroundColor: '#36A2EB',
        borderColor: '#0000FF'
      };
      
      const mockChartInstance = {
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
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'bar'
        }
      });

      // Trigger beforeprint to apply legend formatting
      coordinator._handleBeforePrint();

      // Verify colors were NOT modified for dataset 1
      const dataset1 = mockChartInstance.data.datasets[0];
      expect(dataset1.backgroundColor).toBe(dataset1Colors.backgroundColor);
      expect(dataset1.borderColor).toBe(dataset1Colors.borderColor);

      // Verify colors were NOT modified for dataset 2
      const dataset2 = mockChartInstance.data.datasets[1];
      expect(dataset2.backgroundColor).toBe(dataset2Colors.backgroundColor);
      expect(dataset2.borderColor).toBe(dataset2Colors.borderColor);
    });

    it('should only modify legend options, not dataset colors', () => {
      // Register a doughnut chart
      const chartId = 'test-doughnut';
      const originalColors = ['#FF6384', '#36A2EB', '#FFCE56'];
      
      const mockChartInstance = {
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
      };

      coordinator.chartRegistry.set(chartId, {
        id: chartId,
        canvasRef: mockCanvasRef,
        chartInstance: mockChartInstance,
        config: {
          chartType: 'doughnut'
        }
      });

      // Trigger beforeprint to apply legend formatting
      coordinator._handleBeforePrint();

      // Verify legend options were modified (font size, position, etc.)
      const legendOptions = mockChartInstance.options.plugins.legend;
      expect(legendOptions.labels.font.size).toBe(10); // Minimum font size
      expect(legendOptions.position).toBeDefined();
      expect(legendOptions.align).toBeDefined();

      // Verify dataset colors were NOT modified
      const dataset = mockChartInstance.data.datasets[0];
      expect(dataset.backgroundColor).toEqual(originalColors);
      expect(dataset.borderColor).toEqual(originalColors);
    });

    it('should preserve light colors that might be darkened by LegendFormatter', () => {
      // Register a chart with light colors that LegendFormatter would darken
      const chartId = 'test-light-colors';
      const lightColors = ['#FFE6E6', '#E6F2FF', '#FFFFCC', '#E6FFFF']; // Very light colors
      
      const mockChartInstance = {
        resize: vi.fn(),
        update: vi.fn(),
        data: {
          datasets: [{
            backgroundColor: [...lightColors],
            borderColor: [...lightColors]
          }],
          labels: ['Light Red', 'Light Blue', 'Light Yellow', 'Light Cyan']
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

      // Trigger beforeprint to apply legend formatting
      coordinator._handleBeforePrint();

      // Verify light colors were NOT darkened
      const dataset = mockChartInstance.data.datasets[0];
      expect(dataset.backgroundColor).toEqual(lightColors);
      
      // Verify each light color was preserved exactly
      lightColors.forEach((color, index) => {
        expect(dataset.backgroundColor[index]).toBe(color);
      });
    });
  });
});
