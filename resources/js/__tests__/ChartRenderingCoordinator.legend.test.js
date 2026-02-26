/**
 * ChartRenderingCoordinator Legend Integration Tests
 * 
 * Tests the integration of LegendFormatter with ChartRenderingCoordinator
 * to ensure legends are properly formatted for print mode.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import chartCoordinator from '../Services/ChartRenderingCoordinator';
import { legendFormatter } from '../Services/LegendFormatter';

describe('ChartRenderingCoordinator Legend Integration', () => {
  let canvasRef;
  let mockCanvas;
  let mockChartInstance;

  beforeEach(async () => {
    // Mock Chart.js
    window.Chart = vi.fn().mockImplementation((canvas, config) => {
      return {
        data: config.data || {},
        options: config.options || {},
        config: config,
        destroy: vi.fn(),
        update: vi.fn(),
        resize: vi.fn(),
      };
    });

    // Create mock canvas
    mockCanvas = {
      getContext: vi.fn(() => ({})),
      getBoundingClientRect: vi.fn(() => ({
        width: 600,
        height: 400,
        top: 0,
        left: 0,
        right: 600,
        bottom: 400,
      })),
      width: 600,
      height: 400,
      style: {
        width: '600px',
        height: '400px',
      },
      parentElement: {
        getBoundingClientRect: vi.fn(() => ({
          width: 600,
          height: 400,
        })),
      },
    };

    canvasRef = { current: mockCanvas };

    // Initialize coordinator
    await chartCoordinator.initialize();

    // Mock chart instance
    mockChartInstance = {
      data: {
        labels: ['Label 1', 'Label 2', 'Label 3'],
        datasets: [{
          label: 'Dataset 1',
          data: [10, 20, 30],
          backgroundColor: ['#ff0000', '#00ff00', '#0000ff'],
        }],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
        },
      },
      destroy: vi.fn(),
      update: vi.fn(),
      resize: vi.fn(),
    };
  });

  afterEach(() => {
    chartCoordinator.cleanup();
    vi.clearAllMocks();
  });

  describe('Legend Formatting in Print Mode', () => {
    it('should apply legend formatting when entering print mode', () => {
      // Register a chart with legend enabled
      chartCoordinator.registerChart('test-chart', {
        canvasRef,
        chartType: 'pie',
        data: mockChartInstance.data,
        options: mockChartInstance.options,
      });

      // Get the chart entry and set the chart instance
      const entry = chartCoordinator.chartRegistry.get('test-chart');
      entry.chartInstance = mockChartInstance;

      // Spy on legendFormatter.formatForPrint
      const formatSpy = vi.spyOn(legendFormatter, 'formatForPrint');

      // Trigger print mode
      chartCoordinator._handleBeforePrint();

      // Verify formatForPrint was called
      expect(formatSpy).toHaveBeenCalled();

      // Verify it was called with correct parameters
      const callArgs = formatSpy.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Array); // legend items
      expect(callArgs[0].length).toBe(3); // 3 labels
      expect(callArgs[1]).toBeGreaterThan(0); // available width
      expect(callArgs[2]).toBeGreaterThan(0); // available height

      formatSpy.mockRestore();
    });

    it('should apply minimum 10pt font size to legend (Requirement 3.1)', () => {
      // Register a chart with legend
      chartCoordinator.registerChart('test-chart', {
        canvasRef,
        chartType: 'pie',
        data: mockChartInstance.data,
        options: mockChartInstance.options,
      });

      const entry = chartCoordinator.chartRegistry.get('test-chart');
      entry.chartInstance = mockChartInstance;

      // Trigger print mode
      chartCoordinator._handleBeforePrint();

      // Verify font size is at least 10pt
      expect(mockChartInstance.options.plugins.legend.labels.font.size).toBe(10);
    });

    it('should adjust legend layout based on item count (Requirement 3.2)', () => {
      // Create chart with many legend items (>10)
      const manyItemsData = {
        labels: Array.from({ length: 15 }, (_, i) => `Label ${i + 1}`),
        datasets: [{
          data: Array.from({ length: 15 }, () => Math.random() * 100),
          backgroundColor: Array.from({ length: 15 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`),
        }],
      };

      chartCoordinator.registerChart('many-items-chart', {
        canvasRef,
        chartType: 'pie',
        data: manyItemsData,
        options: {
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      });

      const entry = chartCoordinator.chartRegistry.get('many-items-chart');
      entry.chartInstance = {
        ...mockChartInstance,
        data: manyItemsData,
        options: {
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      };

      // Trigger print mode
      chartCoordinator._handleBeforePrint();

      // For >10 items, layout should be grid (bottom position with start alignment)
      expect(entry.chartInstance.options.plugins.legend.position).toBe('bottom');
      expect(entry.chartInstance.options.plugins.legend.align).toBe('start');
    });

    it('should preserve original colors without modification (Requirement 1.3)', () => {
      // Create chart with light colors
      const lightColorsData = {
        labels: ['Light Yellow', 'Light Gray', 'Light Blue'],
        datasets: [{
          data: [10, 20, 30],
          backgroundColor: ['#ffff00', '#cccccc', '#add8e6'], // Light colors
        }],
      };

      chartCoordinator.registerChart('light-colors-chart', {
        canvasRef,
        chartType: 'pie',
        data: lightColorsData,
        options: {
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      });

      const entry = chartCoordinator.chartRegistry.get('light-colors-chart');
      entry.chartInstance = {
        ...mockChartInstance,
        data: lightColorsData,
        options: {
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      };

      // Store original colors
      const originalColors = [...entry.chartInstance.data.datasets[0].backgroundColor];

      // Trigger print mode
      chartCoordinator._handleBeforePrint();

      // Verify colors were NOT modified (preserved exactly as original)
      const currentColors = entry.chartInstance.data.datasets[0].backgroundColor;
      
      // Check that colors remain exactly the same
      expect(currentColors).toEqual(originalColors);
      expect(currentColors[0]).toBe('#ffff00');
      expect(currentColors[1]).toBe('#cccccc');
      expect(currentColors[2]).toBe('#add8e6');
    });

    it('should skip formatting for charts with legend disabled', () => {
      // Register chart with legend disabled
      chartCoordinator.registerChart('no-legend-chart', {
        canvasRef,
        chartType: 'bar',
        data: mockChartInstance.data,
        options: {
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });

      const entry = chartCoordinator.chartRegistry.get('no-legend-chart');
      entry.chartInstance = {
        ...mockChartInstance,
        options: {
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      };

      const formatSpy = vi.spyOn(legendFormatter, 'formatForPrint');

      // Trigger print mode
      chartCoordinator._handleBeforePrint();

      // Verify formatForPrint was not called for this chart
      expect(formatSpy).not.toHaveBeenCalled();

      formatSpy.mockRestore();
    });

    it('should restore original legend options after print', () => {
      // Register chart
      chartCoordinator.registerChart('restore-chart', {
        canvasRef,
        chartType: 'pie',
        data: mockChartInstance.data,
        options: mockChartInstance.options,
      });

      const entry = chartCoordinator.chartRegistry.get('restore-chart');
      entry.chartInstance = mockChartInstance;

      // Store original legend options
      const originalLegendOptions = JSON.parse(JSON.stringify(mockChartInstance.options.plugins.legend));

      // Trigger print mode
      chartCoordinator._handleBeforePrint();

      // Verify legend options were modified
      expect(mockChartInstance.options.plugins.legend.labels.font.size).toBe(10);

      // Exit print mode
      chartCoordinator._handleAfterPrint();

      // Verify original options were restored
      expect(mockChartInstance.options.plugins.legend).toEqual(originalLegendOptions);
    });

    it('should handle multi-dataset charts correctly', () => {
      // Create chart with multiple datasets (line chart)
      const multiDatasetData = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'Series 1',
            data: [10, 20, 30],
            borderColor: '#ff0000',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
          },
          {
            label: 'Series 2',
            data: [15, 25, 35],
            borderColor: '#00ff00',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
          },
          {
            label: 'Series 3',
            data: [20, 30, 40],
            borderColor: '#0000ff',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
          },
        ],
      };

      chartCoordinator.registerChart('multi-dataset-chart', {
        canvasRef,
        chartType: 'line',
        data: multiDatasetData,
        options: {
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      });

      const entry = chartCoordinator.chartRegistry.get('multi-dataset-chart');
      entry.chartInstance = {
        ...mockChartInstance,
        data: multiDatasetData,
        options: {
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      };

      const formatSpy = vi.spyOn(legendFormatter, 'formatForPrint');

      // Trigger print mode
      chartCoordinator._handleBeforePrint();

      // Verify formatForPrint was called with 3 legend items (one per dataset)
      expect(formatSpy).toHaveBeenCalled();
      const legendItems = formatSpy.mock.calls[0][0];
      expect(legendItems).toHaveLength(3);
      expect(legendItems[0].label).toBe('Series 1');
      expect(legendItems[1].label).toBe('Series 2');
      expect(legendItems[2].label).toBe('Series 3');

      formatSpy.mockRestore();
    });

    it('should apply correct symbol type based on chart type', () => {
      const chartTypes = [
        { type: 'line', expectedSymbol: 'line' },
        { type: 'bar', expectedSymbol: 'square' },
        { type: 'pie', expectedSymbol: 'circle' },
        { type: 'doughnut', expectedSymbol: 'circle' },
      ];

      chartTypes.forEach(({ type, expectedSymbol }) => {
        const chartId = `${type}-chart`;
        
        chartCoordinator.registerChart(chartId, {
          canvasRef,
          chartType: type,
          data: mockChartInstance.data,
          options: mockChartInstance.options,
        });

        const entry = chartCoordinator.chartRegistry.get(chartId);
        entry.chartInstance = mockChartInstance;

        const formatSpy = vi.spyOn(legendFormatter, 'formatForPrint');

        // Trigger print mode
        chartCoordinator._handleBeforePrint();

        // Verify correct symbol type was used
        const legendItems = formatSpy.mock.calls[0][0];
        expect(legendItems[0].symbol).toBe(expectedSymbol);

        formatSpy.mockRestore();

        // Cleanup
        chartCoordinator.unregisterChart(chartId);
      });
    });
  });
});
