import React from 'react';

/**
 * Contenido del FAQ.
 *
 * `faqsOperativas` es lo que se muestra en /faq: preguntas sobre cómo leer la
 * calculadora y de dónde salen los números. El campo `resumen` es la versión en
 * texto plano que alimenta el JSON-LD de la página, así el structured data no se
 * puede desincronizar de lo que el visitante ve en pantalla.
 *
 * `faqsTeoria` es teoría general de créditos hipotecarios. No se renderiza: sirve
 * para un blog aparte y se conserva acá para no perder el contenido.
 */

export const faqsOperativas = [
    {
      q: "¿Por qué sube mi cuota todos los meses?",
      resumen: "La deuda esta en UVAs, no en pesos. La cuota en UVAs es fija, pero cada UVA vale mas cada dia porque se ajusta por el CER, que sigue a la inflacion del INDEC. Por eso la cuota en pesos sube todos los meses.",
      a: <>
        <p>Porque tu deuda no está en pesos: está en <b>UVAs</b>. La cuota en UVAs es siempre la misma, pero cada UVA vale un poco más cada día, porque se ajusta por el CER, que sigue a la inflación que mide el INDEC.</p>
        <div className="p-4 my-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
          Cuota en $ = Cuota en UVAs × Valor UVA del día de pago
        </div>
        <p>De ahí sale todo lo demás: si la inflación se acelera, tu cuota en pesos sube más rápido; si se desacelera, sube más despacio. Lo que nunca cambia es la cantidad de UVAs que pagás por mes.</p>
      </>
    },
    {
      q: "¿Por qué mi cuota no coincide exactamente con la del banco?",
      resumen: "La simulacion usa sistema frances o aleman puro en UVA, segun elijas. Cada banco aplica su propio criterio de recalculo, mas seguros y gastos administrativos que varian segun la entidad. El resultado es una aproximacion cercana, no el numero exacto del resumen.",
      a: <>
        <p>La simulación usa <b>sistema francés o alemán puro en UVA</b>, según elijas. Cada banco aplica su propio criterio de recálculo, más seguros y gastos administrativos que varían según la entidad. Tomá el resultado como una aproximación cercana, no como el número exacto de tu resumen.</p>
        <p>Si querés medir esa diferencia, en el modo <b>Crédito en curso</b> podés cargar la cuota que te cobra el banco y la calculadora te muestra cuánto se aparta de la simulación.</p>
      </>
    },
    {
      q: "¿Qué es el IPC y qué es el REM? ¿Cómo los usamos?",
      resumen: "ProyectAR combina dos fuentes oficiales: el IPC del INDEC para los meses ya cerrados y el REM del BCRA, una encuesta a consultoras sobre inflacion futura, para los que vienen. Cuando un mes tiene ambos, manda el IPC.",
      a: <>
        <p>ProyectAR combina <b>dos fuentes oficiales</b> de datos de inflación para armar un timeline unificado:</p>
        <div className="space-y-3 mt-3">
          <div className="p-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p className="text-sm"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 align-middle"></span><b>IPC (Índice de Precios al Consumidor)</b>: dato real, cerrado. Lo publica el INDEC una vez al mes. Usamos los últimos 12 meses como dato histórico confirmado. Siempre tiene prioridad.</p>
          </div>
          <div className="p-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p className="text-sm"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 align-middle"></span><b>REM (Relevamiento de Expectativas de Mercado)</b>: proyección. El BCRA encuesta a las principales consultoras y bancos sobre cuánto creen que va a ser la inflación futura. Usamos la mediana de esas estimaciones.</p>
          </div>
        </div>
        <p className="mt-3">Cuando un mes tiene dato IPC (real) y REM (proyectado), siempre priorizamos el IPC. Para los meses futuros donde solo hay REM, usamos esa proyección. Si se agotan ambas fuentes, aplicamos <b>inercia</b>: repetimos el último valor disponible del REM.</p>
      </>
    },
    {
      q: "¿Cómo se calcula la inflación mensual a partir del REM anual?",
      resumen: "Cuando el REM solo publica el dato anual, se pasa a mensual con la formula (1 + anual/100)^(1/12) - 1. Es una tasa geometrica, no una division por doce, para que al acumular doce meses de exactamente el valor anual.",
      a: <>
        <p>El REM publica estimaciones mensuales para los próximos meses y una estimación interanual (i.a.) para los años venideros. Cuando solo tenemos el dato anual, lo convertimos a mensual con esta fórmula:</p>
        <div className="p-4 my-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
          Inflación mensual = (1 + Inflación anual / 100) ^ (1/12) − 1
        </div>
        <p>Por ejemplo, si el REM proyecta 25% anual, la tasa mensual equivalente sería: (1.25)^(1/12) − 1 ≈ 1,88% mensual. Es una <b>tasa geométrica</b>, no una simple división por 12, para que al acumularla 12 meses dé exactamente el valor anual.</p>
      </>
    },
    {
      q: "¿Qué significa 'Inercia' en el origen de la inflación?",
      resumen: "Cuando se agotan los datos del REM, la proyeccion aplica el ultimo valor mensual disponible para los meses restantes. Se puede dejar en automatico o fijar una tasa propia.",
      a: <><p>Cuando se agotan los datos del REM (que típicamente cubre 12-18 meses hacia adelante), la proyección necesita seguir. La <b>inercia</b> toma el último valor mensual disponible del REM y lo repite para los meses restantes.</p><p>Es la opción por defecto en el tramo "Meses restantes". Si te parece poco realista para el largo plazo, podés cambiarlo a "Propia" y poner tu propia inflación anual. Lo mismo vale para los primeros meses, aunque ahí el dato oficial es bastante más sólido que cualquier número propio.</p></>
    },
    {
      q: "¿Cómo funciona el ajuste de alquileres?",
      resumen: "Se acumula la inflacion mensual durante el periodo pactado y al llegar al mes de ajuste el alquiler se multiplica por ese factor acumulado.",
      a: <>
        <p>La ley vigente permite que propietarios e inquilinos acuerden libremente la frecuencia y el índice de ajuste. En ProyectAR simulamos esto así:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2 text-sm">
          <li>Se define cada cuántos meses se ajusta (ej: cada 4 meses).</li>
          <li>Durante esos meses, se <b>acumula la inflación mensual</b> (IPC real o REM proyectado).</li>
          <li>Al llegar al mes de ajuste, el alquiler base se multiplica por ese factor acumulado.</li>
        </ol>
        <div className="p-4 my-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
          Factor = (1 + inf₁) × (1 + inf₂) × ... × (1 + infₙ)
          <br/>Nuevo alquiler = Alquiler anterior × Factor
        </div>
        <p>Para <b>alquileres en curso</b>, el sistema pre-acumula la inflación pasada (IPC) desde el último ajuste hasta hoy, para proyectar correctamente desde tu situación actual.</p>
      </>
    },
    {
      q: "¿Por qué ajustar las expensas por inflación?",
      resumen: "Las expensas cubren costos que suben con la inflacion: encargado, mantenimiento, servicios. Simular un contrato con expensas congeladas subestima fuertemente el costo real.",
      a: <><p>Las expensas de un edificio cubren costos que suben con la inflación: sueldo del encargado, mantenimiento, servicios, limpieza. Si simulás un contrato asumiendo expensas congeladas durante dos años, el resultado subestima fuertemente el costo real de vivir en esa propiedad.</p><p>ProyectAR aplica la misma tasa de inflación mensual a las expensas para darte una imagen más fiel del gasto total.</p></>
    },
    {
      q: "¿Qué es el Yield (rentabilidad bruta) y cómo se calcula?",
      resumen: "Es cuanto rinde una propiedad por anio respecto de su valor: alquiler anual en dolares sobre valor de la propiedad en dolares, por cien. Es una medida bruta, no descuenta impuestos ni vacancia.",
      a: <>
        <p>Es una métrica estándar del mercado inmobiliario que indica cuánto rinde una propiedad por año en relación a su valor. Se calcula así:</p>
        <div className="p-4 my-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
          Yield = (Alquiler mensual × 12 / Dólar oficial) / Valor propiedad USD × 100
        </div>
        <p>Es una medida <b>bruta</b> (no descuenta impuestos, vacancia, mantenimiento). En el mercado argentino, los rangos típicos son:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
          <li><b className="font-medium text-ink dark:text-ink-dark">Menor a 3%:</b> Rendimiento bajo. La propiedad se valoriza más por plusvalía que por renta.</li>
          <li><b className="font-medium text-ink dark:text-ink-dark">3% a 5%:</b> Rango normal del mercado argentino actual.</li>
          <li><b className="font-medium text-ink dark:text-ink-dark">5% a 8%:</b> Buen rendimiento. Propiedad rentable.</li>
          <li><b className="font-medium text-ink dark:text-ink-dark">Más de 8%:</b> Excelente y poco frecuente. Suele darse en zonas emergentes o propiedades comerciales.</li>
        </ul>
      </>
    },
    {
      q: "¿Los datos de ProyectAR son exactos?",
      resumen: "ProyectAR es una herramienta de simulacion, no un oraculo. Usa fuentes publicas oficiales, pero toda proyeccion a futuro es incierta. Ante una decision financiera importante, consultar con un profesional idoneo.",
      a: <><p>ProyectAR es una <b>herramienta de simulación</b>, no un oráculo. Usamos las mejores fuentes públicas disponibles (IPC-INDEC, REM-BCRA, UVA-BCRA, Dólar-BCRA), pero toda proyección a futuro es inherentemente incierta.</p><p>La inflación real puede diferir de las estimaciones del REM, los bancos pueden modificar sus tasas, y las condiciones macroeconómicas pueden cambiar. Usá los resultados como referencia para tomar decisiones informadas, no como una promesa de lo que va a pasar.</p><p>Ante cualquier decisión financiera importante, consultá siempre con un profesional idóneo.</p></>
    }
];

