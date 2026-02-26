/**
 * Chart Rendering Coordinator
 * 
 * Centralized system for managing Chart.js rendering with proper lifecycle management,
 * error recovery, and print mode support.
 * 
 * Integrates with GraphPrintAdapter for print-optimized chart dimensions.
 */

// Import print-related services (lazy loaded when needed)
import { GraphPrintAdapter } from './GraphPrintAdapter';
import { PrintStyleManager } from './PrintStyleManager';
import { legendFormatter } from './LegendFormatter';

/**
 * Library Loading Manager
 * 
 * Handles Chart.js library loading with fallback mechanisms.
 * Ensures the library is available before any chart rendering attempts.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
class LibraryLoadingManager {
    constructor() {
        this.loaded = false;
        this.loading = false;
        this.loadPromise = null;
        
        // CDN URLs
        this.primaryCDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        this.fallbackCDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
        
        // Timeout duration (10 seconds)
        this.timeout = 10000;
    }

    /**
     * Load Chart.js library
     * Attempts to load from primary CDN, falls back to secondary on failure
     * 
     * @returns {Promise<void>}
     */
    async loadChartJS() {
        // If already loaded, return immediately
        if (this.isLoaded()) {
            console.log('LibraryLoadingManager: Chart.js already loaded');
            return Promise.resolve();
        }

        // If currently loading, return existing promise
        if (this.loading && this.loadPromise) {
            console.log('LibraryLoadingManager: Chart.js loading in progress, returning existing promise');
            return this.loadPromise;
        }

        // Start loading
        this.loading = true;
        this.loadPromise = this._loadWithFallback();

        try {
            await this.loadPromise;
            this.loaded = true;
            this.loading = false;
            console.log('LibraryLoadingManager: Chart.js loaded successfully');
        } catch (error) {
            this.loading = false;
            this.loadPromise = null;
            console.error('LibraryLoadingManager: Failed to load Chart.js', error);
            throw error;
        }

        return this.loadPromise;
    }

    /**
     * Load library with fallback mechanism
     * Tries primary CDN first, then fallback CDN on failure
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _loadWithFallback() {
        try {
            // Try primary CDN
            console.log('LibraryLoadingManager: Attempting to load from primary CDN');
            await this._loadFromCDN(this.primaryCDN);
            console.log('LibraryLoadingManager: Loaded from primary CDN');
        } catch (primaryError) {
            console.warn('LibraryLoadingManager: Primary CDN failed, trying fallback', primaryError);
            
            try {
                // Try fallback CDN
                console.log('LibraryLoadingManager: Attempting to load from fallback CDN');
                await this._loadFromCDN(this.fallbackCDN);
                console.log('LibraryLoadingManager: Loaded from fallback CDN');
            } catch (fallbackError) {
                console.error('LibraryLoadingManager: Both CDNs failed', {
                    primary: primaryError,
                    fallback: fallbackError
                });
                throw new Error('Failed to load Chart.js from both primary and fallback CDNs');
            }
        }
    }

    /**
     * Load library from a specific CDN URL
     * 
     * @private
     * @param {string} url - CDN URL to load from
     * @returns {Promise<void>}
     */
    _loadFromCDN(url) {
        return new Promise((resolve, reject) => {
            // Check if Chart is already available on window
            if (window.Chart && typeof window.Chart === 'function') {
                resolve();
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = url;
            script.type = 'text/javascript';

            // Set up timeout
            const timeoutId = setTimeout(() => {
                script.remove();
                reject(new Error(`Timeout loading Chart.js from ${url}`));
            }, this.timeout);

            // Handle successful load
            script.onload = () => {
                clearTimeout(timeoutId);
                
                // Verify Chart is available
                if (window.Chart && typeof window.Chart === 'function') {
                    resolve();
                } else {
                    reject(new Error('Chart.js loaded but Chart object not found on window'));
                }
            };

            // Handle load error
            script.onerror = (error) => {
                clearTimeout(timeoutId);
                script.remove();
                reject(new Error(`Failed to load Chart.js from ${url}: ${error.message || 'Unknown error'}`));
            };

            // Append to document
            document.head.appendChild(script);
        });
    }

    /**
     * Check if library is loaded
     * 
     * @returns {boolean}
     */
    isLoaded() {
        // Check internal state first
        if (this.loaded) {
            return true;
        }

        // Check if Chart is available on window
        if (window.Chart && typeof window.Chart === 'function') {
            this.loaded = true;
            return true;
        }

        return false;
    }

    /**
     * Get Chart.js library instance
     * 
     * @returns {typeof Chart | null}
     */
    getChartJS() {
        if (this.isLoaded()) {
            return window.Chart;
        }
        return null;
    }
}

