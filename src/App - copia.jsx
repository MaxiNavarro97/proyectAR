import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Calculator, DollarSign, Calendar, Percent, 
  TrendingUp, Info, Globe, Home, ArrowRightLeft,
  Building2, CheckCircle, AlertCircle, Moon, Sun,
  Download, Filter, ChevronDown, ChevronUp, ExternalLink,
  Zap, Settings2, CalendarDays, AlertTriangle, Scale,
  Library, HelpCircle, Wallet, PieChart, ArrowUpRight,
  TrendingDown, Landmark, FileText, Lightbulb, Mail,
  Activity, Heart, Twitter, Github, Clock
} from 'lucide-react';

// --- CONSTANTES ---
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const YEARS_AHEAD = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i);

const money = (v) => new Intl.NumberFormat('es-AR', { 
  style: 'currency', 
  currency: 'ARS', 
  maximumFractionDigits: 0 
}).format(v);

// --- COMPONENTES AUXILIARES ---

function NavBtn({ active, onClick, icon, label, color }) {
  const themes = {
    indigo: 'text-indigo-600 bg-white dark:bg-slate-800 shadow-md border-indigo-100 dark:border-indigo-500/30 scale-105',
    emerald: 'text-emerald-600 bg-white dark:bg-slate-800 shadow-md border-emerald-100 dark:border-emerald-500/30 scale-105',
    violet: 'text-violet-600 bg-white dark:bg-slate-800 shadow-md border-violet-100 dark:border-violet-500/30 scale-105'
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all border border-transparent active:scale-95 ${active ? themes[color] : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
    >
      {icon} {label}
    </button>
  );
}

function CurrencyInput({ value, onChange, label, sublabel, colorClass = "indigo" }) {
  const [isFocused, setIsFocused] = useState(false);
  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    onChange(Number(rawValue));
  };
  const formatted = new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    maximumFractionDigits: 0 
  }).format(value);

  return (
    <div className="group">
      <label className={`text-[10px] font-black block mb-2 uppercase tracking-widest flex items-center gap-2 transition-colors ${isFocused ? `text-indigo-500` : 'text-slate-400'}`}>
        {label}
      </label>
      <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
        <input 
          type="text" 
          value={formatted} 
          onChange={handleChange} 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-mono text-xl font-bold outline-none border-2 border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-400/30 shadow-inner transition-all dark:text-white"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 dark:text-slate-400">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
      {sublabel && <p className="text-[9px] text-slate-400 mt-2 italic px-1 leading-relaxed">{sublabel}</p>}
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, colorClass, subtitle }) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    orange: 'bg-orange-500/10 text-orange-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm flex items-start gap-4 transition-all hover:translate-y-[-2px] hover:shadow-md">
      <div className={`p-3 rounded-xl ${colorMap[colorClass] || 'bg-slate-500/10 text-slate-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-lg font-black tracking-tight dark:text-white`}>{value}</p>
        {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function BankCard({ name, url, logoUrl }) {
  const [imgError, setImgError] = useState(false);
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-800/50 border dark:border-slate-800 hover:border-indigo-500/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden aspect-square"
    >
      <div className="relative z-10 h-10 w-full flex items-center justify-center mb-2">
        {!imgError ? (
          <img src={logoUrl} alt={name} onError={() => setImgError(true)} className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110" />
        ) : (
          <Landmark className="w-6 h-6 text-slate-300 group-hover:text-indigo-500" />
        )}
      </div>
      <span className="text-[8px] font-black text-slate-400 group-hover:text-indigo-500 uppercase tracking-tighter text-center">{name}</span>
    </a>
  );
}

// --- GRÁFICOS ---

