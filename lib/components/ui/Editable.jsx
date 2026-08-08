'use client';

// Fields that read as plain text until edit mode is on. The alternative, a
// separate edit screen, breaks the thing that makes editing useful here: you
// want to change a value and see the recommendation move without leaving it.

export function EditText({ value, onChange, editing, multiline, placeholder, className = '' }) {
  if (!editing) return <span className={className}>{value}</span>;
  return multiline ? (
    <textarea
      className="edit-input"
      value={value}
      rows={2}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ) : (
    <input
      className="edit-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function EditNumber({ value, onChange, editing, suffix = '', prefix = '', min = 0, max, step = 1 }) {
  if (!editing) {
    return (
      <span>
        {prefix}
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        {suffix}
      </span>
    );
  }
  return (
    <span className="edit-num">
      {prefix && <em>{prefix}</em>}
      <input
        className="edit-input"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
      {suffix && <em>{suffix}</em>}
    </span>
  );
}

export function EditSelect({ value, options, onChange, editing }) {
  if (!editing) return <span style={{ textTransform: 'capitalize' }}>{value}</span>;
  return (
    <select className="edit-input edit-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function EditList({ items, onChange, editing, addLabel = 'Add a line' }) {
  if (!editing) {
    return (
      <ul className="reasons">
        {items.map((s, i) => (
          <li key={`${s}-${i}`}>{s}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="edit-list">
      {items.map((s, i) => (
        <div className="edit-list-row" key={i}>
          <textarea
            className="edit-input"
            rows={2}
            value={s}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button
            className="btn ghost edit-drop"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label={`Remove line ${i + 1}`}
          >
            Remove
          </button>
        </div>
      ))}
      <button className="btn" onClick={() => onChange([...items, ''])}>
        {addLabel}
      </button>
    </div>
  );
}

export function EditBar({ editing, canEdit, onToggle, onReset, label = 'this record' }) {
  if (!canEdit) {
    return <span className="pill">Read only · agent account</span>;
  }
  return (
    <span className="edit-bar">
      {editing && onReset && (
        <button className="btn ghost" onClick={onReset}>
          Reset demo data
        </button>
      )}
      <button className={`btn ${editing ? 'primary' : ''}`} onClick={onToggle}>
        {editing ? 'Done editing' : `Edit ${label}`}
      </button>
    </span>
  );
}