/**
 * Canvas Readiness Verifier
 * 
 * Ensures canvas elements have valid dimensions before rendering.
 * Implements polling with exponential backoff and dimension forcing.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
class CanvasReadinessVerifier {
    constructor() {
        // Configuration
        this.defaultTimeout = 3000; // 3 seconds
        this.initialDelay = 50; // Start with 50ms
        this.maxDelay = 500; // Cap at 500ms
        this.minWidth = 300; // Minimum canvas width
        this.minHeight = 200; // Minimum canvas height
        
        // ResizeObserver instances for tracking dimension changes
        this.resizeObservers = new Map();
    }

    /**
     * Wait for canvas to be ready with valid dimensions
     * Uses polling with exponential backoff
     * 
     * @param {React.RefObject} canvasRef - Reference to canvas element
     * @param {number} timeout - Maximum time to wait in milliseconds (default: 3000)
     * @returns {Promise<Object>} - Promise that resolves with canvas dimensions
     */
    async waitForCanvas(canvasRef, timeout = this.defaultTimeout) {
        if (!canvasRef) {
            throw new Error('CanvasReadinessVerifier: canvasRef is required');
        }

        console.log('CanvasReadinessVerifier: Waiting for canvas to be ready');

        const startTime = Date.now();
        let delay = this.initialDelay;
        let attempt = 0;

        while (Date.now() - startTime < timeout) {
            attempt++;
            
            // Check if canvas is ready
            const dimensions = this._checkCanvasDimensions(canvasRef);
            
            if (dimensions.ready) {
                console.log(`CanvasReadinessVerifier: Canvas ready after ${attempt} attempts`, dimensions);
                return dimensions;
            }

            // Wait with exponential backoff
            await this._sleep(delay);
            
            // Increase delay exponentially, but cap at maxDelay
            delay = Math.min(delay * 2, this.maxDelay);
            
            // Force browser layout recalculation
            if (canvasRef.current) {
                // Access offsetHeight to trigger layout recalculation
                void canvasRef.current.offsetHeight;
            }
        }

        // Timeout reached - canvas still not ready
        console.warn('CanvasReadinessVerifier: Timeout waiting for canvas dimensions');
        
        // Return current dimensions (may be zero)
        const finalDimensions = this._checkCanvasDimensions(canvasRef);
        return {
            ...finalDimensions,
            ready: false,
            timedOut: true
        };
    }

    /**
     * Check if canvas is ready immediately (no waiting)
     * 
     * @param {React.RefObject} canvasRef - Reference to canvas element
     * @returns {boolean} - True if canvas has valid dimensions
     */
    isCanvasReady(canvasRef) {
        if (!canvasRef) {
            return false;
        }

        const dimensions = this._checkCanvasDimensions(canvasRef);
        return dimensions.ready;
    }

    /**
     * Force canvas dimensions when zero dimensions are detected
     * Applies minimum dimensions to canvas and parent container
     * 
     * @param {React.RefObject} canvasRef - Reference to canvas element
     * @param {number} minWidth - Minimum width (default: 300)
     * @param {number} minHeight - Minimum height (default: 200)
     * @returns {void}
     */
    forceCanvasDimensions(canvasRef, minWidth = this.minWidth, minHeight = this.minHeight) {
        if (!canvasRef || !canvasRef.current) {
            console.warn('CanvasReadinessVerifier: Cannot force dimensions - canvas ref not available');
            return;
        }

        const canvas = canvasRef.current;
        console.log('CanvasReadinessVerifier: Forcing canvas dimensions', { minWidth, minHeight });

        try {
            // Get parent container
            const parent = canvas.parentElement;
            
            if (parent) {
                // Check parent dimensions
                const parentRect = parent.getBoundingClientRect();
                
                if (parentRect.width === 0 || parentRect.height === 0) {
                    // Parent has zero dimensions - force parent dimensions
                    console.log('CanvasReadinessVerifier: Parent has zero dimensions, forcing parent size');
                    parent.style.minWidth = `${minWidth}px`;
                    parent.style.minHeight = `${minHeight}px`;
                    parent.style.width = parent.style.width || `${minWidth}px`;
                    parent.style.height = parent.style.height || `${minHeight}px`;
                }
            }

            // Force canvas dimensions
            const canvasRect = canvas.getBoundingClientRect();
            
            if (canvasRect.width === 0) {
                canvas.style.width = `${minWidth}px`;
                canvas.width = minWidth;
            }
            
            if (canvasRect.height === 0) {
                canvas.style.height = `${minHeight}px`;
                canvas.height = minHeight;
            }

            // Force layout recalculation
            void canvas.offsetHeight;

            console.log('CanvasReadinessVerifier: Dimensions forced successfully');
        } catch (error) {
            console.error('CanvasReadinessVerifier: Error forcing dimensions', error);
        }
    }

    /**
     * Observe canvas for dimension changes using ResizeObserver
     * 
     * @param {React.RefObject} canvasRef - Reference to canvas element
     * @param {Function} callback - Callback function to invoke on resize
     * @returns {void}
     */
    observeCanvasResize(canvasRef, callback) {
        if (!canvasRef || !canvasRef.current) {
            console.warn('CanvasReadinessVerifier: Cannot observe resize - canvas ref not available');
            return;
        }

        if (typeof ResizeObserver === 'undefined') {
            console.warn('CanvasReadinessVerifier: ResizeObserver not supported in this browser');
            return;
        }

        const canvas = canvasRef.current;
        const canvasId = canvas.id || `canvas-${Date.now()}`;

        // Clean up existing observer if any
        this.unobserveCanvasResize(canvasRef);

        try {
            // Create new ResizeObserver
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    console.log('CanvasReadinessVerifier: Canvas resized', { width, height });
                    
                    if (callback && typeof callback === 'function') {
                        callback({ width, height, ready: width > 0 && height > 0 });
                    }
                }
            });

            // Start observing
            observer.observe(canvas);
            
            // Store observer for cleanup
            this.resizeObservers.set(canvasId, { observer, canvas });

            console.log('CanvasReadinessVerifier: Started observing canvas resize');
        } catch (error) {
            console.error('CanvasReadinessVerifier: Error setting up ResizeObserver', error);
        }
    }

    /**
     * Stop observing canvas resize
     * 
     * @param {React.RefObject} canvasRef - Reference to canvas element
     * @returns {void}
     */
    unobserveCanvasResize(canvasRef) {
        if (!canvasRef || !canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const canvasId = canvas.id || `canvas-${Date.now()}`;

        const observerEntry = this.resizeObservers.get(canvasId);
        if (observerEntry) {
            try {
                observerEntry.observer.disconnect();
                this.resizeObservers.delete(canvasId);
                console.log('CanvasReadinessVerifier: Stopped observing canvas resize');
            } catch (error) {
                console.error('CanvasReadinessVerifier: Error disconnecting ResizeObserver', error);
            }
        }
    }

    /**
     * Cleanup all resize observers
     * 
     * @returns {void}
     */
    cleanup() {
        console.log('CanvasReadinessVerifier: Cleaning up all resize observers');
        
        for (const [canvasId, observerEntry] of this.resizeObservers.entries()) {
            try {
                observerEntry.observer.disconnect();
            } catch (error) {
                console.error(`CanvasReadinessVerifier: Error disconnecting observer for ${canvasId}`, error);
            }
        }
        
        this.resizeObservers.clear();
    }

    /**
     * Check canvas dimensions
     * 
     * @private
     * @param {React.RefObject} canvasRef - Reference to canvas element
     * @returns {Object} - Dimensions object with width, height, and ready flag
     */
    _checkCanvasDimensions(canvasRef) {
        // Check if ref exists
        if (!canvasRef || !canvasRef.current) {
            return { width: 0, height: 0, ready: false };
        }

        const canvas = canvasRef.current;

        try {
            // Get canvas dimensions using getBoundingClientRect
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Also check parent container dimensions
            const parent = canvas.parentElement;
            let parentWidth = 0;
            let parentHeight = 0;

            if (parent) {
                const parentRect = parent.getBoundingClientRect();
                parentWidth = parentRect.width;
                parentHeight = parentRect.height;
            }

            // Canvas is ready if it has non-zero dimensions
            const ready = width > 0 && height > 0;

            // #region agent log
            try {
                fetch('http://127.0.0.1:7242/ingest/36b80014-4a16-4bd1-8a7c-ecd551ae87f9', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: 'debug-session',
                        runId: 'initial',
                        hypothesisId: 'H1',
                        location: 'ChartRenderingCoordinator.CanvasReadinessVerifier._checkCanvasDimensions',
                        message: 'Canvas dimensions check',
                        data: { width, height, parentWidth, parentHeight, ready },
                        timestamp: Date.now()
                    })
                }).catch(() => {});
            } catch (e) {}
            // #endregion

            return {
                width,
                height,
                parentWidth,
                parentHeight,
                ready
            };
        } catch (error) {
            console.error('CanvasReadinessVerifier: Error checking canvas dimensions', error);
            return { width: 0, height: 0, ready: false };
        }
    }

    /**
     * Sleep utility for async waiting
     * 
     * @private
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Render Queue Manager
 * 
 * Manages the order and timing of chart renders to prevent conflicts.
 * Implements priority queue with debouncing and dependency resolution.
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
class RenderQueueManager {
    constructor() {
        // Priority queue - array of render requests sorted by priority
        this.queue = [];
        
        // Currently processing chart ID
        this.processing = null;
        
        // Completed chart IDs
        this.completed = new Set();
        
        // Failed chart IDs
        this.failed = new Set();
        
        // Debounce timers - map of chartId to timer
        this.debounceTimers = new Map();
        
        // Debounce delay in milliseconds
        this.debounceDelay = 200;
        
        // Animation frame ID for processing
        this.animationFrameId = null;
        
        // Processing flag
        this.isProcessing = false;
        
        // Render callback - function to call when rendering a chart
        this.renderCallback = null;
    }

    /**
     * Set the render callback function
     * This function will be called to actually render each chart
     * 
     * @param {Function} callback - Function that takes chartId and returns Promise
     * @returns {void}
     */
    setRenderCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('RenderQueueManager: Render callback must be a function');
        }
        this.renderCallback = callback;
        console.log('RenderQueueManager: Render callback set');
    }

    /**
     * Add chart to render queue
     * Implements debouncing to prevent rapid re-renders
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {number} priority - Render priority (higher = earlier, default: 0)
     * @param {string[]} dependencies - IDs of charts that must render first (default: [])
     * @returns {Promise<void>} - Promise that resolves when chart is rendered
     */
    enqueue(chartId, priority = 0, dependencies = []) {
        if (!chartId) {
            throw new Error('RenderQueueManager: chartId is required');
        }

        console.log(`RenderQueueManager: Enqueuing chart ${chartId} with priority ${priority}`);

        // Clear existing debounce timer for this chart
        if (this.debounceTimers.has(chartId)) {
            clearTimeout(this.debounceTimers.get(chartId));
            console.log(`RenderQueueManager: Cleared existing debounce timer for ${chartId}`);
        }

        // Create promise that will be resolved when chart is rendered
        return new Promise((resolve, reject) => {
            // Set up debounce timer
            const timerId = setTimeout(() => {
                // Remove timer from map
                this.debounceTimers.delete(chartId);

                // Check if chart is already in queue
                const existingIndex = this.queue.findIndex(req => req.chartId === chartId);
                
                if (existingIndex !== -1) {
                    // Update existing request
                    console.log(`RenderQueueManager: Updating existing queue entry for ${chartId}`);
                    this.queue[existingIndex] = {
                        chartId,
                        priority,
                        dependencies: dependencies || [],
                        timestamp: Date.now(),
                        resolve,
                        reject
                    };
                } else {
                    // Add new request to queue
                    console.log(`RenderQueueManager: Adding new queue entry for ${chartId}`);
                    this.queue.push({
                        chartId,
                        priority,
                        dependencies: dependencies || [],
                        timestamp: Date.now(),
                        resolve,
                        reject
                    });
                }

                // Sort queue by priority (higher priority first)
                // If priorities are equal, sort by timestamp (earlier first)
                this.queue.sort((a, b) => {
                    if (b.priority !== a.priority) {
                        return b.priority - a.priority;
                    }
                    return a.timestamp - b.timestamp;
                });

                console.log(`RenderQueueManager: Queue sorted, length: ${this.queue.length}`);

                // Start processing if not already processing
                if (!this.isProcessing) {
                    this._startProcessing();
                }
            }, this.debounceDelay);

            // Store timer
            this.debounceTimers.set(chartId, timerId);
            console.log(`RenderQueueManager: Debounce timer set for ${chartId} (${this.debounceDelay}ms)`);
        });
    }

    /**
     * Remove chart from queue
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {void}
     */
    dequeue(chartId) {
        if (!chartId) {
            console.warn('RenderQueueManager: chartId is required for dequeue');
            return;
        }

        console.log(`RenderQueueManager: Dequeuing chart ${chartId}`);

        // Clear debounce timer if exists
        if (this.debounceTimers.has(chartId)) {
            clearTimeout(this.debounceTimers.get(chartId));
            this.debounceTimers.delete(chartId);
            console.log(`RenderQueueManager: Cleared debounce timer for ${chartId}`);
        }

        // Remove from queue
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(req => req.chartId !== chartId);
        
        if (this.queue.length < initialLength) {
            console.log(`RenderQueueManager: Removed ${chartId} from queue`);
        } else {
            console.log(`RenderQueueManager: Chart ${chartId} not found in queue`);
        }

        // Remove from completed/failed sets
        this.completed.delete(chartId);
        this.failed.delete(chartId);
    }

    /**
     * Process next chart in queue
     * Uses requestAnimationFrame for smooth rendering
     * 
     * @returns {Promise<void>} - Promise that resolves when processing is complete
     */
    async processNext() {
        if (this.isProcessing) {
            console.log('RenderQueueManager: Already processing, skipping processNext');
            return;
        }

        if (this.queue.length === 0) {
            console.log('RenderQueueManager: Queue is empty, nothing to process');
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;

        try {
            // Find next chart that can be rendered (dependencies met)
            const nextRequest = this._findNextRenderableChart();

            if (!nextRequest) {
                console.log('RenderQueueManager: No renderable charts (waiting for dependencies)');
                this.isProcessing = false;
                
                // Check if we have a deadlock (all remaining charts have unmet dependencies)
                if (this.queue.length > 0) {
                    console.warn('RenderQueueManager: Possible dependency deadlock detected');
                    // Process first chart anyway to break deadlock
                    const firstRequest = this.queue.shift();
                    if (firstRequest) {
                        await this._renderChart(firstRequest);
                    }
                }
                return;
            }

            // Remove from queue
            this.queue = this.queue.filter(req => req.chartId !== nextRequest.chartId);

            // Set as currently processing
            this.processing = nextRequest.chartId;
            console.log(`RenderQueueManager: Processing chart ${nextRequest.chartId}`);

            // Render the chart
            await this._renderChart(nextRequest);

            // Clear processing flag
            this.processing = null;

            // Continue processing if queue has more items
            if (this.queue.length > 0) {
                console.log(`RenderQueueManager: Queue has ${this.queue.length} more items, continuing...`);
                // Use requestAnimationFrame for next render
                this.animationFrameId = requestAnimationFrame(() => {
                    this.isProcessing = false;
                    this.processNext();
                });
            } else {
                console.log('RenderQueueManager: Queue processing complete');
                this.isProcessing = false;
            }
        } catch (error) {
            console.error('RenderQueueManager: Error in processNext', error);
            this.processing = null;
            this.isProcessing = false;
        }
    }

    /**
     * Get queue status
     * 
     * @returns {Object} - Queue status object
     */
    getQueueStatus() {
        return {
            pending: this.queue.map(req => req.chartId),
            processing: this.processing,
            completed: Array.from(this.completed),
            failed: Array.from(this.failed)
        };
    }

    /**
     * Clear the queue
     * Cancels all pending renders and clears state
     * 
     * @returns {void}
     */
    clear() {
        console.log('RenderQueueManager: Clearing queue');

        // Clear all debounce timers
        for (const [chartId, timerId] of this.debounceTimers.entries()) {
            clearTimeout(timerId);
            console.log(`RenderQueueManager: Cleared debounce timer for ${chartId}`);
        }
        this.debounceTimers.clear();

        // Cancel animation frame if pending
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Reject all pending promises
        for (const request of this.queue) {
            if (request.reject) {
                request.reject(new Error('Queue cleared'));
            }
        }

        // Clear queue
        this.queue = [];
        this.processing = null;
        this.isProcessing = false;

        console.log('RenderQueueManager: Queue cleared');
    }

    /**
     * Reset the queue manager
     * Clears queue and resets all state
     * 
     * @returns {void}
     */
    reset() {
        console.log('RenderQueueManager: Resetting');

        this.clear();
        this.completed.clear();
        this.failed.clear();

        console.log('RenderQueueManager: Reset complete');
    }

    /**
     * Start processing the queue
     * 
     * @private
     * @returns {void}
     */
    _startProcessing() {
        console.log('RenderQueueManager: Starting queue processing');
        
        // Use requestAnimationFrame for smooth rendering
        this.animationFrameId = requestAnimationFrame(() => {
            this.processNext();
        });
    }

    /**
     * Find next chart that can be rendered (all dependencies met)
     * 
     * @private
     * @returns {Object|null} - Next render request or null if none available
     */
    _findNextRenderableChart() {
        for (const request of this.queue) {
            // Check if all dependencies are completed
            const dependenciesMet = request.dependencies.every(depId => 
                this.completed.has(depId)
            );

            if (dependenciesMet) {
                console.log(`RenderQueueManager: Found renderable chart ${request.chartId}`);
                return request;
            } else {
                const unmetDeps = request.dependencies.filter(depId => 
                    !this.completed.has(depId)
                );
                console.log(`RenderQueueManager: Chart ${request.chartId} waiting for dependencies: ${unmetDeps.join(', ')}`);
            }
        }

        return null;
    }

    /**
     * Render a chart using the render callback
     * 
     * @private
     * @param {Object} request - Render request object
     * @returns {Promise<void>}
     */
    async _renderChart(request) {
        const { chartId, resolve, reject } = request;

        try {
            console.log(`RenderQueueManager: Rendering chart ${chartId}`);

            // Check if render callback is set
            if (!this.renderCallback) {
                throw new Error('RenderQueueManager: Render callback not set');
            }

            // Call render callback
            const result = await this.renderCallback(chartId);

            // Mark as completed
            this.completed.add(chartId);
            console.log(`RenderQueueManager: Chart ${chartId} rendered successfully`);

            // Resolve promise
            if (resolve) {
                resolve(result);
            }
        } catch (error) {
            console.error(`RenderQueueManager: Error rendering chart ${chartId}`, error);

            // Mark as failed
            this.failed.add(chartId);

            // Reject promise
            if (reject) {
                reject(error);
            }
        }
    }
}

