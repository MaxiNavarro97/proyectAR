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
  Calculator, DollarSign, TrendingUp, Globe, ArrowRightLeft, FileText, Zap,
  Settings2, CalendarDays, AlertTriangle, Activity, Github, Clock, Wallet,
  CheckCircle2, Download, Sun, Moon, ExternalLink, ShieldAlert, HelpCircle,
  X, Coffee, HeartHandshake, FileSpreadsheet, Flag, Handshake, RotateCcw,
  MessageCircle, Check, Flame, Maximize2, Mail, Smartphone
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
const RentPDFDocument = ({ data, summary, role }) => (
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
          <View style={{ flex: 1, backgroundColor: '#eef2ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#4f46e5', fontWeight: 'bold' }}>{role === 'owner' ? 'Ingreso inicial' : 'Alquiler inicial'}</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.alquilerInicial)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#fff7ed', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#ea580c', fontWeight: 'bold' }}>Total expensas est.</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalExpensas)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#f0f9ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#0284c7', fontWeight: 'bold' }}>{role === 'owner' ? 'INGRESO BRUTO EST.' : 'Costo total contrato'}</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalContrato)}</Text></View>
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
// Cada color tiene un unico significado en todo el sitio. Las tarjetas que no
// senalan nada van en slate: cuatro colores distintos para cuatro tarjetas es
// decoracion, y hace que el color deje de querer decir algo cuando importa.
const SUMMARY_COLOR_MAP = {
  slate: 'bg-slate-500/10 text-slate-500',
  orange: 'bg-orange-500/10 text-orange-500',   // interes / expensas: lo que se paga de mas
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', // bien
  amber: 'bg-amber-500/10 text-amber-500',      // atencion
  rose: 'bg-rose-500/10 text-rose-500',         // mal
  indigo: 'bg-indigo-500/10 text-indigo-500',   // identidad de seccion
};

