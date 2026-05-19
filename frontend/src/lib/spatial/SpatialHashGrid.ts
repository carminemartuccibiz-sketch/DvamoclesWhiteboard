import { isEntirelyOutside, type WorldBounds } from './entityBounds';

/**
 * Uniform spatial hash grid for O(1) insert/remove and sub-linear viewport queries.
 * Each entity is registered in every cell its AABB touches; queries dedupe by id.
 */
export class SpatialHashGrid<T> {
  private readonly cellSize: number;
  private readonly cells = new Map<string, Set<T>>();
  private readonly boundsById = new Map<T, WorldBounds>();

  constructor(cellSize = 512) {
    this.cellSize = Math.max(64, cellSize);
  }

  get size(): number {
    return this.boundsById.size;
  }

  clear(): void {
    this.cells.clear();
    this.boundsById.clear();
  }

  insert(id: T, bounds: WorldBounds): void {
    this.remove(id);
    this.boundsById.set(id, bounds);
    for (const key of cellsForBounds(bounds, this.cellSize)) {
      let bucket = this.cells.get(key);
      if (!bucket) {
        bucket = new Set();
        this.cells.set(key, bucket);
      }
      bucket.add(id);
    }
  }

  remove(id: T): void {
    const bounds = this.boundsById.get(id);
    if (!bounds) return;
    for (const key of cellsForBounds(bounds, this.cellSize)) {
      const bucket = this.cells.get(key);
      bucket?.delete(id);
      if (bucket && bucket.size === 0) this.cells.delete(key);
    }
    this.boundsById.delete(id);
  }

  update(id: T, bounds: WorldBounds): void {
    this.insert(id, bounds);
  }

  getBounds(id: T): WorldBounds | undefined {
    return this.boundsById.get(id);
  }

  /**
   * Return ids whose AABB intersects `rect` (not merely touching the same hash cell).
   */
  query(rect: WorldBounds): T[] {
    const candidates = new Set<T>();
    for (const key of cellsForBounds(rect, this.cellSize)) {
      const bucket = this.cells.get(key);
      if (!bucket) continue;
      for (const id of bucket) candidates.add(id);
    }

    const visible: T[] = [];
    for (const id of candidates) {
      const bounds = this.boundsById.get(id);
      if (bounds && !isEntirelyOutside(rect, bounds)) visible.push(id);
    }
    return visible;
  }
}

function cellsForBounds(bounds: WorldBounds, cellSize: number): string[] {
  const minCellX = Math.floor(bounds.minX / cellSize);
  const maxCellX = Math.floor(bounds.maxX / cellSize);
  const minCellY = Math.floor(bounds.minY / cellSize);
  const maxCellY = Math.floor(bounds.maxY / cellSize);

  const keys: string[] = [];
  for (let cx = minCellX; cx <= maxCellX; cx += 1) {
    for (let cy = minCellY; cy <= maxCellY; cy += 1) {
      keys.push(`${cx},${cy}`);
    }
  }
  return keys;
}
