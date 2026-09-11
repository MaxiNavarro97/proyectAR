import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactGA from"react-ga4"; 
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import { cuadroFrances } from './lib/amortizacion.js';
import { faqsOperativas } from './content/faqs.jsx';
import { Panel, Card, SectionTitle, Label, Hint, Body, Field, Stat, Segmented, Badge, Notice, NumberField } from './ui/index.jsx';

import { 
  Calculator, DollarSign, TrendingUp, Globe, ArrowRightLeft, FileText, Settings2,
  CalendarDays, AlertTriangle, Activity, Github, Download, Sun, Moon,
  ExternalLink, HelpCircle, X, Coffee, HeartHandshake, FileSpreadsheet, Flag,
  Handshake, RotateCcw, MessageCircle, Check, Maximize2, Mail, Smartphone,
  Home
} from 'lucide-react';

// --- CONSTANTES GLOBALES ---
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const APP_VERSION ="1.1.0";
const CURRENT_YEAR = new Date().getFullYear();

// Un solo contenedor para todas las franjas del sitio (tira de datos, nav,
// contenido y pie): mismo ancho maximo y mismo margen, asi sus bordes coinciden
// en cualquier pantalla. Antes cada franja tenia el suyo y en monitores anchos
// el logo y el menu quedaban lejos del contenido.
const CONTENEDOR = 'max-w-[1800px] mx-auto w-full px-4 md:px-10';

Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf'
});

// Acumula la inflacion mensual de cada anio calendario. Un anio queda"parcial"
// si remData no trae sus doce meses (tipicamente el ultimo anio del REM).
const inflacionPorAnio = (remData) => {
  if (!remData || remData.length === 0) return [];
  const porAnio = new Map();
  remData.forEach(d => {
    if (!porAnio.has(d.año)) porAnio.set(d.año, { año: d.año, factor: 1, meses: 0, oficialCerrado: 0 });
    const a = porAnio.get(d.año);
    a.factor *= (1 + d.valor / 100);
    a.meses += 1;
    if (d.origen === 'IPC') a.oficialCerrado += 1;
  });
  return [...porAnio.values()]
    .sort((a, b) => a.año - b.año)
    .map(a => ({ año: a.año, valor: (a.factor - 1) * 100, parcial: a.meses < 12, ipc: a.oficialCerrado }));
};

const anualAMensual = (anual) => Math.pow(1 + anual / 100, 1 / 12) - 1;
const mensualAAnual = (mensual) => (Math.pow(1 + mensual / 100, 12) - 1) * 100;

const money = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);


const OPTION_CLASS ="bg-white text-slate-900 dark:bg-slate-800 dark:text-white";

const moneyDec = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const uvas = (v) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(v);

const moneyCompact = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `$ ${(v / 1_000_000_000).toFixed(1).replace('.', ',')} MM`;
  if (abs >= 1_000_000) return `$ ${(v / 1_000_000).toFixed(1).replace('.', ',')} M`;
  return money(v);
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

// --- TOOLTIP COMPONENT (mobile-friendly, click to toggle, viewport-safe) ---
function Tooltip({ children, iconClass ="w-3.5 h-3.5 text-slate-400", color ="indigo" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const tipRef = useRef(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); touchedRef.current = false; } };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const reposition = () => {
    if (!tipRef.current) return;
    tipRef.current.style.left = '0px';
    requestAnimationFrame(() => {
      if (!tipRef.current) return;
      const rect = tipRef.current.getBoundingClientRect();
      if (rect.left < 8) tipRef.current.style.left = `${-rect.left + 8}px`;
      else if (rect.right > window.innerWidth - 8) tipRef.current.style.left = `${window.innerWidth - rect.right - 8}px`;
    });
  };

  useEffect(() => { if (open) reposition(); }, [open]);

  const hc = color === 'emerald' ? 'hover:text-emerald-500' : 'hover:text-indigo-500';

  return (
    <div ref={wrapRef} className="relative inline-flex items-center">
      <div
        className={`p-1 -m-1 cursor-help ${hc}`}
        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); touchedRef.current = true; setOpen(v => !v); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <HelpCircle
          className={`${iconClass} transition-colors outline-none`}
          onMouseEnter={() => { if (!touchedRef.current) setOpen(true); }}
          onMouseLeave={() => { if (!touchedRef.current) setOpen(false); }}
        />
      </div>
      <div ref={tipRef} className={`absolute left-0 bottom-full mb-2 w-[min(22rem,calc(100vw-2rem))] p-4 bg-slate-900/95 backdrop-blur-md text-[14px] text-slate-300 font-medium rounded-2xl shadow-2xl z-[200] leading-relaxed border border-white/10 normal-case tracking-normal text-left whitespace-normal break-words transition-opacity duration-100 pointer-events-none opacity-0 ${open ? '!opacity-100 !pointer-events-auto' : ''}`} style={{left: 0}}>
        <button onClick={() => { setOpen(false); touchedRef.current = false; }} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors p-1 md:hidden" aria-label="Cerrar"><X className="w-3.5 h-3.5" /></button>
        {children}
      </div>
    </div>
  );
}

// --- ESTILOS PDF ---
// Borde compartido por columnas de tabla PDF
const PDF_BORDER = { borderStyle:"solid", borderColor: '#e2e8f0', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 };

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Roboto', backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  brandTitle: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5', textTransform: '' },
  brandSub: { fontSize: 8, color: '#64748b', letterSpacing: 1 },
  reportTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 10, marginBottom: 5, textTransform: '' },
  disclaimerBox: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 4, marginBottom: 15 },
  disclaimerText: { fontSize: 7, color: '#475569', textAlign: 'center' },
  table: { display:"flex", flexDirection:"column", width:"100%", borderStyle:"solid", borderColor: '#e2e8f0', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection:"row" },
  tableColHeader: { ...PDF_BORDER, width:"14.28%", borderBottomColor: '#4f46e5', backgroundColor: '#eef2ff' },
  tableCol: { ...PDF_BORDER, width:"14.28%" },
  tableCellHeader: { margin: 5, fontSize: 8, fontWeight: 'bold', color: '#4f46e5', textTransform: '', textAlign: 'center' },
  tableCell: { margin: 5, fontSize: 8, color: '#334155', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 7, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

// --- COMPONENTE DOCUMENTO PDF (CRÉDITOS) ---
const MortgagePDFDocument = ({ data, summary }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <View><Text style={pdfStyles.brandTitle}>ProyectAR</Text><Text style={pdfStyles.brandSub}>Soberanía Financiera</Text></View>
        <View><Text style={{ fontSize: 8, color: '#64748b' }}>Reporte Generado: {new Date().toLocaleDateString('es-AR')}</Text></View>
      </View>
      <Text style={pdfStyles.reportTitle}>Proyección de Crédito Hipotecario UVA</Text>
      <View style={pdfStyles.disclaimerBox}>
         <Text style={pdfStyles.disclaimerText}>AVISO LEGAL: ProyectAR proporciona esta información como un servicio de simulación financiera. No constituye una interpretación legal, asesoramiento financiero, ni garantiza resultados futuros. Las proyecciones se basan en datos de terceros (REM-BCRA) y pueden variar. Ante decisiones de renta, inversión o crédito, se recomienda consultar con profesionales idóneos.</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
          <View style={{ flex: 1, backgroundColor: '#eef2ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#4f46e5', fontWeight: 'bold' }}>Cuota inicial</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.cuotaInicial)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#fff7ed', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#ea580c', fontWeight: 'bold' }}>Total intereses</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalIntereses)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#f0f9ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#0284c7', fontWeight: 'bold' }}>Pago total est.</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalPagadoFinal)}</Text></View>
      </View>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRow}>
          {["Periodo","Origen Tasa","Cuota Total","Interés","Capital","Saldo"].map(h => (
            <View style={{...pdfStyles.tableColHeader, width:"16.66%"}} key={h}><Text style={pdfStyles.tableCellHeader}>{h}</Text></View>
          ))}
        </View>
        {data.map((row, i) => (
          <View style={pdfStyles.tableRow} key={i} backgroundColor={i % 2 === 0 ? '#ffffff' : '#f8fafc'}>
            <View style={{...pdfStyles.tableCol, width: '16.66%'}}><Text style={pdfStyles.tableCell}>{row.shortDate}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '16.66%'}}><Text style={{...pdfStyles.tableCell, fontSize: 7}}>{row.source}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '16.66%'}}><Text style={{...pdfStyles.tableCell, fontWeight: 'bold'}}>{money(row.cuotaTotal)}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '16.66%'}}><Text style={{...pdfStyles.tableCell, color: '#ea580c'}}>{money(row.interes)}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '16.66%'}}><Text style={{...pdfStyles.tableCell, color: '#4f46e5'}}>{money(row.principal)}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '16.66%'}}><Text style={pdfStyles.tableCell}>{money(row.saldo)}</Text></View>
          </View>
        ))}
      </View>
      <Text style={pdfStyles.footer}>ProyectAR - Desarrollado por @MaxiNavarro97 - Mar del Plata, Argentina.</Text>
    </Page>
  </Document>
);

// --- COMPONENTE DOCUMENTO PDF (ALQUILERES) ---
const RentPDFDocument = ({ data, summary }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <View><Text style={pdfStyles.brandTitle}>ProyectAR</Text><Text style={pdfStyles.brandSub}>Soberanía Financiera</Text></View>
        <View><Text style={{ fontSize: 8, color: '#64748b' }}>Reporte Generado: {new Date().toLocaleDateString('es-AR')}</Text></View>
      </View>
      <Text style={pdfStyles.reportTitle}>Proyección Contrato de Alquiler</Text>
      <View style={pdfStyles.disclaimerBox}>
         <Text style={pdfStyles.disclaimerText}>AVISO LEGAL: ProyectAR proporciona esta información como un servicio de simulación financiera. No constituye una interpretación legal, asesoramiento financiero, ni garantiza resultados futuros. Las proyecciones se basan en datos de terceros (REM-BCRA) y pueden variar. Ante decisiones de renta, inversión o crédito, se recomienda consultar con profesionales idóneos.</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
          <View style={{ flex: 1, backgroundColor: '#eef2ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#4f46e5', fontWeight: 'bold' }}>Alquiler inicial</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.alquilerInicial)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#fff7ed', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#ea580c', fontWeight: 'bold' }}>Total expensas est.</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalExpensas)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#f0f9ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#0284c7', fontWeight: 'bold' }}>Costo total contrato</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalContrato)}</Text></View>
      </View>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRow}>
          {["Periodo","Inflación","Total Mes","Alquiler","Expensas"].map(h => (
            <View style={{...pdfStyles.tableColHeader, width:"20%"}} key={h}><Text style={pdfStyles.tableCellHeader}>{h}</Text></View>
          ))}
        </View>
        {data.map((row, i) => (
          <View style={pdfStyles.tableRow} key={i} backgroundColor={i % 2 === 0 ? '#ffffff' : '#f8fafc'}>
            <View style={{...pdfStyles.tableCol, width: '20%'}}><Text style={pdfStyles.tableCell}>{row.shortDate}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '20%'}}><Text style={{...pdfStyles.tableCell, fontSize: 7}}>{row.source}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '20%'}}><Text style={{...pdfStyles.tableCell, fontWeight: 'bold'}}>{money(row.cuotaTotal)}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '20%'}}><Text style={{...pdfStyles.tableCell, color: '#4f46e5'}}>{money(row.principal)}</Text></View>
            <View style={{...pdfStyles.tableCol, width: '20%'}}><Text style={{...pdfStyles.tableCell, color: '#ea580c'}}>{money(row.interes)}</Text></View>
          </View>
        ))}
      </View>
      <Text style={pdfStyles.footer}>ProyectAR - Desarrollado por @MaxiNavarro97 - Mar del Plata, Argentina.</Text>
    </Page>
  </Document>
);

// --- COMPONENTES AUXILIARES ---

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const TRANSITION = `transform 0.4s ${EASE}, width 0.4s ${EASE}, height 0.4s ${EASE}`;

function useFullscreenOrientation(isOpen) {
  const [landscape, setLandscape] = useState(true);
  useEffect(() => { if (isOpen) setLandscape(true); }, [isOpen]);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const isMobilePortrait = vw < vh && vw < 768;
  const contentStyle = (isMobilePortrait && landscape) ? {
    position: 'absolute', top: '50%', left: '50%',
    width: `${vh}px`, height: `${vw}px`,
    transform: 'translate(-50%, -50%) rotate(-90deg)',
    transition: TRANSITION,
  } : {
    position: 'absolute', top: '50%', left: '50%',
    width: `${vw}px`, height: `${vh}px`,
    transform: 'translate(-50%, -50%) rotate(0deg)',
    transition: TRANSITION,
  };
  return { landscape, setLandscape, isMobilePortrait, contentStyle };
}

