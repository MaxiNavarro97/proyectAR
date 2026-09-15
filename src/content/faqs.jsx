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

const FORMULA = 'p-4 my-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark overflow-x-auto text-center text-ink dark:text-ink-dark font-medium';
const DESTACADO = 'font-medium text-ink dark:text-ink-dark';

export const faqsOperativas = [
    {
      q: "¿Por qué sube mi cuota todos los meses?",
      resumen: "La deuda está en UVAs, no en pesos. Cada UVA vale más cada día porque se ajusta por el CER, que sigue a la inflación del INDEC. La cantidad de UVAs de la cuota no depende de la inflación: en sistema francés es siempre la misma y en alemán baja un poco cada mes. Por eso la cuota en pesos sube aunque las UVAs no cambien.",
      a: <>
        <p>Porque tu deuda no está en pesos: está en <b>UVAs</b>. Cada UVA vale un poco más cada día, porque se ajusta por el CER, que sigue a la inflación que mide el INDEC.</p>
        <div className={FORMULA}>
          Cuota en $ = Cuota en UVAs × Valor UVA del día de pago
        </div>
        <p>La cantidad de UVAs de tu cuota no depende de la inflación: en <b>sistema francés</b> es siempre la misma y en <b>alemán</b> baja un poco cada mes. Lo que sube es el valor de cada UVA. Si la inflación se acelera, tu cuota en pesos sube más rápido; si se desacelera, sube más despacio.</p>
      </>
    },
    {
      q: "¿Por qué mi cuota no coincide exactamente con la del banco?",
      resumen: "La simulación usa sistema francés o alemán puro en UVA, según elijas. Cada banco aplica su propio criterio de recálculo, más seguros y gastos administrativos que varían según la entidad. El resultado es una aproximación cercana, no el número exacto del resumen.",
      a: <>
        <p>La simulación usa <b>sistema francés o alemán puro en UVA</b>, según elijas. Cada banco aplica su propio criterio de recálculo, más seguros y gastos administrativos que varían según la entidad. Tomá el resultado como una aproximación cercana, no como el número exacto de tu resumen.</p>
        <p>Si querés medir esa diferencia, en el modo <b>En curso</b> podés cargar la cuota que te cobra el banco y la calculadora te muestra cuánto se aparta de la simulación.</p>
      </>
    },
    {
      q: "¿Sistema francés o alemán? ¿Cuál me conviene?",
      resumen: "En sistema francés la cuota en UVAs es fija: al principio pagás mucho interés y poco capital, y la primera cuota es más baja, por eso es más fácil calificar. Es el que ofrecen casi todos los bancos para créditos UVA. En alemán devolvés el mismo capital todos los meses: la cuota arranca más alta, baja mes a mes y en total pagás menos intereses.",
      a: <>
        <p>La calculadora te deja elegir el sistema en el panel <b>Tipo de crédito</b>. Son dos formas opuestas de devolver lo mismo:</p>
        <div className="space-y-3 mt-3">
          <div className="p-4 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p className="text-title text-ink dark:text-ink-dark mb-2">Francés: la cuota en UVAs es fija</p>
            <div className="overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
              Cuota = Saldo × r / (1 − (1 + r) ^ −n)
            </div>
            <p className="mt-2">Al principio pagás mucho interés y poco capital. La primera cuota es más baja, así que es más fácil calificar. Es el que ofrecen casi todos los bancos para créditos UVA.</p>
          </div>
          <div className="p-4 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p className="text-title text-ink dark:text-ink-dark mb-2">Alemán: el capital que devolvés es fijo</p>
            <div className="overflow-x-auto text-center text-ink dark:text-ink-dark font-medium">
              Cuota = Capital / n + Saldo × r
            </div>
            <p className="mt-2">La cuota arranca más alta y baja todos los meses, porque el interés se calcula sobre un saldo cada vez menor. En total pagás menos intereses.</p>
          </div>
        </div>
        <p className="text-micro text-faint dark:text-faint-dark">En las dos fórmulas, r = TNA / 12 y n = cantidad de cuotas.</p>
        <p>Probá los dos con el mismo monto: vas a ver cuánto te ahorrás en <b>Intereses</b> con el alemán y cuánto más te pide de sueldo la <b>Primera cuota</b>.</p>
      </>
    },
    {
      q: "¿Qué significa el costo real (por ejemplo, 1,45x)?",
      resumen: "Es cuántas veces devolvés el capital, medido en UVAs: el total pagado en UVAs dividido el capital en UVAs. Un 1,45x significa que por cada 100 UVAs prestadas devolvés 145; esas 45 son el costo del crédito. Se mide en UVAs porque en pesos se suman pesos de años distintos y el número refleja la inflación, no el crédito.",
      a: <>
        <p>Es cuántas veces devolvés lo que te prestaron, <b>medido en UVAs</b>:</p>
        <div className={FORMULA}>
          Costo real = Total pagado en UVAs / Capital en UVAs
        </div>
        <p>Un <b>1,45x</b> significa que por cada 100 UVAs prestadas devolvés 145: esas 45 son el costo del crédito, entre intereses y plazo.</p>
        <p>Debajo aparece el mismo cociente en pesos nominales, que siempre da mucho más alto porque suma pesos de años distintos. Ese número mide la inflación, no el crédito: para comparar créditos, mirá el de UVAs.</p>
      </>
    },
    {
      q: "¿Cuánto de mi sueldo se puede llevar la cuota o el alquiler?",
      resumen: "Para créditos, los bancos suelen pedir que la cuota no supere el 25 a 30% del ingreso neto. Para alquileres, las inmobiliarias suelen pedir ingresos de al menos tres veces el alquiler. La calculadora marca en verde lo que entra en esas reglas y en ámbar o rojo lo que no.",
      a: <>
        <p>Son reglas habituales del mercado, no leyes: cada banco o inmobiliaria puede pedir otra cosa.</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><b className={DESTACADO}>Créditos:</b> los bancos suelen pedir que la cuota no supere el <b>25 a 30%</b> de tus ingresos netos. La calculadora lo marca en verde hasta 25%, en ámbar entre 25% y 30% y en rojo por encima. Por encima de eso normalmente piden codeudor o bajar el monto.</li>
          <li><b className={DESTACADO}>Alquileres:</b> las inmobiliarias suelen pedir ingresos de <b>al menos 3 veces el alquiler</b>, sin contar expensas. La calculadora lo marca en verde si llegás y en rojo si no.</li>
        </ul>
        <p>En los dos casos se compara el primer mes. Si tu sueldo sube menos que la inflación, con el tiempo la cuota o el alquiler van a pesar más. En sistema alemán pasa lo contrario: la primera cuota es la más pesada y después baja.</p>
      </>
    },
    {
      q: "¿Qué es el IPC y qué es el REM? ¿Cómo los usamos?",
      resumen: "ProyectAR combina dos fuentes oficiales: el IPC del INDEC para los meses ya cerrados y el REM del BCRA, una encuesta a consultoras sobre inflación futura, para los que vienen. Cuando un mes tiene ambos, manda el IPC.",
      a: <>
        <p>ProyectAR combina <b>dos fuentes oficiales</b> de datos de inflación para armar una sola línea de tiempo:</p>
        <div className="space-y-3 mt-3">
          <div className="p-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p><b className={DESTACADO}>IPC (Índice de Precios al Consumidor)</b>: dato real, cerrado. Lo publica el INDEC una vez al mes. Usamos los últimos 12 meses como dato histórico confirmado. Siempre tiene prioridad.</p>
          </div>
          <div className="p-3 rounded-control border border-hair dark:border-hair-dark bg-field dark:bg-field-dark">
            <p><b className={DESTACADO}>REM (Relevamiento de Expectativas de Mercado)</b>: proyección. El BCRA encuesta a las principales consultoras y bancos sobre cuánto creen que va a ser la inflación futura. Usamos la mediana de esas estimaciones.</p>
          </div>
        </div>
        <p>Cuando un mes tiene dato IPC (real) y REM (proyectado), siempre priorizamos el IPC. Para los meses futuros donde solo hay REM, usamos esa proyección. Si se agotan ambas fuentes, aplicamos <b>inercia</b>: repetimos el último valor disponible del REM.</p>
      </>
    },
    {
      q: "¿Cómo se calcula la inflación mensual a partir del REM anual?",
      resumen: "Cuando solo hay un dato anual, se pasa a mensual con la fórmula (1 + anual/100)^(1/12) - 1. Es una tasa geométrica y no una división por doce, para que al acumular doce meses dé exactamente el valor anual. Es la misma cuenta que se usa cuando cargás una inflación propia.",
      a: <>
        <p>El REM publica estimaciones mensuales para los próximos meses y una estimación interanual para los años siguientes. Cuando solo tenemos el dato anual, lo convertimos a mensual con esta fórmula:</p>
        <div className={FORMULA}>
          Inflación mensual = (1 + Inflación anual / 100) ^ (1/12) − 1
        </div>
        <p>Por ejemplo, si el REM proyecta 25% anual, la tasa mensual equivalente es (1,25)^(1/12) − 1 ≈ 1,88% mensual. Es una <b>tasa geométrica</b>, no una simple división por 12, para que al acumularla 12 meses dé exactamente el valor anual.</p>
        <p>Es la misma cuenta que usa la calculadora cuando elegís <b>Propia</b> y cargás una inflación anual.</p>
      </>
    },
    {
      q: "¿Qué significa 'Inercia' en la tabla?",
      resumen: "El REM llega hasta unos dos años hacia adelante. Para los meses que siguen, la proyección repite el último valor mensual del REM, y en la tabla esos meses aparecen como INERCIA. Es la opción REM del tramo Meses restantes; se puede cambiar por una inflación propia.",
      a: <>
        <p>El REM llega hasta <b>unos dos años</b> hacia adelante, y un crédito puede durar veinte o treinta. Para los meses que siguen, la proyección toma el último valor mensual del REM y lo repite. En la columna Inflación de la tabla, esos meses aparecen como <b>INERCIA</b>.</p>
        <p>En la calculadora es la opción <b>REM</b> del tramo "Meses restantes", que viene elegida de entrada. Si te parece poco realista para el largo plazo, cambiala a <b>Propia</b> y poné tu propia inflación anual; esos meses pasan a figurar como PROPIA. Lo mismo vale para los primeros meses, aunque ahí el dato oficial es bastante más sólido que cualquier número propio.</p>
      </>
    },
    {
      q: "¿Cómo funciona el ajuste de alquileres?",
      resumen: "Durante el período pactado se acumula la inflación mensual y, al llegar al mes de ajuste, el alquiler vigente se multiplica por ese factor acumulado. En contratos en curso, la inflación real desde el último aumento hasta hoy ya se cuenta.",
      a: <>
        <p>La ley vigente permite que propietarios e inquilinos acuerden libremente la frecuencia y el índice de ajuste. En ProyectAR lo simulamos así:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li>Se define cada cuántos meses se ajusta (por ejemplo, cada 4 meses).</li>
          <li>Durante esos meses se <b>acumula la inflación mensual</b>: IPC real, REM proyectado o tu inflación propia.</li>
          <li>Al llegar al mes de ajuste, el alquiler vigente se multiplica por ese factor acumulado.</li>
        </ol>
        <div className={FORMULA}>
          Factor = (1 + inf₁) × (1 + inf₂) × ... × (1 + infₙ)
          <br/>Nuevo alquiler = Alquiler anterior × Factor
        </div>
        <p>En contratos <b>En curso</b>, la inflación real desde el último aumento hasta hoy ya cuenta para el próximo ajuste, aunque hayas elegido una inflación propia: lo que ya pasó no es un supuesto.</p>
      </>
    },
    {
      q: "¿Por qué ajustar las expensas por inflación?",
      resumen: "Las expensas cubren costos que suben con la inflación: encargado, mantenimiento, servicios. Simular un contrato con expensas congeladas subestima fuertemente el costo real.",
      a: <><p>Las expensas de un edificio cubren costos que suben con la inflación: sueldo del encargado, mantenimiento, servicios, limpieza. Si simulás un contrato asumiendo expensas congeladas durante dos años, el resultado subestima fuertemente el costo real de vivir en esa propiedad.</p><p>ProyectAR aplica la misma inflación mensual a las expensas, todos los meses, para darte una imagen más fiel del gasto total.</p></>
    },
    {
      q: "¿Qué es el yield (rentabilidad bruta) y cómo se calcula?",
      resumen: "Es cuánto rinde una propiedad por año respecto de su valor: el alquiler anual pasado a dólares al tipo oficial, dividido el valor de la propiedad en dólares, por cien. Es una medida bruta: no descuenta impuestos, vacancia ni mantenimiento.",
      a: <>
        <p>Es una métrica estándar del mercado inmobiliario que indica cuánto rinde una propiedad por año en relación a su valor. Se calcula así:</p>
        <div className={FORMULA}>
          Yield = (Alquiler mensual × 12 / Dólar oficial) / Valor propiedad USD × 100
        </div>
        <p>Es una medida <b>bruta</b>: no descuenta impuestos, vacancia ni mantenimiento. En el mercado argentino, los rangos típicos son:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><b className={DESTACADO}>Menor a 3%:</b> rendimiento bajo. La propiedad se valoriza más por plusvalía que por renta.</li>
          <li><b className={DESTACADO}>3% a 5%:</b> rango normal del mercado argentino actual.</li>
          <li><b className={DESTACADO}>5% a 8%:</b> buen rendimiento. Propiedad rentable.</li>
          <li><b className={DESTACADO}>Más de 8%:</b> excelente y poco frecuente. Suele darse en zonas emergentes o propiedades comerciales.</li>
        </ul>
      </>
    },
    {
      q: "¿Los datos de ProyectAR son exactos?",
      resumen: "ProyectAR es una herramienta de simulación, no un oráculo. Usa fuentes públicas: IPC del INDEC, REM del BCRA, valor de la UVA de ArgentinaDatos y dólar oficial de DolarAPI. Toda proyección a futuro es incierta; ante una decisión financiera importante, conviene consultar con un profesional idóneo.",
      a: <><p>ProyectAR es una <b>herramienta de simulación</b>, no un oráculo. Usamos fuentes públicas: el IPC del INDEC, el REM del BCRA, el valor de la UVA publicado por ArgentinaDatos y el dólar oficial de DolarAPI. Aun así, toda proyección a futuro es inherentemente incierta.</p><p>La inflación real puede diferir de las estimaciones del REM, los bancos pueden modificar sus tasas, y las condiciones macroeconómicas pueden cambiar. Usá los resultados como referencia para tomar decisiones informadas, no como una promesa de lo que va a pasar.</p><p>Ante cualquier decisión financiera importante, consultá siempre con un profesional idóneo.</p></>
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
];
