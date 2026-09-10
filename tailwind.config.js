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
      fontSize: {
        // Seis pasos, nombrados por rol y no por tamaño. Cada uno trae su peso
        // y su interlineado, así el rol se elige una sola vez.
        display: ['1.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
        stat:    ['1.25rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '500' }],
        title:   ['0.9375rem', { lineHeight: '1.2', fontWeight: '600' }],
        body:    ['0.8125rem', { lineHeight: '1.45', fontWeight: '400' }],
        label:   ['0.75rem', { lineHeight: '1.2', fontWeight: '500' }],
        micro:   ['0.6875rem', { lineHeight: '1.3', fontWeight: '400' }],
      },
      colors: {
        // Texto: cuatro roles. El número de la escala de slate se elige una vez
        // acá y no se vuelve a escribir en ningún componente.
        ink:    { DEFAULT: '#0f172a', dark: '#f8fafc' },
        muted:  { DEFAULT: '#475569', dark: '#94a3b8' },
        faint:  { DEFAULT: '#94a3b8', dark: '#64748b' },
        // Superficies: tres niveles que nunca se anidan entre sí.
        page:   { DEFAULT: '#f8fafc', dark: '#020617' },
        panel:  { DEFAULT: '#f1f5f9', dark: '#0f172a' },
        card:   { DEFAULT: '#ffffff', dark: '#0f172a' },
        field:  { DEFAULT: '#ffffff', dark: '#1e293b' },
        hair:   { DEFAULT: '#e2e8f0', dark: '#1e293b' },
      },
      borderRadius: {
        control: '0.625rem',  // botones, inputs, chips
        surface: '1rem',      // paneles y tarjetas
      },
    },
  },
  plugins: [],
}