/**
 * Lifecycle Manager
 * 
 * Manages chart instance lifecycle to prevent memory leaks and conflicts.
 * Maintains a registry of active chart instances and handles creation,
 * destruction, and updates.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
class LifecycleManager {
    constructor() {
        // Chart registry - Map of chartId to Chart instance
        this.chartRegistry = new Map();
        
        // Event listeners registry - Map of chartId to array of cleanup functions
        this.eventListeners = new Map();
        
        // Observers registry - Map of chartId to array of observers
        this.observers = new Map();
    }

    /**
     * Create new chart instance
     * Destroys any existing chart on the same canvas before creating new one
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {HTMLCanvasElement} canvas - Canvas element to render on
     * @param {Object} config - Chart.js configuration object
     * @param {string} config.type - Chart type (bar, line, pie, etc.)
     * @param {Object} config.data - Chart data
     * @param {Object} config.options - Chart options
     * @returns {Chart} - Chart.js instance
     */
    createChart(chartId, canvas, config) {
        if (!chartId) {
            throw new Error('LifecycleManager: chartId is required');
        }

        if (!canvas) {
            throw new Error('LifecycleManager: canvas element is required');
        }

        if (!config || !config.type) {
            throw new Error('LifecycleManager: config.type is required');
        }

        // Check if Chart.js is available
        if (!window.Chart || typeof window.Chart !== 'function') {
            throw new Error('LifecycleManager: Chart.js library not loaded');
        }

        console.log(`LifecycleManager: Creating chart ${chartId}`);

        // Destroy existing chart if any
        if (this.chartRegistry.has(chartId)) {
            console.log(`LifecycleManager: Destroying existing chart ${chartId} before creating new one`);
            this.destroyChart(chartId);
        }

        // Check if canvas already has a chart attached
        // Chart.js stores chart instance on canvas element
        if (canvas.chart) {
            console.warn(`LifecycleManager: Canvas already has a chart attached, destroying it`);
            try {
                canvas.chart.destroy();
            } catch (error) {
                console.error('LifecycleManager: Error destroying existing chart on canvas', error);
            }
        }

        try {
            // Create new Chart.js instance
            const chartInstance = new window.Chart(canvas, {
                type: config.type,
                data: config.data || {},
                options: config.options || {}
            });

            // Store in registry
            this.chartRegistry.set(chartId, chartInstance);

            // Initialize event listeners and observers arrays
            this.eventListeners.set(chartId, []);
            this.observers.set(chartId, []);

            console.log(`LifecycleManager: Chart ${chartId} created successfully`);

            return chartInstance;
        } catch (error) {
            console.error(`LifecycleManager: Error creating chart ${chartId}`, error);
            throw error;
        }
    }

    /**
     * Destroy chart instance
     * Cleans up chart, event listeners, and observers
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {void}
     */
    destroyChart(chartId) {
        if (!chartId) {
            console.warn('LifecycleManager: chartId is required for destroy');
            return;
        }

        console.log(`LifecycleManager: Destroying chart ${chartId}`);

        // Get chart instance
        const chartInstance = this.chartRegistry.get(chartId);

        if (!chartInstance) {
            console.warn(`LifecycleManager: Chart ${chartId} not found in registry`);
            return;
        }

        try {
            // Clean up event listeners
            const listeners = this.eventListeners.get(chartId);
            if (listeners && listeners.length > 0) {
                console.log(`LifecycleManager: Cleaning up ${listeners.length} event listeners for ${chartId}`);
                listeners.forEach((cleanup, index) => {
                    try {
                        if (typeof cleanup === 'function') {
                            cleanup();
                        }
                    } catch (error) {
                        console.error(`LifecycleManager: Error cleaning up listener ${index} for ${chartId}`, error);
                    }
                });
                this.eventListeners.delete(chartId);
            }

            // Clean up observers
            const observers = this.observers.get(chartId);
            if (observers && observers.length > 0) {
                console.log(`LifecycleManager: Cleaning up ${observers.length} observers for ${chartId}`);
                observers.forEach((observer, index) => {
                    try {
                        if (observer && typeof observer.disconnect === 'function') {
                            observer.disconnect();
                        }
                    } catch (error) {
                        console.error(`LifecycleManager: Error disconnecting observer ${index} for ${chartId}`, error);
                    }
                });
                this.observers.delete(chartId);
            }

            // Destroy Chart.js instance
            if (chartInstance && typeof chartInstance.destroy === 'function') {
                chartInstance.destroy();
                console.log(`LifecycleManager: Chart.js instance destroyed for ${chartId}`);
            }

            // Remove from registry
            this.chartRegistry.delete(chartId);

            console.log(`LifecycleManager: Chart ${chartId} destroyed successfully`);
        } catch (error) {
            console.error(`LifecycleManager: Error destroying chart ${chartId}`, error);
            
            // Still remove from registry even if destruction failed
            this.chartRegistry.delete(chartId);
            this.eventListeners.delete(chartId);
            this.observers.delete(chartId);
        }
    }

    /**
     * Update existing chart with new data
     * Uses Chart.js update() method to avoid recreation
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {Object} newData - New chart data
     * @param {Object} newOptions - New chart options (optional)
     * @returns {void}
     */
    updateChart(chartId, newData, newOptions = null) {
        if (!chartId) {
            throw new Error('LifecycleManager: chartId is required');
        }

        if (!newData) {
            throw new Error('LifecycleManager: newData is required');
        }

        console.log(`LifecycleManager: Updating chart ${chartId}`);

        // Get chart instance
        const chartInstance = this.chartRegistry.get(chartId);

        if (!chartInstance) {
            console.warn(`LifecycleManager: Chart ${chartId} not found, cannot update`);
            throw new Error(`Chart ${chartId} not found in registry`);
        }

        try {
            // Update data
            chartInstance.data = newData;

            // Update options if provided
            if (newOptions) {
                chartInstance.options = newOptions;
            }

            // Call Chart.js update method
            // Use 'none' mode to skip animations for better performance
            chartInstance.update('none');

            console.log(`LifecycleManager: Chart ${chartId} updated successfully`);
        } catch (error) {
            console.error(`LifecycleManager: Error updating chart ${chartId}`, error);
            throw error;
        }
    }

    /**
     * Get chart instance
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {Chart|null} - Chart.js instance or null if not found
     */
    getChart(chartId) {
        if (!chartId) {
            console.warn('LifecycleManager: chartId is required for getChart');
            return null;
        }

        const chartInstance = this.chartRegistry.get(chartId);

        if (!chartInstance) {
            console.warn(`LifecycleManager: Chart ${chartId} not found in registry`);
            return null;
        }

        return chartInstance;
    }

    /**
     * Check if chart exists in registry
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {boolean} - True if chart exists
     */
    hasChart(chartId) {
        if (!chartId) {
            return false;
        }

        return this.chartRegistry.has(chartId);
    }

    /**
     * Register event listener cleanup function
     * These functions will be called when the chart is destroyed
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {Function} cleanupFn - Cleanup function to call on destroy
     * @returns {void}
     */
    registerEventListener(chartId, cleanupFn) {
        if (!chartId || typeof cleanupFn !== 'function') {
            console.warn('LifecycleManager: chartId and cleanupFn are required');
            return;
        }

        const listeners = this.eventListeners.get(chartId) || [];
        listeners.push(cleanupFn);
        this.eventListeners.set(chartId, listeners);

        console.log(`LifecycleManager: Event listener registered for ${chartId}`);
    }

    /**
     * Register observer for cleanup
     * These observers will be disconnected when the chart is destroyed
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {Object} observer - Observer instance (ResizeObserver, MutationObserver, etc.)
     * @returns {void}
     */
    registerObserver(chartId, observer) {
        if (!chartId || !observer) {
            console.warn('LifecycleManager: chartId and observer are required');
            return;
        }

        const observers = this.observers.get(chartId) || [];
        observers.push(observer);
        this.observers.set(chartId, observers);

        console.log(`LifecycleManager: Observer registered for ${chartId}`);
    }

    /**
     * Get all chart IDs in registry
     * 
     * @returns {string[]} - Array of chart IDs
     */
    getAllChartIds() {
        return Array.from(this.chartRegistry.keys());
    }

    /**
     * Get registry size
     * 
     * @returns {number} - Number of charts in registry
     */
    getRegistrySize() {
        return this.chartRegistry.size;
    }

    /**
     * Destroy all charts
     * Cleans up all charts in the registry
     * 
     * @returns {void}
     */
    destroyAll() {
        console.log('LifecycleManager: Destroying all charts');

        const chartIds = this.getAllChartIds();
        
        for (const chartId of chartIds) {
            try {
                this.destroyChart(chartId);
            } catch (error) {
                console.error(`LifecycleManager: Error destroying chart ${chartId}`, error);
            }
        }

        // Clear all registries
        this.chartRegistry.clear();
        this.eventListeners.clear();
        this.observers.clear();

        console.log('LifecycleManager: All charts destroyed');
    }

    /**
     * Reset the lifecycle manager
     * Destroys all charts and clears all state
     * 
     * @returns {void}
     */
    reset() {
        console.log('LifecycleManager: Resetting');
        this.destroyAll();
        console.log('LifecycleManager: Reset complete');
    }
}

