/**
 * New-session statistics card, rebuilt as plain DOM.
 *
 * The reference panel (Claude Desktop's Code tab) is a 480px card: a 3×2 grid
 * of stat tiles, a 26×7 contribution heatmap and one footer sentence. It is
 * drawn imperatively because the card lives in its own container next to the
 * host's greeting, not in a slot the host renders — so there is no React root
 * to render into and no shared-library dependency to declare.
 *
 * Geometry and colour come from the reference: the card is 5% black over the
 * canvas, a tile 10% black over the card, the heat steps are the reference's
 * own `hsl(217 70% L%)` at L = 72/64/56/48, and everything visible is a theme
 * variable (see `theme/tokens.css`). Measured against the source card and the
 * @2x reference screenshot, which agree pixel for pixel.
 */

/** Marks the card container; the compatibility layer positions it. */
export const CARD_ATTRIBUTE = 'data-ccd-stats-card';

/** Heatmap columns and rows. 26×7 = 182 days, as the reference draws it. */
export const HEAT_COLUMNS = 26;
export const HEAT_ROWS = 7;

/** One stat tile: a footnote label above a semibold value. */
export interface StatsTile {
  readonly label: string;
  readonly value: string;
}

/** Everything the card needs to draw itself. */
export interface StatsCardData {
  /** Header tabs; the first is the active one. */
  readonly tabs: readonly string[];
  readonly tiles: readonly StatsTile[];
  /** 182 heat levels, 0 = no activity, 1-4 = one of the four steps. */
  readonly heat: readonly number[];
  /** First cell drawn after today: the reference leaves those transparent. */
  readonly futureFrom?: number;
  /** Footer sentence, or null when the reference would draw none. */
  readonly note: string | null;
}

/**
 * Level for one day: `ceil(day / busiest day * 4)` clamped to 0-4, which is the
 * reference's own rule (`L = 80 - ceil(ratio * 4) * 8`).
 *
 * @param value - that day's count.
 * @param peak - the busiest day in the window.
 */
export function heatLevel(value: number, peak: number): number {
  if (value <= 0 || peak <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / peak) * 4)));
}

/**
 * Build the card.
 *
 * @param document - renderer document the card belongs to.
 * @param data - tiles, heat levels and the footer sentence.
 * @returns the detached card element.
 */
export function createStatsCard(document: Document, data: StatsCardData): HTMLElement {
  const card = document.createElement('div');
  card.setAttribute(CARD_ATTRIBUTE, 'true');

  /* Header: the reference's segmented control, reduced to the tab(s) this card
     actually offers. The card sits 20px below the header, as in the reference. */
  const header = document.createElement('div');
  header.className = 'ccd-stats-header';
  for (const [index, label] of data.tabs.entries()) {
    const tab = document.createElement('span');
    tab.className = 'ccd-stats-tab';
    tab.textContent = label;
    if (index === 0) tab.dataset.active = 'true';
    header.append(tab);
  }

  const body = document.createElement('div');
  body.className = 'ccd-stats-body';

  const tiles = document.createElement('div');
  tiles.className = 'ccd-stats-tiles';
  for (const tile of data.tiles) {
    const cell = document.createElement('div');
    cell.className = 'ccd-stats-tile';
    const label = document.createElement('span');
    label.className = 'ccd-stats-label';
    label.textContent = tile.label;
    label.title = tile.label;
    const value = document.createElement('span');
    value.className = 'ccd-stats-value';
    value.textContent = tile.value;
    value.title = tile.value;
    cell.append(label, value);
    tiles.append(cell);
  }

  const heat = document.createElement('div');
  heat.className = 'ccd-stats-heat';
  heat.setAttribute('role', 'img');
  heat.setAttribute('aria-label', 'Daily activity heatmap');
  for (let column = 0; column < HEAT_COLUMNS; column += 1) {
    const col = document.createElement('div');
    col.className = 'ccd-stats-heat-col';
    for (let row = 0; row < HEAT_ROWS; row += 1) {
      const index = column * HEAT_ROWS + row;
      const cell = document.createElement('span');
      cell.className = 'ccd-stats-heat-cell';
      const future = data.futureFrom !== undefined && index >= data.futureFrom;
      cell.dataset.level = future ? 'future' : String(data.heat[index] ?? 0);
      col.append(cell);
    }
    heat.append(col);
  }

  /* The footer sentence belongs to the body group, not to the card's own
     20px rhythm: the reference keeps ~12px between the heatmap and that line.
     A total too small for any book drops the line entirely. */
  body.append(tiles, heat);
  if (data.note !== null) {
    const note = document.createElement('p');
    note.className = 'ccd-stats-note';
    note.textContent = data.note;
    body.append(note);
  }
  card.append(header, body);
  return card;
}
