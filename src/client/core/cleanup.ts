import type { Disposer } from '../contracts/ports.ts';

/** Own resources per activation; release in reverse acquisition order. */
export class CleanupScope {
  private readonly cleanups: Disposer[] = [];
  private disposed = false;
  private readonly onError: (error: unknown) => void;

  constructor(onError: (error: unknown) => void = () => {}) {
    this.onError = onError;
  }

  add(cleanup: Disposer): Disposer {
    let active = true;
    const once = () => {
      if (!active) return;
      active = false;
      try { cleanup(); } catch (error) {
        // A reporter failure must not prevent the remaining resources releasing.
        try { this.onError(error); } catch { /* Continue cleanup. */ }
      }
    };
    if (this.disposed) once();
    else this.cleanups.push(once);
    return once;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const cleanup of this.cleanups.splice(0).reverse()) cleanup();
  }
}