export const faqsTeoria = [
    {
      q: "¿Qué son los Créditos UVA?",
      a: <><p>Son préstamos hipotecarios donde el capital se expresa en <b>Unidades de Valor Adquisitivo (UVA)</b>, una unidad creada por el BCRA que se actualiza diariamente según la inflación (índice CER). Tu deuda y tu cuota se ajustan al ritmo de la inflación.</p><p>La ventaja es que la cuota inicial suele ser mucho más baja que en un crédito tradicional a tasa fija, lo que permite acceder con menores ingresos. La contrapartida es que si la inflación sube mucho, la cuota en pesos también lo hace.</p></>
    },
    {
      q: "¿De dónde sale el valor de la UVA?",
      a: <>
        <p>La UVA fue creada en 2016 con una equivalencia clara: <b>1.000 UVAs = costo promedio de 1 m² de construcción</b>. Hoy se ajusta diariamente por el CER (Coeficiente de Estabilización de Referencia), que sigue a la inflación oficial del INDEC.</p>
        <div className="p-4 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark mt-3 space-y-2">
          <p className="text-title text-ink dark:text-ink-dark">¿Mi cuota en UVAs cambia?</p>
          <p className="text-xs md:text-sm"><b>En Sistema Francés:</b> la cuota en UVAs es constante todo el crédito. <b>En Alemán:</b> baja mes a mes. Pero la cuota en pesos siempre cambia porque se multiplica por el valor diario de la UVA.</p>
        </div>
      </>
    },
    {
      q: "¿Cómo se calcula la cuota del crédito UVA?",
      a: <>
        <p>Primero el banco calcula tu cuota en UVAs puras (sin inflación). Esa cuota tiene dos partes: devolución de capital + intereses. Dependiendo del sistema:</p>
        <div className="space-y-3 mt-3">
          <div className="p-4 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p className="text-title text-ink dark:text-ink-dark mb-2">Sistema Francés (cuota constante en UVAs):</p>
            <div className="overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
              PMT = Saldo × r / (1 − (1 + r) ^ −n)
            </div>
            <p className="text-micro mt-2 text-faint dark:text-faint-dark">Donde r = TNA/12 (tasa mensual) y n = cuotas restantes.</p>
          </div>
          <div className="p-4 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p className="text-title text-ink dark:text-ink-dark mb-2">Sistema Alemán (amortización constante):</p>
            <div className="overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
              Amortización = Capital total / n &nbsp;&nbsp;|&nbsp;&nbsp; Cuota = Amortización + Saldo × r
            </div>
            <p className="text-micro mt-2 text-faint dark:text-faint-dark">La cuota en UVAs baja cada mes porque el saldo sobre el que calculás intereses se va reduciendo.</p>
          </div>
        </div>
        <p className="mt-3">Para convertir a pesos:</p>
        <div className="p-4 my-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
          Cuota en $ = Cuota en UVAs × Valor UVA del día de pago
        </div>
        <p>Como el valor de la UVA sube con la inflación, tu cuota en pesos sube mes a mes aunque la cuota en UVAs sea fija.</p>
      </>
    },
    {
      q: "¿Cuál es la diferencia entre el Sistema Francés y el Alemán?",
      a: <><p>Son dos formas de devolver el préstamo con características opuestas:</p><ul className="list-disc pl-5 space-y-2 mt-2"><li><b>Francés (el más común):</b> Cuota en UVAs constante. Al inicio pagás mucho interés y poco capital. Es más fácil de calificar porque la cuota inicial es más baja.</li><li><b>Alemán:</b> Amortización de capital constante. La cuota arranca más alta pero baja cada mes. Pagás menos intereses totales a lo largo del crédito.</li></ul><p className="mt-2">En la práctica, la mayoría de los bancos argentinos ofrecen exclusivamente Sistema Francés para créditos UVA.</p></>
    },
];
