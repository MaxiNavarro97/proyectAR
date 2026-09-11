import React from 'react';

/**
 * Primitivas de interfaz.
 *
 * La idea es que las pantallas no escriban clases sueltas: arman la interfaz
 * con estas piezas. Un componente que no existe acá es una decisión que hay que
 * tomar una vez y agregar acá, no resolver a mano en cada lugar donde aparece.
 *
 * Los tamaños, pesos y colores salen de los tokens de tailwind.config.js.
 */

const unir = (...clases) => clases.filter(Boolean).join(' ');

/* ---------- Superficies. Nunca se anidan entre sí. ---------- */

// Zona de entrada: se hunde respecto de la página.
export function Panel({ children, className }) {
  return (
    <div className={unir('bg-panel dark:bg-panel-dark rounded-surface border border-hair dark:border-hair-dark', className)}>
      {children}
    </div>
  );
}

// Zona de salida: se apoya sobre la página.
export function Card({ children, className }) {
  return (
    <div className={unir('bg-card dark:bg-card-dark rounded-surface border border-hair dark:border-hair-dark', className)}>
      {children}
    </div>
  );
}

/* ---------- Texto ---------- */

// `className` reemplaza el margen inferior por defecto, por ejemplo en una
// cabecera donde el titulo comparte fila con botones y el margen lo desalinea.
export function SectionTitle({ icon: Icon, children, aside, className }) {
  return (
    <div className={unir('flex items-center justify-between gap-3', className ?? 'mb-4')}>
      <h3 className="text-title text-ink dark:text-ink-dark flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-faint dark:text-faint-dark shrink-0" />}
        {children}
      </h3>
      {aside}
    </div>
  );
}

export function Label({ children, className }) {
  return <span className={unir('text-label text-muted dark:text-muted-dark', className)}>{children}</span>;
}

export function Hint({ children, className }) {
  return <p className={unir('text-micro text-faint dark:text-faint-dark', className)}>{children}</p>;
}

export function Body({ children, className }) {
  return <p className={unir('text-body text-muted dark:text-muted-dark', className)}>{children}</p>;
}

/* ---------- Campo: etiqueta arriba, control, ayuda abajo ---------- */

export function Field({ label, hint, aside, children, className }) {
  return (
    <div className={unir('text-left', className)}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {label && <Label>{label}</Label>}
          {aside}
        </div>
      )}
      {children}
      {hint && <Hint className="mt-1.5">{hint}</Hint>}
    </div>
  );
}

/* ---------- Dato ---------- */

const TONO = {
  neutral:  'text-ink dark:text-ink-dark',
  positive: 'text-emerald-600 dark:text-emerald-400',
  warning:  'text-amber-600 dark:text-amber-400',
  negative: 'text-rose-600 dark:text-rose-400',
  interest: 'text-orange-600 dark:text-orange-400',
};

export function Stat({ label, value, sub, tone = 'neutral', size = 'stat', aside, className }) {
  return (
    <div className={unir('min-w-0 text-left', className)}>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Label className="truncate">{label}</Label>
        {aside}
      </div>
      <p className={unir(size === 'display' ? 'text-display' : 'text-stat', ' truncate', TONO[tone])}>{value}</p>
      {sub && <Hint className="mt-1 truncate">{sub}</Hint>}
    </div>
  );
}

/* ---------- Elegir una opción entre varias ---------- */
/* Reemplaza los doce toggles que el sitio tenía escritos de cinco formas. */

export function Segmented({ value, onChange, options, size = 'md', block = false, className }) {
  const alto = size === 'sm' ? 'py-1 px-2.5 text-micro' : 'py-2 px-3 text-label';
  return (
    <div className={unir('inline-flex p-0.5 bg-hair dark:bg-hair-dark rounded-control', block && 'flex w-full', className)}>
      {options.map(o => {
        const activo = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={activo}
            className={unir(
              alto,
              'rounded-control transition-colors whitespace-nowrap',
              block && 'flex-1',
              activo
                ? 'bg-indigo-600 text-white'
                : 'text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Procedencia de un dato ---------- */

const PUNTO = {
  official: 'bg-emerald-500',
  assumed:  'bg-amber-500',
  neutral:  'bg-slate-400',
};

export function Badge({ tone = 'neutral', children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-micro bg-hair dark:bg-field-dark text-muted dark:text-muted-dark">
      <span className={unir('w-1.5 h-1.5 rounded-full shrink-0', PUNTO[tone])} />
      {children}
    </span>
  );
}

/* ---------- Aviso ---------- */

const AVISO = {
  info:    'bg-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  warning: 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400',
  danger:  'bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400',
};

export function Notice({ tone = 'info', icon: Icon, children, className }) {
  return (
    <div className={unir('flex items-start gap-2 p-3 rounded-control border text-body', AVISO[tone], className)}>
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ---------- Controles de entrada ---------- */

const CAMPO = 'w-full bg-field dark:bg-field-dark border border-hair dark:border-hair-dark rounded-control px-3 py-2.5 text-stat text-ink dark:text-ink-dark outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors';

// Un número con su unidad pegada al borde (%, UVA, lo que sea).
export function NumberField({ value, onChange, suffix, prefix, placeholder, align = 'left' }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-label text-faint dark:text-faint-dark pointer-events-none">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className={unir(CAMPO, prefix && 'pl-8', suffix && 'pr-9', align === 'center' && 'text-center')}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-label text-faint dark:text-faint-dark pointer-events-none">{suffix}</span>}
    </div>
  );
}
