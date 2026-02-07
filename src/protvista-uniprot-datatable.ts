import {
  LitElement,
  html,
  css,
  nothing,
  type TemplateResult,
  type PropertyValues,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import {
  computeFilteredData,
  computeUniqueValuesByKey,
  getRowId,
  resolvePath,
  safeDisplayValue,
  type Filters,
} from './utils/protvista-uniprot-datatable';

export interface ColumnConfig<T extends Record<string, unknown>> {
  label: string;
  key: keyof T | string;
  filterable?: boolean;
  render?: (
    row: T
  ) => TemplateResult | string | number | undefined | null | typeof nothing;
}

@customElement('protvista-uniprot-datatable')
export class ProtvistaUniprotDatatable<
  T extends Record<string, unknown>,
> extends LitElement {
  @property({ attribute: false })
  data: ReadonlyArray<T> = [];

  @property({ attribute: false })
  columns: ReadonlyArray<ColumnConfig<T>> = [];

  @property({ type: String, attribute: 'selected-id' })
  selectedId?: string;

  @property({ type: String, attribute: 'row-id-key' })
  rowIdKey: keyof T | string = 'id';

  @state()
  private filters: Filters = {};

  @state()
  private filteredData: ReadonlyArray<T> = [];

  @state()
  private uniqueValuesByKey: Record<string, string[]> = {};

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: inherit;
    }

    .scroll-container {
      max-height: var(--protvista-datatable-max-height, 400px);
      overflow-y: auto;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid #eee;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    thead th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #f9f9f9;
      text-transform: uppercase;
    }

    th {
      text-align: left;
      padding: 0.75rem 0.5rem;
      white-space: nowrap;
      vertical-align: top;
      font-weight: 600;
    }

    td {
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
      vertical-align: middle;
    }

    tbody tr {
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
      outline: none;
    }

    tbody tr:hover {
      background-color: #f0f8ff;
    }

    tbody tr:focus-visible {
      background-color: #f0f8ff;
      outline: 2px solid #0053d6;
      outline-offset: -2px;
    }

    tbody tr.active {
      background-color: #e6f3ff;
      box-shadow: inset 4px 0 0 #0053d6;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    select {
      display: block;
      padding: 0.25rem;
      font-size: 0.85rem;
      width: 100%;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: white;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: #777;
      font-style: italic;
    }
  `;

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('data') || changed.has('columns')) {
      this.uniqueValuesByKey = computeUniqueValuesByKey(
        this.data,
        this.columns.map((c) => ({
          key: String(c.key),
          filterable: c.filterable,
        }))
      );
    }

    if (changed.has('data') || changed.has('filters')) {
      this.filteredData = computeFilteredData(this.data, this.filters);

      if (this.selectedId) {
        const idStillExists = this.filteredData.some(
          (r) => getRowId(r, this.rowIdKey) === this.selectedId
        );
        if (!idStillExists) {
          this.selectedId = undefined;
        }
      }
    }
  }

  protected override updated(changed: PropertyValues) {
    if (
      (changed.has('filters') || changed.has('data')) &&
      !this.selectedId &&
      this.filteredData.length
    ) {
      void this.updateComplete.then(() => {
        const firstFocusable =
          this.renderRoot.querySelector<HTMLTableRowElement>(
            'tbody tr[tabindex="0"]'
          ) ??
          this.renderRoot.querySelector<HTMLTableRowElement>(
            'tbody tr[data-id]'
          );
        firstFocusable?.focus();
      });
    }
  }

  private dispatchRowClick(row: T) {
    this.dispatchEvent(
      new CustomEvent<T>('row-click', {
        detail: row,
        bubbles: true,
        composed: true,
      })
    );
  }

  private focusRowById(id: string) {
    const tr = this.renderRoot.querySelector<HTMLTableRowElement>(
      `tbody tr[data-id="${CSS.escape(id)}"]`
    );
    tr?.focus();
  }

  private getActiveIndex(rows: ReadonlyArray<T>): number {
    if (!rows.length) return -1;

    const activeEl = (this.shadowRoot?.activeElement ||
      document.activeElement) as HTMLElement | null;
    const focusedTr = activeEl?.closest?.(
      'tr[data-id]'
    ) as HTMLTableRowElement | null;

    if (focusedTr?.dataset.id) {
      const idx = rows.findIndex(
        (r) => getRowId(r, this.rowIdKey) === focusedTr.dataset.id
      );
      if (idx !== -1) return idx;
    }

    if (this.selectedId) {
      const idx = rows.findIndex(
        (r) => getRowId(r, this.rowIdKey) === this.selectedId
      );
      if (idx !== -1) return idx;
    }

    return 0;
  }

  private selectIndex(nextIndex: number) {
    const rows = this.filteredData;
    if (nextIndex < 0 || nextIndex >= rows.length) return;

    const row = rows[nextIndex];
    const id = getRowId(row, this.rowIdKey);
    if (!id) return;

    this.selectedId = id;
    this.dispatchRowClick(row);

    void this.updateComplete.then(() => this.focusRowById(id));
  }

  private onTBodyClick = (e: Event) => {
    const tr = e
      .composedPath()
      .find((n) => n instanceof HTMLTableRowElement) as
      | HTMLTableRowElement
      | undefined;

    const id = tr?.dataset?.id;
    if (!id) return;

    const idx = this.filteredData.findIndex(
      (r) => getRowId(r, this.rowIdKey) === id
    );
    if (idx !== -1) this.selectIndex(idx);
  };

  private onTBodyKeyDown = (e: KeyboardEvent) => {
    const rows = this.filteredData;
    if (!rows.length) return;

    const current = this.getActiveIndex(rows);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectIndex(Math.min(current + 1, rows.length - 1));
        return;
      case 'ArrowUp':
        e.preventDefault();
        this.selectIndex(Math.max(current - 1, 0));
        return;
      case 'Home':
        e.preventDefault();
        this.selectIndex(0);
        return;
      case 'End':
        e.preventDefault();
        this.selectIndex(rows.length - 1);
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.selectIndex(current);
        return;
      default:
        return;
    }
  };

  private onFilterChange = (e: Event) => {
    e.stopPropagation();
    const select = e.currentTarget as HTMLSelectElement;
    const key = select.dataset['key'];
    if (!key) return;

    const value = select.value;
    const nextFilters = { ...this.filters };

    if (!value) delete nextFilters[key];
    else nextFilters[key] = value;

    this.filters = nextFilters;
  };

  private onFilterClick = (e: Event) => {
    e.stopPropagation();
  };

  private renderCell(col: ColumnConfig<T>, row: T) {
    if (col.render) return col.render(row) ?? nothing;
    const val = resolvePath(row, String(col.key));
    return safeDisplayValue(val);
  }

  private renderFilterDropdown(col: ColumnConfig<T>) {
    if (!col.filterable) return nothing;

    const key = String(col.key);
    const options = this.uniqueValuesByKey[key] ?? [];

    return html`
      <select
        aria-label=${ifDefined(
          col.label ? `Filter by ${col.label}` : undefined
        )}
        data-key=${key}
        .value=${this.filters[key] ?? ''}
        @change=${this.onFilterChange}
        @click=${this.onFilterClick}
      >
        <option value="">All</option>
        ${options.map((val) => html`<option value=${val}>${val}</option>`)}
      </select>
    `;
  }

  private renderNoResults() {
    return html`
      <tr>
        <td colspan=${this.columns.length} class="no-results">
          No matching results found
        </td>
      </tr>
    `;
  }

  override render() {
    return html`
      <div class="scroll-container">
        <table>
          <thead>
            <tr>
              ${this.columns.map(
                (col) => html`
                  <th scope="col">
                    <div class="header-content">
                      <span>${col.label}</span>
                      ${this.renderFilterDropdown(col)}
                    </div>
                  </th>
                `
              )}
            </tr>
          </thead>

          <tbody
            role="listbox"
            aria-label="Results"
            @click=${this.onTBodyClick}
            @keydown=${this.onTBodyKeyDown}
          >
            ${repeat(
              this.filteredData,
              (row, index) => getRowId(row, this.rowIdKey) || String(index),
              (row, index) => {
                const id = getRowId(row, this.rowIdKey);
                const isSelected = id === this.selectedId;
                const isFocusable =
                  isSelected || (!this.selectedId && index === 0);

                return html`
                  <tr
                    data-id=${id || ''}
                    class=${isSelected ? 'active' : ''}
                    role="option"
                    aria-selected=${isSelected ? 'true' : 'false'}
                    tabindex=${isFocusable ? '0' : '-1'}
                  >
                    ${this.columns.map(
                      (col) => html`<td>${this.renderCell(col, row)}</td>`
                    )}
                  </tr>
                `;
              }
            )}
            ${this.filteredData.length === 0 ? this.renderNoResults() : nothing}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'protvista-uniprot-datatable': ProtvistaUniprotDatatable<
      Record<string, unknown>
    >;
  }
}
