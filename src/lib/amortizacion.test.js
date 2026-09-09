import { describe, it, expect } from 'vitest';
import { cuadroFrances, cuadroAleman } from './amortizacion.js';

// Caso de referencia: 100.000 UVA a 20 años con TNA 4,5%.
const CAPITAL = 100_000;
const TNA = 0.045;
const MESES = 240;

describe('cuadroFrances', () => {
  const cuadro = cuadroFrances(CAPITAL, TNA, MESES);

  it('devuelve una fila por cuota', () => {
    expect(cuadro).toHaveLength(MESES);
  });

  it('mantiene la cuota constante de punta a punta', () => {
    const primera = cuadro[0].cuota;
    const ultima = cuadro[MESES - 1].cuota;
    expect(ultima).toBeCloseTo(primera, 6);
  });

  it('calcula la cuota con la fórmula PMT', () => {
    // PMT = C * r / (1 - (1+r)^-n)
    const r = TNA / 12;
    const pmt = (CAPITAL * r) / (1 - Math.pow(1 + r, -MESES));
    expect(cuadro[0].cuota).toBeCloseTo(pmt, 6);
  });

  it('cancela el saldo en la última cuota', () => {
    expect(cuadro[MESES - 1].saldo).toBeCloseTo(0, 6);
  });

  it('arranca pagando más interés que capital', () => {
    expect(cuadro[0].interes).toBeGreaterThan(cuadro[0].principal);
  });

  it('devuelve exactamente el capital prestado', () => {
    const amortizado = cuadro.reduce((acc, f) => acc + f.principal, 0);
    expect(amortizado).toBeCloseTo(CAPITAL, 6);
  });
});

describe('cuadroAleman', () => {
  const cuadro = cuadroAleman(CAPITAL, TNA, MESES);

  it('amortiza siempre el mismo capital', () => {
    expect(cuadro[0].principal).toBeCloseTo(CAPITAL / MESES, 6);
    expect(cuadro[MESES - 1].principal).toBeCloseTo(CAPITAL / MESES, 6);
  });

  it('tiene cuota decreciente', () => {
    expect(cuadro[MESES - 1].cuota).toBeLessThan(cuadro[0].cuota);
  });

  it('cancela el saldo en la última cuota', () => {
    expect(cuadro[MESES - 1].saldo).toBeCloseTo(0, 6);
  });

  it('paga menos intereses totales que el francés', () => {
    const interesAleman = cuadro.reduce((acc, f) => acc + f.interes, 0);
    const interesFrances = cuadroFrances(CAPITAL, TNA, MESES).reduce((acc, f) => acc + f.interes, 0);
    expect(interesAleman).toBeLessThan(interesFrances);
  });
});

describe('casos borde', () => {
  it('con tasa cero reparte el capital en cuotas iguales sin interés', () => {
    const cuadro = cuadroFrances(1200, 0, 12);
    expect(cuadro).toHaveLength(12);
    expect(cuadro[0].cuota).toBeCloseTo(100, 6);
    expect(cuadro[0].interes).toBe(0);
    expect(cuadro[11].saldo).toBeCloseTo(0, 6);
  });

  it('devuelve vacío con datos incompletos', () => {
    expect(cuadroFrances(0, TNA, MESES)).toEqual([]);
    expect(cuadroFrances(CAPITAL, TNA, 0)).toEqual([]);
    expect(cuadroAleman(0, TNA, MESES)).toEqual([]);
    expect(cuadroAleman(CAPITAL, TNA, 0)).toEqual([]);
  });
});
