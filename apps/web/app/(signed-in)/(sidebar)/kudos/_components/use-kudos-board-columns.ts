import { useLayoutEffect, useState } from 'react';

/** How many columns the page's grid has settled on, from its computed tracks. */
function columnsOf(grid: Element) {
  return getComputedStyle(grid)
    .getPropertyValue('grid-template-columns')
    .split(' ')
    .filter(Boolean).length;
}

/**
 * How many cards stand across the board, read back from the grid, so the breakpoints live in one
 * place, its classes. `null` until the page has been measured, which only a browser can do.
 */
export function useKudosBoardColumns(
  gridRef: React.RefObject<Element | null>,
): number | null {
  const [columns, setColumns] = useState<number | null>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }
    const measure = () => setColumns(columnsOf(grid) || null);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridRef]);

  return columns;
}