function CompositionChart({ data, dateMode }) {
  const [hovered, setHovered] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) return (
    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sin datos para proyectar</p>
    </div>
  );
  
  const maxVal = Math.max(...data.map(d => d.cuotaTotal)) * 1.15;
  const w = 1000, h = 400, padL = 80, padB = 60, padT = 20;
  
  const step = Math.max(1, Math.ceil(data.length / 60));
  const sampled = data.filter((_, i) => i % step === 0);

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {hovered && (
        <div 
          className="absolute z-50 pointer-events-none bg-white dark:bg-slate-800 shadow-2xl rounded-xl border dark:border-slate-700 p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: `${(hovered.x / w) * 100}%`, 
            top: `${(hovered.y / h) * 100 - 10}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center justify-between mb-2 border-b dark:border-slate-700 pb-1.5">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{hovered.data.label}</p>
              {/* BUG FIX: Added optional chaining to avoid crash if UVA is missing */}
              <span className="text-[8px] font-mono text-slate-400">UVA: ${hovered.data.uva?.toFixed(2) || "---"}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Total Cuota:</span>
              <span className="text-sm font-black dark:text-white">{money(hovered.data.cuotaTotal)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Capital:</span>
              </div>
              <span className="text-[10px] font-bold dark:text-slate-200">{money(hovered.data.principal)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Interés:</span>
              </div>
              <span className="text-[10px] font-bold dark:text-slate-200">{money(hovered.data.interes)}</span>
            </div>
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible select-none" preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <g key={p}>
            <line x1={padL} y1={h - padB - (h - padB - padT) * p} x2={w} y2={h - padB - (h - padB - padT) * p} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4"/>
            <text x={padL - 15} y={h - padB - (h - padB - padT) * p + 5} textAnchor="end" className="text-[14px] fill-slate-400 font-mono font-bold">
              {Math.round((maxVal * p) / 1000)}k
            </text>
          </g>
        ))}

        {sampled.map((d, i) => {
          const barAreaW = (w - padL) / sampled.length;
          const barW = barAreaW * 0.8;
          const x = padL + i * barAreaW;
          const hInt = (d.interes / maxVal) * (h - padB - padT);
          const hPri = (d.principal / maxVal) * (h - padB - padT);

          return (
            <g 
              key={i} 
              onMouseEnter={() => setHovered({ x: x + barW / 2, y: h - padB - hInt - hPri, data: d })}
              onMouseLeave={() => setHovered(null)}
              className="group cursor-pointer"
            >
              <rect x={x} y={h - padB - hInt} width={barW} height={hInt} fill="#fb923c" rx="1.5" className="transition-all hover:brightness-110"/>
              <rect x={x} y={h - padB - hInt - hPri} width={barW} height={hPri} fill="#6366f1" rx="1.5" className="transition-all hover:brightness-110"/>
              
              {(i % Math.ceil(sampled.length/10) === 0) && (
                <g>
                  <text x={x + barW/2} y={h - padB + 25} textAnchor="middle" className="text-[12px] fill-slate-500 font-black uppercase tracking-tighter">
                    {dateMode === 'calendar' ? d.shortDate : `M${d.mes}`}
                  </text>
                  <line x1={x + barW/2} y1={h-padB} x2={x+barW/2} y2={h-padB+8} stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
                </g>
              )}
            </g>
          );
        })}
        <line x1={padL} y1={h - padB} x2={w} y2={h - padB} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2"/>
      </svg>
    </div>
  );
}

// --- VISTAS ---

function MortgageCalculator({ dolarOficial, uvaValue }) {
  const [amount, setAmount] = useState(60000000);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState("5.5");
  const [inflation, setInflation] = useState("35");
  const [system, setSystem] = useState('french'); 
  const [inflationMode, setInflationMode] = useState('rem'); 
  const [remStabilizedMode, setRemStabilizedMode] = useState('auto');
  const [remStabilizedValue, setRemStabilizedValue] = useState("2.5");
  const [timeframe, setTimeframe] = useState('all');
  
  const [dateMode, setDateMode] = useState('calendar'); 
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());

  const [remData, setRemData] = useState([]);
  const [remStatus, setRemStatus] = useState('loading');

  useEffect(() => {
    const loadRemCsv = async () => {
      setRemStatus('loading');
      try {
        const csvPath = `${window.location.origin}/data/processed/proyeccion_inflacion.csv`;
        const response = await fetch(csvPath);
        if (!response.ok) throw new Error("File not found");
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        const parsed = rows.filter(row => row.trim()).map(row => {
          const columns = row.split(';');
          if (columns.length < 3) return null;
          const [mes, año, valor] = columns;
          return {
            mes: parseInt(mes),
            año: parseInt(año),
            valor: parseFloat(valor.replace(',', '.'))
          };
        }).filter(Boolean);
        
        if (parsed.length > 0) {
          setRemData(parsed);
          setRemStatus('available');
          setRemStabilizedValue(parsed[parsed.length - 1].valor.toString().replace('.', ','));
        } else {
          throw new Error("No data in CSV");
        }
      } catch (err) {
        setRemData([]);
        setRemStatus('error');
      }
    };
    loadRemCsv();
  }, []);

  const handleDecimalInput = (value, setter) => {
    const normalized = value.replace(',', '.');
    if (normalized === '' || normalized === '.' || /^\d*\.?\d*$/.test(normalized)) {
      setter(value);
    }
  };

  useEffect(() => {
    if (dateMode === 'generic' && inflationMode === 'rem') {
      setInflationMode('manual');
    }
  }, [dateMode, inflationMode]);

  const schedule = useMemo(() => {
    const totalMonths = years * 12;
    const currentUva = uvaValue || 1;
    const rateNum = Number(String(rate).replace(',', '.')) || 0;
    const inflationNum = Number(String(inflation).replace(',', '.')) || 0;
    const monthlyRate = (rateNum / 100) / 12;
    const manualMonthlyInf = Math.pow(1 + inflationNum / 100, 1 / 12) - 1;
    
    let remStabilizedMonthly;
    if (remStabilizedMode === 'auto' && remData.length > 0) {
        remStabilizedMonthly = remData[remData.length - 1].valor / 100;
    } else {
        remStabilizedMonthly = (Number(String(remStabilizedValue).replace(',', '.')) || 0) / 100;
    }
    
    let balanceUva = amount / currentUva;
    const data = [];
    let projUva = currentUva;
    let currentDate = new Date(startYear, startMonth, 1);
    const constantAmortizationUva = (amount / currentUva) / totalMonths;

    for (let i = 1; i <= totalMonths; i++) {
      if (balanceUva <= 0) break;
      let interestUva = balanceUva * monthlyRate;
      let principalUva;

      if (system === 'french') {
        const pmtUva = monthlyRate > 0 
          ? (balanceUva * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -(totalMonths - i + 1)))
          : (amount / currentUva) / totalMonths;
        principalUva = pmtUva - interestUva;
      } else {
        principalUva = constantAmortizationUva;
      }

      if (principalUva > balanceUva) {
        principalUva = balanceUva;
        balanceUva = 0;
      } else {
        balanceUva -= principalUva;
      }

      data.push({
        mes: i,
        label: dateMode === 'calendar' ? `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `Mes ${i}`,
        shortDate: `${MESES[currentDate.getMonth()]} ${String(currentDate.getFullYear()).slice(-2)}`,
        cuotaTotal: (principalUva + interestUva) * projUva,
        interes: interestUva * projUva,
        principal: principalUva * projUva,
        saldo: balanceUva * projUva,
        uva: projUva
      });

      let currentMonthInf;
      if (inflationMode === 'rem' && dateMode === 'calendar' && remData.length > 0) {
        const found = remData.find(d => d.mes === (currentDate.getMonth() + 1) && d.año === currentDate.getFullYear());
        currentMonthInf = found ? (found.valor / 100) : remStabilizedMonthly;
      } else {
        currentMonthInf = manualMonthlyInf;
      }
      
      projUva *= (1 + currentMonthInf);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return data;
  }, [amount, years, rate, system, inflation, inflationMode, remStabilizedMode, remStabilizedValue, uvaValue, dateMode, startMonth, startYear, remData]);

  const totals = useMemo(() => {
    return {
      totalPagado: schedule.reduce((acc, curr) => acc + curr.cuotaTotal, 0),
      totalInteres: schedule.reduce((acc, curr) => acc + curr.interes, 0),
      cuotaInicial: schedule[0]?.cuotaTotal || 0,
    };
  }, [schedule]);

  const exportarAnalisisExcel = () => {
    const encabezados = ["Periodo", "Cuota Total", "Interes", "Capital", "Saldo Remanente"];
    const filas = schedule.map(d => [d.label, Math.round(d.cuotaTotal), Math.round(d.interes), Math.round(d.principal), Math.round(d.saldo)].join(";"));
    const contenidoCsv = [encabezados.join(";"), ...filas].join("\n");
    const blob = new Blob(["\uFEFF" + contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HipotecAR_Reporte_${new Date().getTime()}.csv`;
    link.click();
  };

  const filteredData = useMemo(() => {
    if (timeframe === 'all') return schedule;
    return schedule.slice(0, Math.min(schedule.length, parseInt(timeframe) * 12));
  }, [schedule, timeframe]);

  const banks = [
    { n: "Bco. Nación", u: "https://www.bna.com.ar/Personas/CreditosHipotecarios", l: "https://www.bna.com.ar/Content/img/logo-bna.png" },
    { n: "Bco. Ciudad", u: "https://www.bancociudad.com.ar/personas/creditos/hipotecarios", l: "https://www.bancociudad.com.ar/Content/img/logo-header.png" },
    { n: "Hipotecario", u: "https://www.hipotecario.com.ar/personas/creditos-hipotecarios/uva/", l: "https://www.hipotecario.com.ar/images/logo-hipotecario.png" },
    { n: "Santander", u: "https://www.santander.com.ar/banco/online/personas/prestamos/hipotecarios-uva", l: "https://www.santander.com.ar/banco/online/static/media/logo-santander.f1a84f33.svg" },
    { n: "BBVA", u: "https://www.bbva.com.ar/personas/productos/prestamos/hipotecarios-uva.html", l: "https://www.bbva.com.ar/favicon.ico" },
    { n: "Macro", u: "https://www.macro.com.ar/personas/prestamos/hipotecarios-uva", l: "https://www.macro.com.ar/images/default-source/logos/logo-macro.png" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SIDEBAR IZQUIERDO */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Panel de Configuración Temporal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20"><CalendarDays className="w-4 h-4" /></div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Fijación de Fecha</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner mb-4">
              <button onClick={() => setDateMode('calendar')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 ${dateMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                <Calendar className="w-3 h-3" /> CALENDARIO
              </button>
              <button onClick={() => setDateMode('generic')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 ${dateMode === 'generic' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                <Clock className="w-3 h-3" /> GENÉRICO
              </button>
            </div>

            {dateMode === 'calendar' ? (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mes de Inicio</label>
                  <select 
                    value={startMonth} 
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 border dark:border-slate-700 dark:text-white transition-all cursor-pointer"
                  >
                    {MESES.map((m, i) => <option key={m} value={i}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Año de Inicio</label>
                  <select 
                    value={startYear} 
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 border dark:border-slate-700 dark:text-white transition-all cursor-pointer"
                  >
                    {YEARS_AHEAD.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-3 animate-in fade-in">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                  El modo genérico es ideal para simulaciones abstractas, pero desactiva la inteligencia del REM.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Parámetros */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border dark:border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20"><Settings2 className="w-4 h-4" /></div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Parámetros Críticos</h3>
          </div>
          
          <div className="space-y-6">
            <CurrencyInput label="Monto del Préstamo" value={amount} onChange={setAmount} sublabel="Monto neto a acreditar." />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Plazo: {years} años</label>
                <input type="range" min="5" max="30" value={years} onChange={(e)=>setYears(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer"/>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                <label className="text-[10px] font-black text-indigo-500 block mb-2 uppercase tracking-widest text-center">Tasa Anual (%)</label>
                <input type="text" value={rate} onChange={(e) => handleDecimalInput(e.target.value, setRate)} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
              </div>
            </div>

            <div className="pt-6 border-t dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3 h-3"/> Proyección Inflación
                </label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
                  <button 
                    disabled={dateMode === 'generic'} 
                    onClick={() => setInflationMode('rem')} 
                    className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${inflationMode === 'rem' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'} ${dateMode === 'generic' ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >REM</button>
                  <button onClick={() => setInflationMode('manual')} className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${inflationMode === 'manual' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500'}`}>MANUAL</button>
                </div>
              </div>

              {dateMode === 'generic' && (
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter mb-4 text-center animate-pulse">
                  ⚠️ REM desactivado: requiere Modo Calendario
                </p>
              )}

              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 min-h-[80px] border dark:border-slate-800 transition-all">
                {inflationMode === 'manual' ? (
                  <div className="animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-3 px-1">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">Estimación Anual (%)</span>
                      <input type="text" value={inflation} onChange={(e) => handleDecimalInput(e.target.value, setInflation)} className="w-20 p-1 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded text-right font-mono text-sm font-black text-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                    </div>
                    <input type="range" min="0" max="200" step="0.5" value={Number(String(inflation).replace(',', '.')) || 0} onChange={(e)=>setInflation(String(e.target.value).replace('.', ','))} className="w-full accent-orange-500" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
                        <p className="text-[10px] font-black text-indigo-500 flex items-center gap-2 uppercase tracking-tighter">
                          <Zap className="w-3 h-3"/> Estabilización Residual
                        </p>
                        <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                           <button 
                            onClick={() => setRemStabilizedMode('auto')} 
                            className={`px-2 py-0.5 text-[8px] font-black rounded ${remStabilizedMode === 'auto' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                          >AUTO</button>
                           <button 
                            onClick={() => setRemStabilizedMode('custom')} 
                            className={`px-2 py-0.5 text-[8px] font-black rounded ${remStabilizedMode === 'custom' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                          >MANO</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                      {remStatus === 'error' ? (
                         <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-center animate-pulse">
                            <p className="text-[9px] font-black text-red-500 uppercase">Sin conexión al servidor REM</p>
                         </div>
                      ) : remStabilizedMode === 'auto' ? (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm">
                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 leading-tight">Inercia Post-REM:</p>
                            <p className="text-xs font-black dark:text-white leading-relaxed">Tras los 36 meses del REM, se mantiene el último dato oficial ({remData.length > 0 ? remData[remData.length-1].valor : '---'}% mensual).</p>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Post-REM Mensual</span>
                            <span className="text-[11px] font-mono font-black text-indigo-500">{remStabilizedValue}%</span>
                          </div>
                          <input type="range" min="0" max="10" step="0.1" value={Number(String(remStabilizedValue).replace(',', '.')) || 0} onChange={(e)=>setRemStabilizedValue(String(e.target.value).replace('.', ','))} className="w-full accent-indigo-500" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-6 border-t dark:border-slate-800">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Scale className="w-3 h-3"/> Método de Amortización
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['french', 'german'].map(s => (
                  <button key={s} onClick={() => setSystem(s)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${system === s ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}>
                    <span className={`text-[10px] font-black uppercase ${system === s ? 'text-indigo-600' : 'text-slate-500'}`}>{s === 'french' ? 'Francés' : 'Alemán'}</span>
                    <span className="text-[8px] text-slate-400 font-medium text-center leading-tight">{s === 'french' ? 'Cuota fija UVA' : 'Capital fijo UVA'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box sobre REM */}
        <div className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group transition-all duration-500 ${remStatus === 'error' ? 'bg-slate-800 shadow-slate-900/40' : 'bg-indigo-600 shadow-indigo-500/20'}`}>
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            {remStatus === 'error' ? <AlertTriangle className="w-32 h-32" /> : <Zap className="w-32 h-32" />}
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className={`w-3 h-3 ${remStatus === 'available' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Sincronización BCRA</h4>
              </div>
              <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${remStatus === 'available' ? 'bg-emerald-500/20 text-emerald-400' : remStatus === 'loading' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                {remStatus === 'available' ? 'CONECTADO' : remStatus === 'loading' ? 'SYNC...' : 'OFFLINE'}
              </span>
            </div>

            {remStatus === 'error' ? (
              <div className="animate-in slide-in-from-top-2 duration-500">
                <h3 className="text-lg font-black leading-tight mb-2 uppercase italic tracking-tighter text-red-400">Datos del Mercado no Disponibles</h3>
                <p className="text-[11px] leading-relaxed text-slate-300 opacity-90 mb-4">
                  No hemos podido obtener las expectativas del <strong>Banco Central (BCRA)</strong>. Por favor, utiliza el <strong>Modo Manual</strong> para proyectar la inflación por tu cuenta.
                </p>
                <a href="mailto:soporte@hipotecar.ai?subject=Error REM" className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-black transition-all">
                  <Mail className="w-3 h-3" /> REPORTAR FALLO
                </a>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-black leading-tight mb-2 uppercase italic tracking-tighter">¿Cómo funciona el REM?</h3>
                <p className="text-[11px] leading-relaxed text-indigo-50 opacity-90 leading-relaxed mb-3">
                  El <strong>Relevamiento de Expectativas de Mercado (REM)</strong> es una encuesta mensual realizada por el <strong>Banco Central (BCRA)</strong> que promedia las proyecciones de inflación de los principales analistas económicos del país.
                </p>
                <p className="text-[11px] leading-relaxed text-indigo-100 italic">
                  HipotecAR utiliza este dato para proyectar tus cuotas durante los próximos <strong>36 meses</strong>. Pasado ese tiempo, la simulación continúa según tu configuración de estabilización.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                   <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-2">
                     <AlertCircle className="w-3 h-3" /> Requisito Temporal
                   </p>
                   <p className="text-[10px] text-white/70 mt-1 italic">
                     El REM requiere activar el <strong>Modo Calendario</strong> para asociar las proyecciones a meses específicos y garantizar la precisión técnica del cálculo.
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Oferta Bancaria */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Landmark className="w-3 h-3"/> Oferta Bancaria</h4>
          <p className="text-[9px] text-slate-400 mb-6 italic leading-relaxed font-medium">Accede a las webs oficiales para consultar la Tasa Anual vigente y completa los parámetros superiores.</p>
          <div className="grid grid-cols-3 gap-3">
            {banks.map(b => <BankCard key={b.n} name={b.n} url={b.u} logoUrl={b.l} />)}
          </div>
        </div>

        {/* Donaciones */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Heart className="w-32 h-32 fill-current" />
          </div>
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-3 italic">Proyecto Independiente</h4>
            <p className="text-[11px] leading-relaxed mb-6 opacity-90">
              HipotecAR es una herramienta <strong>gratuita</strong>. Tu donación nos ayuda a mantener los servidores y seguir desarrollando herramientas financieras de acceso libre.
            </p>
            <a href="https://www.mercadopago.com.ar/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-white text-emerald-600 rounded-2xl text-[11px] font-black transition-all shadow-lg hover:scale-[1.03] active:scale-95 group">
              <Heart className="w-4 h-4 fill-emerald-600 group-hover:animate-pulse" /> COLABORAR CON EL PROYECTO
            </a>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="lg:col-span-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Cuota Inicial" value={money(totals.cuotaInicial)} icon={Wallet} colorClass="indigo" subtitle="Primer vencimiento proyectado" />
          <SummaryCard title="Carga Intereses" value={money(totals.totalInteres)} icon={TrendingUp} colorClass="orange" subtitle={`Total a lo largo de ${years} años`} />
          <SummaryCard title="Relación C/K" value={`${((totals.cuotaInicial / amount) * 100).toFixed(2)}%`} icon={PieChart} colorClass="emerald" subtitle="Cuota inicial vs Capital" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border dark:border-slate-800 shadow-sm relative overflow-visible">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h3 className="font-black text-xl tracking-tighter uppercase italic text-slate-800 dark:text-white">Dinámica de Pagos Proyectada</h3>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                {inflationMode === 'rem' ? `Basado en REM (BCRA) ${remStabilizedMode === 'auto' ? '+ Inercia' : '+ Estabilización'}` : `Cálculo basado en inflación manual`}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-inner">
              {['2y', '5y', '10y', 'all'].map(t => (
                <button key={t} onClick={()=>setTimeframe(t)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${timeframe === t ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 scale-105' : 'text-slate-400 opacity-60 hover:opacity-100'}`}>
                  {t === 'all' ? 'FULL' : t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-80 w-full mb-8">
            <CompositionChart data={filteredData} dateMode={dateMode} />
          </div>

          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 pt-6 border-t dark:border-slate-800">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-500/50"/><span className="text-[10px] font-black text-slate-500 uppercase">Capital</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-orange-400 rounded-full shadow-sm shadow-orange-400/50"/><span className="text-[10px] font-black text-slate-500 uppercase">Interés</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl"><FileText className="w-5 h-5 text-indigo-500" /></div>
              <div>
                <h3 className="font-black uppercase text-sm tracking-widest dark:text-white">Reporte de Sensibilidad</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">Evolución patrimonial detallada</p>
              </div>
            </div>
            <button onClick={exportarAnalisisExcel} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-[#217346] hover:bg-[#1a5c38] text-white rounded-2xl text-[11px] font-black transition-all shadow-lg active:scale-95 group">
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"/> EXPORTAR (.CSV)
            </button>
          </div>
          <div className="max-h-[850px] overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 text-slate-400 font-black uppercase text-[10px] border-b dark:border-slate-800 z-10">
                <tr><th className="p-5 text-center">Periodo</th><th className="p-5 text-center">Cuota Total</th><th className="p-5 text-center">Interés</th><th className="p-5 text-center">Capital</th><th className="p-5 text-center">Saldo</th></tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {schedule.map((d) => (
                  <tr key={d.mes} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group text-center">
                    <td className="p-5 font-bold text-slate-800 dark:text-slate-200">{d.label}</td>
                    <td className="p-5 font-black text-slate-900 dark:text-white">{money(d.cuotaTotal)}</td>
                    <td className="p-5 text-orange-500 font-bold">{money(d.interes)}</td>
                    <td className="p-5 text-indigo-500 font-bold">{money(d.principal)}</td>
                    <td className="p-5 text-slate-400 font-mono italic opacity-70 group-hover:opacity-100">{money(d.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="lg:col-span-12 bg-white dark:bg-slate-900 border-t dark:border-slate-800 mt-20 py-10 rounded-3xl px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b dark:border-slate-800 pb-8">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl"><Calculator className="w-5 h-5 text-indigo-500" /></div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tighter uppercase italic dark:text-white">HipotecAR</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Soberanía Financiera</span>
            </div>
          </div>
          <div className="flex gap-6">
            <a href="#" className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 hover:text-indigo-500 transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 hover:text-indigo-500 transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 hover:text-indigo-500 transition-colors"><Github className="w-5 h-5" /></a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">Argentina 2026 • Libertad Financiera</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-right">© {new Date().getFullYear()} HipotecAR - Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}

function RentCalculator() {
  const [rentAmount, setRentAmount] = useState(450000);
  const [periodicity, setPeriodicity] = useState(3);
  const [annualInflation, setAnnualInflation] = useState("50"); 
  const rentSchedule = useMemo(() => {
    const data = [];
    let currentRent = rentAmount;
    const periodRate = Math.pow(1 + (Number(String(annualInflation).replace(',','.'))/100), periodicity/12)-1;
    for(let i=1; i<=24; i++) {
      if(i>1 && (i-1)%periodicity === 0) currentRent *= (1+periodRate);
      data.push({ month: i, rent: currentRent });
    }
    return data;
  }, [rentAmount, periodicity, annualInflation]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border dark:border-slate-800 space-y-8">
        <CurrencyInput label="Alquiler Base" value={rentAmount} onChange={setRentAmount} colorClass="emerald" />
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-widest">Frecuencia de ajuste (meses)</label>
          <select value={periodicity} onChange={e => setPeriodicity(Number(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
            <option value={3}>3 meses</option><option value={4}>4 meses</option><option value={6}>6 meses</option><option value={12}>Anual</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-widest">Inflación Estimada (%)</label>
          <input type="range" min="0" max="250" value={annualInflation} onChange={(e) => setAnnualInflation(e.target.value)} className="w-full accent-emerald-500" />
          <p className="text-right font-mono font-bold text-emerald-500 mt-2">{annualInflation}% Anual</p>
        </div>
      </div>
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border dark:border-slate-800 shadow-sm">
        <h3 className="font-black text-xl mb-10 uppercase italic dark:text-white">Proyección de Alquiler</h3>
        <div className="h-80">
          <CompositionChart 
            // BUG FIX: Mapping data with 'mes' and a dummy 'uva' to avoid crashes in the shared component
            data={rentSchedule.map(r => ({ 
              ...r, 
              cuotaTotal: r.rent, 
              principal: r.rent, 
              interes: 0, 
              label: `Mes ${r.month}`,
              mes: r.month,
              uva: 0 
            }))} 
            dateMode="generic" 
          />
        </div>
      </div>
    </div>
  );
}

function ValuationCalculator({ dolarOficial }) {
  const [rentARS, setRentARS] = useState(500000);
  const [propertyUSD, setPropertyUSD] = useState(100000);
  const yieldP = useMemo(() => ((rentARS / dolarOficial * 12) / propertyUSD) * 100, [rentARS, propertyUSD, dolarOficial]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] shadow-xl border dark:border-slate-800 space-y-10">
        <CurrencyInput label="Alquiler Mensual (ARS)" value={rentARS} onChange={setRentARS} />
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-widest">Valor Venta (USD)</label>
          <div className="relative">
            <input type="number" value={propertyUSD} onChange={e => setPropertyUSD(Number(e.target.value))} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-mono text-4xl font-black outline-none dark:text-white" />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">USD</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center p-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] shadow-2xl text-white text-center">
        <h3 className="text-7xl font-black mb-4 tracking-tighter">{yieldP.toFixed(2)}%</h3>
        <p className="text-xl font-bold uppercase tracking-widest opacity-80">Cap Rate Anual</p>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('mortgage'); 
  const [darkMode, setDarkMode] = useState(true);
  const [dolarOficial, setDolarOficial] = useState(1050);
  const [uvaValue, setUvaValue] = useState(1320);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resDolar, resUva] = await Promise.all([
          fetch('https://dolarapi.com/v1/dolares/oficial'),
          fetch('https://api.argentinadatos.com/v1/finanzas/indices/uva')
        ]);
        if (resDolar.ok) {
          const dataDolar = await resDolar.json();
          setDolarOficial(dataDolar.venta || 1050);
        }
        if (resUva.ok) {
          const dataUva = await resUva.json();
          if (Array.isArray(dataUva) && dataUva.length > 0) {
            setUvaValue(dataUva[dataUva.length - 1].valor || 1320);
          }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-500 flex flex-col">
        
        {/* Ticker de Mercados */}
        <div className="bg-slate-900 text-white py-2.5 overflow-hidden border-b border-white/5 relative z-40">
          <div className="max-w-7xl mx-auto px-6 flex justify-end gap-12 items-center text-[10px] font-black tracking-widest uppercase">
            <div className="flex items-center gap-3">DÓLAR OFICIAL <span className="text-emerald-400 font-mono text-sm tracking-tighter">${dolarOficial}</span></div>
            <div className="flex items-center gap-3">UVA <span className="text-indigo-400 font-mono text-sm tracking-tighter">${uvaValue}</span></div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b dark:border-slate-800 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl"><Calculator className="w-6 h-6" /></div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter uppercase italic leading-none">HipotecAR</span>
                <span className="text-[10px] font-black tracking-widest text-indigo-500/70 uppercase">Intelligence v0.2.9</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-inner">
                <NavBtn active={view === 'mortgage'} onClick={() => setView('mortgage')} icon={<Home className="w-4 h-4"/>} label="CRÉDITOS" color="indigo"/>
                <NavBtn active={view === 'rent'} onClick={() => setView('rent')} icon={<ArrowRightLeft className="w-4 h-4"/>} label="ALQUILERES" color="emerald"/>
                <NavBtn active={view === 'valuation'} onClick={() => setView('valuation')} icon={<Building2 className="w-4 h-4"/>} label="TASACIONES" color="violet"/>
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border dark:border-slate-700">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Contenido Principal */}
        <main className="max-w-7xl mx-auto p-6 md:p-10 flex-grow w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando mercados...</p></div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-700">
              {view === 'mortgage' && <MortgageCalculator dolarOficial={dolarOficial} uvaValue={uvaValue} />}
              {view === 'rent' && <RentCalculator />}
              {view === 'valuation' && <ValuationCalculator dolarOficial={dolarOficial} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}