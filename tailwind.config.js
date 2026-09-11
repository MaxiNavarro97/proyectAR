/** @type {import('tailwindcss').Config} */

// El sistema visual vive acá. La regla es que ningún componente invente un
// tamaño, un peso o un color de texto: si hace falta uno nuevo, se agrega en
// esta tabla y se usa por su nombre. Así dos cosas que son lo mismo no pueden
// terminar viéndose distinto.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Una sola familia para todo el sitio, numeros incluidos. Las cifras
      // se alinean con tabular-nums (ver index.css), no con una monoespaciada.
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Seis pasos, nombrados por rol y no por tamaño. Cada uno trae su peso
        // y su interlineado, así el rol se elige una sola vez.
        display: ['1.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
        stat:    ['1.25rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '500' }],
        title:   ['0.9375rem', { lineHeight: '1.2', fontWeight: '600' }],
        body:    ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        label:   ['0.75rem', { lineHeight: '1.2', fontWeight: '500' }],
        micro:   ['0.75rem', { lineHeight: '1.35', fontWeight: '400' }],
      },
      colors: {
        // Texto: cuatro roles. El número de la escala de slate se elige una vez
        // acá y no se vuelve a escribir en ningún componente.
        ink:    { DEFAULT: '#0f172a', dark: '#f8fafc' },
        muted:  { DEFAULT: '#475569', dark: '#94a3b8' },
        faint:  { DEFAULT: '#94a3b8', dark: '#64748b' },
        // Superficies: tres niveles que nunca se anidan entre sí.
        // Cuatro escalones de luminosidad que tienen que distinguirse SIEMPRE,
        // en los dos temas: la pagina es el fondo, el panel se hunde, la
        // tarjeta se eleva y el campo es el hueco donde se escribe.
        page:   { DEFAULT: '#f1f5f9', dark: '#020617' },
        panel:  { DEFAULT: '#e9eef5', dark: '#0d1526' },
        card:   { DEFAULT: '#ffffff', dark: '#161f33' },
        field:  { DEFAULT: '#ffffff', dark: '#0a111f' },
        hair:   { DEFAULT: '#dde5ee', dark: '#243044' },
        // Color de accion de cada seccion: indigo en creditos, verde en
        // alquileres. Sale de una variable CSS, asi cada pantalla lo cambia
        // sin que los componentes tengan que saber en que seccion estan.
        acento: 'rgb(var(--acento) / <alpha-value>)',
      },
      borderRadius: {
        control: '0.625rem',  // botones, inputs, chips
        surface: '1rem',      // paneles y tarjetas
      },
    },
  },
  plugins: [],
}