/**
 * Error Recovery Handler
 * 
 * Handles rendering errors with retry logic and user feedback.
 * Implements exponential backoff and failure tracking.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
class ErrorRecoveryHandler {
    constructor() {
        // Maximum retry attempts
        this.maxRetries = 3;
        
        // Base delay for exponential backoff (in milliseconds)
        this.baseDelay = 100;
        
        // Retry attempts tracking - Map of chartId to attempt count
        this.retryAttempts = new Map();
        
        // Failed charts tracking - Map of chartId to error information
        this.failedCharts = new Map();
        
        // Error logs - Array of error log entries
        this.errorLogs = [];
    }

    /**
     * Handle render error
     * Implements retry logic with exponential backoff
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {Error} error - Error that occurred during rendering
     * @param {number} attempt - Current attempt number (1-based)
     * @returns {Promise<boolean>} - Promise that resolves to true if should retry, false otherwise
     */
    async handleError(chartId, error, attempt) {
        if (!chartId) {
            throw new Error('ErrorRecoveryHandler: chartId is required');
        }

        if (!error) {
            throw new Error('ErrorRecoveryHandler: error is required');
        }

        console.error(`ErrorRecoveryHandler: Handling error for chart ${chartId}, attempt ${attempt}`, error);

        // Log the error
        this._logError(chartId, error, attempt);

        // Update retry attempts tracking
        this.retryAttempts.set(chartId, attempt);

        // Check if should retry
        if (this.shouldRetry(chartId, attempt)) {
            // Calculate retry delay
            const delay = this.getRetryDelay(attempt);
            
            console.log(`ErrorRecoveryHandler: Will retry chart ${chartId} after ${delay}ms (attempt ${attempt}/${this.maxRetries})`);

            // Wait for the delay
            await this._sleep(delay);

            return true; // Should retry
        } else {
            // Max retries reached - mark as failed
            console.error(`ErrorRecoveryHandler: Max retries reached for chart ${chartId}, marking as failed`);
            this.markFailed(chartId, error);

            return false; // Should not retry
        }
    }

    /**
     * Check if should retry
     * Verifies if the chart hasn't exceeded max retry attempts
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {number} attempt - Current attempt number (1-based)
     * @returns {boolean} - True if should retry, false otherwise
     */
    shouldRetry(chartId, attempt) {
        if (!chartId) {
            console.warn('ErrorRecoveryHandler: chartId is required for shouldRetry');
            return false;
        }

        // Check if attempt is within max retries
        const shouldRetry = attempt < this.maxRetries;

        console.log(`ErrorRecoveryHandler: Should retry ${chartId}? ${shouldRetry} (attempt ${attempt}/${this.maxRetries})`);

        return shouldRetry;
    }

    /**
     * Get retry delay with exponential backoff
     * Calculates delay as: baseDelay * 2^(attempt-1)
     * - Attempt 1: 100ms
     * - Attempt 2: 200ms
     * - Attempt 3: 400ms
     * 
     * @param {number} attempt - Current attempt number (1-based)
     * @returns {number} - Delay in milliseconds
     */
    getRetryDelay(attempt) {
        if (typeof attempt !== 'number' || attempt < 1) {
            console.warn('ErrorRecoveryHandler: Invalid attempt number, using default delay');
            return this.baseDelay;
        }

        // Calculate exponential backoff: baseDelay * 2^(attempt-1)
        const delay = this.baseDelay * Math.pow(2, attempt - 1);

        console.log(`ErrorRecoveryHandler: Retry delay for attempt ${attempt}: ${delay}ms`);

        return delay;
    }

    /**
     * Mark chart as failed
     * Records the chart as permanently failed with error information
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {Error} error - Final error that caused failure
     * @returns {void}
     */
    markFailed(chartId, error) {
        if (!chartId) {
            console.warn('ErrorRecoveryHandler: chartId is required for markFailed');
            return;
        }

        console.error(`ErrorRecoveryHandler: Marking chart ${chartId} as failed`, error);

        // Get retry attempt count
        const attempts = this.retryAttempts.get(chartId) || 0;

        // Store failure information
        const failureInfo = {
            chartId,
            error: {
                message: error?.message || 'Unknown error',
                stack: error?.stack || '',
                name: error?.name || 'Error'
            },
            attempts,
            timestamp: new Date().toISOString(),
            failedAt: Date.now()
        };

        this.failedCharts.set(chartId, failureInfo);

        // Log the failure
        console.error(`ErrorRecoveryHandler: Chart ${chartId} marked as failed after ${attempts} attempts`, failureInfo);

        // Log to error logs
        this._logError(chartId, error, attempts, true);
    }

    /**
     * Check if chart is marked as failed
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {boolean} - True if chart is marked as failed
     */
    isFailed(chartId) {
        if (!chartId) {
            return false;
        }

        return this.failedCharts.has(chartId);
    }

    /**
     * Get failure information for a chart
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {Object|null} - Failure information or null if not failed
     */
    getFailureInfo(chartId) {
        if (!chartId) {
            return null;
        }

        return this.failedCharts.get(chartId) || null;
    }

    /**
     * Get retry attempt count for a chart
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {number} - Number of retry attempts
     */
    getRetryCount(chartId) {
        if (!chartId) {
            return 0;
        }

        return this.retryAttempts.get(chartId) || 0;
    }

    /**
     * Reset error state for a chart
     * Clears retry attempts and failure status
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {void}
     */
    resetChart(chartId) {
        if (!chartId) {
            console.warn('ErrorRecoveryHandler: chartId is required for reset');
            return;
        }

        console.log(`ErrorRecoveryHandler: Resetting error state for chart ${chartId}`);

        this.retryAttempts.delete(chartId);
        this.failedCharts.delete(chartId);

        console.log(`ErrorRecoveryHandler: Chart ${chartId} error state reset`);
    }

    /**
     * Get all failed chart IDs
     * 
     * @returns {string[]} - Array of failed chart IDs
     */
    getFailedChartIds() {
        return Array.from(this.failedCharts.keys());
    }

    /**
     * Get error logs
     * 
     * @param {number} limit - Maximum number of logs to return (default: all)
     * @returns {Array} - Array of error log entries
     */
    getErrorLogs(limit = null) {
        if (limit && typeof limit === 'number' && limit > 0) {
            return this.errorLogs.slice(-limit);
        }
        return [...this.errorLogs];
    }

    /**
     * Clear all error state
     * Resets all retry attempts, failed charts, and error logs
     * 
     * @returns {void}
     */
    clearAll() {
        console.log('ErrorRecoveryHandler: Clearing all error state');

        this.retryAttempts.clear();
        this.failedCharts.clear();
        this.errorLogs = [];

        console.log('ErrorRecoveryHandler: All error state cleared');
    }

    /**
     * Log error with context information
     * 
     * @private
     * @param {string} chartId - Unique identifier for the chart
     * @param {Error} error - Error that occurred
     * @param {number} attempt - Attempt number
     * @param {boolean} isFinal - Whether this is the final failure
     * @returns {void}
     */
    _logError(chartId, error, attempt, isFinal = false) {
        const logEntry = {
            chartId,
            error: {
                message: error?.message || 'Unknown error',
                stack: error?.stack || '',
                name: error?.name || 'Error'
            },
            attempt,
            isFinal,
            timestamp: new Date().toISOString(),
            loggedAt: Date.now()
        };

        // Add to error logs
        this.errorLogs.push(logEntry);

        // Keep only last 100 error logs to prevent memory issues
        if (this.errorLogs.length > 100) {
            this.errorLogs = this.errorLogs.slice(-100);
        }

        // Log to console
        const logLevel = isFinal ? 'error' : 'warn';
        console[logLevel](`ErrorRecoveryHandler: [${chartId}] Attempt ${attempt}${isFinal ? ' (FINAL)' : ''}:`, error.message);
    }

    /**
     * Sleep utility for async waiting
     * 
     * @private
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Chart Rendering Coordinator
 * 
 * Centralized service that manages all chart rendering operations.
 * Handles library loading, canvas readiness, render queue management,
 * chart lifecycle, and error recovery.
 * 
 * Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 6.4, 6.5
 */

class ChartRenderingCoordinator {
    constructor() {
        // State management
        this.state = {
            libraryLoaded: false,
            domReady: false,
            renderingInProgress: false,
            failedCharts: [],
            successfulCharts: [],
            isPrintMode: false  // Track print mode state
        };

        // Chart registry - stores all registered charts
        this.chartRegistry = new Map();

        // Initialize managers
        this.libraryLoadingManager = new LibraryLoadingManager();
        this.canvasReadinessVerifier = null;
        this.renderQueueManager = new RenderQueueManager();
        this.lifecycleManager = new LifecycleManager();
        this.errorRecoveryHandler = new ErrorRecoveryHandler();

        // Print mode support
        this.graphPrintAdapter = null;  // Will be initialized when needed
        this.printStyleManager = null;  // Will be initialized when needed
        this.printModeHandler = null;   // Handler for beforeprint/afterprint events

        // Initialization flag
        this.initialized = false;

        // Global event listeners for resize and visibility
        this.resizeHandler = null;
        this.visibilityHandler = null;

        // Bind methods to maintain context
        this.initialize = this.initialize.bind(this);
        this.cleanup = this.cleanup.bind(this);
        this.registerChart = this.registerChart.bind(this);
        this.unregisterChart = this.unregisterChart.bind(this);
        this.requestRender = this.requestRender.bind(this);
        this.forceRender = this.forceRender.bind(this);
        this.isReadyToRender = this.isReadyToRender.bind(this);
        this.getState = this.getState.bind(this);
        this._handleGlobalResize = this._handleGlobalResize.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._handleBeforePrint = this._handleBeforePrint.bind(this);
        this._handleAfterPrint = this._handleAfterPrint.bind(this);
    }

