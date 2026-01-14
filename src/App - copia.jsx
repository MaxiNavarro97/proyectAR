import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calculator, DollarSign, Calendar, Percent, 
  TrendingUp, Info, Globe, Home, ArrowRightLeft,
  Landmark, FileText, Zap, Settings2, 
  CalendarDays, AlertTriangle, Scale, Activity, 
  Github, Clock, Wallet, CheckCircle2,
  PieChart, Download, Sun, Moon, ExternalLink, ShieldAlert,
  HelpCircle
} from 'lucide-react';

// --- CONSTANTES ---
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const money = (v) => new Intl.NumberFormat('es-AR', { 
  style: 'currency', 
  currency: 'ARS', 
  maximumFractionDigits: 0 
}).format(v);

// --- COMPONENTES AUXILIARES ---

function NavBtn({ active, onClick, icon, label, color }) {
  const themes = {
    indigo: 'text-indigo-600 dark:text-sky-400 bg-white dark:bg-slate-800 shadow-md border-indigo-100 dark:border-sky-500/30 scale-105',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-md border-emerald-100 dark:border-emerald-500/30 scale-105'
  };
  return (
    <button onClick={onClick} className={`px-4 md:px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black flex items-center gap-2 transition-all border border-transparent active:scale-95 ${active ? themes[color] : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
      {React.cloneElement(icon, { className: "w-4 h-4 md:w-5 md:h-5" })} {label}
    </button>
  );
}

function CurrencyInput({ value, onChange, label, sublabel }) {
  const [isFocused, setIsFocused] = useState(false);
  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = rawValue === '' ? 0 : Number(rawValue);
    onChange(numericValue);
  };
  const formatted = (isFocused && value === 0) ? '' : money(value);
  return (
    <div className="group text-left">
      <label className={`text-[10px] font-black block mb-2 uppercase tracking-widest flex items-center gap-2 transition-colors ${isFocused ? `text-indigo-500` : 'text-slate-400'}`}>{label}</label>
      <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
        <input type="text" value={formatted} onChange={handleChange} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} placeholder="$ 0" className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-mono text-lg md:text-xl font-bold outline-none border-2 border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-400/30 shadow-inner transition-all dark:text-white" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 dark:text-slate-400"><DollarSign className="w-5 h-5" /></div>
      </div>
      {sublabel && <p className="text-[9px] text-slate-400 mt-2  px-1 leading-relaxed">{sublabel}</p>}
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, colorClass, subtitle }) {
  const colorMap = { 
    indigo: 'bg-indigo-500/10 text-indigo-500', 
    orange: 'bg-orange-500/10 text-orange-500', 
    emerald: 'bg-emerald-500/10 text-emerald-500',
    rose: 'bg-rose-500/10 text-rose-500',
    sky: 'bg-sky-500/10 text-sky-500'
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border dark:border-slate-800 shadow-sm flex items-start gap-3 transition-all hover:translate-y-[-2px] hover:shadow-md min-w-0 flex-1">
      <div className={`p-2 md:p-2.5 rounded-xl shrink-0 ${colorMap[colorClass] || 'bg-slate-500/10 text-slate-500'}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 overflow-hidden text-left">
        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{title}</p>
        <p className="text-sm md:text-base font-black tracking-tight dark:text-white leading-none truncate">{value}</p>
        {subtitle && <p className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

function BankCard({ name, url, logoUrl }) {
  const [imgError, setImgError] = useState(false);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden aspect-square">
      <div className="relative z-10 h-8 md:h-10 w-full flex items-center justify-center mb-1 bg-white">
        {!imgError ? (
          <img 
            src={logoUrl} 
            alt={name} 
            onError={() => setImgError(true)} 
            className="max-h-full max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
          />
        ) : (
          <Landmark className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        )}
      </div>
      <span className="text-[6px] md:text-[7px] font-black text-slate-500 uppercase tracking-tighter text-center transition-colors group-hover:text-indigo-600">{name}</span>
    </a>
  );
}

// --- VISUALIZACIÓN DE DATOS ---

function CompositionChart({ data, dateMode, showRemMarker, isRent = false }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 gap-4">
        <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-700" />
        <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 ">No hay información ingresada para proyectar</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.cuotaTotal)) * 1.15;
  const w = 1000, h = 400, padL = 100, padB = 60, padT = 20;
  const step = Math.max(1, Math.ceil(data.length / (isRent ? 40 : 60)));
  const sampled = data.filter((_, i) => i % step === 0);
  const lastRemIndex = showRemMarker ? data.findLastIndex(d => d.source === 'REM') : -1;
  const remMarkerX = lastRemIndex !== -1 ? (padL + (lastRemIndex / (data.length - 1)) * (w - padL)) : null;

  return (
    <div className="relative w-full h-full">
      {hovered && (
        <div className="absolute z-50 pointer-events-none bg-white dark:bg-slate-800 shadow-2xl rounded-xl border dark:border-slate-700 p-3 md:p-4 min-w-[180px] md:min-w-[200px]" style={{ left: `${(hovered.x / w) * 100}%`, top: `${(hovered.y / h) * 100 - 10}%`, transform: 'translate(-50%, -100%)' }}>
          <div className="flex items-center justify-between mb-2 border-b dark:border-slate-700 pb-1.5">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{hovered.data.label}</p>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${hovered.data.source === 'REM' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{hovered.data.source}</span>
          </div>
          <div className="space-y-1.5 text-[10px] md:text-[11px]">
            <div className="flex justify-between items-center gap-4"><span className="font-bold text-slate-400 uppercase">Total:</span><span className="font-black dark:text-white">{money(hovered.data.cuotaTotal)}</span></div>
            <div className="flex justify-between items-center gap-4 text-indigo-500 font-bold uppercase">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><span>{isRent ? 'Alquiler' : 'Capital'}:</span></div>
              <span>{money(hovered.data.principal)}</span>
            </div>
            <div className="flex justify-between items-center gap-4 text-orange-500 font-bold uppercase">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" /><span>{isRent ? 'Expensas' : 'Interés'}:</span></div>
              <span>{money(hovered.data.interes)}</span>
            </div>
          </div>
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible select-none" preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <g key={p}>
            <line x1={padL} y1={h - padB - (h - padB - padT) * p} x2={w} y2={h - padB - (h - padB - padT) * p} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4"/>
            <text x={padL - 15} y={h - padB - (h - padB - padT) * p + 5} textAnchor="end" className="text-[10px] md:text-[11px] fill-slate-400 font-mono font-bold">$ {new Intl.NumberFormat('es-AR').format(Math.round((maxVal * p) / 1000))} mil</text>
          </g>
        ))}
        {sampled.map((d, i) => {
          const barAreaW = (w - padL) / sampled.length;
          const barW = barAreaW * 0.8;
          const x = padL + i * barAreaW;
          const hInt = (d.interes / maxVal) * (h - padB - padT);
          const hPri = (d.principal / maxVal) * (h - padB - padT);
          const hGas = (d.gastos / maxVal) * (h - padB - padT);
          return (
            <g key={i} onMouseEnter={() => setHovered({ x: x + barW / 2, y: h - padB - hInt - hPri - hGas, data: d })} onMouseLeave={() => setHovered(null)} className="group cursor-pointer">
              <rect x={x} y={h - padB - hPri} width={barW} height={hPri} fill="#6366f1" rx="1.5" className="transition-all group-hover:brightness-110"/>
              <rect x={x} y={h - padB - hPri - hInt} width={barW} height={hInt} fill="#fb923c" rx="1.5" className="transition-all group-hover:brightness-110"/>
              <rect x={x} y={h - padB - hPri - hInt - hGas} width={barW} height={hGas} fill="#fb7185" rx="1.5" className="transition-all group-hover:brightness-110"/>
              {(i % Math.ceil(sampled.length/10) === 0) && (
                <text x={x + barW/2} y={h - padB + 25} textAnchor="middle" className="text-[10px] md:text-[11px] fill-slate-500 font-black uppercase tracking-tighter">{dateMode === 'calendar' ? d.shortDate : `M${d.mes}`}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --- VISTA CALCULADORA HIPOTECARIA ---
function MortgageCalculator({ uvaValue, remData, remStatus }) {
  const hoy = new Date();
  const [amount, setAmount] = useState(0); 
  const [salary, setSalary] = useState(0); 
  const [years, setYears] = useState(0);
  const [rate, setRate] = useState("0");
  const [extraRate, setExtraRate] = useState("0"); 
  const [inflation, setInflation] = useState("0");
  const [system, setSystem] = useState('french'); 
  const [inflationMode, setInflationMode] = useState('rem'); 
  const [remStabilizedMode, setRemStabilizedMode] = useState('auto');
  const [remStabilizedValue, setRemStabilizedValue] = useState("0");
  const [timeframe, setTimeframe] = useState('all');
  const [dateMode, setDateMode] = useState('calendar'); 
  const [startMonth, setStartMonth] = useState(hoy.getMonth());
  const [startYear, setStartYear] = useState(hoy.getFullYear());

  useEffect(() => {
    if (remData && remData.length > 0) {
      const lastValue = remData[remData.length - 1].valor;
      setRemStabilizedValue(String(lastValue).replace('.', ','));
    }
  }, [remData]);

  useEffect(() => {
    if (dateMode === 'generic') { setInflationMode('manual'); }
  }, [dateMode]);

  const schedule = useMemo(() => {
    if (!amount || amount === 0) return [];
    const totalMonths = Number(years) * 12;
    if (isNaN(totalMonths) || totalMonths <= 0) return [];
    const currentUva = uvaValue || 1;
    const rateNum = (Number(String(rate).replace(',', '.')) || 0) / 100;
    const extraRateNum = (Number(String(extraRate).replace(',', '.')) || 0) / 100;
    const inflationNum = Number(String(inflation).replace(',', '.')) || 0;
    const monthlyRate = rateNum / 12;
    const manualMonthlyInf = Math.pow(1 + inflationNum / 100, 1 / 12) - 1;
    let remStabMon = (remStabilizedMode === 'auto' && remData && remData.length > 0) 
      ? remData[remData.length - 1].valor / 100 
      : (Number(String(remStabilizedValue).replace(',', '.')) || 0) / 100;
    let balanceUva = amount / currentUva;
    const capitalUvaInicial = amount / currentUva;
    const data = [];
    let projUva = currentUva;
    let currentDate = new Date(startYear, startMonth, 1);
    const constantAmortizationUva = capitalUvaInicial / totalMonths;
    for (let i = 1; i <= totalMonths; i++) {
      if (balanceUva <= 0) break;
      let interestUva = balanceUva * monthlyRate;
      let principalUva;
      if (system === 'french') {
        const pmtUva = monthlyRate > 0 ? (balanceUva * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -(totalMonths - i + 1))) : constantAmortizationUva;
        principalUva = pmtUva - interestUva;
      } else { principalUva = constantAmortizationUva; }
      if (principalUva > balanceUva) { principalUva = balanceUva; balanceUva = 0; } else { balanceUva -= principalUva; }
      const gastosPesos = capitalUvaInicial * extraRateNum * projUva;
      const remMatch = (dateMode === 'calendar' && inflationMode === 'rem' && remData && remData.length > 0) ? remData.find(d => d.mes === (currentDate.getMonth() + 1) && d.año === currentDate.getFullYear()) : null;
      let sourceName = 'MANUAL';
      if (inflationMode === 'rem') sourceName = remMatch ? 'REM' : 'INERCIA';
      data.push({
        mes: i,
        label: dateMode === 'calendar' ? `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `Mes ${i}`,
        shortDate: `${MESES[currentDate.getMonth()]} ${String(currentDate.getFullYear()).slice(-2)}`,
        interes: interestUva * projUva, 
        principal: principalUva * projUva, 
        gastos: gastosPesos,
        cuotaTotal: (principalUva + interestUva) * projUva + gastosPesos, 
        saldo: balanceUva * projUva, 
        source: sourceName
      });
      let currentMonthInf = (dateMode === 'generic') ? manualMonthlyInf : (inflationMode === 'rem' ? (remMatch ? remMatch.valor / 100 : remStabMon) : manualMonthlyInf);
      projUva *= (1 + currentMonthInf);
      currentDate.setMonth(currentDate.getMonth() + 1); 
    }
    return data;
  }, [amount, years, rate, extraRate, system, inflation, inflationMode, remStabilizedMode, remStabilizedValue, uvaValue, dateMode, startMonth, startYear, remData]);

  const totals = useMemo(() => ({
      totalPagadoFinal: schedule.reduce((acc, curr) => acc + curr.cuotaTotal, 0),
      totalIntereses: schedule.reduce((acc, curr) => acc + curr.interes, 0),
      cuotaInicial: schedule[0]?.cuotaTotal || 0,
  }), [schedule]);

  const filteredData = useMemo(() => (timeframe === 'all' ? schedule : schedule.slice(0, Math.min(schedule.length, parseInt(timeframe) * 12))), [schedule, timeframe]);

  const exportToCSV = () => {
    if (schedule.length === 0) return;
    const headers = ["Mes", "Cuota Total", "Interes", "Capital", "Gastos", "Saldo Pendiente", "Origen"];
    const rows = schedule.map(d => [d.label, Math.round(d.cuotaTotal), Math.round(d.interes), Math.round(d.principal), Math.round(d.gastos), Math.round(d.saldo), d.source]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(";") + "\n" + rows.map(e => e.join(";")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ProyectAR_Hipotecas_${new Date().getTime()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border dark:border-slate-800 text-left">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg"><CalendarDays className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white leading-none">Inicio del crédito</h3>
            </div>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-slate-900 text-[10px] text-white font-medium rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 leading-relaxed border border-white/10  normal-case tracking-normal">
                {"La fecha de inicio permite sincronizar la primera cuota con el dato de inflación proyectado por el REM para ese mes específico. Esto asegura que la curva de actualización de la UVA sea coherente con el calendario fiscal."}
              </div>
            </div>
          </div>
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button onClick={() => setDateMode('calendar')} className={`flex-1 py-2 text-[10px] font-black rounded-lg ${dateMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-sky-400' : 'text-slate-500'}`}>CALENDARIO</button>
            <button onClick={() => setDateMode('generic')} className={`flex-1 py-2 text-[10px] font-black rounded-lg ${dateMode === 'generic' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-sky-400' : 'text-slate-500'}`}>GENÉRICO</button>
          </div>

          {/* Cartel titilante solicitado */}
          {dateMode === 'generic' && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-3 animate-pulse mb-4">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-black uppercase tracking-tighter text-rose-600 leading-tight ">El modo genérico desactiva la conexión con el REM.</p>
            </div>
          )}

          {dateMode === 'calendar' && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in">
              <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">{[2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}</select>
              <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">{MESES.map((m, i) => <option key={m} value={i}>{m.toUpperCase()}</option>)}</select>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border dark:border-slate-800 space-y-6 text-left">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg"><Settings2 className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest dark:text-white leading-none">Condiciones del crédito</h3>
            </div>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-slate-900 text-[10px] text-white font-medium rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 leading-relaxed border border-white/10  normal-case tracking-normal">
                {"Las condiciones finales las indica cada entidad bancaria. Consultá las webs oficiales (en la sección de abajo tenés algunas), para obtener los datos precisos de tu simulación."}
              </div>
            </div>  
          </div>
          <CurrencyInput label="Monto del Préstamo" value={amount} onChange={setAmount} />
          <CurrencyInput label="Sueldo Neto Mensual (Opcional)" value={salary} onChange={setSalary} sublabel="Para calcular la afectación de tus ingresos sobre la cuota (Relación Cuota/Ingreso)." />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800 text-center">
              <label className="text-[10px] font-black text-indigo-500 block mb-2 uppercase tracking-widest">Plazo (Años)</label>
              <input type="text" value={years} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setYears(v === '' ? '' : Number(v)); }} onBlur={() => { if (!years || years === 0) setYears(20); }} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800 text-center">
              <label className="text-[10px] font-black text-indigo-500 block mb-2 uppercase tracking-widest">Tasa (TNA %)</label>
              <input type="text" value={rate} onChange={(e) => { const v = e.target.value.replace(',','.'); if(v==='' || /^\d*\.?\d*$/.test(v)) setRate(e.target.value); }} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
            </div>
          </div>
          <div className="pt-4 border-t dark:border-slate-800">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block  leading-none flex items-center gap-2">
              <Percent className="w-3 h-3"/> Gastos Mensuales extra
              <div className="group relative">
                <HelpCircle className="w-3 h-3 text-slate-300 cursor-help hover:text-rose-500 transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 p-3 bg-slate-900 text-[9px] text-white font-medium rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal leading-tight  border border-white/10">
                  {"Incluye seguros (vida, incendio) y mantenimiento de cuenta. Es un valor que debería ser informado por la entidad bancaria. Si no se conoce, dejar en 0%."}
                </div>
              </div>
            </label>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border dark:border-slate-800">
              <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-rose-500 uppercase ">{extraRate}% del capital</span></div>
              <input type="range" min="0" max="0.5" step="0.01" value={extraRate} onChange={(e)=>setExtraRate(e.target.value)} className="w-full accent-rose-500 cursor-pointer"/>
            </div>
          </div>
          <div className="pt-4 border-t dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest  flex items-center gap-2 leading-none"><Scale className="w-3 h-3"/> Sistema de Amortización</label>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
                <div className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-slate-900 text-[10px] text-white font-medium rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 leading-relaxed border border-white/10  normal-case tracking-normal">
                  <b className="text-indigo-400">Francés:</b> Cuota total constante. Al principio pagás más intereses y poco capital. Es el más común en créditos hipotecarios UVA.<br/><br/>
                  <b className="text-indigo-400">Alemán:</b> Amortización de capital constante. La cuota total empieza más alta pero baja mes a mes.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSystem('french')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${system === 'french' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}><span className={`text-xs font-black uppercase ${system === 'french' ? 'text-indigo-600' : 'text-slate-500'}`}>Francés</span></button>
              <button onClick={() => setSystem('german')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${system === 'german' ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}><span className={`text-xs font-black uppercase ${system === 'german' ? 'text-amber-500' : 'text-slate-500'}`}>Alemán</span></button>
            </div>
          </div>
          <div className="pt-4 border-t dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest  flex items-center gap-2">
                <TrendingUp className="w-3 h-3"/> Inflación Proyectada
                <div className="group relative">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
                  <div className="absolute left-0 bottom-full mb-2 w-72 p-4 bg-slate-900 text-[10px] text-white font-medium rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 leading-relaxed border border-white/10  normal-case tracking-normal">
                    <b className="text-indigo-400">REM:</b> Relevamiento de Expectativas de Mercado (BCRA). Utiliza el consenso dinámico de más de 40 consultoras y bancos que estiman un valor distinto para cada mes. El REM provee proyecciones de expertos para los primeros 36 meses. <br/><br/> 
                    Para el tiempo restante, ProyectAR aplica una "Inercia": podés usar el último dato del REM de forma constante (Modo Auto) o setear un valor propio (Modo Fija). <br/><br/>
                    <b className="text-indigo-400">Manual:</b> Ignora el mercado y aplica una misma tasa fija todos los meses. Es útil para proyectar escenarios lineales de largo plazo.
                  </div>
                </div>
              </label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button disabled={dateMode === 'generic'} onClick={() => setInflationMode('rem')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${inflationMode === 'rem' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>REM</button>
                <button onClick={() => setInflationMode('manual')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${inflationMode === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>MANUAL</button>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border dark:border-slate-800">
              {inflationMode === 'manual' ? (
                <div className="animate-in fade-in space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-500 uppercase">Tasa fija anual estimada</span><span className="text-[11px] font-mono font-black dark:text-white">{inflation}%</span></div>
                    <input type="range" min="0" max="100" step="0.5" value={Number(String(inflation).replace(',', '.')) || 0} onChange={(e)=>setInflation(String(e.target.value).replace('.', ','))} className="w-full accent-indigo-500" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3"><p className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 leading-none"><Zap className="w-3 h-3" /> Inercia Post-REM</p><div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl"><button onClick={() => setRemStabilizedMode('auto')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg ${remStabilizedMode === 'auto' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>AUTO</button><button onClick={() => setRemStabilizedMode('custom')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg ${remStabilizedMode === 'custom' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>FIJA</button></div></div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black dark:text-white uppercase leading-tight ">
                    {remStabilizedMode === 'auto' ? `Aplicando ${(remData && remData.length > 0 ? remData[remData.length-1].valor : '---')}% mensual` : 
                      <div>
                        <div className="flex justify-between mb-1"><span>Tasa Fija mensual estimada:</span><span>{remStabilizedValue}%</span></div>
                        <input type="range" min="0" max="10" step="0.1" value={Number(String(remStabilizedValue).replace(',', '.')) || 0} onChange={(e)=>setRemStabilizedValue(String(e.target.value).replace('.', ','))} className="w-full accent-indigo-500" />
                      </div>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border dark:border-slate-800 shadow-xl space-y-5 text-left text-[11px]">
          <h4 className="font-black uppercase text-slate-800 dark:text-white flex items-center gap-2"><Globe className="w-3 h-3 text-indigo-500" /> Webs de los principales bancos argentinos</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: "Bco. Nación", u: "https://www.bna.com.ar/Personas/CreditosHipotecarios", l: "/logos/bconacion.png" },
              { n: "Bco. Ciudad", u: "https://bancociudad.com.ar/institucional/micrositio/PrestamoRemodelacionVivienda", l: "/logos/ciudad.png" },
              { n: "Hipotecario", u: "https://www.hipotecario.com.ar/personas/prestamos-a-la-vivienda/tradicional/adquisicion/", l: "/logos/hipotecario.png" },
              { n: "Santander", u: "https://www.santander.com.ar/personas/prestamos/hipotecarios-uva", l: "/logos/santander.png" },
              { n: "BBVA", u: "https://www.bbva.com.ar/personas/productos/creditos-hipotecarios.html", l: "/logos/bbva.png" },
              { n: "Macro", u: "https://www.macro.com.ar/personas/prestamos-hipotecarios?d=Any", l: "/logos/macro.png" }
            ].map(b => <BankCard key={b.n} name={b.n} url={b.u} logoUrl={b.l} />)}
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-9 space-y-8 min-w-0">
        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap gap-4 w-full">
          <SummaryCard title="Cuota Inicial" value={money(totals.cuotaInicial)} icon={Wallet} colorClass="indigo" subtitle="Vencimiento 1" />
          <SummaryCard title="Carga Intereses" value={money(totals.totalIntereses)} icon={TrendingUp} colorClass="orange" subtitle="Financiamiento" />
          <SummaryCard title="Afectación (RCI)" value={salary > 0 ? `${((totals.cuotaInicial / salary) * 100).toFixed(1)}%` : "--- %"} icon={Activity} colorClass={salary > 0 && (totals.cuotaInicial / salary) > 0.3 ? "rose" : "emerald"} subtitle="Puede ser limitada por el banco." />
          <SummaryCard title="Pago Final" value={money(totals.totalPagadoFinal)} icon={CheckCircle2} colorClass="sky" subtitle="Costo Total" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border dark:border-slate-800 shadow-sm relative overflow-hidden text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <h3 className="font-black text-2xl tracking-tighter uppercase dark:text-white  leading-none">Dinámica de Pagos Proyectada</h3>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-inner">
              {['2y', '3y', '5y', '10y', 'all'].map(t => (
                <button key={t} onClick={()=>setTimeframe(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${timeframe === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                  {t === 'all' ? 'TODO' : t.replace('y', ' AÑOS')}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[480px] w-full mb-8"><CompositionChart data={filteredData} dateMode={dateMode} showRemMarker={inflationMode === 'rem'} /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden text-left text-[11px]">
          <div className="p-8 flex flex-col sm:flex-row justify-between items-center border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 gap-4">
            <span className="text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2  leading-none"><FileText className="w-4 h-4 text-indigo-500"/> Tabla de Amortización</span>
            <button onClick={exportToCSV} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest leading-none"><Download className="inline w-4 h-4 mr-2" /> Exportar CSV</button>
          </div>
          <div className="max-h-[850px] overflow-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 text-slate-400 font-black uppercase text-[10px] border-b dark:border-slate-800 z-10 shadow-sm">
                <tr><th className="p-4 text-center">Periodo</th><th className="p-4 text-center">Origen</th><th className="p-4 text-center">Cuota Total</th><th className="p-4 text-center">Interés</th><th className="p-4 text-center">Capital</th><th className="p-4 text-center">Gastos</th><th className="p-4 text-center">Saldo</th></tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800 text-center">
                {schedule.map((d) => (
                  <tr key={d.mes} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{d.label}</td>
                    <td className="p-4"><span className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase shadow-sm ${d.source === 'REM' ? 'bg-indigo-600 text-white' : 'bg-slate-500 text-white'}`}>{d.source}</span></td>
                    <td className="p-4 font-black text-slate-900 dark:text-white whitespace-nowrap">{money(d.cuotaTotal)}</td>
                    <td className="p-4 text-orange-600 font-bold whitespace-nowrap">{money(d.interes)}</td>
                    <td className="p-4 text-indigo-600 font-bold whitespace-nowrap">{money(d.principal)}</td>
                    <td className="p-4 text-rose-500 font-bold opacity-80 whitespace-nowrap">{money(d.gastos)}</td>
                    <td className="p-4 text-slate-800 dark:text-slate-100 font-black font-mono  whitespace-nowrap">{money(d.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- VISTA ALQUILERES ---
function RentCalculator({ remData, remStatus }) {
  const [rentAmount, setRentAmount] = useState(0);
  const [expensesAmount, setExpensesAmount] = useState(0); 
  const [periodicity, setPeriodicity] = useState(4);
  const [durationYears, setDurationYears] = useState(2); 
  const [inflationMode, setInflationMode] = useState('rem');
  const [manualInf, setManualInf] = useState("0"); 
  const [adjustExpenses, setAdjustExpenses] = useState(true);

  const schedule = useMemo(() => {
    if (rentAmount === 0 && expensesAmount === 0) return [];
    const data = [];
    const totalMonths = durationYears * 12;
    let currentRent = rentAmount;
    let currentExpenses = expensesAmount;
    let accumulatedFactor = 1;
    const start = new Date();
    for (let i = 1; i <= totalMonths; i++) {
      const currentDate = new Date(start.getFullYear(), start.getMonth() + i - 1, 1);
      let monthlyRate;
      if (inflationMode === 'rem' && remStatus === 'available') {
        const match = remData.find(d => d.mes === (currentDate.getMonth() + 1) && d.año === currentDate.getFullYear());
        monthlyRate = match ? match.valor / 100 : (remData && remData.length > 0 ? remData[remData.length-1]?.valor / 100 : 0.025);
      } else { 
        monthlyRate = Math.pow(1 + (Number(manualInf) / 100), 1/12) - 1; 
      }
      if (i > 1 && adjustExpenses) { currentExpenses *= (1 + monthlyRate); }
      accumulatedFactor *= (1 + monthlyRate);
      if (i > 1 && (i - 1) % periodicity === 0) { currentRent *= accumulatedFactor; accumulatedFactor = 1; }
      data.push({
        mes: i, 
        label: `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
        shortDate: `${MESES[currentDate.getMonth()]} ${String(currentDate.getFullYear()).slice(-2)}`,
        cuotaTotal: currentRent + currentExpenses, 
        principal: currentRent, 
        interes: currentExpenses, 
        gastos: 0,
        source: inflationMode === 'rem' ? 'REM' : 'ALQUILER'
      });
    }
    return data;
  }, [rentAmount, expensesAmount, periodicity, durationYears, inflationMode, manualInf, remData, remStatus, adjustExpenses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border dark:border-slate-800 space-y-8 text-left">
        <CurrencyInput label="Alquiler Inicial" value={rentAmount} onChange={setRentAmount} />
        <div className="space-y-4">
          <CurrencyInput label="Expensas Iniciales" value={expensesAmount} onChange={setExpensesAmount} />
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-500 ">¿Ajustar Expensas por inflación? (Mensualmente)</span>
            <button onClick={() => setAdjustExpenses(!adjustExpenses)} className={`w-12 h-6 rounded-full transition-all relative ${adjustExpenses ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${adjustExpenses ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block  leading-none">Duración del Contrato de alquiler</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(y => (
              <button key={y} onClick={() => setDurationYears(y)} className={`py-3 rounded-xl text-xs font-black transition-all ${durationYears === y ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                {y} {y===1?'AÑO':'AÑOS'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block  leading-none">Recurrencia del Ajuste del Alquiler (Meses)</label>
          <div className="grid grid-cols-3 gap-2">
            {[3, 4, 6].map(m => (
              <button key={m} onClick={() => setPeriodicity(m)} className={`py-3 rounded-xl text-xs font-black transition-all ${periodicity === m ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-6 border-t dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-black uppercase text-slate-400 ">Inflación Proyectada</label>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button disabled={remStatus === 'error'} onClick={() => setInflationMode('rem')} className={`px-3 py-1 text-[9px] font-black rounded ${inflationMode === 'rem' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>REM</button>
              <button onClick={() => setInflationMode('manual')} className={`px-3 py-1 text-[9px] font-black rounded ${inflationMode === 'manual' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>MANUAL</button>
            </div>
          </div>

          {/* Nota REM solicitada para alquileres */}
          {inflationMode === 'rem' && (
            <p className="text-[9px] text-slate-400 mt-2 mb-4  px-1 leading-tight">
              Nota: El REM proyecta los próximos 36 meses, cubriendo la totalidad de este contrato.
            </p>
          )}

          {inflationMode === 'manual' && (
            <div className="animate-in fade-in space-y-2">
               <div className="flex justify-between items-center"><span className="text-[10px] font-black text-emerald-500 uppercase">Tasa fija anual estimada</span><span className="text-[11px] font-mono font-black dark:text-white">{manualInf}%</span></div>
               <input type="range" min="0" max="100" step="1" value={manualInf} onChange={(e)=>setManualInf(e.target.value)} className="w-full accent-emerald-500 cursor-pointer" />
            </div>
          )}
        </div>
      </div>
      <div className="lg:col-span-9 space-y-8">
        <SummaryCard title="Costo Total Contrato" value={money(schedule.reduce((acc,c)=>acc+c.cuotaTotal,0))} icon={CheckCircle2} colorClass="sky" subtitle="Alquiler + Expensas" />
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border dark:border-slate-800 shadow-sm relative overflow-hidden text-left">
          <h3 className="font-black text-2xl mb-8 uppercase dark:text-white  leading-none">Proyección Alquiler</h3>
          <div className="h-[450px] w-full">
            <CompositionChart data={schedule} dateMode="calendar" showRemMarker={inflationMode === 'rem'} isRent={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- APP COMPONENT PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('mortgage'); 
  const [darkMode, setDarkMode] = useState(true);
  const [dolarOficial, setDolarOficial] = useState(0);
  const [uvaValue, setUvaValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [remDateLabel, setRemDateLabel] = useState(""); 
  const [remData, setRemData] = useState([]);
  const [remStatus, setRemStatus] = useState('loading');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    document.title = "ProyectAR | Soberanía Financiera";
    const fetchData = async () => {
      try {
        const resMarket = await fetch(`/market/market_status.json?v=${new Date().getTime()}`);
        if (resMarket.ok) {
          const m = await resMarket.json();
          setDolarOficial(m.dolar_oficial); setUvaValue(m.uva_value); setLastUpdate(m.last_update);
        }
        const resRem = await fetch(`/REM/processed/proyeccion_inflacion.csv?v=${new Date().getTime()}`);
        if (resRem.ok) {
          const text = await resRem.text();
          const rows = text.split('\n').slice(1);
          const parsed = rows.map(r => r.trim()).filter(r => r.length > 0).map(r => {
            const [m, a, v] = r.split(';');
            return { mes: parseInt(m), año: parseInt(a), valor: parseFloat(v.replace(',', '.')) };
          });
          setRemData(parsed); setRemStatus('available');
          if (parsed.length > 0) setRemDateLabel(`${MESES[parsed[0].mes - 1]} ${parsed[0].año}`);
        } else { setRemStatus('error'); }
      } catch (e) { console.error(e); setRemStatus('error'); } finally { setLoading(false); }
    };
    fetchData();
  }, []);
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors flex flex-col">
        <div className="bg-slate-900 text-white py-3 border-b border-white/5 relative z-40 px-6 md:px-10">
          <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] font-black tracking-widest uppercase  text-slate-500">
            <div className="flex items-center gap-6 leading-none">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" /> Fuentes: <a href="https://dolarapi.com" target="_blank" className="hover:text-emerald-400">DolarAPI</a> • <a href="https://argentinadatos.com" target="_blank" className="hover:text-indigo-400">ArgentinaDatos</a>
              </div>
              <span className="hidden md:inline text-slate-700">|</span>
              <span className="hidden sm:inline">REM: {remDateLabel || '---'}</span>
            </div>
            <div className="flex gap-12 items-center font-mono leading-none">
              <div>DÓLAR OFICIAL <span className="text-emerald-400 font-black">${dolarOficial}</span></div>
              <div>UVA <span className="text-indigo-400 font-black">${uvaValue}</span></div>
            </div>
          </div>
        </div>
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-b dark:border-slate-800 sticky top-0 z-40 h-20 md:h-28 flex items-center justify-between px-6 md:px-10 shadow-sm">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="bg-indigo-600 text-white p-3 md:p-4 rounded-2xl shadow-xl shadow-indigo-600/30"><Calculator className="w-6 h-6 md:w-8 md:h-8" /></div>
            <div className="flex flex-col text-left"><span className="font-black text-xl md:text-3xl tracking-tighter uppercase leading-none ">Proyect<span className="text-sky-400">AR</span></span><span className="text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mt-2 md:mt-3 opacity-60  leading-none">v0.9.6</span></div>
          </div>
          <div className="flex items-center gap-3 md:gap-10">
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-2xl border dark:border-slate-700 shadow-inner">
              <NavBtn active={view === 'mortgage'} onClick={() => setView('mortgage')} icon={<Home />} label="CRÉDITOS" color="indigo"/>
              <NavBtn active={view === 'rent'} onClick={() => setView('rent')} icon={<ArrowRightLeft />} label="ALQUILERES" color="emerald"/>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 md:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 shadow-md active:scale-90">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </nav>
        <main className="max-w-[1800px] mx-auto p-6 md:p-10 flex-grow w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 md:py-60 gap-6">
              <div className="w-20 h-20 border-[8px] border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse  text-center">Sincronizando Mercados...</p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-1000">
              {view === 'mortgage' ? <MortgageCalculator uvaValue={uvaValue} remData={remData} remStatus={remStatus} /> : <RentCalculator remData={remData} remStatus={remStatus} />}
            </div>
          )}
        </main>
        <footer className="max-w-[1800px] mx-auto w-full border-t dark:border-slate-800 mt-10 md:mt-20 py-10 md:py-16 px-6 md:px-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50 ">{"República Argentina - 2026"}</p>
          </div>
          <div className="flex-[2] max-w-2xl mx-auto text-center opacity-60">
            <p className="text-[10px] leading-relaxed uppercase tracking-tighter font-medium text-slate-500 dark:text-slate-400">
              <span className="font-black text-indigo-500">Aviso Legal:</span> {"ProyectAR es una herramienta de simulación informativa. Los resultados son proyecciones basadas en datos históricos y estimaciones de mercado (REM - BCRA), no garantizan resultados futuros."}
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center lg:items-end gap-2 text-[11px] font-bold text-slate-400 uppercase opacity-50 ">
            <a href="https://github.com/MaxiNavarro97" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-400 transition-colors"><Github className="w-4 h-4" /> @MaxiNavarro97</a>
            <p>@maxinavarro1997@gmail.com</p>
          </div>
        </footer>
      </div>
    </div>
  );
}