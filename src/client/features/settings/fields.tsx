import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { FontMenu } from './FontMenu.tsx';
import type { FontMenuLabels } from './FontMenu.tsx';

/**
 * Field rows for the configuration page.
 *
 * The page is the plugin's own settings surface, so it draws its own controls:
 * the host's shared switch and select belong to a package outside this plugin's
 * type baseline, and a copy of an official component is not allowed. The
 * controls below reproduce that surface's shapes and read the same design
 * tokens — capsule switch, bordered select box with a chevron, bordered text
 * field — so the page sits in the host's panel without looking foreign.
 */

/** The chevron a select box carries; drawn here rather than copied. */
function Chevron(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface SwitchRowProps {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/**
 * One boolean row: a labelled sliding switch, the shape the host's own settings
 * rows use.
 * @param props - Identity, copy, current value and the change callback.
 * @returns The row.
 */
export function SwitchRow({ id, label, hint, checked, onChange }: SwitchRowProps): ReactElement {
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  return (
    <div className="ccd-settings-row" data-ccd-row="switch">
      <span className="ccd-settings-label">
        <span className="ccd-settings-name" id={labelId}>{label}</span>
        {hint === undefined ? null : <span className="ccd-settings-hint" id={hintId}>{hint}</span>}
      </span>
      <span className="ccd-settings-control">
        <button
          type="button"
          id={id}
          className="ccd-settings-switch"
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelId}
          {...(hint === undefined ? {} : { 'aria-describedby': hintId })}
          onClick={() => onChange(!checked)}
        >
          <span className="ccd-settings-thumb" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

export interface ColourRowProps {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly value: string;
  readonly placeholder: string;
  readonly resetLabel: string;
  readonly error?: string;
  readonly onChange: (value: string) => void;
  readonly onCommit: () => void;
  readonly onReset: () => void;
}

/**
 * One background-colour row: a bordered hex field, written when it is left.
 * @param props - Identity, copy, current text and callbacks.
 * @returns The row.
 */
export function ColourRow(props: ColourRowProps): ReactElement {
  const { id, label, hint, value, placeholder, resetLabel, error, onChange, onCommit, onReset } = props;
  const labelId = `${id}-label`;
  return (
    <div className="ccd-settings-row" data-ccd-row="colour">
      <span className="ccd-settings-label">
        <span className="ccd-settings-name" id={labelId}>{label}</span>
        {hint === undefined ? null : <span className="ccd-settings-hint">{hint}</span>}
      </span>
      <span className="ccd-settings-control">
        <input
          id={id}
          className="ccd-settings-text ccd-settings-text-short"
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-labelledby={labelId}
          aria-invalid={error !== undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          onBlur={onCommit}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') { event.preventDefault(); onCommit(); }
          }}
        />
        <button type="button" className="ccd-settings-button-quiet" onClick={onReset}>{resetLabel}</button>
      </span>
      {error === undefined ? null : <p className="ccd-settings-error" role="alert">{error}</p>}
    </div>
  );
}

export interface FontRowProps {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly value: string;
  readonly placeholder: string;
  readonly resetLabel: string;
  readonly error?: string;
  /** The open family menu's anchor box, or undefined while it is closed. */
  readonly anchor: HTMLElement | undefined;
  readonly families: readonly string[];
  readonly menuLabels: FontMenuLabels;
  readonly onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onSelect: (family: string) => void;
  readonly onUseText: (text: string) => void;
  readonly onCloseMenu: () => void;
  readonly onReset: () => void;
}

/**
 * One typeface row: a select box that shows the served family and opens the
 * installed-family menu; a family the list does not carry can be typed into
 * that menu's search field.
 * @param props - Identity, copy, current value, menu state and callbacks.
 * @returns The row and, when open, its menu.
 */
export function FontRow(props: FontRowProps): ReactElement {
  const {
    id, label, hint, value, placeholder, resetLabel, error, anchor, families, menuLabels,
    onToggle, onSelect, onUseText, onCloseMenu, onReset,
  } = props;
  const labelId = `${id}-label`;
  return (
    <div className="ccd-settings-row" data-ccd-row="font">
      <span className="ccd-settings-label">
        <span className="ccd-settings-name" id={labelId}>{label}</span>
        {hint === undefined ? null : <span className="ccd-settings-hint">{hint}</span>}
      </span>
      <span className="ccd-settings-control">
        <button
          type="button"
          id={id}
          className="ccd-settings-select"
          data-empty={value === ''}
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={anchor !== undefined}
          onClick={onToggle}
        >
          <span className="ccd-settings-select-value">{value === '' ? placeholder : value}</span>
          <Chevron />
        </button>
        <button type="button" className="ccd-settings-button-quiet" onClick={onReset}>{resetLabel}</button>
      </span>
      {error === undefined ? null : <p className="ccd-settings-error" role="alert">{error}</p>}
      {anchor === undefined ? null : (
        <FontMenu
          anchor={anchor}
          families={families}
          value={value}
          labels={menuLabels}
          onSelect={onSelect}
          onUseText={onUseText}
          onClose={onCloseMenu}
        />
      )}
    </div>
  );
}