    /**
     * Initialize the coordinator
     * Sets up all managers and prepares the system for chart rendering
     * 
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.warn('ChartRenderingCoordinator: Already initialized');
            return;
        }

        try {
            console.log('ChartRenderingCoordinator: Initializing...');

            // Reset state to initial values
            this.state = {
                libraryLoaded: false,
                domReady: false,
                renderingInProgress: false,
                failedCharts: [],
                successfulCharts: []
            };

            // Clear chart registry
            this.chartRegistry.clear();

            // Check if DOM is ready
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                this.state.domReady = true;
            } else {
                // Wait for DOM to be ready
                await new Promise((resolve) => {
                    const handler = () => {
                        this.state.domReady = true;
                        document.removeEventListener('DOMContentLoaded', handler);
                        resolve();
                    };
                    document.addEventListener('DOMContentLoaded', handler);
                });
            }

            // Load Chart.js library
            try {
                await this.libraryLoadingManager.loadChartJS();
                this.state.libraryLoaded = true;
                console.log('ChartRenderingCoordinator: Chart.js library loaded');
            } catch (error) {
                console.error('ChartRenderingCoordinator: Failed to load Chart.js library', error);
                throw new Error('Failed to initialize: Chart.js library could not be loaded');
            }

            // Initialize other managers
            this.canvasReadinessVerifier = new CanvasReadinessVerifier();
            console.log('ChartRenderingCoordinator: Canvas readiness verifier initialized');
            
            // Initialize render queue manager (already instantiated in constructor)
            // Set up render callback for queue manager
            this.renderQueueManager.setRenderCallback(async (chartId) => {
                return await this._renderChartInternal(chartId);
            });
            console.log('ChartRenderingCoordinator: Render queue manager initialized with callback');
            
            // Lifecycle manager already instantiated in constructor
            console.log('ChartRenderingCoordinator: Lifecycle manager initialized');
            
            // Error recovery handler already instantiated in constructor
            console.log('ChartRenderingCoordinator: Error recovery handler initialized');

            // Set up global event listeners for window resize and visibility changes
            // This ensures charts resize when window is resized or when switching tabs
            this._setupGlobalEventListeners();
            console.log('ChartRenderingCoordinator: Global event listeners set up');

            this.initialized = true;
            console.log('ChartRenderingCoordinator: Initialization complete');
        } catch (error) {
            console.error('ChartRenderingCoordinator: Initialization failed', error);
            throw error;
        }
    }

    /**
     * Cleanup the coordinator
     * Destroys all charts, clears state, and releases resources
     * 
     * @returns {void}
     */
    cleanup() {
        console.log('ChartRenderingCoordinator: Cleaning up...');

        try {
            // Destroy all registered charts using lifecycle manager
            if (this.lifecycleManager) {
                this.lifecycleManager.destroyAll();
                console.log('ChartRenderingCoordinator: All charts destroyed via lifecycle manager');
            }

            // Clear chart registry
            this.chartRegistry.clear();

            // Cleanup managers
            if (this.canvasReadinessVerifier) {
                this.canvasReadinessVerifier.cleanup();
            }

            if (this.renderQueueManager) {
                this.renderQueueManager.reset();
            }

            // Remove global event listeners
            this._removeGlobalEventListeners();

            // Reset state
            this.state = {
                libraryLoaded: false,
                domReady: false,
                renderingInProgress: false,
                failedCharts: [],
                successfulCharts: []
            };

            // Reset initialization flag
            this.initialized = false;

            console.log('ChartRenderingCoordinator: Cleanup complete');
        } catch (error) {
            console.error('ChartRenderingCoordinator: Cleanup failed', error);
        }
    }

    /**
     * Register a chart for rendering
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @param {Object} config - Chart configuration
     * @param {React.RefObject} config.canvasRef - Reference to canvas element
     * @param {string} config.chartType - Type of chart (bar, line, pie, etc.)
     * @param {Object} config.data - Chart data
     * @param {Object} config.options - Chart options
     * @param {string[]} config.dependencies - IDs of charts that must render first
     * @param {number} config.priority - Render priority (higher = earlier)
     * @returns {void}
     */
    registerChart(chartId, config) {
        if (!chartId) {
            throw new Error('ChartRenderingCoordinator: chartId is required');
        }

        if (!config || !config.canvasRef) {
            throw new Error('ChartRenderingCoordinator: config.canvasRef is required');
        }

        console.log(`ChartRenderingCoordinator: Registering chart ${chartId}`);

        // Create registry entry
        const entry = {
            id: chartId,
            canvasRef: config.canvasRef,
            chartInstance: null,
            config: {
                chartType: config.chartType || 'bar',
                data: config.data || {},
                options: config.options || {},
                dependencies: config.dependencies || [],
                priority: config.priority || 0
            },
            status: 'pending',
            lastError: null,
            retryCount: 0
        };

        // Store in registry
        this.chartRegistry.set(chartId, entry);

        console.log(`ChartRenderingCoordinator: Chart ${chartId} registered successfully`);
    }

    /**
     * Unregister a chart
     * Destroys the chart instance and removes it from the registry
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {void}
     */
    unregisterChart(chartId) {
        if (!chartId) {
            console.warn('ChartRenderingCoordinator: chartId is required for unregister');
            return;
        }

        console.log(`ChartRenderingCoordinator: Unregistering chart ${chartId}`);

        const entry = this.chartRegistry.get(chartId);
        if (!entry) {
            console.warn(`ChartRenderingCoordinator: Chart ${chartId} not found in registry`);
            return;
        }

        try {
            // Use lifecycle manager to destroy chart
            if (entry.chartInstance && this.lifecycleManager) {
                this.lifecycleManager.destroyChart(chartId);
            }

            // Remove from registry
            this.chartRegistry.delete(chartId);

            // Remove from state tracking arrays
            this.state.successfulCharts = this.state.successfulCharts.filter(id => id !== chartId);
            this.state.failedCharts = this.state.failedCharts.filter(id => id !== chartId);

            console.log(`ChartRenderingCoordinator: Chart ${chartId} unregistered successfully`);
        } catch (error) {
            console.error(`ChartRenderingCoordinator: Error unregistering chart ${chartId}`, error);
        }
    }

    /**
     * Request chart render (queued)
     * Adds the chart to the render queue for processing
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {Promise<Object>} - Promise that resolves with the chart instance
     */
    async requestRender(chartId) {
        if (!chartId) {
            throw new Error('ChartRenderingCoordinator: chartId is required');
        }

        const entry = this.chartRegistry.get(chartId);
        if (!entry) {
            throw new Error(`ChartRenderingCoordinator: Chart ${chartId} not registered`);
        }

        console.log(`ChartRenderingCoordinator: Render requested for chart ${chartId}`);

        // Use render queue manager
        if (this.renderQueueManager) {
            return this.renderQueueManager.enqueue(
                chartId, 
                entry.config.priority, 
                entry.config.dependencies
            );
        }

        // Fallback: Return a resolved promise if queue manager not available
        console.warn('ChartRenderingCoordinator: Render queue manager not available');
        return Promise.resolve(null);
    }

    /**
     * Force immediate render (bypass queue)
     * Renders the chart immediately without queuing
     * 
     * @param {string} chartId - Unique identifier for the chart
     * @returns {Promise<Object>} - Promise that resolves with the chart instance
     */
    async forceRender(chartId) {
        if (!chartId) {
            throw new Error('ChartRenderingCoordinator: chartId is required');
        }

        const entry = this.chartRegistry.get(chartId);
        if (!entry) {
            throw new Error(`ChartRenderingCoordinator: Chart ${chartId} not registered`);
        }

        console.log(`ChartRenderingCoordinator: Force render requested for chart ${chartId}`);

        // Render immediately bypassing the queue
        try {
            const chartInstance = await this._renderChartInternal(chartId);
            return chartInstance;
        } catch (error) {
            console.error(`ChartRenderingCoordinator: Force render failed for chart ${chartId}`, error);
            throw error;
        }
    }

