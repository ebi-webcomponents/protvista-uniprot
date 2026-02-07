import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { ifDefined } from 'lit/directives/if-defined.js';

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
  // Table data (array of row objects).
  @property({ attribute: false })
  data: ReadonlyArray<T> = [];

  // Column configuration
  @property({ attribute: false })
  columns: ReadonlyArray<ColumnConfig<T>> = [];

  // Row id to mark as active (e.g. selected row)
  @property({ type: String, attribute: 'selected-id' })
  selectedId?: string;

  // Field name used to compute row IDs (defaults to "id")
  @property({ type: String, attribute: 'row-id-key' })
  rowIdKey: keyof T | string = 'id';

  // Current filters per column key
  @state()
  private filters: Record<string, string> = {};

  // Derived data: filtered rows
  @state()
  private filteredData: ReadonlyArray<T> = [];

  // Derived data: unique values per filterable key
  @state()
  private uniqueValuesByKey: Record<string, string[]> = {};

  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: inherit;
    }
    .scroll-container {
      max-height: var(--protvista-datatable-max-height, 420px);
      overflow-y: auto;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
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
    }
    th {
      text-align: left;
      padding: 0.5rem;
      border-bottom: 2px solid #ddd;
      background: #f9f9f9;
      white-space: nowrap;
      vertical-align: top;
      text-transform: uppercase;
    }
    td {
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
      vertical-align: middle;
    }
    tr {
      cursor: pointer;
      transition: background-color 0.2s;
    }
    tr:hover {
      background-color: #f0f8ff;
    }
    tr.active {
      background-color: #e6f3ff;
      border-left: 4px solid #0053d6;
    }
    select {
      display: block;
      margin-top: 0.25rem;
      padding: 0.2rem;
      font-size: 0.8rem;
      max-width: 100%;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: white;
    }
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .no-results {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `;

  protected override willUpdate(changed: Map<PropertyKey, unknown>) {
    if (changed.has('data') || changed.has('filters')) {
      this.filteredData = this.computeFilteredData();
    }

    if (changed.has('data') || changed.has('columns')) {
      this.uniqueValuesByKey = this.computeUniqueValuesByKey();
    }
  }

  private computeFilteredData(): ReadonlyArray<T> {
    const filters = this.filters;
    const entries = Object.entries(filters);

    if (entries.length === 0) return this.data;

    return this.data.filter((row) =>
      entries.every(([key, filterVal]) => {
        if (!filterVal) return true;
        const rowVal = this.getCellStringValue(row, key);
        return rowVal === filterVal;
      })
    );
  }

  private computeUniqueValuesByKey(): Record<string, string[]> {
    // Generate filter dropdown options
    const result: Record<string, string[]> = {};
    for (const col of this.columns) {
      if (!col.filterable) continue;
      const key = String(col.key);
      result[key] = this.getUniqueValues(key);
    }
    return result;
  }

  private getUniqueValues(key: string): string[] {
    const values = new Set<string>();

    for (const item of this.data) {
      const raw = this.getCellRawValue(item, key);
      const s = raw == null ? '' : String(raw);
      if (s) values.add(s);
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private getRowId(row: T): string {
    const raw = this.getCellRawValue(row, String(this.rowIdKey));
    return raw == null ? '' : String(raw);
  }

  private getCellRawValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  private getCellStringValue(row: T, key: string): string {
    const raw = this.getCellRawValue(row, key);
    return raw == null ? '' : String(raw);
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

  private onRowClick = (e: Event) => {
    const tr = e.currentTarget as HTMLTableRowElement | null;
    const idx = tr?.dataset['index'];
    if (idx == null) return;

    const row = this.filteredData[Number(idx)];
    if (!row) return;

    this.dispatchRowClick(row);
  };

  private onFilterChange = (e: Event) => {
    const select = e.currentTarget as HTMLSelectElement;
    const key = select.dataset['key'];
    if (!key) return;

    const value = select.value;

    // Remove empty filters to keep the object minimal
    const next = { ...this.filters };
    if (!value) {
      delete next[key];
    } else {
      next[key] = value;
    }

    this.filters = next;
  };

  private onFilterClick = (e: Event) => {
    e.stopPropagation();
  };

  private renderCell(col: ColumnConfig<T>, row: T) {
    if (col.render) return col.render(row) ?? nothing;
    const raw = this.getCellRawValue(row, String(col.key));
    return raw == null ? nothing : raw;
  }

  override render() {
    const filteredData = this.filteredData;
    const columns = this.columns;

    return html`
      <div class="scroll-container">
        <table>
          <thead>
            <tr>
              ${columns.map(
                (col) => html`
                  <th scope="col">
                    <div class="header-content">
                      <span>${col.label}</span>
                      ${col.filterable
                        ? html`
                            <select
                              aria-label=${ifDefined(
                                col.label ? `Filter ${col.label}` : undefined
                              )}
                              data-key=${String(col.key)}
                              .value=${this.filters[String(col.key)] ?? ''}
                              @change=${this.onFilterChange}
                              @click=${this.onFilterClick}
                            >
                              <option value="">All</option>
                              ${(
                                this.uniqueValuesByKey[String(col.key)] ?? []
                              ).map(
                                (val) =>
                                  html`<option value=${val}>${val}</option>`
                              )}
                            </select>
                          `
                        : nothing}
                    </div>
                  </th>
                `
              )}
            </tr>
          </thead>
          <tbody>
            ${repeat(
              filteredData,
              (row) => this.getRowId(row),
              (row, index) => html`
                <tr
                  data-index=${index}
                  class=${this.getRowId(row) === (this.selectedId ?? '')
                    ? 'active'
                    : ''}
                  @click=${this.onRowClick}
                >
                  ${columns.map(
                    (col) => html`<td>${this.renderCell(col, row)}</td>`
                  )}
                </tr>
              `
            )}
            ${filteredData.length === 0
              ? html`
                  <tr>
                    <td colspan=${columns.length} class="no-results">
                      No matching results found
                    </td>
                  </tr>
                `
              : nothing}
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