function ChartModal({ isOpen, onClose, children, title }) {
  const { contentStyle } = useFullscreenOrientation(isOpen);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 overflow-hidden duration-300">
      <div style={contentStyle} className="flex flex-col">
        <div className="flex justify-between items-center px-5 py-3 shrink-0">
          <h3 className="text-white font-semibold text-base md:text-2xl tracking-tighter truncate mr-3">{title}</h3>
          <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 min-h-0 px-5 pb-3 flex items-center justify-center relative">
          <div style={{ width: '100%', height: '100%', maxHeight: '100%', position: 'relative' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function TableModal({ isOpen, onClose, children, title }) {
  const { landscape, setLandscape, isMobilePortrait, contentStyle } = useFullscreenOrientation(isOpen);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 overflow-hidden duration-300">
      <div style={contentStyle} className="flex flex-col h-full">
        <div className="flex justify-between items-center px-5 py-4 shrink-0 border-b border-white/10">
          <h3 className="text-white font-semibold text-base md:text-xl tracking-tighter truncate mr-3">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {isMobilePortrait && (
              <button onClick={() => setLandscape(l => !l)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all" title={landscape ?"Cambiar a vertical" :"Cambiar a horizontal"}>
                <Smartphone className="w-4 h-4" style={{ transition: `transform 0.4s ${EASE}`, transform: landscape ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function DonationModal({ onClose, downloadLink, exportType, onDownload }) {
  const [downloading, setDownloading] = useState(false);

  const handleStandardDownload = () => {
    setDownloading(true);
    setTimeout(() => {
        onDownload();
        setDownloading(false);
    }, 500);
  };

  const getButtonContent = () => {
      if (exportType === 'pdf') { return downloadLink; }
      let icon = <Download className="w-4 h-4"/>;
      let label = `Descargar ${exportType.toUpperCase()}`;
      let bg ="bg-indigo-600 hover:bg-indigo-700";
      if (exportType === 'excel') { icon = <FileSpreadsheet className="w-4 h-4"/>; bg ="bg-emerald-600 hover:bg-emerald-700"; }
      return (
        <button onClick={handleStandardDownload} disabled={downloading} className={`w-full py-3.5 ${bg} text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2`}>
            {icon} {downloading ? 'Generando...' : label}
        </button>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 bg-slate-900/80 backdrop-blur-sm duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-500/20 shadow-sm w-full max-w-md overflow-hidden relative sm:zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 dark:from-indigo-950/30 to-transparent -z-10"></div>
           <HeartHandshake className="w-12 h-12 text-indigo-500 mx-auto mb-4 drop-shadow-sm animate-bounce-slow" />
           <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white mb-2 tracking-tight leading-none">¡Tu reporte está listo!</h2>
           <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed px-4">
             Esta herramienta es 100% gratuita y la desarrollamos a pulmón para ayudarte a tomar mejores decisiones financieras. Si te aportó algún valor, considerá hacer una colaboración que nos ayuda enormemente a pagar los servidores y seguir mejorando la aplicación.
           </p>
           
           <div className="flex flex-col gap-3 mb-6">
              <a href="https://cafecito.app/proyectar" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#00cba9] hover:bg-[#00b899] text-white font-semibold rounded-xl text-xs transition-all">
                  <Coffee className="w-4 h-4"/> Invitar un Cafecito
              </a>
              <a href="https://link.mercadopago.com.ar/proyectarapp" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#009ee3] hover:bg-[#008ed0] text-white font-semibold rounded-xl text-xs transition-all">
                  <Handshake className="w-4 h-4"/> Aportar por Mercado Pago
              </a>
           </div>

           <div className="relative py-3">
             <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
             <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-2 text-[12px] font-bold text-slate-400">O continuar a la descarga</span></div>
           </div>
           
           <div className="mt-2">{getButtonContent()}</div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 dark:text-white rounded-full backdrop-blur-md transition-all"><X className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// --- COMPONENTE DE BOTON DE NAVEGACIÓN ---
// Pestanas del sitio. Mismo aspecto que los toggles de la pagina (Segmented):
// riel gris y la activa en indigo. Son links y no botones porque cambian de ruta.
function NavigationMenu() {
  const { pathname } = useLocation();
  const pestanas = [
    { to: '/calculadora-creditos-uva', label: 'Créditos' },
    { to: '/calculadora-alquileres', label: 'Alquileres' },
    { to: '/faq', label: 'FAQ' },
  ];
  return (
    <div className="flex md:inline-flex w-full md:w-auto p-0.5 bg-hair dark:bg-hair-dark rounded-control">
      {pestanas.map(p => {
        const activa = pathname === p.to;
        return (
          <Link key={p.to} to={p.to} aria-current={activa ? 'page' : undefined}
            className={`flex-1 md:flex-none text-center py-2 px-4 text-label rounded-control transition-colors whitespace-nowrap ${activa ? 'bg-indigo-600 text-white' : 'text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark'}`}>
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}

// Monto en pesos. Usa las mismas piezas que el resto: la unica particularidad
// es que formatea mientras se escribe.
function CurrencyInput({ value, onChange, label, sublabel, usdEquivalent }) {
  const [enFoco, setEnFoco] = useState(false);
  const mostrado = (enFoco && value === 0) ? '' : money(value);

  return (
    <Field label={label} hint={sublabel}>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={mostrado}
          onChange={(e) => { const crudo = e.target.value.replace(/\D/g, ''); onChange(crudo === '' ? 0 : Number(crudo)); }}
          onFocus={(e) => { setEnFoco(true); e.target.select(); }}
          onBlur={() => setEnFoco(false)}
          placeholder="$ 0"
          className="w-full bg-field dark:bg-field-dark border border-hair dark:border-hair-dark rounded-control px-3 py-2.5 pr-9 text-stat text-ink dark:text-ink-dark outline-none focus:border-indigo-500 transition-colors"
        />
        <DollarSign className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-faint dark:text-faint-dark pointer-events-none" />
      </div>
      {usdEquivalent > 0 && (
        <Hint className="mt-1.5">Aprox. USD {new Intl.NumberFormat('es-AR').format(Math.round(usdEquivalent))} al oficial</Hint>
      )}
    </Field>
  );
}

// Fuera del componente: no cambia nunca, no tiene sentido recrearlo en cada render
const BankCard = React.memo(function BankCard({ name, url, logoUrl }) {
  // Logos en gris: son links de referencia, no la informacion principal. En
  // oscuro se invierten y se funden con el fondo, asi el fondo blanco de cada
  // imagen deja de ser un rectangulo brillante.
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={`Créditos hipotecarios en ${name}`}
      className="flex items-center justify-center h-12 px-3 rounded-control bg-field dark:bg-field-dark border border-hair dark:border-hair-dark hover:border-indigo-500 transition-colors">
      <img src={logoUrl} alt={name} loading="lazy" className="max-h-7 max-w-full object-contain grayscale opacity-60 hover:opacity-100 mix-blend-multiply dark:invert dark:mix-blend-screen transition-opacity" />
    </a>
  );
});

// --- VISUALIZACIÓN DE DATOS ---
function TooltipContent({ data, isRent }) {
  return (
    <>
      <div className="flex items-center justify-between mb-2.5 border-b border-white/10 pb-2.5">
        <p className="text-[14px] font-semibold text-indigo-400">{data.label}</p>
        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${data.source === 'IPC' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : data.source === 'REM' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/10 text-slate-300 border border-white/10'}`}>{data.source}</span>
      </div>
      <div className="space-y-2 text-[15px] mb-3 border-b border-white/10 pb-3">
        <div className="flex justify-between items-center gap-4"><span className="font-bold text-slate-400 tracking-wide">Total:</span><span className="font-semibold text-white">{money(data.cuotaTotal)}</span></div>
        <div className={`flex justify-between items-center gap-4 font-bold tracking-wide text-indigo-400`}><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full bg-indigo-500`} /><span className="">{isRent ? 'Alquiler' : 'Capital'}:</span></div><span>{money(data.principal)}</span></div>
        <div className="flex justify-between items-center gap-4 text-orange-400 font-bold tracking-wide"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400" /><span className="">{isRent ? 'Expensas' : 'Interés'}:</span></div><span>{money(data.interes)}</span></div>
      </div>
      <div className="space-y-1.5 text-[14px]">
        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold tracking-wide">Var. Mensual:</span><span className={`font-semibold ${data.varMensual > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{data.varMensual > 0 ? '+' : ''}{data.varMensual.toFixed(1)}%</span></div>
        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold tracking-wide">Acumulado YTD:</span><span className={`font-semibold ${data.varYTD > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{data.varYTD > 0 ? '+' : ''}{data.varYTD.toFixed(1)}%</span></div>
        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold tracking-wide">Var. Total:</span><span className={`font-semibold ${data.varTotal > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{data.varTotal > 0 ? '+' : ''}{data.varTotal.toFixed(1)}%</span></div>
      </div>
    </>
  );
}

function CompositionChart({ data, dateMode, showRemMarker, isRent = false, fullscreen = false }) {
  const [hovered, setHovered] = useState(null);
  const touchTimer = useRef(null);

  const clearTouch = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = null;
  };

  const handleTouchStart = (d, pct) => (e) => {
    e.preventDefault();
    clearTouch();
    setHovered({ data: d, pct });
  };

  const handleTouchEnd = () => {
    clearTouch();
    touchTimer.current = setTimeout(() => setHovered(null), 2500);
  };

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 gap-3 p-4">
        <Calculator className="w-8 h-8 md:w-10 md:h-10 text-slate-300 dark:text-slate-700" />
        <p className="text-[12px] md:text-[13px] font-semibold text-slate-400 text-center">Completá el monto y el plazo para ver tu proyección</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.cuotaTotal)) * 1.15;
  const w = 1000, h = 320, padL = 138, padB = 55, padT = 15, padR = 0;
  const anchoUtil = w - padL - padR;
  const step = Math.max(1, Math.ceil(data.length / (isRent ? 40 : 60)));
  const sampled = data.filter((_, i) => i % step === 0);

  return (
    <div className="relative w-full h-full">
      
      {/* TOOLTIP: fijo en esquina superior derecha */}
      {hovered && (
        <div
          className="absolute top-1 z-[200] bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/10 p-3 sm:p-4 w-[220px] sm:w-[240px] pointer-events-none"
          style={{ right: `clamp(0px, calc(${100 - hovered.pct}% - 110px), calc(100% - 220px))` }}
        >
          <TooltipContent data={hovered.data} isRent={isRent} />
        </div>
      )}

      <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full select-none"
      preserveAspectRatio={fullscreen ?"xMidYMid meet" :"xMinYMid meet"}
      onMouseLeave={() => setHovered(null)}
      onTouchStart={() => setHovered(null)}
      >

        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <g key={p}>
            <line x1={padL} y1={h - padB - (h - padB - padT) * p} x2={w - padR} y2={h - padB - (h - padB - padT) * p} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4"/>
            <text x={padL - 15} y={h - padB - (h - padB - padT) * p + 5} textAnchor="end" className="text-[14px] fill-slate-400">{moneyCompact(maxVal * p)}</text>
          </g>
        ))}
        {sampled.map((d, i) => {
          const barAreaW = anchoUtil / sampled.length;
          const barW = barAreaW * 0.8;
          const x = padL + i * barAreaW;
          const hInt = (d.interes / maxVal) * (h - padB - padT);
          const hPri = (d.principal / maxVal) * (h - padB - padT);
          const pct = ((padL + i * barAreaW + barW / 2) / w) * 100;
          return (
            <g
              key={i}
              onMouseEnter={() => setHovered({ data: d, pct })}
              onMouseMove={() => setHovered(prev => prev ? { ...prev, data: d, pct } : { data: d, pct })}
              onTouchStart={handleTouchStart(d, pct)}
              onTouchEnd={handleTouchEnd}
              className="group cursor-pointer"
            >
              <rect x={x} y={h - padB - hPri} width={barW} height={hPri} fill="#6366f1" rx="1.5" fillOpacity="0.85" className="transition-all group-hover:brightness-110"/>
              <rect x={x} y={h - padB - hPri - hInt} width={barW} height={hInt} fill="#fb923c" rx="1.5" fillOpacity="0.85" className="transition-all group-hover:brightness-110"/>
              {(i % Math.ceil(sampled.length/10) === 0) && (
                <text x={x + barW/2} y={h - padB + 10} textAnchor="end" className="text-[13px] fill-slate-500 md:hidden" transform={`rotate(-90, ${x + barW/2}, ${h - padB + 10})`}>
                  {dateMode === 'calendar' ? d.shortDate : `M${d.mes}`}
                </text>
              )}
              {(i % Math.ceil(sampled.length/10) === 0) && (
                <text x={x + barW/2} y={h - padB + 22} textAnchor="middle" className="text-[14px] fill-slate-500 hidden md:block">{dateMode === 'calendar' ? d.shortDate : `M${d.mes}`}</text>
              )}
            </g>
          );
        })}
        {/* Línea divisoria IPC → REM */}
        {showRemMarker && (() => {
          const transIdx = sampled.findIndex(d => d.source === 'REM' || d.source === 'INERCIA');
          if (transIdx > 0) {
            const barAreaW = anchoUtil / sampled.length;
            const tx = padL + transIdx * barAreaW - barAreaW * 0.1;
            return (
              <g>
                <line x1={tx} y1={padT} x2={tx} y2={h - padB} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"/>
                <text x={tx + 6} y={padT + 12} className="text-[11px] fill-indigo-400 font-bold" opacity="0.7">Proyectado →</text>
              </g>
            );
          }
          return null;
        })()}
      </svg>
    </div>
  );
}

// Tabla de amortizacion del credito UVA. La usan la vista normal y el modal a
// pantalla completa; `dark` es el modal, que siempre va sobre fondo oscuro.
function AmortizationTable({ data, dark = false }) {
  const totalCuotas = data.reduce((a, d) => a + d.cuotaTotal, 0);
  const totalInteres = data.reduce((a, d) => a + d.interes, 0);
  const totalCapital = data.reduce((a, d) => a + d.principal, 0);
  const totalUva = data.reduce((a, d) => a + d.cuotaUva, 0);

  // Los numeros van alineados a la derecha, que es como se comparan de un
  // vistazo, y todo en peso normal: la unica cifra destacada es la cuota.
  const tinta = dark ? 'text-slate-100' : 'text-ink dark:text-ink-dark';
  const tenue = dark ? 'text-slate-400' : 'text-muted dark:text-muted-dark';
  const th = 'px-4 py-3 font-medium whitespace-nowrap';
  const td = 'px-4 py-2.5 text-right whitespace-nowrap';

  return (
    <table className={`w-full border-collapse text-body ${dark ? '' : 'min-w-[860px]'}`} style={dark ? { minWidth: 960 } : undefined}>
      <thead className={`sticky top-0 z-10 text-label ${dark ? 'bg-slate-950 text-slate-400 border-b border-white/10' : 'bg-card dark:bg-card-dark text-muted dark:text-muted-dark border-b border-hair dark:border-hair-dark'}`}>
        <tr>
          <th className={`${th} text-left`}>Periodo</th>
          <th className={`${th} text-left`}>Inflación</th>
          <th className={`${th} text-right`}>Cuota UVA</th>
          <th className={`${th} text-right`}>Valor UVA</th>
          <th className={`${th} text-right`}>Cuota total</th>
          <th className={`${th} text-right`}>Interés</th>
          <th className={`${th} text-right`}>Capital</th>
          <th className={`${th} text-right`}>Saldo</th>
        </tr>
      </thead>
      <tbody className={dark ? 'divide-y divide-white/5' : 'divide-y divide-hair dark:divide-hair-dark'}>
        {data.length === 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-10 text-center text-body text-faint dark:text-faint-dark">Cargá el monto, el plazo y la tasa para ver la tabla mes a mes.</td>
          </tr>
        )}
        {data.map((d, i) => {
          // El origen del dato solo se marca cuando cambia.
          const cambiaOrigen = i === 0 || data[i - 1].source !== d.source;
          return (
            <tr key={d.mes} className={`${tenue} ${d.isHalfWay ? (dark ? 'bg-white/5' : 'bg-indigo-500/5') : ''}`}>
              <td className={`px-4 py-2.5 text-left whitespace-nowrap ${tinta}`}>
                <span className="inline-flex items-center gap-1.5">
                  {d.label}
                  {d.isHalfWay && <span title="Mitad del capital devuelto" className="inline-flex items-center gap-1 text-micro text-indigo-500"><Flag className="w-3 h-3" /> 50%</span>}
                </span>
              </td>
              <td className="px-4 py-2.5 text-left whitespace-nowrap">
                {cambiaOrigen && (
                  <span className={`inline-flex items-center gap-1.5 text-micro px-2 py-0.5 rounded-full ${dark ? 'bg-white/5 text-slate-300' : 'bg-hair dark:bg-hair-dark text-muted dark:text-muted-dark'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.oficial ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {d.source}
                  </span>
                )}
              </td>
              <td className={td}>{uvas(d.cuotaUva)}</td>
              <td className={td}>{money(d.valorUva)}</td>
              <td className={`${td} font-semibold ${tinta}`}>{money(d.cuotaTotal)}</td>
              <td className={td}>{money(d.interes)}</td>
              <td className={td}>{money(d.principal)}</td>
              <td className={td}>{money(d.saldo)}</td>
            </tr>
          );
        })}
      </tbody>
      {data.length > 0 && (
      <tfoot className={`sticky bottom-0 text-label ${dark ? 'bg-slate-950 text-slate-300 border-t border-white/10' : 'bg-card dark:bg-card-dark text-ink dark:text-ink-dark border-t border-hair dark:border-hair-dark'}`}>
        <tr>
          <td className="px-4 py-3 text-left font-medium">Totales</td>
          <td />
          <td className="px-4 py-3 text-right whitespace-nowrap">{uvas(totalUva)}</td>
          <td />
          <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">{money(totalCuotas)}</td>
          <td className="px-4 py-3 text-right whitespace-nowrap">{money(totalInteres)}</td>
          <td className="px-4 py-3 text-right whitespace-nowrap">{money(totalCapital)}</td>
          <td />
        </tr>
      </tfoot>
      )}
    </table>
  );
}

// Contexto macro del sitio. No pertenece a ninguna calculadora en particular,
// asi que vive en el encabezado y se ve en todas las rutas. Todo sale de los
// datos que ya se descargan: market_status.json y el CSV unificado.
function MacroBar({ uvaValue, dolarOficial, remData, lastUpdate }) {
  const datos = useMemo(() => {
    if (!remData || remData.length === 0) return { ipc: null, rem12: null };
    const ipc = [...remData].reverse().find(d => d.origen === 'IPC') || null;
    const hoy = new Date();
    const futuros = remData
      .filter(d => d.año > hoy.getFullYear() || (d.año === hoy.getFullYear() && d.mes > hoy.getMonth() + 1))
      .slice(0, 12);
    const rem12 = futuros.length === 12
      ? (futuros.reduce((f, d) => f * (1 + d.valor / 100), 1) - 1) * 100
      : null;
    return { ipc, rem12 };
  }, [remData]);

  // La fecha del dato va dentro de la etiqueta: en una banda de una linea no
  // hay lugar para un pie, y sin fecha un numero de inflacion no dice nada.
  const items = [
    { label: 'UVA', valor: uvaValue > 0 ? moneyDec(uvaValue) : '---', title: 'Unidad de Valor Adquisitivo. Se ajusta a diario por el CER, que sigue a la inflación del INDEC.' },
    { label: 'Dólar oficial', valor: dolarOficial > 0 ? money(dolarOficial) : '---', title: 'Cotización oficial del peso contra el dólar.' },
    { label: datos.ipc ? `IPC ${MESES[datos.ipc.mes - 1].toLowerCase()} ${String(datos.ipc.año).slice(-2)}` : 'IPC', valor: datos.ipc ? `${String(datos.ipc.valor).replace('.', ',')}%` : '---', title: 'Último dato de inflación mensual publicado por el INDEC.' },
    { label: 'REM 12m', valor: datos.rem12 !== null ? `${datos.rem12.toFixed(1).replace('.', ',')}%` : '---', title: 'Inflación acumulada esperada para los próximos doce meses, según el Relevamiento de Expectativas de Mercado del BCRA.' },
  ];

  return (
    <div className="border-b border-hair dark:border-hair-dark">
      <div className={`${CONTENEDOR} h-8 flex items-center gap-5 overflow-x-auto no-scrollbar text-micro whitespace-nowrap`}>
        {items.map(it => (
          <span key={it.label} title={it.title} className="shrink-0">
            <span className="text-faint dark:text-faint-dark">{it.label}</span>{' '}
            <span className="font-medium text-ink dark:text-ink-dark">{it.valor}</span>
          </span>
        ))}
        <span className="ml-auto shrink-0 text-faint dark:text-faint-dark" title="Ultima actualizacion de los datos">{formatDateTime(lastUpdate)}</span>
      </div>
    </div>
  );
}

// --- UTILIDADES DE COMPARTIR POR URL ---
const encodeParams = (params) => {
  const encoded = btoa(JSON.stringify(params));
  return encoded;
};

const decodeParams = (hash) => {
  try {
    return JSON.parse(atob(hash));
  } catch { return null; }
};

const copyShareUrl = (params, setCopied) => {
  const url = `${window.location.origin}${window.location.pathname}?s=${encodeParams(params)}`;
  navigator.clipboard.writeText(url);
  setCopied(true);
  setTimeout(() => setCopied(false), 2500);
};

// --- VISTA CALCULADORA HIPOTECARIA ---
function MortgageCalculator({ uvaValue, remData, dolarOficial }) {
  const hoyRef = useRef(new Date());
  const hoy = hoyRef.current;
   
  const [loanType, setLoanType] = useState('new'); 
  const [balanceCurrency, setBalanceCurrency] = useState('ars'); 
  const [remInstallments, setRemInstallments] = useState(0);
  const [bankInstallment, setBankInstallment] = useState(0);

  const [amount, setAmount] = useState(0); 
  const [salary, setSalary] = useState(0); 
  const [years, setYears] = useState('');
  const [rate, setRate] = useState('');
  // Cada tramo de la proyeccion decide por separado si sigue el dato oficial
  // o una inflacion propia. Los valores propios arrancan en el ultimo REM.
  const [inflFirstMode, setInflFirstMode] = useState('rem');
  const [inflFirstAnnual, setInflFirstAnnual] = useState("25");
  const [inflLongMode, setInflLongMode] = useState('rem');
  const [inflLongAnnual, setInflLongAnnual] = useState("25");
  const [timeframe, setTimeframe] = useState(() => {
    try { return localStorage.getItem('proyectar_tf_mortgage') || 'all'; } catch { return 'all'; }
  });
  // El credito siempre arranca hoy: sin fecha libre, la proyeccion queda
  // siempre enganchada al calendario de IPC + REM.
  const startMonth = hoy.getMonth();
  const startYear = hoy.getFullYear();

  const [showDonationModal, setShowDonationModal] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [exportRange, setExportRange] = useState('all');
  const [copiedWP, setCopiedWP] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);

  const [copiedShare, setCopiedShare] = useState(false);

  // Cargar parámetros desde URL compartida
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (s) {
      const decoded = decodeParams(s);
      if (decoded && decoded.t === 'mortgage') {
        if (decoded.a) setAmount(decoded.a);
        if (decoded.y) setYears(decoded.y);
        if (decoded.r) setRate(String(decoded.r));
        if (decoded.lt) setLoanType(decoded.lt);
        // Limpiar la URL después de cargar
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const getShareParams = () => ({
    t: 'mortgage', a: amount, y: years, r: rate, lt: loanType
  });

  const handleReset = () => {
      setAmount(0); setSalary(0); setYears(''); setRate(''); setRemInstallments(0); setBankInstallment(0);
  };

  useEffect(() => { try { localStorage.setItem('proyectar_tf_mortgage', timeframe); } catch { /* ignorar */ } }, [timeframe]);

  const inflacionAnual = useMemo(() => inflacionPorAnio(remData).filter(a => a.año >= hoy.getFullYear()), [remData, hoy]);
  const ultimoRemMensual = (remData && remData.length > 0) ? remData[remData.length - 1].valor : 0;
  const ultimoRemAnual = mensualAAnual(ultimoRemMensual);

  // Al elegir"propia" se arranca desde el ultimo dato oficial, no desde un numero suelto.
  useEffect(() => {
    if (ultimoRemMensual > 0) {
      const anual = String(Math.round(mensualAAnual(ultimoRemMensual)));
      setInflFirstAnnual(anual);
      setInflLongAnnual(anual);
    }
  }, [ultimoRemMensual]);

  const schedule = useMemo(() => {
    if (!amount || amount === 0) return [];
    
    const totalMonths = loanType === 'new' ? Number(years) * 12 : Number(remInstallments);
    if (isNaN(totalMonths) || totalMonths <= 0) return [];
    
    const currentUva = uvaValue || 1;
    const rateNum = (Number(String(rate).replace(',', '.')) || 0) / 100;
    // Inflacion mensual de cada tramo.
    const primerosMensual = anualAMensual(Number(String(inflFirstAnnual).replace(',', '.')) || 0);
    const restantesMensual = inflLongMode === 'rem'
      ? ultimoRemMensual / 100
      : anualAMensual(Number(String(inflLongAnnual).replace(',', '.')) || 0);
    
    let capitalUvaInicial;
    if (loanType === 'new') {
      capitalUvaInicial = amount / currentUva;
    } else {
      capitalUvaInicial = balanceCurrency === 'ars' ? (amount / currentUva) : amount;
    }

    // Map unificado de inflación (IPC pasado + REM futuro ya mergeados)
    const inflacionMap = (remData && remData.length > 0)
      ? new Map(remData.map(d => [d.mes + '-' + d.año, d]))
      : new Map();

    // El cuadro de marcha se calcula entero en UVA (sin inflación) y recién después
    // se recorre aplicando el valor proyectado de la UVA mes a mes.
    const cuadro = cuadroFrances(capitalUvaInicial, rateNum, totalMonths);

    const data = [];
    let projUva = currentUva;
    let currentDate = new Date(startYear, startMonth, 1);
    let halfWayTriggered = false;

    let lastMonthVal = 0;
    let lastDecVal = 0;
    let firstVal = 0;

    for (const fila of cuadro) {
      const i = fila.mes;
      const interestUva = fila.interes;
      const principalUva = fila.principal;
      const balanceUva = fila.saldo;

      const inflMatch = inflacionMap.get((currentDate.getMonth() + 1) + '-' + currentDate.getFullYear()) ?? null;
      const sourceName = inflMatch
        ? (inflFirstMode === 'custom' ? 'PROPIA' : (inflMatch.origen === 'IPC' ? 'IPC' : 'REM'))
        : (inflLongMode === 'custom' ? 'PROPIA' : 'INERCIA');

      let isHalfWay = false;
      if (!halfWayTriggered && balanceUva <= capitalUvaInicial / 2) {
         isHalfWay = true;
         halfWayTriggered = true;
      }

      const cuotaTotal = (principalUva + interestUva) * projUva;

      if (i === 1) {
          firstVal = cuotaTotal;
          lastMonthVal = cuotaTotal;
          lastDecVal = cuotaTotal;
      }

      const varMensual = i === 1 ? 0 : ((cuotaTotal / lastMonthVal) - 1) * 100;
      const varYTD = i === 1 ? 0 : ((cuotaTotal / lastDecVal) - 1) * 100;
      const varTotal = i === 1 ? 0 : ((cuotaTotal / firstVal) - 1) * 100;

      data.push({
        mes: i,
        label: `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
        shortDate: `${MESES[currentDate.getMonth()]} ${String(currentDate.getFullYear()).slice(-2)}`,
        interes: interestUva * projUva, 
        principal: principalUva * projUva, 
        cuotaTotal: cuotaTotal, 
        saldo: balanceUva * projUva, 
        // En sistema frances la cuota en UVA es constante: lo que sube es el valor de la UVA.
        cuotaUva: principalUva + interestUva,
        interesUva: interestUva,
        valorUva: projUva,
        oficial: !!inflMatch,
        source: sourceName,
        isHalfWay: isHalfWay,
        varMensual: varMensual || 0,
        varYTD: varYTD || 0,
        varTotal: varTotal || 0
      });

      lastMonthVal = cuotaTotal;
      if (currentDate.getMonth() === 11) { lastDecVal = cuotaTotal; }

      const currentMonthInf = inflMatch
        ? (inflFirstMode === 'custom' ? primerosMensual : inflMatch.valor / 100)
        : restantesMensual;
      projUva *= (1 + currentMonthInf);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return data;
  }, [amount, years, rate, inflFirstMode, inflFirstAnnual, inflLongMode, inflLongAnnual, ultimoRemMensual, uvaValue, startMonth, startYear, remData, loanType, balanceCurrency, remInstallments]);

  const totals = useMemo(() => {
      const montoOriginalPesos = loanType === 'new' ? amount : (balanceCurrency === 'ars' ? amount : amount * uvaValue);
      return {
        totalPagadoFinal: schedule.reduce((acc, curr) => acc + curr.cuotaTotal, 0),
        totalIntereses: schedule.reduce((acc, curr) => acc + curr.interes, 0),
        totalCapital: schedule.reduce((acc, curr) => acc + curr.principal, 0),
        cuotaInicial: schedule[0]?.cuotaTotal || 0,
        montoOriginalPesos,
        // En UVA la inflacion no infla los totales, asi que estos si miden el credito.
        totalPagadoUva: schedule.reduce((acc, curr) => acc + curr.cuotaUva, 0),
        totalInteresesUva: schedule.reduce((acc, curr) => acc + curr.interesUva, 0),
        capitalUva: uvaValue > 0 ? montoOriginalPesos / uvaValue : 0,
      };
  }, [schedule, amount, loanType, balanceCurrency, uvaValue]);

  // Sin datos la pantalla conserva toda su estructura y solo muestra "---":
  // asi, al cargar el credito, nada se mueve de lugar; solo se llena.
  const sinDatos = schedule.length === 0;

  const filteredData = useMemo(() => (timeframe === 'all' ? schedule : schedule.slice(0, Math.min(schedule.length, parseInt(timeframe) * 12))), [schedule, timeframe]);

  // Cuantos meses de la proyeccion tienen dato oficial (IPC o REM) detras.
  const mesesOficiales = schedule.filter(d => d.oficial).length;
  const mesesSinDato = schedule.length - mesesOficiales;

  // Cuanto se aparta la simulacion de lo que el banco cobra de verdad.
  const gapAbs = (bankInstallment > 0 && totals.cuotaInicial > 0) ? bankInstallment - totals.cuotaInicial : 0;
  const gapPct = totals.cuotaInicial > 0 ? (gapAbs / totals.cuotaInicial) * 100 : 0;

  const resultsRef = useRef(null);
  const prevScheduleLen = useRef(0);
  const rateNum = Number(String(rate).replace(',', '.')) || 0;
  useEffect(() => {
    if (schedule.length > 0 && prevScheduleLen.current === 0 && rateNum > 0 && resultsRef.current && window.innerWidth < 1024) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevScheduleLen.current = schedule.length;
  }, [schedule.length, rateNum]);

  // La tabla en pantalla siempre muestra el credito completo; lo que se recorta
  // es el archivo que te llevas.
  const datosExport = exportRange === 'all'
    ? schedule
    : schedule.slice(0, Math.min(schedule.length, parseInt(exportRange) * 12));

  const exportToCSV = () => {
    if (datosExport.length === 0) return;
    const headers = ["Mes","Cuota UVA","Valor UVA","Cuota Total","Interes","Capital","Saldo Pendiente","Inflación"];
    const rows = datosExport.map(d => [
      d.label, d.cuotaUva.toFixed(2), d.valorUva.toFixed(2), Math.round(d.cuotaTotal), Math.round(d.interes),
      Math.round(d.principal), Math.round(d.saldo), d.source
    ]);
    const csvContent ="data:text/csv;charset=utf-8," + headers.join(";") +"\n" + rows.map(e => e.join(";")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ProyectAR_Hipotecas_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (datosExport.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(datosExport.map(d => ({"Periodo": d.label,"Cuota UVA": Number(d.cuotaUva.toFixed(2)),"Valor UVA": Number(d.valorUva.toFixed(2)),"Cuota Total": Math.round(d.cuotaTotal),"Interés": Math.round(d.interes),"Capital": Math.round(d.principal),"Saldo Pendiente": Math.round(d.saldo),"Inflación": d.source
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws,"Proyeccion");
    XLSX.writeFile(wb, `ProyectAR_Hipotecas_${new Date().getTime()}.xlsx`);
  };

  const handleExportClick = (type) => {
      if (datosExport.length === 0) return;
      setExportType(type);
      setShowDonationModal(true);
  };

  const copyToWhatsApp = () => {
      if (schedule.length === 0) return;
      const text = `🏦 *Proyección ProyectAR*\n\n💰 Cuota 1: ${money(totals.cuotaInicial)}\n📉 Total Intereses: ${money(totals.totalIntereses)}\n📈 Pago Final Est.: ${money(totals.totalPagadoFinal)}\n\nSimulá tu crédito gratis en proyectar.io`;
      navigator.clipboard.writeText(text);
      setCopiedWP(true);
      setTimeout(() => setCopiedWP(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6 xl:gap-8 max-w-full">
      
      {showDonationModal && (
        <DonationModal 
          onClose={() => setShowDonationModal(false)}
          exportType={exportType}
          onDownload={() => {
              if(exportType === 'excel') exportToExcel();
              if(exportType === 'csv') exportToCSV();
          }}
          downloadLink={
            <PDFDownloadLink document={<MortgagePDFDocument data={datosExport} summary={totals} />} fileName={`ProyectAR_Reporte_${new Date().getTime()}.pdf`}>
              {({ loading }) => (
                <button disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                   <FileText className="w-4 h-4"/> {loading ? 'Generando Archivo...' : 'Descargar PDF Ahora'}
                </button>
              )}
            </PDFDownloadLink>
          }
        />
      )}

      <ChartModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} title="Proyección de pagos del crédito">
          <CompositionChart data={filteredData} dateMode="calendar" showRemMarker fullscreen />
      </ChartModal>

      <TableModal isOpen={isTableFullscreen} onClose={() => setIsTableFullscreen(false)} title="Tabla de Amortización">
        <AmortizationTable data={schedule} dark />
      </TableModal>

      {/* --- COLUMNA IZQUIERDA: LO QUE PONES --- */}
      <div className="space-y-4 min-w-0">

        <Panel className="p-4 md:p-5">
          <SectionTitle
            icon={CalendarDays}
            aside={
              <button onClick={handleReset} title="Limpiar todo" aria-label="Limpiar formulario" className="p-1.5 rounded-control text-faint hover:text-ink dark:hover:text-ink-dark transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            }
          >
            Tipo de crédito
            <Tooltip iconClass="w-3.5 h-3.5 text-faint">
              <p className="mb-3"><b className="text-indigo-400">Nuevo:</b> todavía no lo sacaste. Simulás desde cero con el monto, el plazo y la tasa que te ofrece el banco.</p>
              <p><b className="text-indigo-400">En curso:</b> ya lo tenés. Proyectás desde tu saldo deudor actual y las cuotas que te quedan.</p>
            </Tooltip>
          </SectionTitle>

          <Segmented
            block
            value={loanType}
            onChange={setLoanType}
            options={[{ value: 'new', label: 'Nuevo' }, { value: 'ongoing', label: 'En curso' }]}
          />

          <Hint className="mt-3 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 shrink-0" /> Proyectando desde {MESES[hoy.getMonth()]} {hoy.getFullYear()}
          </Hint>
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionTitle icon={Settings2}>Datos del crédito</SectionTitle>

          {loanType === 'new' ? (
            <div className="space-y-4">
              <CurrencyInput label="Monto del préstamo" value={amount} onChange={setAmount} usdEquivalent={amount / dolarOficial} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plazo (años)">
                  <NumberField
                    value={years || ''}
                    onChange={(v) => { const n = v.replace(/\D/g, ''); setYears(n === '' ? '' : Math.min(50, Number(n))); }}
                  />
                </Field>
                <Field
                  label="TNA (%)"
                  aside={<Tooltip iconClass="w-3 h-3 text-faint">Tasa Nominal Anual. La define cada banco: podés averiguarla en su web o simulando el crédito ahí mismo. Al final de esta columna están los links.</Tooltip>}
                >
                  <NumberField
                    value={rate}
                    onChange={(v) => { const t = v.replace(',', '.'); if (t === '' || /^\d*\.?\d*$/.test(t)) setRate(v); }}
                  />
                </Field>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Field
                label="Saldo deudor"
                hint={
                  amount > 0
                    ? (balanceCurrency === 'ars'
                        ? `Equivale a ${new Intl.NumberFormat('es-AR').format(Math.round(amount / uvaValue))} UVA aprox.`
                        : `Equivale a ${money(amount * uvaValue)} al valor UVA de hoy`)
                    : 'Está en tu home banking. Podés cargarlo en pesos o en UVA.'
                }
                aside={
                  <Segmented
                    size="sm"
                    value={balanceCurrency}
                    onChange={setBalanceCurrency}
                    options={[{ value: 'ars', label: '$' }, { value: 'uva', label: 'UVA' }]}
                  />
                }
              >
                <NumberField
                  value={amount === 0 ? '' : (balanceCurrency === 'ars' ? money(amount) : new Intl.NumberFormat('es-AR').format(amount))}
                  onChange={(v) => { const n = v.replace(/\D/g, ''); setAmount(n === '' ? 0 : Number(n)); }}
                  suffix={balanceCurrency === 'uva' ? 'UVA' : '$'}
                  placeholder={balanceCurrency === 'ars' ? '$ 0' : '0'}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Cuotas restantes">
                  <NumberField
                    value={remInstallments || ''}
                    onChange={(v) => { const n = v.replace(/\D/g, ''); setRemInstallments(n === '' ? '' : Math.min(600, Number(n))); }}
                  />
                </Field>
                <Field
                  label="TNA (%)"
                  aside={<Tooltip iconClass="w-3 h-3 text-faint">La define cada banco. Podés averiguarla en su web o en tu resumen.</Tooltip>}
                >
                  <NumberField
                    value={rate}
                    onChange={(v) => { const t = v.replace(',', '.'); if (t === '' || /^\d*\.?\d*$/.test(t)) setRate(v); }}
                  />
                </Field>
              </div>

              <div className="pt-4 border-t border-hair dark:border-hair-dark">
                <CurrencyInput
                  label="Cuota que te cobra el banco (opcional)"
                  value={bankInstallment}
                  onChange={setBankInstallment}
                  sublabel="El total de tu último resumen, para ver cuánto se aparta la simulación de lo que pagás."
                />
                {bankInstallment > 0 && totals.cuotaInicial > 0 && (
                  <Notice tone={Math.abs(gapPct) <= 5 ? 'info' : 'warning'} icon={ArrowRightLeft} className="mt-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span>Simulada {money(totals.cuotaInicial)}</span>
                      <span className="text-stat">{gapPct > 0 ? '+' : ''}{gapPct.toFixed(1)}%</span>
                    </div>
                    <span className="text-micro opacity-80">
                      {Math.abs(gapPct) <= 5
                        ? 'Coincide con tu resumen. Lo que queda suelen ser seguros y gastos.'
                        : `Tu banco cobra ${money(Math.abs(gapAbs))} ${gapAbs > 0 ? 'más' : 'menos'} por mes: seguros y gastos, u otro criterio de recálculo.`}
                    </span>
                  </Notice>
                )}
              </div>
            </div>
          )}
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionTitle icon={TrendingUp}>
            Inflación proyectada
            <Tooltip iconClass="w-3.5 h-3.5 text-faint">
              <p className="mb-3">La inflación que usamos para proyectar cómo sube tu cuota mes a mes.</p>
              <p className="mb-3">Los meses ya cerrados usan el <b className="text-white">IPC del INDEC</b> y los que vienen, el <b className="text-white">REM del BCRA</b>. El REM llega hasta unos dos años; para los que siguen se repite su último valor.</p>
              <p><b className="text-white">Propia:</b> en cualquiera de los dos tramos podés poner tu número. Ojo que ahí dejás de mirar una proyección oficial y pasás a mirar un supuesto tuyo.</p>
            </Tooltip>
          </SectionTitle>

          <div className="divide-y divide-hair dark:divide-hair-dark">
            <div className="pb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Label>{mesesOficiales === 0 ? 'Primeros meses' : mesesSinDato === 0 ? `Los ${mesesOficiales} meses` : `Primeros ${mesesOficiales} meses`}</Label>
                <Segmented size="sm" value={inflFirstMode} onChange={setInflFirstMode}
                  options={[{ value: 'rem', label: 'REM' }, { value: 'custom', label: 'Propia' }]} />
              </div>
              {inflFirstMode === 'rem' ? (
                <div>
                  <Body>IPC del INDEC para los meses cerrados, REM del BCRA para los que vienen.</Body>
                  {inflacionAnual.length > 0 && (
                    <Body className="mt-2">
                      Esperada: {inflacionAnual.map((a, i) => (
                        <span key={a.año}>{i > 0 && ' · '}{a.año} <b className="font-medium text-ink dark:text-ink-dark">{a.valor.toFixed(0)}%</b>{a.parcial && ' (parcial)'}</span>
                      ))}
                    </Body>
                  )}
                </div>
              ) : (
                <div className="">
                  <NumberField value={inflFirstAnnual} suffix="% anual"
                    onChange={(v) => { const t = v.replace(',', '.'); if (t === '' || /^\d*\.?\d*$/.test(t)) setInflFirstAnnual(v); }} />
                  <Hint className="mt-1.5">Reemplaza el dato oficial. Equivale a {(anualAMensual(Number(String(inflFirstAnnual).replace(',', '.')) || 0) * 100).toFixed(2).replace('.', ',')}% mensual.</Hint>
                </div>
              )}
            </div>

            {mesesSinDato > 0 && (
              <div className="pt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Label>Meses restantes</Label>
                  <Segmented size="sm" value={inflLongMode} onChange={setInflLongMode}
                    options={[{ value: 'rem', label: 'REM' }, { value: 'custom', label: 'Propia' }]} />
                </div>
                {inflLongMode === 'rem' ? (
                  <Body>
                    {ultimoRemMensual > 0
                      ? `Sigue con el último dato del REM: ${String(ultimoRemMensual).replace('.', ',')}% mensual, ${ultimoRemAnual.toFixed(1).replace('.', ',')}% anual.`
                      : 'Sigue con el último dato disponible del REM.'}
                  </Body>
                ) : (
                  <div className="">
                    <NumberField value={inflLongAnnual} suffix="% anual"
                      onChange={(v) => { const t = v.replace(',', '.'); if (t === '' || /^\d*\.?\d*$/.test(t)) setInflLongAnnual(v); }} />
                    <Hint className="mt-1.5">Equivale a {(anualAMensual(Number(String(inflLongAnnual).replace(',', '.')) || 0) * 100).toFixed(2).replace('.', ',')}% mensual.</Hint>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionTitle icon={Activity}>Tu sueldo</SectionTitle>
          <CurrencyInput
            label="Sueldo neto mensual (opcional)"
            value={salary}
            onChange={setSalary}
            sublabel="Para ver qué porcentaje se lleva la primera cuota."
          />
          {salary > 0 && totals.cuotaInicial > 0 && (
            <div className="mt-4 space-y-2">
              <Stat
                label="Afectación de la primera cuota"
                value={`${((totals.cuotaInicial / salary) * 100).toFixed(1)}%`}
                tone={(totals.cuotaInicial / salary) > 0.3 ? 'negative' : 'neutral'}
              />
              <Body>Los bancos suelen pedir que no supere el <b>25-30%</b> de tus ingresos netos. Por encima de eso normalmente piden codeudor o bajar el monto.</Body>
              <Hint>Es solo la primera cuota. Si tu sueldo sube menos que la inflación, con el tiempo va a pesar más.</Hint>
            </div>
          )}
        </Panel>

      </div>

      {/* --- COLUMNA DERECHA: LO QUE SALE --- */}
      <div ref={resultsRef} className="space-y-4 min-w-0">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <Stat
              label={loanType === 'new' ? 'Primera cuota' : 'Próxima cuota'}
              value={sinDatos ? '---' : moneyCompact(totals.cuotaInicial)}
              sub={schedule[0] ? `${uvas(schedule[0].cuotaUva)} UVA por mes` : '\u00a0'}
            />
          </Card>
          <Card className="p-4">
            <Stat
              label="Intereses"
              value={sinDatos ? '---' : moneyCompact(totals.totalIntereses)}
              sub={totals.totalInteresesUva > 0 ? `${uvas(Math.round(totals.totalInteresesUva))} UVA` : '\u00a0'}
            />
          </Card>
          <Card className="p-4">
            <Stat
              label={loanType === 'new' ? 'Total a pagar' : 'Falta pagar'}
              value={sinDatos ? '---' : moneyCompact(totals.totalPagadoFinal)}
              sub={totals.totalPagadoUva > 0 ? `${uvas(Math.round(totals.totalPagadoUva))} UVA` : '\u00a0'}
            />
          </Card>
          <Card className="p-4">
            <Stat
              label="Costo real"
              value={!sinDatos && totals.capitalUva > 0 ? `${(totals.totalPagadoUva / totals.capitalUva).toFixed(2).replace('.', ',')}x` : '---'}
              sub={!sinDatos && totals.montoOriginalPesos > 0 ? `${(totals.totalPagadoFinal / totals.montoOriginalPesos).toFixed(1).replace('.', ',')}x en pesos nominales` : '\u00a0'}
              aside={<Tooltip iconClass="w-3 h-3 text-faint"><p className="mb-3">Cuántas veces el capital terminás devolviendo, <b className="text-white">medido en UVA</b>. Un 1,50x significa que por cada 100 UVA prestadas devolvés 150: esos 50 son el costo del crédito.</p><p>Abajo está el mismo cociente en pesos nominales, que siempre da mucho más alto porque suma pesos de años distintos. Ese número asusta pero mide la inflación, no el crédito.</p></Tooltip>}
            />
          </Card>
        </div>

        <Card className="p-4 md:p-5 relative z-40">
          <SectionTitle
            aside={
              <div className="flex items-center gap-2">
                <Segmented
                  size="sm"
                  value={timeframe}
                  onChange={setTimeframe}
                  options={[
                    { value: '1y', label: '1 año' },
                    { value: '2y', label: '2 años' },
                    { value: '3y', label: '3 años' },
                    { value: '10y', label: '10 años' },
                    { value: 'all', label: 'Todo' },
                  ]}
                />
                <button onClick={() => setIsFullscreen(true)} title="Ver en pantalla completa" aria-label="Ver en pantalla completa"
                  className="p-2 rounded-control text-faint hover:text-ink dark:hover:text-ink-dark transition-colors shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            }
          >
            Proyección de pagos
          </SectionTitle>

          <div className="flex items-center gap-4 mb-2 text-micro text-muted dark:text-muted-dark">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Capital</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400" /> Interés</span>
          </div>

          <div className="w-full h-[220px] sm:h-auto sm:aspect-[1000/320]">
            <CompositionChart data={filteredData} dateMode="calendar" showRemMarker />
          </div>

          <Hint className="mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" /> No incluye seguros ni gastos administrativos: sumá un 3-5% aproximado según el banco.
          </Hint>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-hair dark:border-hair-dark">
            <SectionTitle
              className="mb-0"
              icon={FileText}
              aside={
                <button onClick={() => { if (schedule.length > 0) setIsTableFullscreen(true); }} title="Ver tabla en pantalla completa" aria-label="Ver tabla en pantalla completa"
                  className="p-2 rounded-control text-faint hover:text-ink dark:hover:text-ink-dark transition-colors shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </button>
              }
            >
              Tabla de amortización
            </SectionTitle>

            <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
              <select value={exportRange} onChange={(e) => setExportRange(e.target.value)} aria-label="Rango a exportar" title="Rango a exportar"
                className="bg-field dark:bg-field-dark border border-hair dark:border-hair-dark rounded-control px-2.5 py-2 text-label text-ink dark:text-ink-dark outline-none cursor-pointer">
                {[['all', 'Todo el crédito'], ['1', '1 año'], ['2', '2 años'], ['3', '3 años'], ['5', '5 años'], ['10', '10 años']].map(([v, l]) => (
                  <option key={v} value={v} className={OPTION_CLASS}>{l}</option>
                ))}
              </select>

              {[
                { id: 'pdf', icon: FileText, label: 'PDF', tono: 'text-rose-500' },
                { id: 'excel', icon: FileSpreadsheet, label: 'Excel', tono: 'text-emerald-600 dark:text-emerald-500' },
                { id: 'csv', icon: Download, label: 'CSV', tono: 'text-faint dark:text-faint-dark' },
              ].map(b => (
                <button key={b.id} onClick={() => { if (schedule.length > 0) handleExportClick(b.id); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-control text-label bg-field dark:bg-field-dark border border-hair dark:border-hair-dark text-ink dark:text-ink-dark hover:border-indigo-500 transition-colors">
                  <b.icon className={`w-4 h-4 ${b.tono}`} /> {b.label}
                </button>
              ))}

              <button onClick={copyToWhatsApp} title="Copiar resumen para WhatsApp" aria-label="Copiar resumen para WhatsApp"
                className="p-2 rounded-control bg-field dark:bg-field-dark border border-hair dark:border-hair-dark hover:border-[#25D366] transition-colors">
                {copiedWP ? <Check className="w-4 h-4 text-emerald-500" /> : <MessageCircle className="w-4 h-4 text-[#25D366]" />}
              </button>
              <button onClick={() => copyShareUrl(getShareParams(), setCopiedShare)} title="Copiar link de la simulación" aria-label="Copiar link para compartir"
                className="p-2 rounded-control bg-field dark:bg-field-dark border border-hair dark:border-hair-dark text-muted dark:text-muted-dark hover:border-indigo-500 transition-colors">
                {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="h-[420px] md:h-[640px] overflow-auto w-full no-scrollbar">
            <div className="inline-block min-w-full align-middle">
              <AmortizationTable data={schedule} />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionTitle icon={Globe}>Bancos con crédito UVA</SectionTitle>
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2">
            {[
              { n: "Bco. Nación", u: "https://www.bna.com.ar/Personas/CreditosHipotecarios", l: "/logos/bconacion.png" },
              { n: "Bco. Provincia", u: "https://www.bancoprovincia.com.ar/hipotecarioTradicional/Info_Prov_Vivienda", l: "/logos/provincia.png" },
              { n: "Galicia", u: "https://www.galicia.ar/personas/prestamos/hipotecarios", l: "/logos/galicia.png" },
              { n: "Santander", u: "https://www.santander.com.ar/personas/prestamos/hipotecarios-uva", l: "/logos/santander.png" },
              { n: "Macro", u: "https://www.macro.com.ar/personas/prestamos-hipotecarios?d=Any", l: "/logos/macro.png" },
              { n: "BBVA", u: "https://www.bbva.com.ar/personas/productos/creditos-hipotecarios.html", l: "/logos/bbva.png" },
              { n: "Credicoop", u: "https://www.bancocredicoop.coop/personas/asalariados/creditos-para-la-vivienda/compra-uvas", l: "/logos/credicoop.png" },
              { n: "Bco. Ciudad", u: "https://bancociudad.com.ar/institucional/micrositio/PrestamoRemodelacionVivienda", l: "/logos/ciudad.png" },
              { n: "ICBC", u: "https://www.icbc.com.ar/personas/productos-servicios/prestamos/hipotecarios", l: "/logos/icbc.png" },
              { n: "Supervielle", u: "https://www.supervielle.com.ar/personas/prestamos/hipotecarios", l: "/logos/supervielle.png" },
              { n: "Patagonia", u: "https://www.bancopatagonia.com.ar/personas/prestamos/hipotecarios", l: "/logos/patagonia.png" },
              { n: "Hipotecario", u: "https://www.hipotecario.com.ar/personas/prestamos-a-la-vivienda/tradicional/adquisicion/", l: "/logos/hipotecario.png" }
            ].map(b => <BankCard key={b.n} name={b.n} url={b.u} logoUrl={b.l} />)}
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- VISTA ALQUILERES (INTEGRADA) ---
// Tabla de pagos del alquiler. Misma forma que la de amortizacion: numeros a la
// derecha, peso normal y una sola cifra destacada, el total del mes. Los meses
// en que se ajusta el alquiler llevan una marca con el aumento, porque son los
// que cambian lo que se paga.
function RentTable({ data, dark = false }) {
  const totalMes = data.reduce((a, d) => a + d.cuotaTotal, 0);
  const totalAlquiler = data.reduce((a, d) => a + d.principal, 0);
  const totalExpensas = data.reduce((a, d) => a + d.interes, 0);

  const tinta = dark ? 'text-slate-100' : 'text-ink dark:text-ink-dark';
  const tenue = dark ? 'text-slate-400' : 'text-muted dark:text-muted-dark';
  const th = 'px-4 py-3 font-medium whitespace-nowrap';
  const td = 'px-4 py-2.5 text-right whitespace-nowrap';

  return (
    <table className={`w-full border-collapse text-body ${dark ? '' : 'min-w-[640px]'}`} style={dark ? { minWidth: 720 } : undefined}>
      <thead className={`sticky top-0 z-10 text-label ${dark ? 'bg-slate-950 text-slate-400 border-b border-white/10' : 'bg-card dark:bg-card-dark text-muted dark:text-muted-dark border-b border-hair dark:border-hair-dark'}`}>
        <tr>
          <th className={`${th} text-left`}>Periodo</th>
          <th className={`${th} text-left`}>Inflación</th>
          <th className={`${th} text-right`}>Alquiler</th>
          <th className={`${th} text-right`}>Expensas</th>
          <th className={`${th} text-right`}>Total del mes</th>
        </tr>
      </thead>
      <tbody className={dark ? 'divide-y divide-white/5' : 'divide-y divide-hair dark:divide-hair-dark'}>
        {data.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-10 text-center text-body text-faint dark:text-faint-dark">Cargá el alquiler, las expensas y la duración para ver los pagos mes a mes.</td>
          </tr>
        )}
        {data.map((d, i) => {
          // El origen del dato solo se marca cuando cambia.
          const cambiaOrigen = i === 0 || data[i - 1].source !== d.source;
          return (
            <tr key={d.mes} className={`${tenue} ${d.ajuste ? (dark ? 'bg-white/5' : 'bg-indigo-500/5') : ''}`}>
              <td className={`px-4 py-2.5 text-left whitespace-nowrap ${tinta}`}>
                <span className="inline-flex items-center gap-1.5">
                  {d.label}
                  {d.ajuste && (
                    <span title="Mes en que se ajusta el alquiler" className="inline-flex items-center gap-1 text-micro text-indigo-500">
                      <TrendingUp className="w-3 h-3" /> +{d.aumento.toFixed(1).replace('.', ',')}%
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-2.5 text-left whitespace-nowrap">
                {cambiaOrigen && (
                  <span className={`inline-flex items-center gap-1.5 text-micro px-2 py-0.5 rounded-full ${dark ? 'bg-white/5 text-slate-300' : 'bg-hair dark:bg-hair-dark text-muted dark:text-muted-dark'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.oficial ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {d.source}
                  </span>
                )}
              </td>
              <td className={td}>{money(d.principal)}</td>
              <td className={td}>{money(d.interes)}</td>
              <td className={`${td} font-semibold ${tinta}`}>{money(d.cuotaTotal)}</td>
            </tr>
          );
        })}
      </tbody>
      {data.length > 0 && (
        <tfoot className={`sticky bottom-0 text-label ${dark ? 'bg-slate-950 text-slate-300 border-t border-white/10' : 'bg-card dark:bg-card-dark text-ink dark:text-ink-dark border-t border-hair dark:border-hair-dark'}`}>
          <tr>
            <td className="px-4 py-3 text-left font-medium">Totales</td>
            <td />
            <td className="px-4 py-3 text-right whitespace-nowrap">{money(totalAlquiler)}</td>
            <td className="px-4 py-3 text-right whitespace-nowrap">{money(totalExpensas)}</td>
            <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">{money(totalMes)}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function RentCalculator({ remData, dolarOficial }) {
  const hoyRef = useRef(new Date());
  const hoy = hoyRef.current;

  const [rentType, setRentType] = useState('new');
  const [rentAmount, setRentAmount] = useState(0);
  const [expensesAmount, setExpensesAmount] = useState(0);
  const [salary, setSalary] = useState(0);
  const [propertyValueUsd, setPropertyValueUsd] = useState('');

  const [durationMonths, setDurationMonths] = useState('');
  const [adjustPeriod, setAdjustPeriod] = useState('');
  const [monthsSinceLastAdjust, setMonthsSinceLastAdjust] = useState('');

  // Mismo esquema de inflacion que en creditos: cada tramo decide por separado
  // si sigue el dato oficial o una inflacion propia.
  const [inflFirstMode, setInflFirstMode] = useState('rem');
  const [inflFirstAnnual, setInflFirstAnnual] = useState('25');
  const [inflLongMode, setInflLongMode] = useState('rem');
  const [inflLongAnnual, setInflLongAnnual] = useState('25');

  const [showDonationModal, setShowDonationModal] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [exportRange, setExportRange] = useState('all');
  const [copiedWP, setCopiedWP] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [timeframe, setTimeframe] = useState('all');

  // El contrato se proyecta siempre desde hoy.
  const startMonth = hoy.getMonth();
  const startYear = hoy.getFullYear();

  const aNumero = (v) => Number(String(v).replace(',', '.')) || 0;

  // Cargar parametros desde un link compartido. Los links viejos pueden traer
  // modo propietario, fecha o inflacion manual: se ignoran sin romperse.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (s) {
      const decoded = decodeParams(s);
      if (decoded && decoded.t === 'rent') {
        if (decoded.ra) setRentAmount(decoded.ra);
        if (decoded.ea) setExpensesAmount(decoded.ea);
        if (decoded.dm) setDurationMonths(decoded.dm);
        if (decoded.ap) setAdjustPeriod(decoded.ap);
        if (decoded.rt) setRentType(decoded.rt);
        if (decoded.ms) setMonthsSinceLastAdjust(decoded.ms);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const getShareParams = () => ({
    t: 'rent', ra: rentAmount, ea: expensesAmount, dm: durationMonths, ap: adjustPeriod, rt: rentType, ms: monthsSinceLastAdjust
  });

  const handleReset = () => {
    setRentAmount(0); setExpensesAmount(0); setSalary(0); setPropertyValueUsd('');
    setDurationMonths(''); setAdjustPeriod(''); setMonthsSinceLastAdjust('');
  };

  const inflacionAnual = useMemo(() => inflacionPorAnio(remData).filter(a => a.año >= hoy.getFullYear()), [remData, hoy]);
  const ultimoRemMensual = (remData && remData.length > 0) ? remData[remData.length - 1].valor : 0;
  const ultimoRemAnual = mensualAAnual(ultimoRemMensual);

  // Al elegir "propia" se arranca desde el ultimo dato oficial, no desde un numero suelto.
  useEffect(() => {
    if (ultimoRemMensual > 0) {
      const anual = String(Math.round(mensualAAnual(ultimoRemMensual)));
      setInflFirstAnnual(anual);
      setInflLongAnnual(anual);
    }
  }, [ultimoRemMensual]);

  const schedule = useMemo(() => {
    const totalMonths = Number(durationMonths) || 0;
    if ((rentAmount === 0 && expensesAmount === 0) || totalMonths <= 0) return [];

    const periodo = Number(adjustPeriod) || 0;
    const desdeAjuste = rentType === 'ongoing' ? (Number(monthsSinceLastAdjust) || 0) : 0;
    const inflacionMap = (remData && remData.length > 0)
      ? new Map(remData.map(d => [d.mes + '-' + d.año, d]))
      : new Map();
    const primerosMensual = anualAMensual(aNumero(inflFirstAnnual));
    const restantesMensual = inflLongMode === 'rem' ? ultimoRemMensual / 100 : anualAMensual(aNumero(inflLongAnnual));

    let currentRent = rentAmount;
    let currentExpenses = expensesAmount;
    let factor = 1; // inflacion acumulada desde el ultimo ajuste

    // Contrato en curso: la inflacion desde el ultimo ajuste hasta hoy ya ocurrio.
    // Sale siempre del dato real, aunque se haya elegido una inflacion propia:
    // lo que ya paso no es un supuesto.
    for (let j = desdeAjuste; j >= 1; j--) {
      const f = new Date(startYear, startMonth - j, 1);
      const m = inflacionMap.get((f.getMonth() + 1) + '-' + f.getFullYear());
      factor *= 1 + (m ? m.valor / 100 : restantesMensual);
    }

    const data = [];
    let currentDate = new Date(startYear, startMonth, 1);
    let tasaAnterior = 0;
    let firstVal = 0, lastMonthVal = 0, lastDecVal = 0;

    for (let i = 1; i <= totalMonths; i++) {
      // La inflacion de un mes se aplica recien al mes siguiente: el aumento
      // que toca cada N meses cubre exactamente esos N meses, no uno mas.
      if (i > 1) {
        currentExpenses *= 1 + tasaAnterior;
        factor *= 1 + tasaAnterior;
      }

      const transcurridos = desdeAjuste + (i - 1);
      const ajuste = periodo > 0 && transcurridos > 0 && transcurridos % periodo === 0;
      const aumento = ajuste ? (factor - 1) * 100 : 0;
      if (ajuste) {
        currentRent *= factor;
        factor = 1;
      }

      const inflMatch = inflacionMap.get((currentDate.getMonth() + 1) + '-' + currentDate.getFullYear()) ?? null;
      const sourceName = inflMatch
        ? (inflFirstMode === 'custom' ? 'PROPIA' : (inflMatch.origen === 'IPC' ? 'IPC' : 'REM'))
        : (inflLongMode === 'custom' ? 'PROPIA' : 'INERCIA');
      const tasa = inflMatch
        ? (inflFirstMode === 'custom' ? primerosMensual : inflMatch.valor / 100)
        : restantesMensual;

      const cuotaTotal = currentRent + currentExpenses;
      if (i === 1) { firstVal = cuotaTotal; lastMonthVal = cuotaTotal; lastDecVal = cuotaTotal; }

      data.push({
        mes: i,
        label: `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
        shortDate: `${MESES[currentDate.getMonth()]} ${String(currentDate.getFullYear()).slice(-2)}`,
        cuotaTotal,
        principal: currentRent,
        interes: currentExpenses,
        source: sourceName,
        oficial: !!inflMatch,
        ajuste,
        aumento,
        varMensual: i === 1 ? 0 : ((cuotaTotal / lastMonthVal) - 1) * 100 || 0,
        varYTD: i === 1 ? 0 : ((cuotaTotal / lastDecVal) - 1) * 100 || 0,
        varTotal: i === 1 ? 0 : ((cuotaTotal / firstVal) - 1) * 100 || 0,
      });

      lastMonthVal = cuotaTotal;
      if (currentDate.getMonth() === 11) lastDecVal = cuotaTotal;
      tasaAnterior = tasa;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return data;
  }, [rentAmount, expensesAmount, durationMonths, adjustPeriod, monthsSinceLastAdjust, rentType, inflFirstMode, inflFirstAnnual, inflLongMode, inflLongAnnual, ultimoRemMensual, remData, startMonth, startYear]);

  const totals = useMemo(() => ({
    alquilerInicial: schedule[0]?.principal || 0,
    expensasIniciales: schedule[0]?.interes || 0,
    cuotaTotalInicial: schedule[0]?.cuotaTotal || 0,
    ultimoMes: schedule[schedule.length - 1]?.cuotaTotal || 0,
    totalExpensas: schedule.reduce((acc, curr) => acc + curr.interes, 0),
    totalContrato: schedule.reduce((acc, curr) => acc + curr.cuotaTotal, 0),
  }), [schedule]);

  // Sin datos la pantalla conserva su estructura y solo muestra "---".
  const sinDatos = schedule.length === 0;
  const proximoAjuste = schedule.find(d => d.ajuste) || null;
  const mesesOficiales = schedule.filter(d => d.oficial).length;
  const mesesSinDato = schedule.length - mesesOficiales;
  const NBSP = ' ';
  const pct = (v) => v.toFixed(1).replace('.', ',');

  const filteredData = useMemo(() => (timeframe === 'all' ? schedule : schedule.slice(0, Math.min(schedule.length, parseInt(timeframe) * 12))), [schedule, timeframe]);

  const resultsRef = useRef(null);
  const prevScheduleLen = useRef(0);
  useEffect(() => {
    if (schedule.length > 0 && prevScheduleLen.current === 0 && resultsRef.current && window.innerWidth < 1024) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevScheduleLen.current = schedule.length;
  }, [schedule.length]);

  // Rentabilidad bruta: solo el alquiler, sin expensas, al dolar oficial.
  const valorPropiedad = Number(String(propertyValueUsd).replace(/\D/g, '')) || 0;
  const annualRentUsd = dolarOficial > 0 ? (rentAmount * 12) / dolarOficial : 0;
  const grossYield = valorPropiedad > 0 ? (annualRentUsd / valorPropiedad) * 100 : 0;
  const pri = grossYield > 0 ? 100 / grossYield : 0;

  // La tabla en pantalla siempre muestra el contrato completo; lo que se recorta es el archivo.
  const datosExport = exportRange === 'all'
    ? schedule
    : schedule.slice(0, Math.min(schedule.length, parseInt(exportRange) * 12));

  const exportToCSV = () => {
    if (datosExport.length === 0) return;
    const headers = ["Periodo", "Alquiler", "Expensas", "Total del mes", "Ajuste (%)", "Inflación"];
    const rows = datosExport.map(d => [
      d.label, Math.round(d.principal), Math.round(d.interes), Math.round(d.cuotaTotal), d.ajuste ? d.aumento.toFixed(1) : '', d.source
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(";") + "\n" + rows.map(e => e.join(";")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ProyectAR_Alquiler_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (datosExport.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(datosExport.map(d => ({
      "Periodo": d.label,
      "Alquiler": Math.round(d.principal),
      "Expensas": Math.round(d.interes),
      "Total del mes": Math.round(d.cuotaTotal),
      "Ajuste (%)": d.ajuste ? Number(d.aumento.toFixed(1)) : '',
      "Inflación": d.source
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alquiler");
    XLSX.writeFile(wb, `ProyectAR_Alquiler_${new Date().getTime()}.xlsx`);
  };

  const handleExportClick = (type) => {
    if (datosExport.length === 0) return;
    setExportType(type);
    setShowDonationModal(true);
  };

  const copyToWhatsApp = () => {
    if (schedule.length === 0) return;
    const text = `Proyección de alquiler - ProyectAR\n\nPrimer mes: ${money(totals.cuotaTotalInicial)}\n${proximoAjuste ? `Próximo aumento: ${proximoAjuste.label}, +${pct(proximoAjuste.aumento)}%\n` : ''}Total del contrato: ${money(totals.totalContrato)}\n\nSimulá el tuyo gratis en proyectar.io`;
    navigator.clipboard.writeText(text);
    setCopiedWP(true);
    setTimeout(() => setCopiedWP(false), 2000);
  };

  const soloNumeros = (v) => v.replace(/\D/g, '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6 xl:gap-8 max-w-full">

      {showDonationModal && (
        <DonationModal
          onClose={() => setShowDonationModal(false)}
          exportType={exportType}
          onDownload={() => {
            if (exportType === 'excel') exportToExcel();
            if (exportType === 'csv') exportToCSV();
          }}
          downloadLink={
            <PDFDownloadLink document={<RentPDFDocument data={datosExport} summary={totals} />} fileName={`ProyectAR_Alquiler_${new Date().getTime()}.pdf`}>
              {({ loading }) => (<button disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"><FileText className="w-4 h-4"/> {loading ? 'Generando...' : 'Descargar PDF Ahora'}</button>)}
            </PDFDownloadLink>
          }
        />
      )}

      <ChartModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} title="Proyección de pagos del alquiler">
        <CompositionChart data={schedule} dateMode="calendar" showRemMarker isRent fullscreen />
      </ChartModal>

      <TableModal isOpen={isTableFullscreen} onClose={() => setIsTableFullscreen(false)} title="Pagos mes a mes">
        <RentTable data={schedule} dark />
      </TableModal>

      {/* --- COLUMNA IZQUIERDA: LO QUE PONES --- */}
      <div className="space-y-4 min-w-0">

        <Panel className="p-4 md:p-5">
          <SectionTitle
            icon={CalendarDays}
            aside={
              <button onClick={handleReset} title="Limpiar todo" aria-label="Limpiar formulario" className="p-1.5 rounded-control text-faint hover:text-ink dark:hover:text-ink-dark transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            }
          >
            Tipo de contrato
            <Tooltip iconClass="w-3.5 h-3.5 text-faint">
              <p className="mb-3"><b className="text-indigo-400">Nuevo:</b> todavía no lo firmaste o recién empieza. Simulás desde el primer mes.</p>
              <p><b className="text-indigo-400">En curso:</b> ya lo estás pagando. Proyectás desde lo que pagás hoy y los meses que pasaron desde el último aumento.</p>
            </Tooltip>
          </SectionTitle>

          <Segmented
            block
            value={rentType}
            onChange={setRentType}
            options={[{ value: 'new', label: 'Nuevo' }, { value: 'ongoing', label: 'En curso' }]}
          />

          <Hint className="mt-3 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 shrink-0" /> Proyectando desde {MESES[hoy.getMonth()]} {hoy.getFullYear()}
          </Hint>
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionTitle icon={Settings2}>Datos del contrato</SectionTitle>
          <div className="space-y-4">
            <CurrencyInput
              label={rentType === 'new' ? 'Alquiler mensual' : 'Alquiler que pagás hoy'}
              value={rentAmount}
              onChange={setRentAmount}
              usdEquivalent={dolarOficial > 0 ? rentAmount / dolarOficial : 0}
            />
            <CurrencyInput
              label="Expensas"
              value={expensesAmount}
              onChange={setExpensesAmount}
              sublabel="Se actualizan todos los meses con la inflación."
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label={rentType === 'new' ? 'Duración (meses)' : 'Meses que faltan'}>
                <NumberField
                  value={durationMonths}
                  onChange={(v) => { const n = soloNumeros(v); setDurationMonths(n === '' ? '' : Math.min(120, Number(n))); }}
                />
              </Field>
              <Field
                label="Ajusta cada (meses)"
                aside={<Tooltip iconClass="w-3 h-3 text-faint">La frecuencia que pactaste en el contrato: 3, 4, 6 o 12 meses son las más comunes. En cada ajuste el alquiler sube lo que acumuló la inflación desde el ajuste anterior.</Tooltip>}
              >
                <NumberField
                  value={adjustPeriod}
                  onChange={(v) => { const n = soloNumeros(v); setAdjustPeriod(n === '' ? '' : Math.min(24, Number(n))); }}
                />
              </Field>
            </div>
            {rentType === 'ongoing' && (
              <Field label="Meses desde el último aumento" hint="Para saber cuánta inflación ya se acumuló para el próximo.">
                <NumberField
                  value={monthsSinceLastAdjust}
                  onChange={(v) => { const n = soloNumeros(v); const tope = Math.max((Number(adjustPeriod) || 1) - 1, 0); setMonthsSinceLastAdjust(n === '' ? '' : Math.min(tope, Number(n))); }}
                />
              </Field>
            )}
          </div>
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionTitle icon={TrendingUp}>
            Inflación proyectada
            <Tooltip iconClass="w-3.5 h-3.5 text-faint">
              <p className="mb-3">La inflación que usamos para proyectar cómo sube el alquiler en cada ajuste y las expensas todos los meses.</p>
              <p className="mb-3">Los meses ya cerrados usan el <b className="text-white">IPC del INDEC</b> y los que vienen, el <b className="text-white">REM del BCRA</b>. El REM llega hasta unos dos años; para los que siguen se repite su último valor.</p>
              <p><b className="text-white">Propia:</b> en cualquiera de los dos tramos podés poner tu número. Lo que ya pasó desde el último aumento se calcula siempre con el dato real.</p>
            </Tooltip>
          </SectionTitle>

          <div className="divide-y divide-hair dark:divide-hair-dark">
            <div className="pb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Label>{sinDatos || mesesOficiales === 0 ? 'Primeros meses' : mesesSinDato === 0 ? `Los ${mesesOficiales} meses` : `Primeros ${mesesOficiales} meses`}</Label>
                <Segmented size="sm" value={inflFirstMode} onChange={setInflFirstMode}
                  options={[{ value: 'rem', label: 'REM' }, { value: 'custom', label: 'Propia' }]} />
              </div>
              {inflFirstMode === 'rem' ? (
                <div>
                  <Body>IPC del INDEC para los meses cerrados, REM del BCRA para los que vienen.</Body>
                  {inflacionAnual.length > 0 && (
                    <Body className="mt-2">
                      Esperada: {inflacionAnual.map((a, i) => (
                        <span key={a.año}>{i > 0 && ' · '}{a.año} <b className="font-medium text-ink dark:text-ink-dark">{a.valor.toFixed(0)}%</b>{a.parcial && ' (parcial)'}</span>
                      ))}
                    </Body>
                  )}
                </div>
              ) : (
                <div>
                  <NumberField value={inflFirstAnnual} suffix="% anual"
                    onChange={(v) => { const t = v.replace(',', '.'); if (t === '' || /^\d*\.?\d*$/.test(t)) setInflFirstAnnual(v); }} />
                  <Hint className="mt-1.5">Reemplaza el dato oficial. Equivale a {(anualAMensual(aNumero(inflFirstAnnual)) * 100).toFixed(2).replace('.', ',')}% mensual.</Hint>
                </div>
              )}
            </div>

            {(sinDatos || mesesSinDato > 0) && (
              <div className="pt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Label>Meses restantes</Label>
                  <Segmented size="sm" value={inflLongMode} onChange={setInflLongMode}
                    options={[{ value: 'rem', label: 'REM' }, { value: 'custom', label: 'Propia' }]} />
                </div>
                {inflLongMode === 'rem' ? (
                  <Body>
                    {ultimoRemMensual > 0
                      ? `Sigue con el último dato del REM: ${String(ultimoRemMensual).replace('.', ',')}% mensual, ${ultimoRemAnual.toFixed(1).replace('.', ',')}% anual.`
                      : 'Sigue con el último dato disponible del REM.'}
                  </Body>
                ) : (
                  <div>
                    <NumberField value={inflLongAnnual} suffix="% anual"
                      onChange={(v) => { const t = v.replace(',', '.'); if (t === '' || /^\d*\.?\d*$/.test(t)) setInflLongAnnual(v); }} />
                    <Hint className="mt-1.5">Equivale a {(anualAMensual(aNumero(inflLongAnnual)) * 100).toFixed(2).replace('.', ',')}% mensual.</Hint>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionTitle icon={Activity}>Tu sueldo</SectionTitle>
          <CurrencyInput
            label="Sueldo neto mensual (opcional)"
            value={salary}
            onChange={setSalary}
            sublabel="Para ver si el alquiler entra en lo que te suelen pedir."
          />
          {salary > 0 && totals.cuotaTotalInicial > 0 && (
            <div className="mt-4 space-y-2">
              <Stat
                label="Primer mes sobre tu sueldo"
                value={`${pct((totals.cuotaTotalInicial / salary) * 100)}%`}
                tone={rentAmount * 3 > salary ? 'negative' : 'neutral'}
              />
              <Body>Las inmobiliarias suelen pedir ingresos de <b>al menos 3 veces el alquiler</b>. Con este sueldo, eso es un alquiler de hasta {money(salary / 3)}.</Body>
            </div>
          )}
        </Panel>

        <Panel className="p-4 md:p-5">
          <SectionTitle icon={Home}>Si sos el dueño</SectionTitle>
          <Field label="Valor de la propiedad en USD (opcional)" hint="Para calcular cuánto rinde el alquiler por año.">
            <NumberField
              value={valorPropiedad ? new Intl.NumberFormat('es-AR').format(valorPropiedad) : ''}
              onChange={(v) => setPropertyValueUsd(soloNumeros(v))}
            />
          </Field>
          {valorPropiedad > 0 && rentAmount > 0 && dolarOficial > 0 && (
            <div className="mt-4 space-y-2">
              <Stat
                label="Rentabilidad bruta"
                value={`${pct(grossYield)}% anual`}
                tone={grossYield < 3 ? 'negative' : grossYield >= 5 ? 'positive' : 'neutral'}
              />
              <Body>En Argentina lo habitual está entre 3% y 5% anual. Al dólar oficial, recuperás la inversión en <b>{pct(pri)} años</b> solo con el alquiler.</Body>
              <Hint>Es bruta: no descuenta impuestos, vacancia ni mantenimiento.</Hint>
            </div>
          )}
        </Panel>
      </div>

      {/* --- COLUMNA DERECHA: LO QUE SALE --- */}
      <div ref={resultsRef} className="space-y-4 min-w-0">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <Stat
              label="Hoy pagás"
              value={sinDatos ? '---' : moneyCompact(totals.cuotaTotalInicial)}
              sub={sinDatos ? NBSP : `alquiler ${moneyCompact(totals.alquilerInicial)} + expensas ${moneyCompact(totals.expensasIniciales)}`}
            />
          </Card>
          <Card className="p-4">
            <Stat
              label="Próximo aumento"
              value={proximoAjuste ? `+${pct(proximoAjuste.aumento)}%` : '---'}
              sub={proximoAjuste ? `en ${proximoAjuste.label}` : (sinDatos ? NBSP : 'sin ajustes en el período')}
            />
          </Card>
          <Card className="p-4">
            <Stat
              label="Total del contrato"
              value={sinDatos ? '---' : moneyCompact(totals.totalContrato)}
              sub={sinDatos ? NBSP : `${schedule.length} meses`}
            />
          </Card>
          <Card className="p-4">
            <Stat
              label="Último mes"
              value={sinDatos ? '---' : moneyCompact(totals.ultimoMes)}
              sub={sinDatos || totals.cuotaTotalInicial === 0 ? NBSP : `+${pct(((totals.ultimoMes / totals.cuotaTotalInicial) - 1) * 100)}% contra hoy`}
            />
          </Card>
        </div>

        <Card className="p-4 md:p-5 relative z-40">
          <SectionTitle
            aside={
              <div className="flex items-center gap-2">
                <Segmented
                  size="sm"
                  value={timeframe}
                  onChange={setTimeframe}
                  options={[
                    { value: '1y', label: '1 año' },
                    { value: '2y', label: '2 años' },
                    { value: '3y', label: '3 años' },
                    { value: 'all', label: 'Todo' },
                  ]}
                />
                <button onClick={() => setIsFullscreen(true)} title="Ver en pantalla completa" aria-label="Ver en pantalla completa"
                  className="p-2 rounded-control text-faint hover:text-ink dark:hover:text-ink-dark transition-colors shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            }
          >
            Proyección de pagos
          </SectionTitle>

          <div className="flex items-center gap-4 mb-2 text-micro text-muted dark:text-muted-dark">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Alquiler</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400" /> Expensas</span>
          </div>

          <div className="w-full h-[220px] sm:h-auto sm:aspect-[1000/320]">
            <CompositionChart data={filteredData} dateMode="calendar" showRemMarker isRent />
          </div>

          <Hint className="mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {Number(adjustPeriod) > 0
              ? `El alquiler sube cada ${adjustPeriod} meses con la inflación acumulada; las expensas, todos los meses.`
              : 'Sin frecuencia de ajuste el alquiler queda fijo; las expensas suben todos los meses.'}
          </Hint>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-hair dark:border-hair-dark">
            <SectionTitle
              className="mb-0"
              icon={FileText}
              aside={
                <button onClick={() => { if (schedule.length > 0) setIsTableFullscreen(true); }} title="Ver tabla en pantalla completa" aria-label="Ver tabla en pantalla completa"
                  className="p-2 rounded-control text-faint hover:text-ink dark:hover:text-ink-dark transition-colors shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </button>
              }
            >
              Pagos mes a mes
            </SectionTitle>

            <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
              <select value={exportRange} onChange={(e) => setExportRange(e.target.value)} aria-label="Rango a exportar" title="Rango a exportar"
                className="bg-field dark:bg-field-dark border border-hair dark:border-hair-dark rounded-control px-2.5 py-2 text-label text-ink dark:text-ink-dark outline-none cursor-pointer">
                {[['all', 'Todo el contrato'], ['1', '1 año'], ['2', '2 años'], ['3', '3 años']].map(([v, l]) => (
                  <option key={v} value={v} className={OPTION_CLASS}>{l}</option>
                ))}
              </select>

              {[
                { id: 'pdf', icon: FileText, label: 'PDF', tono: 'text-rose-500' },
                { id: 'excel', icon: FileSpreadsheet, label: 'Excel', tono: 'text-emerald-600 dark:text-emerald-500' },
                { id: 'csv', icon: Download, label: 'CSV', tono: 'text-faint dark:text-faint-dark' },
              ].map(b => (
                <button key={b.id} onClick={() => { if (schedule.length > 0) handleExportClick(b.id); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-control text-label bg-field dark:bg-field-dark border border-hair dark:border-hair-dark text-ink dark:text-ink-dark hover:border-indigo-500 transition-colors">
                  <b.icon className={`w-4 h-4 ${b.tono}`} /> {b.label}
                </button>
              ))}

              <button onClick={copyToWhatsApp} title="Copiar resumen para WhatsApp" aria-label="Copiar resumen para WhatsApp"
                className="p-2 rounded-control bg-field dark:bg-field-dark border border-hair dark:border-hair-dark hover:border-[#25D366] transition-colors">
                {copiedWP ? <Check className="w-4 h-4 text-emerald-500" /> : <MessageCircle className="w-4 h-4 text-[#25D366]" />}
              </button>
              <button onClick={() => copyShareUrl(getShareParams(), setCopiedShare)} title="Copiar link de la simulación" aria-label="Copiar link para compartir"
                className="p-2 rounded-control bg-field dark:bg-field-dark border border-hair dark:border-hair-dark text-muted dark:text-muted-dark hover:border-indigo-500 transition-colors">
                {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="h-[420px] md:h-[640px] overflow-auto w-full no-scrollbar">
            <div className="inline-block min-w-full align-middle">
              <RentTable data={schedule} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- VISTA PREGUNTAS FRECUENTES (FAQ) ---
function FAQItem({ question, children, isOpen, onClick }) {
  return (
    <div className={`border dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white dark:bg-slate-800 border-amber-500/30 dark:border-amber-500/30' : 'bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}>
      <button onClick={onClick} className="w-full text-left p-5 md:p-6 flex justify-between items-center gap-4 outline-none">
        <h4 className="font-semibold text-sm md:text-base tracking-tight text-slate-800 dark:text-white leading-none">{question}</h4>
        <div className={`p-2 rounded-full transition-all duration-300 shrink-0 ${isOpen ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rotate-180' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-5 md:p-6 pt-0 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const faqs = faqsOperativas;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-full">
      <div className="lg:col-span-12 space-y-8">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl border dark:border-slate-800 shadow-sm relative z-40 text-left">
          <div className="flex flex-col mb-10 gap-2">
            <h2 className="font-semibold text-3xl md:text-4xl tracking-tighter dark:text-white flex items-center gap-3">
              <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
              Preguntas Frecuentes
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Cómo leer los resultados y de dónde sale cada número de la proyección.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem 
                key={index} 
                question={faq.q} 
                isOpen={openIndex === index} 
                onClick={() => toggle(index)}
              >
                {faq.a}
              </FAQItem>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- APP COMPONENT PRINCIPAL ---
// SEGURIDAD: Idealmente mover a variable de entorno: import.meta.env.VITE_GA_ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID || '';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('proyectar_dark');
      if (saved !== null) return JSON.parse(saved);
      // Respetar preferencia del sistema operativo
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return true; }
  });
  
  const [dolarOficial, setDolarOficial] = useState(0);
  const [uvaValue, setUvaValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [remDateLabel, setRemDateLabel] = useState(""); 
  const [remData, setRemData] = useState([]);
  const [remStatus, setRemStatus] = useState('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { localStorage.setItem('proyectar_dark', JSON.stringify(darkMode)); } catch { /* storage lleno o bloqueado */ }
  }, [darkMode]);

  useEffect(() => {
    if (GA_MEASUREMENT_ID) { ReactGA.initialize(GA_MEASUREMENT_ID); ReactGA.send({ hitType:"pageview", page: window.location.pathname }); }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resMarket = await fetch(`/market/market_status.json?v=${new Date().getTime()}`);
        if (resMarket.ok) { const m = await resMarket.json(); setDolarOficial(m.dolar_oficial); setUvaValue(m.uva_value); setLastUpdate(m.last_update); }
        const resInflacion = await fetch(`/REM/processed/inflacion_unificada.csv?v=${new Date().getTime()}`);
        if (resInflacion.ok) {
          const text = await resInflacion.text();
          const rows = text.split('\n').slice(1);
          const parsed = rows
            .map(r => r.trim())
            .filter(r => r.length > 0)
            .map(r => {
              const parts = r.split(';');
              return {
                mes: parseInt(parts[0]),
                año: parseInt(parts[1]),
                valor: parseFloat(parts[2].replace(',', '.')),
                origen: (parts[4] || 'REM').trim()
              };
            });
          setRemData(parsed);
          setRemStatus('available');
          const firstRem = parsed.find(d => d.origen === 'REM');
          if (firstRem) setRemDateLabel(`${MESES[firstRem.mes - 1]} ${firstRem.año}`);
          else if (parsed.length > 0) setRemDateLabel(`${MESES[parsed[0].mes - 1]} ${parsed[0].año}`);
        } else { setRemStatus('error'); }
      } catch (e) { console.error(e); setRemStatus('error'); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <div className={darkMode ? 'dark' : ''}>
          <div className="min-h-screen bg-page dark:bg-page-dark text-ink dark:text-ink-dark transition-colors flex flex-col max-w-[100vw] overflow-x-hidden relative" style={{ fontFamily:"'Inter', system-ui, -apple-system, sans-serif" }}>

            <MacroBar uvaValue={uvaValue} dolarOficial={dolarOficial} remData={remData} lastUpdate={lastUpdate} />

            <nav className="bg-page/90 dark:bg-page-dark/90 backdrop-blur-xl border-b border-hair dark:border-hair-dark sticky top-0 z-40">
              <div className={`${CONTENEDOR} grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 md:py-0 md:h-16`}>
                <div className="flex items-center gap-2.5 justify-self-start">
                  <img src="/favicon.png" alt="" className="w-8 h-8 object-contain rounded-control" />
                  <span className="text-title md:text-lg font-semibold tracking-tight text-ink dark:text-ink-dark">Proyect<span className="text-indigo-500">AR</span></span>
                </div>
                <div className="order-3 col-span-2 md:order-none md:col-span-1 md:justify-self-center">
                  <NavigationMenu />
                </div>
                <button onClick={() => setDarkMode(!darkMode)} aria-label="Cambiar tema claro/oscuro" title="Cambiar tema"
                  className="order-2 md:order-none justify-self-end p-2 rounded-control bg-field dark:bg-field-dark border border-hair dark:border-hair-dark text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors">
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </nav>

            <main className={`${CONTENEDOR} py-6 md:py-8 flex-grow`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40 md:py-60 gap-6"><div className="w-20 h-20 border-[8px] border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div><p className="text-[14px] font-semibold tracking-[0.4em] text-slate-400 text-center">Sincronizando Mercados...</p></div>
              ) : (
                <div className="">
                  <Routes>
                    {/* REDIRECCIÓN: Si entran a la home vacía, los mandamos a los créditos */}
                    <Route path="/" element={<Navigate to="/calculadora-creditos-uva" replace />} />

                    {/* RUTA 1: HIPOTECAS (NUEVA URL) */}
                    <Route path="/calculadora-creditos-uva" element={
                      <>
                        <Helmet>
                          <title>ProyectAR | Calculadora de Créditos UVA </title>
                          <meta name="description" content="Simulá tu crédito hipotecario UVA con ajuste por inflación y datos oficiales del REM (BCRA). Proyectá cuánto sube tu cuota mes a mes con el sistema francés en UVA." />
                          <script type="application/ld+json">{JSON.stringify({"@context":"https://schema.org","@type":"WebApplication","name":"ProyectAR - Calculadora de Créditos UVA","url":"https://proyectar.io/calculadora-creditos-uva","description":"Simulador de créditos hipotecarios UVA con inflación proyectada (IPC + REM BCRA), sistema francés, exportación a PDF/Excel.","applicationCategory":"FinanceApplication","operatingSystem":"Web","offers": {"@type":"Offer","price":"0","priceCurrency":"ARS" },"author": {"@type":"Person","name":"Maxi Navarro" }
                          })}</script>
                        </Helmet>
                        <MortgageCalculator uvaValue={uvaValue} remData={remData} dolarOficial={dolarOficial} />
                      </>
                    } />

                    {/* RUTA 2: ALQUILERES (QUEDA IGUAL) */}
                    <Route path="/calculadora-alquileres" element={
                      <>
                        <Helmet>
                          <title>ProyectAR | Calculadora de Alquileres </title>
                          <meta name="description" content="Calculá la actualización de tu contrato de alquiler, expensas e inflación. Ideal para inquilinos y propietarios en Argentina." />
                          <script type="application/ld+json">{JSON.stringify({"@context":"https://schema.org","@type":"WebApplication","name":"ProyectAR - Calculadora de Alquileres","url":"https://proyectar.io/calculadora-alquileres","description":"Simulador de contratos de alquiler con ajuste por inflación (IPC + REM BCRA), cálculo de expensas, yield para propietarios.","applicationCategory":"FinanceApplication","operatingSystem":"Web","offers": {"@type":"Offer","price":"0","priceCurrency":"ARS" },"author": {"@type":"Person","name":"Maxi Navarro" }
                          })}</script>
                        </Helmet>
                        <RentCalculator remData={remData} dolarOficial={dolarOficial} />
                      </>
                    } />

                    {/* RUTA 3: FAQ */}
                    <Route path="/faq" element={
                      <>
                        <Helmet>
                          <title>ProyectAR | FAQ - Preguntas Frecuentes</title>
                          <meta name="description" content="Por qué sube tu cuota UVA, de dónde sale la inflación proyectada (IPC + REM del BCRA) y qué no incluye la simulación." />
                          {/* El structured data se arma con las mismas preguntas que se muestran en pantalla. */}
                          <script type="application/ld+json">{JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity": faqsOperativas.map(f => ({"@type":"Question","name": f.q,"acceptedAnswer": {"@type":"Answer","text": f.resumen }
                            }))
                          })}</script>
                        </Helmet>
                        <FAQ />
                      </>
                    } />



                  </Routes>
                </div>
              )}
            </main>

            <div className={`${CONTENEDOR} mt-10`}>
              <div className="rounded-surface border border-hair dark:border-hair-dark bg-card dark:bg-card-dark p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                  <p className="text-title text-ink dark:text-ink-dark">¿Te sirvió ProyectAR?</p>
                  <p className="text-body text-muted dark:text-muted-dark mt-1 max-w-2xl">Es 100% gratuita y la hacemos a pulmón. Si te aportó algo, una colaboración nos ayuda a pagar los servidores y a seguir mejorándola.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <a href="https://cafecito.app/proyectar" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 rounded-control text-label bg-field dark:bg-field-dark border border-hair dark:border-hair-dark text-ink dark:text-ink-dark hover:border-indigo-500 transition-colors"><Coffee className="w-4 h-4 text-faint" /> Invitar un cafecito</a>
                  <a href="https://link.mercadopago.com.ar/proyectarapp" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 rounded-control text-label bg-field dark:bg-field-dark border border-hair dark:border-hair-dark text-ink dark:text-ink-dark hover:border-indigo-500 transition-colors"><Handshake className="w-4 h-4 text-faint" /> Aportar por Mercado Pago</a>
                </div>
              </div>
            </div>

            <footer className={`${CONTENEDOR} border-t border-hair dark:border-hair-dark mt-10 md:mt-16 py-10 flex flex-col gap-8`}>
              <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="flex-1 text-center lg:text-left leading-none"><p className="text-[13px] font-bold text-slate-400 tracking-[0.2em] opacity-50">{`República Argentina · ${CURRENT_YEAR} · v${APP_VERSION}`}</p></div>
                <div className="flex-[2] max-w-2xl mx-auto text-center opacity-60"><p className="text-[12px] leading-relaxed tracking-tighter font-medium text-slate-500 dark:text-slate-400"><span className="font-semibold text-indigo-500">Aviso Legal:</span> {"ProyectAR proporciona esta información como un servicio de simulación financiera. No constituye una interpretación legal, asesoramiento financiero, ni garantiza resultados futuros. Las proyecciones se basan en datos de terceros (REM-BCRA) y pueden variar. Ante decisiones de renta, inversión o crédito, se recomienda consultar con profesionales idóneos."}</p></div>
                <div className="flex-1 flex flex-col items-center lg:items-end gap-2 text-[13px] font-bold text-slate-400 opacity-50 italic"><a href="https://github.com/MaxiNavarro97" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-400 transition-colors leading-none"><Github className="w-4 h-4" /> @MaxiNavarro97</a><a href="mailto:proyectarapp@gmail.com" className="flex items-center gap-2 hover:text-indigo-400 transition-colors leading-none"><Mail className="w-3.5 h-3.5" /> proyectarapp@gmail.com</a></div>
              </div>
              <div className="border-t dark:border-slate-800 pt-6 text-center">
                <p className="text-[11px] font-semibold text-slate-400 opacity-40 mb-3">Fuentes de datos · Últ. act. {formatDateTime(lastUpdate)}</p>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] font-bold text-slate-400 opacity-50">
                  <a href="https://www.bcra.gob.ar/relevamiento-expectativas-mercado-rem/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">BCRA (REM {remDateLabel || '---'})</a>
                  <span className="text-slate-700">·</span>
                  <a href="https://argentinadatos.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">ArgentinaDatos API</a>
                  <span className="text-slate-700">·</span>
                  <a href="https://dolarapi.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">DolarAPI</a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </Router>
    </HelmetProvider>
  );
}