    /**
     * Internal method to render a chart
     * Uses all managers to coordinate the rendering process
     * 
     * @private
     * @param {string} chartId - Unique identifier for the chart
     * @returns {Promise<Object>} - Promise that resolves with the chart instance
     */
    async _renderChartInternal(chartId) {
        if (!chartId) {
            throw new Error('ChartRenderingCoordinator: chartId is required');
        }

        const entry = this.chartRegistry.get(chartId);
        if (!entry) {
            throw new Error(`ChartRenderingCoordinator: Chart ${chartId} not registered`);
        }

        console.log(`ChartRenderingCoordinator: Starting internal render for chart ${chartId}`);

        // #region agent log
        try {
            fetch('http://127.0.0.1:7242/ingest/36b80014-4a16-4bd1-8a7c-ecd551ae87f9', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'initial',
                    hypothesisId: 'H2',
                    location: 'ChartRenderingCoordinator._renderChartInternal',
                    message: 'Starting internal render for chart',
                    data: {
                        chartId,
                        state: {
                            libraryLoaded: this.state.libraryLoaded,
                            domReady: this.state.domReady,
                            renderingInProgress: this.state.renderingInProgress
                        }
                    },
                    timestamp: Date.now()
                })
            }).catch(() => {});
        } catch (e) {}
        // #endregion

        // Update status
        entry.status = 'rendering';
        this.state.renderingInProgress = true;

        let attempt = entry.retryCount + 1;
        let chartInstance = null;

        try {
            // Step 1: Verify library is loaded
            if (!this.libraryLoadingManager.isLoaded()) {
                throw new Error('Chart.js library not loaded');
            }

            // Step 2: Wait for canvas to be ready
            console.log(`ChartRenderingCoordinator: Waiting for canvas readiness for ${chartId}`);
            const dimensions = await this.canvasReadinessVerifier.waitForCanvas(entry.canvasRef);

            if (!dimensions.ready) {
                console.warn(`ChartRenderingCoordinator: Canvas not ready for ${chartId}, forcing dimensions`);
                this.canvasReadinessVerifier.forceCanvasDimensions(entry.canvasRef);
                
                // Wait a bit after forcing dimensions
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Step 3: Get canvas element
            const canvas = entry.canvasRef.current;
            if (!canvas) {
                throw new Error('Canvas element not available');
            }

            // Step 4: Create or update chart using lifecycle manager
            console.log(`ChartRenderingCoordinator: Creating/updating chart ${chartId} via lifecycle manager`);
            
            if (this.lifecycleManager.hasChart(chartId)) {
                // Chart exists - update it
                console.log(`ChartRenderingCoordinator: Updating existing chart ${chartId}`);
                this.lifecycleManager.updateChart(chartId, entry.config.data, entry.config.options);
                chartInstance = this.lifecycleManager.getChart(chartId);
            } else {
                // Chart doesn't exist - create it
                console.log(`ChartRenderingCoordinator: Creating new chart ${chartId}`);
                chartInstance = this.lifecycleManager.createChart(chartId, canvas, {
                    type: entry.config.chartType,
                    data: entry.config.data,
                    options: entry.config.options
                });
            }

            // Step 5: Update entry with chart instance
            entry.chartInstance = chartInstance;
            entry.status = 'success';
            entry.lastError = null;
            entry.retryCount = 0;

            // Step 6: Force chart resize after creation to ensure visibility
            // This fixes the issue where charts render but aren't visible until F12 is pressed
            if (chartInstance && typeof chartInstance.resize === 'function') {
                // Use requestAnimationFrame to ensure DOM is fully laid out
                requestAnimationFrame(() => {
                    try {
                        chartInstance.resize();
                        console.log(`ChartRenderingCoordinator: Forced resize for chart ${chartId}`);
                    } catch (resizeError) {
                        console.warn(`ChartRenderingCoordinator: Error resizing chart ${chartId}`, resizeError);
                    }
                });
                
                // Also resize after a short delay to catch any late layout changes
                setTimeout(() => {
                    try {
                        if (chartInstance && typeof chartInstance.resize === 'function') {
                            chartInstance.resize();
                            console.log(`ChartRenderingCoordinator: Delayed resize for chart ${chartId}`);
                        }
                    } catch (resizeError) {
                        console.warn(`ChartRenderingCoordinator: Error in delayed resize for chart ${chartId}`, resizeError);
                    }
                }, 300);
            }

            // Step 7: Set up ResizeObserver to watch container for size changes
            if (canvas && canvas.parentElement && typeof ResizeObserver !== 'undefined') {
                try {
                    const resizeObserver = new ResizeObserver(() => {
                        if (chartInstance && typeof chartInstance.resize === 'function') {
                            requestAnimationFrame(() => {
                                try {
                                    chartInstance.resize();
                                } catch (e) {
                                    console.warn(`ChartRenderingCoordinator: Error resizing chart ${chartId} via ResizeObserver`, e);
                                }
                            });
                        }
                    });
                    resizeObserver.observe(canvas.parentElement);
                    
                    // Register observer for cleanup
                    this.lifecycleManager.registerObserver(chartId, resizeObserver);
                    console.log(`ChartRenderingCoordinator: ResizeObserver set up for chart ${chartId}`);
                } catch (observerError) {
                    console.warn(`ChartRenderingCoordinator: Error setting up ResizeObserver for chart ${chartId}`, observerError);
                }
            }

            // Update state
            if (!this.state.successfulCharts.includes(chartId)) {
                this.state.successfulCharts.push(chartId);
            }
            this.state.failedCharts = this.state.failedCharts.filter(id => id !== chartId);

            // Reset error state in error recovery handler
            this.errorRecoveryHandler.resetChart(chartId);

            console.log(`ChartRenderingCoordinator: Chart ${chartId} rendered successfully`);

            return chartInstance;

        } catch (error) {
            console.error(`ChartRenderingCoordinator: Error rendering chart ${chartId}`, error);

            // Update entry
            entry.lastError = error;
            entry.retryCount = attempt;

            // Use error recovery handler to determine if should retry
            const shouldRetry = await this.errorRecoveryHandler.handleError(chartId, error, attempt);

            if (shouldRetry) {
                console.log(`ChartRenderingCoordinator: Retrying render for chart ${chartId}`);
                // Retry the render
                return await this._renderChartInternal(chartId);
            } else {
                // Max retries reached - mark as failed
                entry.status = 'failed';
                
                // Update state
                if (!this.state.failedCharts.includes(chartId)) {
                    this.state.failedCharts.push(chartId);
                }
                this.state.successfulCharts = this.state.successfulCharts.filter(id => id !== chartId);

                console.error(`ChartRenderingCoordinator: Chart ${chartId} failed after ${attempt} attempts`);
                
                // Re-throw the error
                throw error;
            }
        } finally {
            // Clear rendering in progress flag
            this.state.renderingInProgress = false;
        }
    }

    /**
     * Check if ready to render
     * Verifies that all prerequisites for rendering are met
     * 
     * @returns {boolean} - True if ready to render
     */
    isReadyToRender() {
        const ready = this.state.libraryLoaded && 
                     this.state.domReady && 
                     !this.state.renderingInProgress;

        console.log(`ChartRenderingCoordinator: Ready to render: ${ready}`, {
            libraryLoaded: this.state.libraryLoaded,
            domReady: this.state.domReady,
            renderingInProgress: this.state.renderingInProgress
        });

        return ready;
    }

    /**
     * Get current state
     * Returns a copy of the current coordinator state
     * 
     * @returns {Object} - Current state object
     */
    getState() {
        return {
            ...this.state,
            failedCharts: [...this.state.failedCharts],
            successfulCharts: [...this.state.successfulCharts]
        };
    }

    /**
     * Set up global event listeners for window resize and visibility changes
     * This ensures charts resize properly when window is resized or when switching tabs
     * 
     * @private
     * @returns {void}
     */
    _setupGlobalEventListeners() {
        // Debounce resize handler to avoid excessive calls
        let resizeTimeout = null;
        this.resizeHandler = () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(() => {
                this._handleGlobalResize();
            }, 150);
        };

        // Visibility change handler (for tab switching)
        this.visibilityHandler = () => {
            this._handleVisibilityChange();
        };

        // Print mode handlers - ENABLED for print functionality
        this.printModeHandler = {
            beforePrint: () => this._handleBeforePrint(),
            afterPrint: () => this._handleAfterPrint()
        };

        // Chart re-render handler (triggered by print cleanup)
        this.chartRerenderHandler = (event) => {
            console.log('ChartRenderingCoordinator: Received chart re-render request', event.detail);
            this._rerenderAllCharts();
        };

        // Add event listeners
        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);

        // IMPORTANT:
        // The chart-specific beforeprint/afterprint handlers were causing layout
        // breakage and charts disappearing after the print dialog was closed.
        // We now rely on the PrintHandlerService + charts:rerender events to
        // refresh charts after print, and intentionally DO NOT hook into the
        // global beforeprint/afterprint events here.
        //
        // This keeps the on-screen dashboard layout stable when the user opens
        // and cancels the print dialog.

        // Chart re-render listener for print cleanup (triggered by PrintHandlerService)
        window.addEventListener('charts:rerender', this.chartRerenderHandler);

        console.log('ChartRenderingCoordinator: Global event listeners added (print-safe mode enabled)');
    }

    /**
     * Remove global event listeners
     * 
     * @private
     * @returns {void}
     */
    _removeGlobalEventListeners() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.visibilityHandler = null;
        }

        // Print handlers enabled - cleanup needed
        if (this.printModeHandler) {
            window.removeEventListener('beforeprint', this.printModeHandler.beforePrint);
            window.removeEventListener('afterprint', this.printModeHandler.afterPrint);
            this.printModeHandler = null;
        }

        // Chart re-render handler cleanup
        if (this.chartRerenderHandler) {
            window.removeEventListener('charts:rerender', this.chartRerenderHandler);
            this.chartRerenderHandler = null;
        }

        console.log('ChartRenderingCoordinator: Global event listeners removed');
    }

    /**
     * Handle global window resize event
     * Resizes all registered charts
     * 
     * @private
     * @returns {void}
     */
    _handleGlobalResize() {
        console.log('ChartRenderingCoordinator: Handling global resize event');

        // Resize all registered charts
        for (const [chartId, entry] of this.chartRegistry.entries()) {
            if (entry.chartInstance && typeof entry.chartInstance.resize === 'function') {
                try {
                    entry.chartInstance.resize();
                    console.log(`ChartRenderingCoordinator: Resized chart ${chartId} due to window resize`);
                } catch (error) {
                    console.warn(`ChartRenderingCoordinator: Error resizing chart ${chartId} on window resize`, error);
                }
            }
        }
    }

    /**
     * Handle visibility change event (tab switching)
     * Resizes all registered charts when page becomes visible
     * 
     * @private
     * @returns {void}
     */
    _handleVisibilityChange() {
        // Only resize when page becomes visible (not when hidden)
        if (document.visibilityState === 'visible') {
            console.log('ChartRenderingCoordinator: Page became visible, resizing charts');

            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                // Resize all registered charts
                for (const [chartId, entry] of this.chartRegistry.entries()) {
                    if (entry.chartInstance && typeof entry.chartInstance.resize === 'function') {
                        try {
                            entry.chartInstance.resize();
                            console.log(`ChartRenderingCoordinator: Resized chart ${chartId} due to visibility change`);
                        } catch (error) {
                            console.warn(`ChartRenderingCoordinator: Error resizing chart ${chartId} on visibility change`, error);
                        }
                    }
                }
            });

            // Also resize after a short delay to catch any late layout changes
            setTimeout(() => {
                for (const [chartId, entry] of this.chartRegistry.entries()) {
                    if (entry.chartInstance && typeof entry.chartInstance.resize === 'function') {
                        try {
                            entry.chartInstance.resize();
                        } catch (error) {
                            console.warn(`ChartRenderingCoordinator: Error in delayed resize for chart ${chartId}`, error);
                        }
                    }
                }
            }, 200);
        }
    }

    /**
     * Handle beforeprint event
     * Applies print-specific dimensions to all charts using GraphPrintAdapter
     * and formats legends using LegendFormatter
     * 
     * High-Resolution Rendering Implementation:
     * 1. 2x scale factor for 300 DPI output - Canvas dimensions are doubled
     * 2. SVG charts preserve vector quality - Chart.js uses canvas, but any SVG
     *    elements in the page are handled by CSS (see print-analytics.css)
     * 3. High-quality interpolation for raster images - Canvas context is set to
     *    use 'high' imageSmoothingQuality for bicubic or better interpolation
     * 
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4
     * 
     * @private
     * @returns {void}
     */
    _handleBeforePrint() {
        console.log('ChartRenderingCoordinator: Entering print mode');
        this.state.isPrintMode = true;

        // Initialize GraphPrintAdapter if not already initialized
        if (!this.graphPrintAdapter) {
            try {
                this.graphPrintAdapter = new GraphPrintAdapter();
                console.log('ChartRenderingCoordinator: GraphPrintAdapter initialized');
            } catch (error) {
                console.error('ChartRenderingCoordinator: Failed to initialize GraphPrintAdapter', error);
                // Continue without print adapter - charts will use default dimensions
                return;
            }
        }

        // Initialize PrintStyleManager if not already initialized
        if (!this.printStyleManager) {
            try {
                this.printStyleManager = new PrintStyleManager();
                console.log('ChartRenderingCoordinator: PrintStyleManager initialized');
            } catch (error) {
                console.warn('ChartRenderingCoordinator: Failed to initialize PrintStyleManager', error);
                // Continue without print style manager - will use default paper size
            }
        }

        // Detect paper size
        let paperFormat = 'A4'; // Default
        if (this.printStyleManager) {
            try {
                paperFormat = this.printStyleManager.detectPaperSize();
                console.log(`ChartRenderingCoordinator: Detected paper format: ${paperFormat}`);
            } catch (error) {
                console.warn('ChartRenderingCoordinator: Failed to detect paper size, using A4', error);
            }
        }

        // Apply print dimensions and legend formatting to all registered charts
        for (const [chartId, entry] of this.chartRegistry.entries()) {
            try {
                if (!entry.chartInstance || !entry.canvasRef || !entry.canvasRef.current) {
                    continue;
                }

                const canvas = entry.canvasRef.current;
                const chartType = entry.config.chartType || 'bar';

                // Get original dimensions
                const rect = canvas.getBoundingClientRect();
                const originalWidth = rect.width || 600;
                const originalHeight = rect.height || 400;
                const originalAspectRatio = originalWidth / originalHeight;

                // Calculate print dimensions using GraphPrintAdapter
                const printDimensions = this.graphPrintAdapter.calculatePrintDimensions(
                    paperFormat,
                    chartType,
                    originalAspectRatio
                );

                console.log(`ChartRenderingCoordinator: Print dimensions for ${chartId}:`, {
                    original: { width: originalWidth, height: originalHeight },
                    print: printDimensions,
                    paperFormat
                });

                // Store original dimensions and options for restoration
                if (!entry.originalDimensions) {
                    entry.originalDimensions = {
                        width: originalWidth,
                        height: originalHeight,
                        canvasWidth: canvas.width,
                        canvasHeight: canvas.height,
                        styleWidth: canvas.style.width,
                        styleHeight: canvas.style.height
                    };
                }

                // Store original legend options for restoration
                // We need to distinguish between:
                // - Charts that had explicit legend options configured
                // - Charts that were using Chart.js defaults (no legend options object)
                //
                // To do this safely we:
                // - Store a deep copy of the legend options when they exist
                // - Store a sentinel value (null) when no legend options were defined
                //
                // This allows the afterprint handler to fully restore the original
                // configuration, including removing any legend options we added only
                // for print mode. Without this, charts that relied on defaults would
                // keep the print legend layout after printing, deforming the layout
                // until the page is refreshed.
                if (typeof entry.originalLegendOptions === 'undefined') {
                    const hasLegendOptions = !!(entry.chartInstance.options && entry.chartInstance.options.plugins && entry.chartInstance.options.plugins.legend);

                    if (hasLegendOptions) {
                        entry.originalLegendOptions = JSON.parse(JSON.stringify(entry.chartInstance.options.plugins.legend));
                    } else {
                        // Sentinel meaning "no explicit legend options before print"
                        entry.originalLegendOptions = null;
                    }
                }

                // Store original colors for restoration (BEFORE any print mode modifications)
                if (!entry.originalColors && entry.chartInstance.data?.datasets) {
                    entry.originalColors = {
                        datasets: entry.chartInstance.data.datasets.map(dataset => {
                            const colors = {};
                            
                            // Deep copy backgroundColor
                            if (dataset.backgroundColor !== undefined) {
                                if (Array.isArray(dataset.backgroundColor)) {
                                    colors.backgroundColor = [...dataset.backgroundColor];
                                } else {
                                    colors.backgroundColor = dataset.backgroundColor;
                                }
                            }
                            
                            // Deep copy borderColor
                            if (dataset.borderColor !== undefined) {
                                if (Array.isArray(dataset.borderColor)) {
                                    colors.borderColor = [...dataset.borderColor];
                                } else {
                                    colors.borderColor = dataset.borderColor;
                                }
                            }
                            
                            return colors;
                        })
                    };
                    console.log(`ChartRenderingCoordinator: Stored original colors for chart ${chartId}`);
                }

                // Convert mm to pixels (assuming 96 DPI for screen)
                const mmToPixels = (mm) => (mm * 96) / 25.4;
                const printWidthPx = mmToPixels(printDimensions.width);
                const printHeightPx = mmToPixels(printDimensions.height);

                // Apply print dimensions to canvas
                canvas.style.width = `${printWidthPx}px`;
                canvas.style.height = `${printHeightPx}px`;
                
                // Apply scale factor for high-DPI rendering
                canvas.width = printWidthPx * printDimensions.scale;
                canvas.height = printHeightPx * printDimensions.scale;

                // Apply high-quality interpolation for raster images
                // This ensures that any raster content (PNG, JPG) in the chart
                // is scaled using high-quality interpolation (bicubic or better)
                if (typeof canvas.getContext === 'function') {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Enable image smoothing with high quality
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        console.log(`ChartRenderingCoordinator: Applied high-quality interpolation for chart ${chartId}`);
                    }
                }

                // Apply legend formatting for print mode
                this._applyLegendFormatting(chartId, entry, printDimensions.width);

                // Resize the chart to fit new dimensions
                if (entry.chartInstance && typeof entry.chartInstance.resize === 'function') {
                    entry.chartInstance.resize();
                    console.log(`ChartRenderingCoordinator: Applied print dimensions to chart ${chartId}`);
                }

                // Update the chart to apply legend changes
                if (entry.chartInstance && typeof entry.chartInstance.update === 'function') {
                    entry.chartInstance.update('none'); // Use 'none' mode to skip animations
                    console.log(`ChartRenderingCoordinator: Updated chart ${chartId} with print legend formatting`);
                }
            } catch (error) {
                console.error(`ChartRenderingCoordinator: Error applying print dimensions to chart ${chartId}`, error);
            }
        }

        console.log('ChartRenderingCoordinator: Print mode setup complete');
    }

    /**
     * Apply legend formatting for print mode
     * Uses LegendFormatter to ensure legends are readable in print
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     * 
     * @private
     * @param {string} chartId - Chart identifier
     * @param {Object} entry - Chart registry entry
     * @param {number} availableWidth - Available width in mm
     * @returns {void}
     */
    _applyLegendFormatting(chartId, entry, availableWidth) {
        try {
            const chartInstance = entry.chartInstance;
            
            // Check if chart has legend enabled
            if (!chartInstance.options?.plugins?.legend?.display) {
                console.log(`ChartRenderingCoordinator: Chart ${chartId} has legend disabled, skipping formatting`);
                return;
            }

            // Extract legend items from chart data
            const legendItems = [];
            const datasets = chartInstance.data?.datasets || [];
            const labels = chartInstance.data?.labels || [];

            // For charts with multiple datasets (line, bar with multiple series)
            if (datasets.length > 1) {
                datasets.forEach((dataset, index) => {
                    legendItems.push({
                        label: dataset.label || `Dataset ${index + 1}`,
                        color: dataset.borderColor || dataset.backgroundColor || '#000000',
                        symbol: this._getSymbolForChartType(entry.config.chartType)
                    });
                });
            } 
            // For charts with single dataset but multiple labels (pie, doughnut)
            else if (datasets.length === 1 && labels.length > 0) {
                const dataset = datasets[0];
                const colors = Array.isArray(dataset.backgroundColor) 
                    ? dataset.backgroundColor 
                    : [dataset.backgroundColor];
                
                labels.forEach((label, index) => {
                    legendItems.push({
                        label: String(label),
                        color: colors[index % colors.length] || '#000000',
                        symbol: this._getSymbolForChartType(entry.config.chartType)
                    });
                });
            }

            if (legendItems.length === 0) {
                console.log(`ChartRenderingCoordinator: No legend items found for chart ${chartId}`);
                return;
            }

            // Calculate available height (reserve space for chart)
            const availableHeight = 50; // mm - reasonable space for legend

            // Format legend using LegendFormatter
            const formattedLegend = legendFormatter.formatForPrint(
                legendItems,
                availableWidth,
                availableHeight
            );

            console.log(`ChartRenderingCoordinator: Formatted legend for ${chartId}:`, {
                itemCount: legendItems.length,
                layout: formattedLegend.layout,
                fontSize: formattedLegend.fontSize,
                columns: formattedLegend.columns
            });

            // Apply formatted legend settings to chart options
            if (!chartInstance.options.plugins) {
                chartInstance.options.plugins = {};
            }
            if (!chartInstance.options.plugins.legend) {
                chartInstance.options.plugins.legend = {};
            }

            const legendOptions = chartInstance.options.plugins.legend;

            // Apply minimum font size (10pt)
            if (!legendOptions.labels) {
                legendOptions.labels = {};
            }
            if (!legendOptions.labels.font) {
                legendOptions.labels.font = {};
            }
            legendOptions.labels.font.size = formattedLegend.fontSize;

            // Apply layout based on formatted legend
            // For horizontal layout with few items
            if (formattedLegend.layout === 'horizontal') {
                legendOptions.position = 'bottom';
                legendOptions.align = 'center';
                if (!legendOptions.labels) legendOptions.labels = {};
                legendOptions.labels.padding = 8;
            }
            // For vertical layout
            else if (formattedLegend.layout === 'vertical') {
                legendOptions.position = 'right';
                legendOptions.align = 'start';
                if (!legendOptions.labels) legendOptions.labels = {};
                legendOptions.labels.padding = 6;
            }
            // For grid layout with many items
            else if (formattedLegend.layout === 'grid') {
                legendOptions.position = 'bottom';
                legendOptions.align = 'start';
                if (!legendOptions.labels) legendOptions.labels = {};
                legendOptions.labels.padding = 6;
                // Note: Chart.js doesn't natively support grid layout for legends
                // The multi-column effect will be achieved through CSS in print-analytics.css
            }

            // Ensure legend is displayed
            legendOptions.display = true;

            // Note: Color contrast adjustments removed to preserve original chart colors in print mode
            // This prevents the color darkening bug (Requirements 1.3)
            // Original colors are now preserved throughout the print process

            console.log(`ChartRenderingCoordinator: Applied legend formatting to chart ${chartId}`);
        } catch (error) {
            console.error(`ChartRenderingCoordinator: Error applying legend formatting to chart ${chartId}`, error);
        }
    }

    /**
     * Get appropriate symbol type for chart type
     * 
     * @private
     * @param {string} chartType - Chart type (bar, line, pie, etc.)
     * @returns {string} - Symbol type ('circle', 'square', or 'line')
     */
    _getSymbolForChartType(chartType) {
        switch (chartType) {
            case 'line':    
                return 'line';
            case 'bar':
            case 'horizontalBar':
                return 'square';
            case 'pie':
            case 'doughnut':
            case 'polarArea':
                return 'circle';
            default:
                return 'circle';
        }
    }

    /**
     * Handle afterprint event
     * Restores original dimensions and legend options to all charts after printing
     * 
     * @private
     * @returns {void}
     */
    _handleAfterPrint() {
        console.log('ChartRenderingCoordinator: Exiting print mode');
        this.state.isPrintMode = false;

        // Restore original dimensions and legend options to all registered charts
        for (const [chartId, entry] of this.chartRegistry.entries()) {
            try {
                if (!entry.chartInstance || !entry.canvasRef || !entry.canvasRef.current) {
                    continue;
                }

                const canvas = entry.canvasRef.current;

                // Restore original dimensions if they were stored
                if (entry.originalDimensions) {
                    const original = entry.originalDimensions;

                    // Restore original dimensions
                    canvas.style.width = original.styleWidth || '';
                    canvas.style.height = original.styleHeight || '';
                    canvas.width = original.canvasWidth;
                    canvas.height = original.canvasHeight;

                    // Clear stored original dimensions
                    delete entry.originalDimensions;
                }

                // Restore original legend options if they were stored
                if (typeof entry.originalLegendOptions !== 'undefined') {
                    // Ensure plugins container exists
                    if (!entry.chartInstance.options) {
                        entry.chartInstance.options = {};
                    }
                    if (!entry.chartInstance.options.plugins) {
                        entry.chartInstance.options.plugins = {};
                    }

                    if (entry.originalLegendOptions === null) {
                        // Chart had no explicit legend options before print.
                        // Remove the legend options we added so Chart.js falls
                        // back to its default legend configuration.
                        delete entry.chartInstance.options.plugins.legend;
                        console.log(`ChartRenderingCoordinator: Removed print legend options for chart ${chartId}`);
                    } else {
                        // Chart had explicit legend options; restore them.
                        entry.chartInstance.options.plugins.legend = JSON.parse(JSON.stringify(entry.originalLegendOptions));
                        console.log(`ChartRenderingCoordinator: Restored original legend options for chart ${chartId}`);
                    }

                    delete entry.originalLegendOptions;
                }

                // Restore original colors if they were stored
                if (entry.originalColors && entry.chartInstance.data?.datasets) {
                    const datasets = entry.chartInstance.data.datasets;
                    const originalDatasets = entry.originalColors.datasets;

                    // Restore colors for each dataset
                    for (let i = 0; i < datasets.length && i < originalDatasets.length; i++) {
                        const dataset = datasets[i];
                        const originalColors = originalDatasets[i];

                        // Restore backgroundColor
                        if (originalColors.backgroundColor !== undefined) {
                            if (Array.isArray(originalColors.backgroundColor)) {
                                dataset.backgroundColor = [...originalColors.backgroundColor];
                            } else {
                                dataset.backgroundColor = originalColors.backgroundColor;
                            }
                        }

                        // Restore borderColor
                        if (originalColors.borderColor !== undefined) {
                            if (Array.isArray(originalColors.borderColor)) {
                                dataset.borderColor = [...originalColors.borderColor];
                            } else {
                                dataset.borderColor = originalColors.borderColor;
                            }
                        }
                    }

                    // Clear stored original colors
                    delete entry.originalColors;
                    console.log(`ChartRenderingCoordinator: Restored original colors for chart ${chartId}`);
                }

                // Check if canvas is visible before restoring
                // Charts that were hidden during print isolation need to wait until visible
                const canvasStyle = window.getComputedStyle(canvas);
                const isVisible = canvasStyle.display !== 'none' && canvasStyle.visibility !== 'hidden';
                
                if (isVisible) {
                    // Canvas is visible - restore immediately
                    // Resize the chart to fit restored dimensions
                    if (entry.chartInstance && typeof entry.chartInstance.resize === 'function') {
                        entry.chartInstance.resize();
                        console.log(`ChartRenderingCoordinator: Restored original dimensions to chart ${chartId}`);
                    }

                    // Update the chart to apply restored legend options and colors
                    if (entry.chartInstance && typeof entry.chartInstance.update === 'function') {
                        entry.chartInstance.update('none'); // Use 'none' mode to skip animations
                    }
                } else {
                    // Canvas is still hidden - schedule restoration for when it becomes visible
                    console.log(`ChartRenderingCoordinator: Chart ${chartId} is hidden, scheduling delayed restoration`);
                    setTimeout(() => {
                        this._retryChartRender(chartId, entry);
                    }, 300);
                }
            } catch (error) {
                console.error(`ChartRenderingCoordinator: Error restoring dimensions to chart ${chartId}`, error);
            }
        }

        console.log('ChartRenderingCoordinator: Print mode cleanup complete');
    }

    /**
     * Re-render all registered charts
     * This is called after print cleanup to restore charts that may have been affected
     * 
     * @private
     * @returns {void}
     */
    _rerenderAllCharts() {
        console.log('ChartRenderingCoordinator: Re-rendering all charts');

        const chartIds = Array.from(this.chartRegistry.keys());
        
        for (const chartId of chartIds) {
            try {
                const entry = this.chartRegistry.get(chartId);
                
                if (!entry) {
                    console.warn(`ChartRenderingCoordinator: Chart ${chartId} not found in registry`);
                    continue;
                }
                
                if (!entry.chartInstance) {
                    console.warn(`ChartRenderingCoordinator: Chart ${chartId} has no instance, attempting to re-create`);
                    // Try to re-create the chart
                    try {
                        this._renderChartInternal(chartId);
                        console.log(`ChartRenderingCoordinator: Successfully re-created chart ${chartId}`);
                    } catch (recreateError) {
                        console.error(`ChartRenderingCoordinator: Failed to re-create chart ${chartId}`, recreateError);
                    }
                    continue;
                }

                // Check if canvas is still in the DOM
                const canvas = entry.canvasRef?.current;
                if (!canvas || !document.body.contains(canvas)) {
                    console.warn(`ChartRenderingCoordinator: Canvas for chart ${chartId} not in DOM, skipping`);
                    continue;
                }

                // Check if canvas is visible
                const canvasStyle = window.getComputedStyle(canvas);
                const isHidden = canvasStyle.display === 'none' || canvasStyle.visibility === 'hidden';
                
                if (isHidden) {
                    console.warn(`ChartRenderingCoordinator: Canvas for chart ${chartId} is hidden, will retry after delay`);
                    
                    // Check if the parent container is also hidden
                    let parent = canvas.parentElement;
                    let parentHidden = false;
                    while (parent && parent !== document.body) {
                        const parentStyle = window.getComputedStyle(parent);
                        if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
                            parentHidden = true;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                    
                    if (parentHidden) {
                        console.log(`ChartRenderingCoordinator: Parent container for chart ${chartId} is hidden, scheduling multiple retries`);
                        // Parent is hidden - schedule multiple retries with increasing delays
                        setTimeout(() => {
                            this._retryChartRender(chartId, entry);
                        }, 200);
                        setTimeout(() => {
                            this._retryChartRender(chartId, entry);
                        }, 500);
                        setTimeout(() => {
                            this._retryChartRender(chartId, entry);
                        }, 1000);
                    } else {
                        // Canvas itself is hidden but parent is visible - shorter retry
                        setTimeout(() => {
                            this._retryChartRender(chartId, entry);
                        }, 300);
                    }
                    continue;
                }

                // Resize the chart to ensure proper dimensions
                if (typeof entry.chartInstance.resize === 'function') {
                    entry.chartInstance.resize();
                }

                // Update the chart to re-render
                if (typeof entry.chartInstance.update === 'function') {
                    entry.chartInstance.update('none'); // Use 'none' mode to skip animations
                }

                console.log(`ChartRenderingCoordinator: Re-rendered chart ${chartId}`);
            } catch (error) {
                console.error(`ChartRenderingCoordinator: Error re-rendering chart ${chartId}`, error);
                
                // If re-rendering fails, try to re-create the chart
                try {
                    console.log(`ChartRenderingCoordinator: Attempting to re-create chart ${chartId} after error`);
                    this._renderChartInternal(chartId);
                } catch (recreateError) {
                    console.error(`ChartRenderingCoordinator: Failed to re-create chart ${chartId}`, recreateError);
                }
            }
        }

        console.log('ChartRenderingCoordinator: Chart re-rendering complete');
    }

    /**
     * Retry rendering a chart that was previously hidden
     * Helper method for delayed retries after sections become visible
     * 
     * @private
     * @param {string} chartId - Chart identifier
     * @param {Object} entry - Chart registry entry
     * @returns {void}
     */
    _retryChartRender(chartId, entry) {
        try {
            // Check if canvas is now visible
            const canvas = entry.canvasRef?.current;
            if (!canvas || !document.body.contains(canvas)) {
                console.warn(`ChartRenderingCoordinator: Canvas for chart ${chartId} still not in DOM`);
                return;
            }

            const canvasStyle = window.getComputedStyle(canvas);
            if (canvasStyle.display === 'none' || canvasStyle.visibility === 'hidden') {
                // Still hidden, will retry again later if needed
                return;
            }

            // Canvas is now visible - re-render the chart
            if (entry.chartInstance) {
                // Force resize to recalculate dimensions
                if (typeof entry.chartInstance.resize === 'function') {
                    entry.chartInstance.resize();
                }
                
                // Update the chart to re-render
                if (typeof entry.chartInstance.update === 'function') {
                    entry.chartInstance.update('none');
                }
                
                console.log(`ChartRenderingCoordinator: Successfully re-rendered chart ${chartId} after retry`);
            } else {
                // Chart instance is missing - try to re-create
                console.log(`ChartRenderingCoordinator: Chart ${chartId} instance missing, attempting to re-create`);
                try {
                    this._renderChartInternal(chartId);
                } catch (recreateError) {
                    console.error(`ChartRenderingCoordinator: Failed to re-create chart ${chartId}`, recreateError);
                }
            }
        } catch (error) {
            console.error(`ChartRenderingCoordinator: Error in retry render for chart ${chartId}`, error);
        }
    }
}

// Export singleton instance
const coordinatorInstance = new ChartRenderingCoordinator();
export default coordinatorInstance;
