/**
 * Cuadros de marcha de amortización.
 *
 * Trabajan en la unidad en la que venga el capital: para créditos UVA el capital
 * entra en UVA y cada fila se multiplica después por el valor de la UVA del mes
 * correspondiente. Así el cálculo financiero queda separado del ajuste por inflación.
 *
 * `tasaAnual` es la TNA en tanto por uno (0.045 para una TNA del 4,5%).
 * Cada fila trae el saldo YA descontada la amortización de ese mes.
 */

// Sistema francés: cuota constante.
// El PMT se recalcula sobre el saldo y las cuotas que faltan en cada período; en un
// crédito puro eso da siempre el mismo valor, y tolera saldos que no arrancan de cero.
export function cuadroFrances(capital, tasaAnual, meses) {
  if (!(capital > 0) || !(meses > 0)) return [];

  const tasaMensual = tasaAnual / 12;
  const amortizacionConstante = capital / meses;
  const cuadro = [];
  let saldo = capital;

  for (let mes = 1; mes <= meses; mes++) {
    if (saldo <= 0) break;

    const interes = saldo * tasaMensual;
    const cuotasRestantes = meses - mes + 1;
    const cuota = tasaMensual > 0
      ? (saldo * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -cuotasRestantes))
      : amortizacionConstante;

    let principal = cuota - interes;
    if (principal > saldo) principal = saldo;
    saldo -= principal;

    cuadro.push({ mes, cuota: principal + interes, interes, principal, saldo });
  }

  return cuadro;
}

// Sistema alemán: amortización de capital constante, cuota decreciente.
// En el simulador UVA es una opción: casi todos los bancos ofrecen francés.
export function cuadroAleman(capital, tasaAnual, meses) {
  if (!(capital > 0) || !(meses > 0)) return [];

  const tasaMensual = tasaAnual / 12;
  const amortizacionConstante = capital / meses;
  const cuadro = [];
  let saldo = capital;

  for (let mes = 1; mes <= meses; mes++) {
    if (saldo <= 0) break;

    const interes = saldo * tasaMensual;
    let principal = amortizacionConstante;
    if (principal > saldo) principal = saldo;
    saldo -= principal;

    cuadro.push({ mes, cuota: principal + interes, interes, principal, saldo });
  }

  return cuadro;
}
