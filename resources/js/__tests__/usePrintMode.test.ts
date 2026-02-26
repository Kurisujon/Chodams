import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePrintMode } from '../hooks/usePrintMode';

describe('usePrintMode', () => {
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create a mock MediaQueryList
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock window.matchMedia (create it if it doesn't exist)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => {
        if (query === 'print') {
          return mockMediaQueryList;
        }
        return {
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      }),
    });

    // Mock window event listeners
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false initially when not in print mode', () => {
    mockMediaQueryList.matches = false;
    
    const { result } = renderHook(() => usePrintMode());
    
    expect(result.current).toBe(false);
  });

  it('should return true initially when in print mode', () => {
    mockMediaQueryList.matches = true;
    
    const { result } = renderHook(() => usePrintMode());
    
    expect(result.current).toBe(true);
  });

  it('should set up media query listener on mount', () => {
    renderHook(() => usePrintMode());
    
    expect(window.matchMedia).toHaveBeenCalledWith('print');
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should set up beforeprint event listener on mount', () => {
    renderHook(() => usePrintMode());
    
    expect(window.addEventListener).toHaveBeenCalledWith(
      'beforeprint',
      expect.any(Function)
    );
  });

  it('should set up afterprint event listener on mount', () => {
    renderHook(() => usePrintMode());
    
    expect(window.addEventListener).toHaveBeenCalledWith(
      'afterprint',
      expect.any(Function)
    );
  });

  it('should update state when media query changes to print mode', async () => {
    const { result } = renderHook(() => usePrintMode());
    
    expect(result.current).toBe(false);
    
    // Get the change handler that was registered
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls.find(
      call => call[0] === 'change'
    )?.[1];
    
    // Simulate media query change to print mode
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true } as MediaQueryListEvent);
      });
    }
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should update state when media query changes from print mode', async () => {
    mockMediaQueryList.matches = true;
    const { result } = renderHook(() => usePrintMode());
    
    expect(result.current).toBe(true);
    
    // Get the change handler that was registered
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls.find(
      call => call[0] === 'change'
    )?.[1];
    
    // Simulate media query change from print mode
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: false } as MediaQueryListEvent);
      });
    }
    
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should update state when beforeprint event fires', async () => {
    const { result } = renderHook(() => usePrintMode());
    
    expect(result.current).toBe(false);
    
    // Get the beforeprint handler that was registered
    const beforePrintHandler = (window.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'beforeprint'
    )?.[1];
    
    // Simulate beforeprint event
    if (beforePrintHandler) {
      act(() => {
        beforePrintHandler();
      });
    }
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should update state when afterprint event fires', async () => {
    mockMediaQueryList.matches = true;
    const { result } = renderHook(() => usePrintMode());
    
    expect(result.current).toBe(true);
    
    // Get the afterprint handler that was registered
    const afterPrintHandler = (window.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'afterprint'
    )?.[1];
    
    // Simulate afterprint event
    if (afterPrintHandler) {
      act(() => {
        afterPrintHandler();
      });
    }
    
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should clean up media query listener on unmount', () => {
    const { unmount } = renderHook(() => usePrintMode());
    
    unmount();
    
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should clean up beforeprint event listener on unmount', () => {
    const { unmount } = renderHook(() => usePrintMode());
    
    unmount();
    
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'beforeprint',
      expect.any(Function)
    );
  });

  it('should clean up afterprint event listener on unmount', () => {
    const { unmount } = renderHook(() => usePrintMode());
    
    unmount();
    
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'afterprint',
      expect.any(Function)
    );
  });

  it('should handle multiple print mode transitions correctly', async () => {
    const { result } = renderHook(() => usePrintMode());
    
    expect(result.current).toBe(false);
    
    // Get event handlers
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls.find(
      call => call[0] === 'change'
    )?.[1];
    const beforePrintHandler = (window.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'beforeprint'
    )?.[1];
    const afterPrintHandler = (window.addEventListener as any).mock.calls.find(
      (call: any[]) => call[0] === 'afterprint'
    )?.[1];
    
    // Transition 1: Enter print mode via beforeprint
    if (beforePrintHandler) {
      act(() => {
        beforePrintHandler();
      });
    }
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    // Transition 2: Exit print mode via afterprint
    if (afterPrintHandler) {
      act(() => {
        afterPrintHandler();
      });
    }
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
    
    // Transition 3: Enter print mode via media query
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true } as MediaQueryListEvent);
      });
    }
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    // Transition 4: Exit print mode via media query
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: false } as MediaQueryListEvent);
      });
    }
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