const SummaryCard = React.memo(function SummaryCard({ title, value, icon: Icon, colorClass, sticky, tooltip, sub }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setAnimating(true);
      const t = setTimeout(() => { setDisplayValue(value); setAnimating(false); }, 150);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`bg-white dark:bg-slate-900 p-3 rounded-2xl border dark:border-slate-800 shadow-sm flex items-start gap-2.5 transition-all min-w-0 flex-1 relative ${sticky ? 'sticky top-[85px] md:top-[128px] z-30 hover:z-[60] shadow-sm border-indigo-500/30 dark:border-indigo-500/30' : ' hover:z-[60]'}`}>
      <div className={`p-2 rounded-xl shrink-0 ${SUMMARY_COLOR_MAP[colorClass] || 'bg-slate-500/10 text-slate-500'}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 text-left flex-1 relative"> 
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className="text-[11px] md:text-[12px] font-semibold text-slate-400 truncate">{title}</p>
          {tooltip && (
            <Tooltip iconClass="w-3 h-3 text-slate-300">
              {tooltip}
            </Tooltip>
          )}
        </div>
        <p className={`text-xl md:text-2xl font-medium tracking-tight leading-none truncate transition-opacity duration-200 ${animating ? 'opacity-30' : 'opacity-100'} ${colorClass === 'rose' && title.includes('Rentabilidad') ? 'text-rose-500' : 'dark:text-white'}`}>{displayValue}</p>
        {sub && <p className="text-[11px] font-bold text-slate-400 leading-none truncate mt-1">{sub}</p>}
      </div>
    </div>
  );
});

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
        <div className={`flex justify-between items-center gap-4 font-bold tracking-wide ${isRent ? 'text-emerald-400' : 'text-indigo-400'}`}><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${isRent ? 'bg-emerald-500' : 'bg-indigo-500'}`} /><span className="">{isRent ? 'Alquiler' : 'Capital'}:</span></div><span>{money(data.principal)}</span></div>
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
              <rect x={x} y={h - padB - hPri} width={barW} height={hPri} fill={isRent ?"#10b981" :"#6366f1"} rx="1.5" fillOpacity="0.85" className="transition-all group-hover:brightness-110"/>
              <rect x={x} y={h - padB - hPri - hInt} width={barW} height={hInt} fill={isRent ?"#f59e0b" :"#fb923c"} rx="1.5" fillOpacity="0.85" className="transition-all group-hover:brightness-110"/>
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
          <div className="max-h-[400px] md:max-h-[850px] overflow-auto w-full no-scrollbar">
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
function RentCalculator({ remData, dolarOficial }) {
  const hoyRef = useRef(new Date());
  const hoy = hoyRef.current;
  const [rentType, setRentType] = useState('new'); 
  const [rentRole, setRentRole] = useState('tenant'); 
  
  const [rentAmount, setRentAmount] = useState(0);
  const [expensesAmount, setExpensesAmount] = useState(0); 
  const [propertyValueUsd, setPropertyValueUsd] = useState(0);
  const [salary, setSalary] = useState(0); 
  
  const [durationMonths, setDurationMonths] = useState(0); 
  const [adjustPeriod, setAdjustPeriod] = useState(0);
  const [monthsSinceLastAdjust, setMonthsSinceLastAdjust] = useState(0);
  
  const [adjustExpenses, setAdjustExpenses] = useState(true);
  const [dateMode, setDateMode] = useState('calendar'); 
  const [startMonth, setStartMonth] = useState(hoy.getMonth());
  const [startYear, setStartYear] = useState(hoy.getFullYear());
  
  const [inflationMode, setInflationMode] = useState('rem');
  const [manualInf, setManualInf] = useState("0"); 
  const [remStabilizedMode, setRemStabilizedMode] = useState('auto');
  const [remStabilizedValue, setRemStabilizedValue] = useState("0");
  
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [copiedWP, setCopiedWP] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [timeframe, setTimeframe] = useState('all');

  const [amountFocused, setAmountFocused] = useState(false);
  const [expFocused, setExpFocused] = useState(false);
  const [propFocused, setPropFocused] = useState(false);
  const [durFocused, setDurFocused] = useState(false);
  const [adjFocused, setAdjFocused] = useState(false);
  const [sinceFocused, setSinceFocused] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Cargar parámetros desde URL compartida
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
        if (decoded.rr) setRentRole(decoded.rr);
        if (decoded.rt) setRentType(decoded.rt);
        if (decoded.im) setInflationMode(decoded.im);
        if (decoded.mi) setManualInf(String(decoded.mi));
        if (decoded.sm !== undefined) setStartMonth(decoded.sm);
        if (decoded.sy) setStartYear(decoded.sy);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const getShareParams = () => ({
    t: 'rent', ra: rentAmount, ea: expensesAmount, dm: durationMonths, ap: adjustPeriod,
    rr: rentRole, rt: rentType, im: inflationMode, mi: manualInf, sm: startMonth, sy: startYear
  });

  const handleReset = () => {
    setRentAmount(0); setExpensesAmount(0); setPropertyValueUsd(0); setSalary(0); setDurationMonths(0); setAdjustPeriod(0); setMonthsSinceLastAdjust(0); setManualInf("0");
  };

  useEffect(() => {
    if (rentType === 'ongoing') {
      setDateMode('calendar');
      setStartMonth(hoy.getMonth());
      setStartYear(hoy.getFullYear());
    }
  }, [rentType]);

  useEffect(() => {
    if (dateMode === 'generic') { setRentType('new'); setInflationMode('manual'); }
  }, [dateMode]);

  useEffect(() => {
    if (remData && remData.length > 0) {
      const lastValue = remData[remData.length - 1].valor;
      setRemStabilizedValue(String(lastValue).replace('.', ','));
    }
  }, [remData]);

  const schedule = useMemo(() => {
    if (rentAmount === 0 && expensesAmount === 0) return [];
    const data = [];
    const totalMonths = Number(durationMonths) || 0;
    if (totalMonths <= 0) return [];

    // Un solo Map unificado (IPC pasado + REM futuro ya vienen mergeados del script)
    const inflacionMap = (dateMode === 'calendar' && inflationMode === 'rem' && remData && remData.length > 0)
      ? new Map(remData.map(d => [d.mes + '-' + d.año, d]))
      : new Map();

    let currentRent = rentAmount;
    let currentExpenses = expensesAmount;
    let accumulatedFactor = 1;
    let currentDate = new Date(startYear, startMonth, 1);
    
    const manualMonthlyInf = Math.pow(1 + (Number(String(manualInf).replace(',', '.')) || 0) / 100, 1 / 12) - 1;
    let remStabMon = (remStabilizedMode === 'auto' && remData && remData.length > 0) 
      ? remData[remData.length - 1].valor / 100 
      : (Number(String(remStabilizedValue).replace(',', '.')) || 0) / 100;

    // Para alquileres en curso: pre-acumular inflación pasada desde el timeline unificado
    if (rentType === 'ongoing' && Number(monthsSinceLastAdjust) > 0 && inflationMode === 'rem') {
      const mesesAtras = Number(monthsSinceLastAdjust);
      for (let j = mesesAtras; j >= 1; j--) {
        const pastDate = new Date(startYear, startMonth - j, 1);
        const pastKey = (pastDate.getMonth() + 1) + '-' + pastDate.getFullYear();
        const match = inflacionMap.get(pastKey);
        if (match) {
          accumulatedFactor *= (1 + match.valor / 100);
        } else {
          // Fallback: usar inercia
          accumulatedFactor *= (1 + remStabMon);
        }
      }
    }

    let lastMonthVal = 0;
    let lastDecVal = 0;
    let firstVal = 0;

    for (let i = 1; i <= totalMonths; i++) {
      const matchKey = (currentDate.getMonth() + 1) + '-' + currentDate.getFullYear();
      const inflMatch = inflacionMap.get(matchKey) ?? null;
      
      let sourceName = 'MANUAL';
      if (inflationMode === 'rem') {
        if (inflMatch) {
          sourceName = inflMatch.origen === 'IPC' ? 'IPC' : 'REM';
        } else {
          sourceName = 'INERCIA';
        }
      }

      let monthlyRate;
      if (dateMode === 'generic' || inflationMode !== 'rem') {
        monthlyRate = manualMonthlyInf;
      } else {
        monthlyRate = inflMatch ? inflMatch.valor / 100 : remStabMon;
      }

      if (i > 1 && adjustExpenses) { currentExpenses *= (1 + monthlyRate); }
      accumulatedFactor *= (1 + monthlyRate);

      let isAdjustMonth = false;
      if (i > 1 && Number(adjustPeriod) > 0) {
        if (rentType === 'new') {
          isAdjustMonth = (i - 1) % Number(adjustPeriod) === 0;
        } else {
          isAdjustMonth = (i - 1 + Number(monthsSinceLastAdjust)) % Number(adjustPeriod) === 0;
        }
      }

      if (isAdjustMonth) { 
        currentRent *= accumulatedFactor; 
        accumulatedFactor = 1; 
      }

      const cuotaTotal = currentRent + currentExpenses;

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
        label: dateMode === 'calendar' ? `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `Mes ${i}`,
        shortDate: `${MESES[currentDate.getMonth()]} ${String(currentDate.getFullYear()).slice(-2)}`,
        cuotaTotal: cuotaTotal, 
        principal: currentRent, 
        interes: currentExpenses, 
        source: sourceName,
        varMensual: varMensual || 0,
        varYTD: varYTD || 0,
        varTotal: varTotal || 0
      });

      lastMonthVal = cuotaTotal;
      if (currentDate.getMonth() === 11) {
          lastDecVal = cuotaTotal;
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return data;
  }, [rentAmount, expensesAmount, durationMonths, adjustPeriod, monthsSinceLastAdjust, inflationMode, manualInf, remStabilizedMode, remStabilizedValue, dateMode, startMonth, startYear, remData, adjustExpenses, rentType]);

  const totals = useMemo(() => ({
    alquilerInicial: schedule[0]?.principal || 0,
    cuotaTotalInicial: schedule[0]?.cuotaTotal || 0,
    totalExpensas: schedule.reduce((acc, curr) => acc + curr.interes, 0),
    totalContrato: schedule.reduce((acc, curr) => acc + curr.cuotaTotal, 0),
  }), [schedule]);

  const filteredData = useMemo(() => (timeframe === 'all' ? schedule : schedule.slice(0, Math.min(schedule.length, parseInt(timeframe) * 12))), [schedule, timeframe]);

  const resultsRef = useRef(null);
  const prevScheduleLen = useRef(0);
  useEffect(() => {
    if (schedule.length > 0 && prevScheduleLen.current === 0 && resultsRef.current && window.innerWidth < 1024) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevScheduleLen.current = schedule.length;
  }, [schedule.length]);

  // CALCULO RENTABILIDAD (YIELD) - Solo alquiler, SIN expensas
  const annualRentUsd = dolarOficial > 0 ? (rentAmount * 12) / dolarOficial : 0;
  const grossYield = propertyValueUsd > 0 ? (annualRentUsd / propertyValueUsd) * 100 : 0;
  
  // CALCULO PRI (Período de Recuperación de la Inversión)
  const pri = grossYield > 0 ? 100 / grossYield : 0;
  let yieldColor ="slate";
  let yieldIcon = Activity;
  if (propertyValueUsd > 0) {
      if (grossYield < 3) { yieldColor ="rose"; yieldIcon = AlertTriangle; }        // Malo
      else if (grossYield < 5) { yieldColor ="orange"; yieldIcon = TrendingUp; }     // Normal
      else if (grossYield <= 8) { yieldColor ="emerald"; yieldIcon = CheckCircle2; } // Bueno
      else { yieldColor ="sky"; yieldIcon = Flame; }                                  // Excelente
  }

  const exportToCSV = () => {
    if (schedule.length === 0) return;
    const headers = ["Periodo","Total Mes","Alquiler","Expensas","Inflación"];
    const rows = schedule.map(d => [
      d.label, Math.round(d.cuotaTotal), Math.round(d.principal), Math.round(d.interes), d.source
    ]);
    const csvContent ="data:text/csv;charset=utf-8," + headers.join(";") +"\n" + rows.map(e => e.join(";")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ProyectAR_Alquiler_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (schedule.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(schedule.map(d => ({"Periodo": d.label,"Total Mes": Math.round(d.cuotaTotal),"Alquiler": Math.round(d.principal),"Expensas": Math.round(d.interes),"Inflación": d.source
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws,"Alquileres");
    XLSX.writeFile(wb, `ProyectAR_Alquiler_${new Date().getTime()}.xlsx`);
  };

  const handleExportClick = (type) => {
      if (schedule.length === 0) return;
      setExportType(type);
      setShowDonationModal(true);
  };

  const copyToWhatsApp = () => {
      if (schedule.length === 0) return;
      const text = `🏠 *Proyección ProyectAR*\n\n${rentRole === 'tenant' ? '💸 A Pagar (Mes 1)' : '💰 A Cobrar (Mes 1)'}: ${money(totals.alquilerInicial)}\n📈 ${rentRole === 'tenant' ? 'Costo Total Contrato' : 'Ingreso Bruto Est.'}: ${money(totals.totalContrato)}${rentRole === 'owner' && propertyValueUsd > 0 ? `\n🔥 Rentabilidad Anual: ${grossYield.toFixed(1)}%` : ''}\n\nSimulá gratis en proyectar.io`;
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
            <PDFDownloadLink document={<RentPDFDocument data={schedule} summary={totals} role={rentRole} />} fileName={`ProyectAR_Alquileres_${new Date().getTime()}.pdf`}>
              {({ loading }) => (<button disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"><FileText className="w-4 h-4"/> {loading ? 'Generando...' : 'Descargar PDF Ahora'}</button>)}
            </PDFDownloadLink>
          }
        />
      )}

      <ChartModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} title="Proyección de pagos del alquiler">
          <CompositionChart data={schedule} dateMode={dateMode} showRemMarker={inflationMode === 'rem'} isRent={true} fullscreen />
      </ChartModal>

      <TableModal isOpen={isTableFullscreen} onClose={() => setIsTableFullscreen(false)} title="Tabla de Pagos Mensuales">
        <table className="w-full text-left border-collapse text-[13px]" style={{ minWidth: 600 }}>
          <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-semibold text-[12px] border-b border-white/10 leading-none shadow-[0_-8px_0_0_#020617]">
            <tr><th className="p-4 text-center">Periodo</th><th className="p-4 text-center">Inflación</th><th className="p-4 text-center">Total Mes</th><th className="p-4 text-center">Alquiler</th><th className="p-4 text-center">Expensas</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-center">
            {schedule.map((d) => (
              <tr key={d.mes} className="transition-colors hover:bg-white/5">
                <td className="p-4 font-bold text-slate-200">{d.label}</td>
                <td className="p-4"><span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${d.source === 'IPC' ? 'bg-emerald-600 text-white' : d.source === 'REM' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white'}`}>{d.source}</span></td>
                <td className="p-4 font-semibold text-white whitespace-nowrap">{money(d.cuotaTotal)}</td>
                <td className="p-4 text-emerald-400 font-bold whitespace-nowrap">{money(d.principal)}</td>
                <td className="p-4 text-orange-400 font-bold whitespace-nowrap">{money(d.interes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableModal>

      {/* --- COLUMNA IZQUIERDA: CONTROLES --- */}
      <div className="space-y-4 min-w-0">
        
        {/* BLOQUE INICIO ALQUILERES (INTEGRADO) */}
        <div className="bg-slate-100/70 dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-hair-dark text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-none flex items-center gap-2">
                Inicio y tipo
                <Tooltip iconClass="w-3.5 h-3.5 text-emerald-400" color="emerald">
                    <p className="mb-3"><b className="text-emerald-400 font-bold">Fecha Exacta:</b> Si sabés en qué mes vas a pagar, elegí esta opción. Nos permite sincronizar tu cuota con la inflación oficial (IPC real + REM proyectado) para ese mes puntual.</p>
                    <p><b className="text-emerald-200 font-bold">Sin Fecha Fija:</b> Ideal si recién estás averiguando y querés hacer una proyección estimada. Al no haber un mes específico, usás una inflación manual.</p>
                  </Tooltip>
              </h3>
            </div>
            <button onClick={handleReset} title="Limpiar todo" className="p-2 rounded-xl transition-colors text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800" aria-label="Limpiar formulario"><RotateCcw className="w-4 h-4" /></button>
          </div>
          
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button onClick={() => setDateMode('calendar')} className={`flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all ${dateMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Fecha exacta</button>
            <button onClick={() => setDateMode('generic')} className={`flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all ${dateMode === 'generic' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Sin fecha fija</button>
          </div>

          {dateMode === 'calendar' && (
             <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 border border-slate-200 dark:border-slate-700">
               <button onClick={() => setRentType('new')} className={`flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all ${rentType === 'new' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Nuevo</button>
               <button onClick={() => setRentType('ongoing')} className={`flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${rentType === 'ongoing' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
                 En curso
                 <Tooltip iconClass="w-3 h-3 text-slate-400" color="indigo">
                     Simulá contratos vigentes ajustados a la inflación actual.
                   </Tooltip>
               </button>
             </div>
          )}
          
          {dateMode === 'generic' && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-3 mb-4">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[12px] font-semibold tracking-tighter text-rose-600 leading-tight">Sin fecha fija, usás inflación manual y no se conecta al calendario REM.</p>
            </div>
          )}

          {dateMode === 'calendar' && (
             rentType === 'new' ? (
                <div className="grid grid-cols-2 gap-3">
                  <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">
                    {[CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].map(y => <option key={y} value={y} className={OPTION_CLASS}>{y}</option>)}
                  </select>
                  <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">
                    {MESES.map((m, i) => <option key={m} value={i} className={OPTION_CLASS} disabled={startYear === hoy.getFullYear() && i < hoy.getMonth()}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
             ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                   <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">Proyectando desde {MESES[hoy.getMonth()]} {hoy.getFullYear()}</span>
                </div>
             )
          )}
        </div>

        {/* BLOQUE DATOS DEL CONTRATO */}
        <div className="bg-slate-100/70 dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-hair-dark space-y-4 text-left">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Settings2 className="w-4 h-4 text-slate-400 shrink-0" />
              <h3 className="text-sm font-semibold dark:text-white leading-none">Datos del contrato</h3>
            </div>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 z-10"></div>
            <button onClick={() => setRentRole('tenant')} className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-all ${rentRole === 'tenant' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Modo inquilino</button>
            <button onClick={() => setRentRole('owner')} className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-all ${rentRole === 'owner' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Modo propietario</button>
          </div>

          <div className="space-y-4">
            <div className="group text-left">
              <label className="text-[12px] font-semibold text-slate-400 block mb-2">{rentType === 'new' ? (rentRole === 'owner' ? 'Ingreso del alquiler' : 'Monto del alquiler') : 'ALQUILER ACTUAL (MES EN CURSO)'}</label>
              <div className="relative">
                <input type="text" inputMode="numeric" value={amountFocused && rentAmount === 0 ? '' : money(rentAmount)} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRentAmount(v === '' ? 0 : Number(v)); }} onFocus={(e) => { setAmountFocused(true); e.target.select(); }} onBlur={() => setAmountFocused(false)} placeholder="$ 0" className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/50  dark:text-white" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 dark:text-slate-400"><DollarSign className="w-5 h-5" /></div>
              </div>
              {rentAmount > 0 && <p className="text-[12px] text-emerald-600 mt-2 px-1 font-bold">Aprox. USD {new Intl.NumberFormat('es-AR').format(Math.round(rentAmount / dolarOficial))} <span className="text-[10px] opacity-70">(Oficial)</span></p>}
            </div>

            <div className="group text-left">
              <label className="text-[12px] font-semibold text-slate-400 block mb-2">{rentRole === 'owner' ? 'EXPENSAS A CARGO INQUILINO' : 'Expensas iniciales'}</label>
              <div className="relative mb-2">
                <input type="text" inputMode="numeric" value={expFocused && expensesAmount === 0 ? '' : money(expensesAmount)} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setExpensesAmount(v === '' ? 0 : Number(v)); }} onFocus={(e) => { setExpFocused(true); e.target.select(); }} onBlur={() => setExpFocused(false)} placeholder="$ 0" className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/50  dark:text-white" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700">
                <span className="text-[12px] font-semibold text-slate-500 leading-tight">¿Ajustar por inflación? (Mensual)</span>
                <button onClick={() => setAdjustExpenses(!adjustExpenses)} className={`w-10 h-5 rounded-full transition-all relative ${adjustExpenses ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${adjustExpenses ? 'left-5' : 'left-0.5'}`} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border dark:border-slate-800 text-center">
                <label className="text-[13px] font-semibold text-emerald-600 block mb-2 leading-none">{rentType === 'new' ? 'Duración (meses)' : 'MESES RESTANTES'}</label>
                <input type="text" inputMode="numeric" value={(durFocused && (durationMonths === 0 || durationMonths === '')) ? '' : durationMonths} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); setDurationMonths(num !== '' && num > 240 ? 240 : num); }} onFocus={(e) => { setDurFocused(true); e.target.select(); }} onBlur={() => setDurFocused(false)} className="w-full bg-transparent text-xl font-semibold outline-none text-center dark:text-white" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border dark:border-slate-800 text-center">
                <label className="text-[13px] font-semibold text-emerald-600 block mb-2 leading-none">Ajusta cada (meses)</label>
                <input type="text" inputMode="numeric" value={(adjFocused && (adjustPeriod === 0 || adjustPeriod === '')) ? '' : adjustPeriod} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); setAdjustPeriod(num !== '' && num > 120 ? 120 : num); }} onFocus={(e) => { setAdjFocused(true); e.target.select(); }} onBlur={() => setAdjFocused(false)} className="w-full bg-transparent text-xl font-semibold outline-none text-center dark:text-white" />
              </div>
            </div>

            {rentType === 'ongoing' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-emerald-500/20 text-center">
                <label className="text-[13px] font-semibold text-emerald-600 mb-2 flex justify-center items-center gap-1.5">
                  Meses desde el último ajuste
                  <Tooltip iconClass="w-3 h-3 text-emerald-400" color="emerald">
                      Ej: Si firmaste o tuviste el último aumento hace 2 meses exactos, ingresá"2". Esto permite calcular con precisión el próximo mes de ajuste.
                    </Tooltip>
                </label>
                <input type="text" inputMode="numeric" value={(sinceFocused && (monthsSinceLastAdjust === 0 || monthsSinceLastAdjust === '')) ? '' : monthsSinceLastAdjust} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); const maxVal = Number(adjustPeriod) > 0 ? Number(adjustPeriod) - 1 : 11; setMonthsSinceLastAdjust(num !== '' && num > maxVal ? maxVal : num); }} onFocus={(e) => { setSinceFocused(true); e.target.select(); }} onBlur={() => setSinceFocused(false)} className="w-full bg-transparent text-2xl font-semibold outline-none text-center text-emerald-700 dark:text-emerald-400" />
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t dark:border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-4">
              <label className="text-[12px] font-semibold text-slate-400 flex items-center gap-2 min-w-0 overflow-visible">
                Inflación proyectada
                <Tooltip iconClass="w-3.5 h-3.5 text-slate-300" color="emerald">
                    <p className="mb-3 text-emerald-300 font-bold">💡 ¿Qué es esto? La inflación que usamos para proyectar cómo va a aumentar tu alquiler mes a mes.</p>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><b className="text-emerald-400">Modo REM (Oficial)</b></div>
                      <p className="mb-2">Relevamiento de Expectativas de Mercado del <span className="text-white">BCRA</span>. Expertos proyectan la inflación para el año actual y los dos siguientes. ProyectAR mapea estos datos <span className="text-emerald-300">mes a mes</span> automáticamente.</p>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/5"><p className="text-[13px] leading-snug"><span className="text-emerald-300 font-bold tracking-tighter">Inercia:</span> Para el tiempo restante sin datos oficiales, se aplica el <span className="text-white">último valor del REM</span> (Auto) o tu <span className="text-white">tasa propia</span> (Fija).</p></div>
                    <div className="h-px w-full bg-white/5 mb-3"></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div><b className="text-indigo-400">Modo Manual</b></div>
                      <p><span className="text-white font-bold">Control total.</span> Definí una tasa fija para todo el contrato. Ideal para simular escenarios propios.</p>
                    </div>
                  </div>
                </Tooltip>
              </label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                <button disabled={dateMode === 'generic'} onClick={() => setInflationMode('rem')} className={`px-3 py-1 text-[11px] font-semibold rounded-xl ${inflationMode === 'rem' ? 'bg-emerald-600 text-white' : 'text-slate-500'} ${dateMode === 'generic' ? 'opacity-50 cursor-not-allowed' : ''}`}>REM</button>
                <button onClick={() => setInflationMode('manual')} className={`px-3 py-1 text-[11px] font-semibold rounded-xl ${inflationMode === 'manual' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Manual</button>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border dark:border-slate-800">
              {inflationMode === 'manual' ? (
                <div className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[12px] font-semibold text-emerald-600 leading-none">Tasa fija anual estimada</span><span className="text-[13px] font-semibold dark:text-white leading-none">{manualInf}%</span></div>
                    <input type="range" min="0" max="100" step="1" value={Number(String(manualInf).replace(',', '.')) || 0} onChange={(e)=>setManualInf(String(e.target.value).replace('.', ','))} className="w-full accent-emerald-500" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3"><p className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1 leading-none"><Zap className="w-3 h-3" /> Inercia Post-REM</p><div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl"><button onClick={() => setRemStabilizedMode('auto')} className={`px-3 py-1.5 text-[10px] font-semibold rounded-xl ${remStabilizedMode === 'auto' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Auto</button><button onClick={() => setRemStabilizedMode('custom')} className={`px-3 py-1.5 text-[10px] font-semibold rounded-xl ${remStabilizedMode === 'custom' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Fija</button></div></div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-[12px] font-semibold dark:text-white leading-tight">
                    {remStabilizedMode === 'auto' ? `Aplicando el último dato oficial (${(remData && remData.length > 0 ? remData[remData.length-1].valor : '---')}%) para los meses restantes.` : 
                      <div>
                        <div className="flex justify-between mb-1"><span>Tasa Fija mensual estimada para los meses restantes:</span><span>{remStabilizedValue}%</span></div>
                        <input type="range" min="0" max="10" step="0.1" value={Number(String(remStabilizedValue).replace(',', '.')) || 0} onChange={(e)=>setRemStabilizedValue(String(e.target.value).replace('.', ','))} className="w-full accent-emerald-500" />
                      </div>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BLOQUE FINAL DE ALQUILERES: RCI O YIELD */}
          <div className="pt-4 border-t dark:border-slate-800">
            {rentRole === 'owner' ? (
              <div className="group text-left">
                <label className="text-[12px] font-semibold text-slate-400 block mb-2">
                  Valor de la propiedad (USD)
                </label>
                <div className="relative">
                  <input
                    type="text" inputMode="numeric"
                    value={propFocused && propertyValueUsd === 0 ? '' : new Intl.NumberFormat('es-AR').format(propertyValueUsd)}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setPropertyValueUsd(v === '' ? 0 : Number(v)); }}
                    onFocus={(e) => { setPropFocused(true); e.target.select(); }} onBlur={() => setPropFocused(false)}
                    placeholder="USD 0"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/50  dark:text-white"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 font-semibold text-xs dark:text-slate-400">USD</div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-tight px-1 mt-2">
                  Para calcular la Rentabilidad Bruta Anual (Gross Yield) de manera aproximada.
                </p>
              </div>
            ) : (
              <div>
                <CurrencyInput 
                  label="Sueldo neto mensual (opcional)" 
                  value={salary} 
                  onChange={setSalary} 
                  sublabel="Para calcular qué porcentaje de tu sueldo se va en el primer alquiler + expensas (RCI)."
                  color="emerald"
                />
                {salary > 0 && totals.cuotaTotalInicial > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 italic font-medium leading-tight px-1">
                      ⚠️ Importante: Este cálculo es del primer mes. Si tu sueldo sube menos que el alquiler, el impacto sobre tu bolsillo será mayor con el tiempo.
                    </p>
                    <div className={`p-4 rounded-2xl text-[12px] font-semibold flex items-center justify-between border-2 transition-colors ${
                      (totals.cuotaTotalInicial / salary) > 0.3 
                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                    }`}>
                      <span className="flex items-center gap-2"><Activity className="w-4 h-4"/> Afectación (RCI)</span>
                      <span className="text-lg leading-none">{((totals.cuotaTotalInicial / salary) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Yield abajo de los inputs en modo propietario */}
            {rentRole === 'owner' && propertyValueUsd > 0 && rentAmount > 0 && (
              <div className="mt-4">
                <div className={`p-4 rounded-2xl text-[12px] font-semibold flex items-center justify-between border-2 transition-colors ${
                  yieldColor === 'rose' 
                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
                    : yieldColor === 'orange'
                    ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    : yieldColor === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                }`}>
                  <span className="flex items-center gap-2">
                    {React.createElement(yieldIcon, { className:"w-4 h-4" })}
                    Rentabilidad Anual
                  </span>
                  <span className="text-lg leading-none">{grossYield.toFixed(1)}%</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-tight px-1 mt-2">
                  Rentabilidad bruta anual. Solo cuenta el alquiler en dólares (oficial de hoy), sin gastos extras como impuestos o mantenimiento. 
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* --- COLUMNA DERECHA: RESULTADOS ALQUILERES --- */}
      <div ref={resultsRef} className="space-y-4 min-w-0">
        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap gap-3 w-full">
          <SummaryCard title={rentType === 'new' ? (rentRole === 'owner' ?"Primer Ingreso" :"Primer Pago") :"Alquiler Actual"} value={moneyCompact(totals.alquilerInicial)} icon={Wallet} colorClass="slate" sticky={true} tooltip="Monto base del alquiler para el primer mes de la proyección." />
          <SummaryCard title="Expensas" value={moneyCompact(totals.totalExpensas)} icon={TrendingUp} colorClass="orange" tooltip="Proyección de todas las expensas sumadas a lo largo de la simulación." />
          <SummaryCard title={rentRole === 'owner' ?"Ingreso Est." :" Total"} value={moneyCompact(totals.totalContrato)} icon={CheckCircle2} colorClass="slate" tooltip="La suma de todos los alquileres y expensas a pagar (o cobrar, si sos dueño) mes a mes hasta el final del contrato." />
          
          {rentRole === 'owner' ? (
             <SummaryCard 
                title="PRI" 
                value={propertyValueUsd > 0 && pri > 0 ? `${pri.toFixed(1)} años` :"---"} 
                icon={Clock} 
                colorClass={pri > 0 && pri <= 15 ? 'emerald' : pri <= 25 ? 'amber' : 'rose'} 
                tooltip="Período de Recuperación de la Inversión (PRI). Años estimados para recuperar la inversión inicial solo con el ingreso del alquiler, sin expensas ni gastos extra." 
             />
          ) : (
             <SummaryCard title="Costo Infl." value={totals.alquilerInicial > 0 ? `${(totals.totalContrato / (totals.alquilerInicial * durationMonths)).toFixed(1).replace('.', ',')}x` :"---"} icon={Activity} colorClass="slate" tooltip="Impacto de la inflación sobre tu gasto total. Por ejemplo: 1.3x significa que por la inflación terminás pagando un 30% más de lo que pagarías si el alquiler nunca aumentara." />
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm relative z-40 text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
             <div className="flex items-center gap-3">
               <h3 className="font-semibold text-lg md:text-xl tracking-tight dark:text-white leading-none">Proyección de pagos del alquiler</h3>
               <button onClick={() => setIsFullscreen(true)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl transition-all" title="Ver en Pantalla Completa" aria-label="Ver en pantalla completa"><Maximize2 className="w-4 h-4" /></button>
             </div>
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700  overflow-x-auto max-w-full no-scrollbar">
              {['1y', '2y', '3y', 'all'].map(t => (
                <button key={t} onClick={()=>setTimeframe(t)} className={`px-5 py-1.5 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${timeframe === t ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
                  {t === 'all' ? 'Todo' : t.replace('y', ' año' + (parseInt(t) > 1 ? 's' : ''))}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[200px] md:h-[420px] w-full"><CompositionChart data={filteredData} dateMode={dateMode} showRemMarker={inflationMode === 'rem'} isRent={true} /></div>
        </div>

        {/* TABLA DE ALQUILERES */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden text-left text-[13px]">
          <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold text-slate-800 dark:text-white flex items-center gap-2 leading-none"><FileText className="w-4 h-4 text-emerald-500"/> Tabla de pagos mensuales</span>
              <button onClick={() => { if(schedule.length > 0) setIsTableFullscreen(true); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl transition-all" title="Ver tabla en pantalla completa" aria-label="Ver tabla en pantalla completa"><Maximize2 className="w-4 h-4" /></button>
            </div>
            
            <div className="flex w-full lg:w-auto gap-2">
              <button onClick={() => { if(schedule.length > 0) handleExportClick('excel'); }} className="flex-1 lg:flex-none px-4 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all leading-none" title="Descargar como Excel" aria-label="Descargar Excel">
                 <FileSpreadsheet className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">EXCEL</span>
              </button>
              <button onClick={() => { if(schedule.length > 0) handleExportClick('csv'); }} className="flex-1 lg:flex-none px-4 py-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white font-semibold rounded-xl transition-all leading-none">
                 <Download className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">CSV</span>
              </button>
              <button onClick={() => { if(schedule.length > 0) handleExportClick('pdf'); }} className="flex-[2] lg:flex-none px-4 py-4 bg-indigo-600 text-white font-semibold rounded-xl transition-all leading-none whitespace-nowrap">
                 <FileText className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">PDF</span> 
              </button>
              <button onClick={copyToWhatsApp} className={`flex-none px-4 py-4 ${copiedWP ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-emerald-500'} font-semibold rounded-xl transition-all`} title="Copiar resumen para WhatsApp" aria-label="Copiar resumen para WhatsApp">
                 {copiedWP ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              </button>
              <button onClick={() => copyShareUrl(getShareParams(), setCopiedShare)} className={`flex-none px-4 py-4 ${copiedShare ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-emerald-500'} font-semibold rounded-xl transition-all`} title="Copiar link de simulación" aria-label="Copiar link para compartir">
                 {copiedShare ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="max-h-[400px] md:max-h-[850px] overflow-auto w-full no-scrollbar">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-left border-collapse min-w-[700px] md:min-w-[900px]">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 text-slate-400 font-semibold text-[12px] border-b dark:border-slate-800 z-10 shadow-sm leading-none">
                  <tr><th className="p-4 text-center">Periodo</th><th className="p-4 text-center">Inflación</th><th className="p-4 text-center">Total Mes</th><th className="p-4 text-center">Alquiler</th><th className="p-4 text-center">Expensas</th></tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800 text-center">
                  {schedule.map((d) => (
                    <tr key={d.mes} className="transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{d.label}</td>
                      <td className="p-4"><span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${d.source === 'IPC' ? 'bg-emerald-600 text-white' : d.source === 'REM' ? 'bg-indigo-600 text-white' : 'bg-slate-500 text-white'}`}>{d.source}</span></td>
                      <td className="p-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{money(d.cuotaTotal)}</td>
                      <td className="p-4 text-emerald-600 font-bold whitespace-nowrap">{money(d.principal)}</td>
                      <td className="p-4 text-orange-600 font-bold whitespace-nowrap">{money(d.interes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

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