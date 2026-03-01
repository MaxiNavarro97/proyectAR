import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactGA from "react-ga4"; 
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import { 
  Calculator, DollarSign,
  TrendingUp, Globe, Home, ArrowRightLeft,
  Landmark, FileText, Zap, Settings2, 
  CalendarDays, AlertTriangle, Scale, Activity, 
  Github, Clock, Wallet, CheckCircle2,
  Download, Sun, Moon, ExternalLink, ShieldAlert,
  HelpCircle, Rocket, X, Sparkles, Coffee, HeartHandshake,
  FileSpreadsheet, Flag, Handshake, RotateCcw, MessageCircle, Check, Flame, Maximize2, Mail, Smartphone
} from 'lucide-react';

// --- CONSTANTES GLOBALES ---
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const APP_VERSION = "1.0.0";
const CURRENT_YEAR = new Date().getFullYear();

Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf'
});

const money = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

const formatDateTime = (dateStr) => {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' HS';
};

// --- TOOLTIP COMPONENT (mobile-friendly, click to toggle, viewport-safe) ---
function Tooltip({ children, iconClass = "w-3.5 h-3.5 text-slate-400", color = "indigo" }) {
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
      <div ref={tipRef} className={`absolute left-0 bottom-full mb-2 w-[min(22rem,calc(100vw-2rem))] p-4 bg-slate-900/95 backdrop-blur-md text-[12px] text-slate-300 font-medium rounded-2xl shadow-2xl z-[200] leading-relaxed border border-white/10 normal-case tracking-normal text-left whitespace-normal break-words transition-opacity duration-100 pointer-events-none opacity-0 ${open ? '!opacity-100 !pointer-events-auto' : ''}`} style={{left: 0}}>
        <button onClick={() => { setOpen(false); touchedRef.current = false; }} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors p-1 md:hidden" aria-label="Cerrar"><X className="w-3.5 h-3.5" /></button>
        {children}
      </div>
    </div>
  );
}

// --- ESTILOS PDF ---
// Borde compartido por columnas de tabla PDF
const PDF_BORDER = { borderStyle: "solid", borderColor: '#e2e8f0', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 };

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Roboto', backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  brandTitle: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },
  brandSub: { fontSize: 8, color: '#64748b', letterSpacing: 1 },
  reportTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 10, marginBottom: 5, textTransform: 'uppercase' },
  disclaimerBox: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 4, marginBottom: 15 },
  disclaimerText: { fontSize: 7, color: '#475569', textAlign: 'center' },
  table: { display: "flex", flexDirection: "column", width: "100%", borderStyle: "solid", borderColor: '#e2e8f0', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableColHeader: { ...PDF_BORDER, width: "14.28%", borderBottomColor: '#4f46e5', backgroundColor: '#eef2ff' },
  tableCol: { ...PDF_BORDER, width: "14.28%" },
  tableCellHeader: { margin: 5, fontSize: 8, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', textAlign: 'center' },
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
          <View style={{ flex: 1, backgroundColor: '#eef2ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#4f46e5', fontWeight: 'bold' }}>CUOTA INICIAL</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.cuotaInicial)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#fff7ed', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#ea580c', fontWeight: 'bold' }}>TOTAL INTERESES</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalIntereses)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#f0f9ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#0284c7', fontWeight: 'bold' }}>PAGO TOTAL EST.</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalPagadoFinal)}</Text></View>
      </View>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRow}>
          {["Periodo", "Origen Tasa", "Cuota Total", "Interés", "Capital", "Saldo"].map(h => (
            <View style={{...pdfStyles.tableColHeader, width: "16.66%"}} key={h}><Text style={pdfStyles.tableCellHeader}>{h}</Text></View>
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
          <View style={{ flex: 1, backgroundColor: '#eef2ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#4f46e5', fontWeight: 'bold' }}>{role === 'owner' ? 'INGRESO INICIAL' : 'ALQUILER INICIAL'}</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.alquilerInicial)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#fff7ed', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#ea580c', fontWeight: 'bold' }}>TOTAL EXPENSAS EST.</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalExpensas)}</Text></View>
          <View style={{ flex: 1, backgroundColor: '#f0f9ff', padding: 8, borderRadius: 4 }}><Text style={{ fontSize: 8, color: '#0284c7', fontWeight: 'bold' }}>{role === 'owner' ? 'INGRESO BRUTO EST.' : 'COSTO TOTAL CONTRATO'}</Text><Text style={{ fontSize: 12, fontWeight: 'bold' }}>{money(summary.totalContrato)}</Text></View>
      </View>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRow}>
          {["Periodo", "Origen Info", "Total Mes", "Alquiler", "Expensas"].map(h => (
            <View style={{...pdfStyles.tableColHeader, width: "20%"}} key={h}><Text style={pdfStyles.tableCellHeader}>{h}</Text></View>
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
  const { landscape, setLandscape, isMobilePortrait, contentStyle } = useFullscreenOrientation(isOpen);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 overflow-hidden animate-in fade-in duration-300">
      <div style={contentStyle} className="flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 shrink-0">
          <h3 className="text-white font-black text-base md:text-2xl uppercase tracking-tighter truncate mr-3">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {isMobilePortrait && (
              <button onClick={() => setLandscape(l => !l)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90" title={landscape ? "Cambiar a vertical" : "Cambiar a horizontal"}>
                <Smartphone className="w-4 h-4" style={{ transition: `transform 0.4s ${EASE}`, transform: landscape ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 min-h-0 px-5 pb-5 flex items-center justify-center overflow-hidden">
          <div style={{ width: '100%', aspectRatio: '1000/320', maxHeight: '100%' }}>
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
    <div className="fixed inset-0 z-[150] bg-slate-950 overflow-hidden animate-in fade-in duration-300">
      <div style={contentStyle} className="flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 shrink-0 border-b border-white/10">
          <h3 className="text-white font-black text-base md:text-xl uppercase tracking-tighter truncate mr-3">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {isMobilePortrait && (
              <button onClick={() => setLandscape(l => !l)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90" title={landscape ? "Cambiar a vertical" : "Cambiar a horizontal"}>
                <Smartphone className="w-4 h-4" style={{ transition: `transform 0.4s ${EASE}`, transform: landscape ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto no-scrollbar p-4">
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
      let bg = "bg-indigo-600 hover:bg-indigo-700";
      if (exportType === 'excel') { icon = <FileSpreadsheet className="w-4 h-4"/>; bg = "bg-emerald-600 hover:bg-emerald-700"; }
      return (
        <button onClick={handleStandardDownload} disabled={downloading} className={`w-full py-3.5 ${bg} text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2`}>
            {icon} {downloading ? 'Generando...' : label}
        </button>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/20 shadow-2xl w-full max-w-md overflow-hidden relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 dark:from-indigo-950/30 to-transparent -z-10"></div>
           <HeartHandshake className="w-12 h-12 text-indigo-500 mx-auto mb-4 drop-shadow-sm animate-bounce-slow" />
           <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-800 dark:text-white mb-2 tracking-tight leading-none">¡Tu reporte está listo!</h2>
           <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed px-4">
             Esta herramienta es 100% gratuita y la desarrollamos a pulmón para ayudarte a tomar mejores decisiones financieras. Si te aportó algún valor, considerá hacer una colaboración que nos ayuda enormemente a pagar los servidores y seguir mejorando la aplicación.
           </p>
           
           <div className="flex flex-col gap-3 mb-6">
              <a href="https://cafecito.app/proyectar" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#00cba9] hover:bg-[#00b899] text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <Coffee className="w-4 h-4"/> Invitar un Cafecito
              </a>
              <a href="https://link.mercadopago.com.ar/proyectarapp" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#009ee3] hover:bg-[#008ed0] text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <Handshake className="w-4 h-4"/> Aportar por Mercado Pago
              </a>
           </div>

           <div className="relative py-3">
             <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
             <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">O continuar a la descarga</span></div>
           </div>
           
           <div className="mt-2">{getButtonContent()}</div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 dark:text-white rounded-full backdrop-blur-md transition-all"><X className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

function WelcomeModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/20 shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-300">
        <div className="h-32 bg-indigo-600 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-2xl opacity-50"></div>
            <div className="absolute top-10 left-10 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            <Rocket className="w-12 h-12 text-white relative z-10 drop-shadow-lg" />
        </div>
        <div className="p-8 text-left">
           <div className="flex items-center gap-2 mb-2">
             <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">Novedades</span>
             <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white">Version {APP_VERSION}</h2>
           </div>
           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
             Seguimos mejorando ProyectAR para que tengas la mejor experiencia de análisis financiero:
           </p>
           <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3"><div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0"><Maximize2 className="w-4 h-4"/></div><div><h4 className="text-xs font-black uppercase dark:text-white">Modo Cine</h4><p className="text-[10px] text-slate-400">Ahora podés expandir los gráficos a pantalla completa para un análisis detallado.</p></div></div>
              <div className="flex items-start gap-3"><div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0"><ShieldAlert className="w-4 h-4"/></div><div><h4 className="text-xs font-black uppercase dark:text-white">Notas de Riesgo</h4><p className="text-[10px] text-slate-400">Sumamos advertencias sobre la afectación de ingresos vs inflación.</p></div></div>
           </div>
           <button onClick={onClose} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group">
             <span>¡A simular!</span> <Sparkles className="w-3 h-3 text-indigo-300 group-hover:text-white transition-colors"/>
           </button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"><X className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// --- COMPONENTE DE BOTON DE NAVEGACIÓN ---
const NAV_THEMES = {
  indigo: 'text-indigo-600 dark:text-sky-400 bg-white dark:bg-slate-800 shadow-md border-indigo-100 dark:border-sky-500/30 scale-105',
  emerald: 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-md border-emerald-100 dark:border-emerald-500/30 scale-105',
  amber: 'text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800 shadow-md border-amber-100 dark:border-amber-500/30 scale-105',
};

const NavBtn = React.memo(function NavBtn({ to, currentPath, icon, label, color }) {
  const active = currentPath === to || (to === '/' && currentPath === '');
  return (
    <Link to={to} className={`px-2.5 sm:px-4 md:px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] md:text-xs font-black flex items-center gap-1.5 md:gap-2 transition-all border border-transparent active:scale-95 ${active ? NAV_THEMES[color] : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
      {React.cloneElement(icon, { className: "w-3.5 h-3.5 md:w-5 md:h-5" })} {label}
    </Link>
  );
});

// --- MENU DE NAVEGACIÓN ---
function NavigationMenu() {
  const location = useLocation();
  return (
    <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border dark:border-slate-700 shadow-inner overflow-x-auto no-scrollbar max-w-full">
      <NavBtn currentPath={location.pathname} to="/calculadora-creditos-uva" icon={<Home />} label="CRÉDITOS" color="indigo"/>
      <NavBtn currentPath={location.pathname} to="/calculadora-alquileres" icon={<ArrowRightLeft />} label="ALQUILERES" color="emerald"/>
      <NavBtn currentPath={location.pathname} to="/faq" icon={<HelpCircle />} label="FAQ" color="amber"/>
    </div>
  );
}

function CurrencyInput({ value, onChange, label, sublabel, usdEquivalent }) {
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
        <input 
          type="text" 
          inputMode="numeric"
          value={formatted} 
          onChange={handleChange} 
          onFocus={(e) => { setIsFocused(true); e.target.select(); }} 
          onBlur={() => setIsFocused(false)} 
          placeholder="$ 0" 
          className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-mono text-lg md:text-xl font-bold outline-none border-2 border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-400/30 shadow-inner transition-all dark:text-white" 
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 dark:text-slate-400"><DollarSign className="w-5 h-5" /></div>
      </div>
      {usdEquivalent > 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 px-1 font-bold">Aprox. USD {new Intl.NumberFormat('es-AR').format(Math.round(usdEquivalent))} <span className="text-[8px] opacity-70">(Oficial)</span></p>}
      {sublabel && <p className="text-[10px] text-slate-400 mt-1 px-1 leading-relaxed">{sublabel}</p>}
    </div>
  );
}

// Fuera del componente: no cambia nunca, no tiene sentido recrearlo en cada render
const SUMMARY_COLOR_MAP = {
  indigo: 'bg-indigo-500/10 text-indigo-500',
  orange: 'bg-orange-500/10 text-orange-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  rose: 'bg-rose-500/10 text-rose-500',
  sky: 'bg-sky-500/10 text-sky-500',
  amber: 'bg-amber-500/10 text-amber-500',
  slate: 'bg-slate-500/10 text-slate-500',
};

const SummaryCard = React.memo(function SummaryCard({ title, value, icon: Icon, colorClass, sticky, tooltip }) {
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
    <div className={`bg-white dark:bg-slate-900 p-3 rounded-2xl border dark:border-slate-800 shadow-sm flex items-start gap-2.5 transition-all min-w-0 flex-1 relative hover:-translate-y-0.5 ${sticky ? 'sticky top-[85px] md:top-[128px] z-30 hover:z-[60] shadow-xl border-indigo-500/30 dark:border-sky-500/30' : 'hover:shadow-md hover:z-[60]'}`}>
      <div className={`p-2 rounded-xl shrink-0 ${SUMMARY_COLOR_MAP[colorClass] || 'bg-slate-500/10 text-slate-500'}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 text-left flex-1 relative"> 
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{title}</p>
          {tooltip && (
            <Tooltip iconClass="w-3 h-3 text-slate-300">
              {tooltip}
            </Tooltip>
          )}
        </div>
        <p className={`text-sm md:text-base font-black font-mono tracking-tight leading-none truncate transition-opacity duration-200 ${animating ? 'opacity-30' : 'opacity-100'} ${colorClass === 'rose' && title.includes('Rentabilidad') ? 'text-rose-500' : 'dark:text-white'}`}>{displayValue}</p>
      </div>
    </div>
  );
});

const BankCard = React.memo(function BankCard({ name, url, logoUrl }) {
  const [imgError, setImgError] = useState(false);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden aspect-square">
      <div className="relative z-10 h-10 md:h-12 w-full flex items-center justify-center bg-white">
        {!imgError ? (
          <img src={logoUrl} alt={name} onError={() => setImgError(true)} className="max-h-full max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
        ) : (<Landmark className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />)}
      </div>
    </a>
  );
});

// --- VISUALIZACIÓN DE DATOS ---
function TooltipContent({ data, isRent }) {
  return (
    <>
      <div className="flex items-center justify-between mb-2.5 border-b border-white/10 pb-2.5">
        <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest">{data.label}</p>
        <span className={`text-[9px] px-2 py-0.5 rounded font-black ${data.source === 'IPC' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : data.source === 'REM' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/10 text-slate-300 border border-white/10'}`}>{data.source}</span>
      </div>
      <div className="space-y-2 text-[13px] mb-3 border-b border-white/10 pb-3">
        <div className="flex justify-between items-center gap-4"><span className="font-bold text-slate-400 uppercase tracking-wide">Total:</span><span className="font-black text-white">{money(data.cuotaTotal)}</span></div>
        <div className="flex justify-between items-center gap-4 text-indigo-400 font-bold uppercase tracking-wide"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="uppercase">{isRent ? 'Alquiler' : 'Capital'}:</span></div><span>{money(data.principal)}</span></div>
        <div className="flex justify-between items-center gap-4 text-orange-400 font-bold uppercase tracking-wide"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400" /><span className="uppercase">{isRent ? 'Expensas' : 'Interés'}:</span></div><span>{money(data.interes)}</span></div>
      </div>
      <div className="space-y-1.5 text-[12px]">
        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase tracking-wide">Var. Mensual:</span><span className={`font-black ${data.varMensual > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{data.varMensual > 0 ? '+' : ''}{data.varMensual.toFixed(1)}%</span></div>
        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase tracking-wide">Acumulado YTD:</span><span className={`font-black ${data.varYTD > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{data.varYTD > 0 ? '+' : ''}{data.varYTD.toFixed(1)}%</span></div>
        <div className="flex justify-between items-center"><span className="text-slate-400 font-bold uppercase tracking-wide">Var. Total:</span><span className={`font-black ${data.varTotal > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{data.varTotal > 0 ? '+' : ''}{data.varTotal.toFixed(1)}%</span></div>
      </div>
    </>
  );
}

function CompositionChart({ data, dateMode, showRemMarker, isRent = false }) {
  const [hovered, setHovered] = useState(null);
  const touchTimer = useRef(null);

  const clearTouch = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = null;
  };

  const handleTouchStart = (d) => (e) => {
    e.preventDefault();
    clearTouch();
    setHovered({ data: d, touch: true });
  };

  const handleTouchEnd = () => {
    clearTouch();
    touchTimer.current = setTimeout(() => setHovered(null), 2500);
  };

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 gap-3">
        <Calculator className="w-10 h-10 text-slate-300 dark:text-slate-700" />
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Completá el monto y el plazo para ver tu proyección</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.cuotaTotal)) * 1.15;
  const w = 1000, h = 320, padL = 100, padB = 55, padT = 15;
  const step = Math.max(1, Math.ceil(data.length / (isRent ? 40 : 60)));
  const sampled = data.filter((_, i) => i % step === 0);

  return (
    <div className="relative w-full h-full overflow-hidden">
      
      {/* TOOLTIP DESKTOP: sigue al mouse con posición fixed */}
      {hovered && !hovered.touch && (
        <div
          className="fixed z-[200] pointer-events-none bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/10 p-5 w-[240px]"
          style={{
            left: `${Math.max(8, Math.min(window.innerWidth - 256, hovered.cx - 120))}px`,
            top: hovered.cy > window.innerHeight * 0.55
              ? `${Math.max(8, hovered.cy - 310)}px`
              : `${Math.min(window.innerHeight - 310, hovered.cy + 12)}px`,
          }}
        >
          <TooltipContent data={hovered.data} isRent={isRent} />
        </div>
      )}

      {/* TOOLTIP MOBILE: panel fijo en la parte inferior, no depende de coordenadas */}
      {hovered && hovered.touch && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[200] bg-slate-900/98 backdrop-blur-md shadow-2xl rounded-2xl border border-white/10 p-4 mx-1 mb-1"
          onClick={() => setHovered(null)}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <TooltipContent data={hovered.data} isRent={isRent} />
            </div>
            <button className="shrink-0 p-1 text-slate-500 hover:text-white" onClick={() => setHovered(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full overflow-visible select-none"
        preserveAspectRatio="none"
        onMouseLeave={() => !hovered?.touch && setHovered(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <g key={p}>
            <line x1={padL} y1={h - padB - (h - padB - padT) * p} x2={w} y2={h - padB - (h - padB - padT) * p} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4"/>
            <text x={padL - 15} y={h - padB - (h - padB - padT) * p + 5} textAnchor="end" className="text-[12px] fill-slate-400 font-mono font-bold">$ {new Intl.NumberFormat('es-AR').format(Math.round((maxVal * p) / 1000))} mil</text>
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
              onMouseEnter={(e) => setHovered({ cx: e.clientX, cy: e.clientY, data: d, touch: false })}
              onMouseMove={(e) => setHovered(prev => prev && !prev.touch ? { ...prev, cx: e.clientX, cy: e.clientY } : prev)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={handleTouchStart(d)}
              onTouchEnd={handleTouchEnd}
              className="group cursor-pointer"
            >
              <rect x={x} y={h - padB - hPri} width={barW} height={hPri} fill={isRent ? "#10b981" : "#6366f1"} rx="1.5" className="transition-all group-hover:brightness-110"/>
              <rect x={x} y={h - padB - hPri - hInt} width={barW} height={hInt} fill={isRent ? "#f59e0b" : "#fb923c"} rx="1.5" className="transition-all group-hover:brightness-110"/>
              {(i % Math.ceil(sampled.length/10) === 0) && (
                <text x={x + barW/2} y={h - padB + 10} textAnchor="end" className="text-[11px] fill-slate-500 font-black uppercase tracking-tighter md:hidden" transform={`rotate(-90, ${x + barW/2}, ${h - padB + 10})`}>
                  {dateMode === 'calendar' ? d.shortDate : `M${d.mes}`}
                </text>
              )}
              {(i % Math.ceil(sampled.length/10) === 0) && (
                <text x={x + barW/2} y={h - padB + 22} textAnchor="middle" className="text-[12px] fill-slate-500 font-black uppercase tracking-tighter hidden md:block">{dateMode === 'calendar' ? d.shortDate : `M${d.mes}`}</text>
              )}
            </g>
          );
        })}
        {/* Línea divisoria IPC → REM */}
        {showRemMarker && (() => {
          const transIdx = sampled.findIndex(d => d.source === 'REM' || d.source === 'INERCIA');
          if (transIdx > 0) {
            const barAreaW = (w - padL) / sampled.length;
            const tx = padL + transIdx * barAreaW - barAreaW * 0.1;
            return (
              <g>
                <line x1={tx} y1={padT} x2={tx} y2={h - padB} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"/>
                <text x={tx + 6} y={padT + 12} className="text-[9px] fill-indigo-400 font-bold" opacity="0.7">Proyectado →</text>
              </g>
            );
          }
          return null;
        })()}
      </svg>
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
  const [remFocused, setRemFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

  const [amount, setAmount] = useState(0); 
  const [salary, setSalary] = useState(0); 
  const [years, setYears] = useState(0);
  const [rate, setRate] = useState("0");
  const [inflation, setInflation] = useState("0");
  const [system, setSystem] = useState('french'); 
  const [inflationMode, setInflationMode] = useState('rem'); 
  const [remStabilizedMode, setRemStabilizedMode] = useState('auto');
  const [remStabilizedValue, setRemStabilizedValue] = useState("0");
  const [timeframe, setTimeframe] = useState(() => {
    try { return localStorage.getItem('proyectar_tf_mortgage') || 'all'; } catch { return 'all'; }
  });
  const [dateMode, setDateMode] = useState('calendar'); 
  const [startMonth, setStartMonth] = useState(hoy.getMonth());
  const [startYear, setStartYear] = useState(hoy.getFullYear());

  const [showDonationModal, setShowDonationModal] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [copiedWP, setCopiedWP] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [showGastosBanner, setShowGastosBanner] = useState(true);

  const [yearsFocused, setYearsFocused] = useState(false);
  const [rateFocused, setRateFocused] = useState(false);
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
        if (decoded.s) setSystem(decoded.s);
        if (decoded.im) setInflationMode(decoded.im);
        if (decoded.inf) setInflation(String(decoded.inf));
        if (decoded.lt) setLoanType(decoded.lt);
        if (decoded.sm !== undefined) setStartMonth(decoded.sm);
        if (decoded.sy) setStartYear(decoded.sy);
        // Limpiar la URL después de cargar
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const getShareParams = () => ({
    t: 'mortgage', a: amount, y: years, r: rate, s: system,
    im: inflationMode, inf: inflation, lt: loanType, sm: startMonth, sy: startYear
  });

  const handleReset = () => {
      setAmount(0); setSalary(0); setYears(0); setRate("0"); setInflation("0"); setRemInstallments(0);
  };

  useEffect(() => { try { localStorage.setItem('proyectar_tf_mortgage', timeframe); } catch { /* ignorar */ } }, [timeframe]);

  useEffect(() => {
    if (loanType === 'ongoing') {
      setDateMode('calendar');
      setStartMonth(hoy.getMonth());
      setStartYear(hoy.getFullYear());
    }
  }, [loanType]);

  useEffect(() => {
    if (dateMode === 'generic') { setLoanType('new'); setInflationMode('manual'); }
  }, [dateMode]);

  useEffect(() => {
    if (remData && remData.length > 0) {
      const lastValue = remData[remData.length - 1].valor;
      setRemStabilizedValue(String(lastValue).replace('.', ','));
    }
  }, [remData]);

  const schedule = useMemo(() => {
    if (!amount || amount === 0) return [];
    
    const totalMonths = loanType === 'new' ? Number(years) * 12 : Number(remInstallments);
    if (isNaN(totalMonths) || totalMonths <= 0) return [];
    
    const currentUva = uvaValue || 1;
    const rateNum = (Number(String(rate).replace(',', '.')) || 0) / 100;
    const inflationNum = Number(String(inflation).replace(',', '.')) || 0;
    const monthlyRate = rateNum / 12;
    const manualMonthlyInf = Math.pow(1 + inflationNum / 100, 1 / 12) - 1;
    let remStabMon = (remStabilizedMode === 'auto' && remData && remData.length > 0) 
      ? remData[remData.length - 1].valor / 100 
      : (Number(String(remStabilizedValue).replace(',', '.')) || 0) / 100;
    
    let capitalUvaInicial;
    if (loanType === 'new') {
      capitalUvaInicial = amount / currentUva;
    } else {
      capitalUvaInicial = balanceCurrency === 'ars' ? (amount / currentUva) : amount;
    }

    // Map unificado de inflación (IPC pasado + REM futuro ya mergeados)
    const inflacionMap = (dateMode === 'calendar' && inflationMode === 'rem' && remData && remData.length > 0)
      ? new Map(remData.map(d => [d.mes + '-' + d.año, d]))
      : new Map();

    let balanceUva = capitalUvaInicial;
    const data = [];
    let projUva = currentUva;
    let currentDate = new Date(startYear, startMonth, 1);
    const constantAmortizationUva = capitalUvaInicial / totalMonths;
    let halfWayTriggered = false;

    let lastMonthVal = 0;
    let lastDecVal = 0;
    let firstVal = 0;

    for (let i = 1; i <= totalMonths; i++) {
      if (balanceUva <= 0) break;
      let interestUva = balanceUva * monthlyRate;
      let principalUva;
      if (system === 'french') {
        const pmtUva = monthlyRate > 0 ? (balanceUva * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -(totalMonths - i + 1))) : constantAmortizationUva;
        principalUva = pmtUva - interestUva;
      } else { principalUva = constantAmortizationUva; }
      
      if (principalUva > balanceUva) { principalUva = balanceUva; balanceUva = 0; } else { balanceUva -= principalUva; }
      
      const inflMatch = inflacionMap.get((currentDate.getMonth() + 1) + '-' + currentDate.getFullYear()) ?? null;
      let sourceName = 'MANUAL';
      if (inflationMode === 'rem') {
        if (inflMatch) {
          sourceName = inflMatch.origen === 'IPC' ? 'IPC' : 'REM';
        } else {
          sourceName = 'INERCIA';
        }
      }

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
        label: dateMode === 'calendar' ? `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `Mes ${i}`,
        shortDate: `${MESES[currentDate.getMonth()]} ${String(currentDate.getFullYear()).slice(-2)}`,
        interes: interestUva * projUva, 
        principal: principalUva * projUva, 
        cuotaTotal: cuotaTotal, 
        saldo: balanceUva * projUva, 
        source: sourceName,
        isHalfWay: isHalfWay,
        varMensual: varMensual || 0,
        varYTD: varYTD || 0,
        varTotal: varTotal || 0
      });

      lastMonthVal = cuotaTotal;
      if (currentDate.getMonth() === 11) { lastDecVal = cuotaTotal; }

      let currentMonthInf;
      if (dateMode === 'generic' || inflationMode !== 'rem') {
        currentMonthInf = manualMonthlyInf;
      } else {
        currentMonthInf = inflMatch ? inflMatch.valor / 100 : remStabMon;
      }
      projUva *= (1 + currentMonthInf);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return data;
  }, [amount, years, rate, system, inflation, inflationMode, remStabilizedMode, remStabilizedValue, uvaValue, dateMode, startMonth, startYear, remData, loanType, balanceCurrency, remInstallments]);

  const totals = useMemo(() => ({
      totalPagadoFinal: schedule.reduce((acc, curr) => acc + curr.cuotaTotal, 0),
      totalIntereses: schedule.reduce((acc, curr) => acc + curr.interes, 0),
      cuotaInicial: schedule[0]?.cuotaTotal || 0,
      montoOriginalPesos: loanType === 'new' ? amount : (balanceCurrency === 'ars' ? amount : amount * uvaValue)
  }), [schedule, amount, loanType, balanceCurrency, uvaValue]);

  const filteredData = useMemo(() => (timeframe === 'all' ? schedule : schedule.slice(0, Math.min(schedule.length, parseInt(timeframe) * 12))), [schedule, timeframe]);

  const resultsRef = useRef(null);
  const prevScheduleLen = useRef(0);
  const rateNum = Number(String(rate).replace(',', '.')) || 0;
  useEffect(() => {
    if (schedule.length > 0 && prevScheduleLen.current === 0 && rateNum > 0 && resultsRef.current && window.innerWidth < 1024) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevScheduleLen.current = schedule.length;
  }, [schedule.length, rateNum]);

  const exportToCSV = () => {
    if (schedule.length === 0) return;
    const headers = ["Mes", "Cuota Total", "Interes", "Capital", "Saldo Pendiente", "Origen"];
    const rows = schedule.map(d => [
      d.label, Math.round(d.cuotaTotal), Math.round(d.interes),
      Math.round(d.principal), Math.round(d.saldo), d.source
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(";") + "\n" + rows.map(e => e.join(";")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ProyectAR_Hipotecas_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (schedule.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(schedule.map(d => ({
      "Periodo": d.label,
      "Cuota Total": Math.round(d.cuotaTotal),
      "Interés": Math.round(d.interes),
      "Capital": Math.round(d.principal),
      "Saldo Pendiente": Math.round(d.saldo),
      "Origen": d.source
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proyeccion");
    XLSX.writeFile(wb, `ProyectAR_Hipotecas_${new Date().getTime()}.xlsx`);
  };

  const handleExportClick = (type) => {
      if (schedule.length === 0) return;
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full">
      
      {showDonationModal && (
        <DonationModal 
          onClose={() => setShowDonationModal(false)}
          exportType={exportType}
          onDownload={() => {
              if(exportType === 'excel') exportToExcel();
              if(exportType === 'csv') exportToCSV();
          }}
          downloadLink={
            <PDFDownloadLink document={<MortgagePDFDocument data={schedule} summary={totals} />} fileName={`ProyectAR_Reporte_${new Date().getTime()}.pdf`}>
              {({ loading }) => (
                <button disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2">
                   <FileText className="w-4 h-4"/> {loading ? 'Generando Archivo...' : 'Descargar PDF Ahora'}
                </button>
              )}
            </PDFDownloadLink>
          }
        />
      )}

      <ChartModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} title="Proyección de pagos del crédito">
          <CompositionChart data={filteredData} dateMode={dateMode} showRemMarker={inflationMode === 'rem'} />
      </ChartModal>

      <TableModal isOpen={isTableFullscreen} onClose={() => setIsTableFullscreen(false)} title="Tabla de Amortización">
        <table className="w-full text-left border-collapse text-[11px]" style={{ minWidth: 700 }}>
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-black uppercase text-[10px] border-b border-white/10 leading-none">
            <tr><th className="p-4 text-center">Periodo</th><th className="p-4 text-center">Origen</th><th className="p-4 text-center">Cuota Total</th><th className="p-4 text-center">Interés</th><th className="p-4 text-center">Capital</th><th className="p-4 text-center">Saldo</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-center">
            {schedule.map((d) => (
              <tr key={d.mes} className={`transition-colors ${d.isHalfWay ? 'bg-sky-900/20 border-l-4 border-sky-500' : 'hover:bg-white/5'}`}>
                <td className="p-4 font-bold text-slate-200 flex items-center justify-center gap-2">
                  {d.label} {d.isHalfWay && <span title="50% del capital saldado" className="flex items-center gap-1 bg-sky-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter"><Flag className="w-2 h-2"/> 50%</span>}
                </td>
                <td className="p-4"><span className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase shadow-sm ${d.source === 'IPC' ? 'bg-emerald-600 text-white' : d.source === 'REM' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white'}`}>{d.source}</span></td>
                <td className="p-4 font-black text-white whitespace-nowrap">{money(d.cuotaTotal)}</td>
                <td className="p-4 text-orange-400 font-bold whitespace-nowrap">{money(d.interes)}</td>
                <td className="p-4 text-indigo-400 font-bold whitespace-nowrap">{money(d.principal)}</td>
                <td className="p-4 text-slate-100 font-black font-mono whitespace-nowrap">{money(d.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableModal>

      {/* --- COLUMNA IZQUIERDA: CONTROLES --- */}
      <div className="lg:col-span-3 space-y-4">
        
        {/* BLOQUE INICIO CRÉDITO (INTEGRADO) */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl shadow-xl border dark:border-slate-800 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg"><CalendarDays className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white leading-none flex items-center gap-2">
                INICIO Y TIPO
                <Tooltip iconClass="w-3.5 h-3.5 text-slate-400">
                  <p className="mb-3"><b className="text-indigo-400 font-bold">Fecha Exacta:</b> Si sabés en qué mes vas a pagar, elegí esta opción. Nos permite sincronizar tu cuota con la inflación oficial (IPC real + REM proyectado) para ese mes puntual.</p>
                  <p><b className="text-emerald-400 font-bold">Sin Fecha Fija:</b> Ideal si recién estás averiguando y querés hacer una proyección estimada. Al no haber un mes específico, usás una inflación manual.</p>
                </Tooltip>
              </h3>
            </div>
            <button onClick={handleReset} title="Limpiar todo" className="p-2 rounded-lg transition-colors text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800" aria-label="Limpiar formulario"><RotateCcw className="w-4 h-4" /></button>
          </div>
          
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button onClick={() => setDateMode('calendar')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${dateMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-sky-400' : 'text-slate-500'}`}>FECHA EXACTA</button>
            <button onClick={() => setDateMode('generic')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${dateMode === 'generic' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-sky-400' : 'text-slate-500'}`}>SIN FECHA FIJA</button>
          </div>

          {dateMode === 'calendar' && (
             <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 border border-slate-200 dark:border-slate-700">
               <button onClick={() => setLoanType('new')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${loanType === 'new' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>NUEVO</button>
               <button onClick={() => setLoanType('ongoing')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${loanType === 'ongoing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>
                 EN CURSO 
               </button>
             </div>
          )}
          
          {dateMode === 'generic' && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-3 animate-pulse mb-4">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-black uppercase tracking-tighter text-rose-600 leading-tight">Sin fecha fija, usás inflación manual y no se conecta al calendario REM.</p>
            </div>
          )}

          {dateMode === 'calendar' && (
             loanType === 'new' ? (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                  <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">
                    {[CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">
                    {MESES.map((m, i) => (
                      <option key={m} value={i} disabled={startYear === hoy.getFullYear() && i < hoy.getMonth()}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
             ) : (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center animate-in fade-in">
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Proyectando desde {MESES[hoy.getMonth()]} {hoy.getFullYear()}</span>
                </div>
             )
          )}
        </div>

         {/* BLOQUE DATOS DEL CRÉDITO */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl shadow-xl border dark:border-slate-800 space-y-4 text-left">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg"><Settings2 className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest dark:text-white leading-none">DATOS DEL CRÉDITO</h3>
            </div>
          </div>

          {loanType === 'new' ? (
            <div className="animate-in fade-in space-y-4">
              <CurrencyInput label="MONTO DEL PRÉSTAMO" value={amount} onChange={setAmount} usdEquivalent={amount / dolarOficial} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800 text-center">
                  <label className="text-[11px] font-black text-indigo-500 block mb-2 uppercase tracking-widest leading-none">PLAZO (AÑOS)</label>
                  <input type="text" inputMode="numeric" value={(yearsFocused && (years === 0 || years === '')) ? '' : years} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); setYears(num !== '' && num > 50 ? 50 : num); }} onFocus={(e) => { setYearsFocused(true); e.target.select(); }} onBlur={() => setYearsFocused(false)} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800 text-center">
                  <label className="text-[11px] font-black text-indigo-500 mb-2 uppercase tracking-widest leading-none flex items-center justify-center gap-1.5">
                    TASA (TNA %)
                    <Tooltip iconClass="w-3 h-3 text-indigo-300" color="indigo">
                        Este dato lo define cada banco. Podés averiguarlo mirando su web o simulando tu crédito ahí mismo. Al final de esta columna tenés los links a los principales bancos del país para que consultes.
                      </Tooltip>
                  </label>
                  <input type="text" inputMode="numeric" value={(rateFocused && (rate === 0 || rate === '0')) ? '' : rate} onChange={(e) => { const v = e.target.value.replace(',','.'); if(v==='' || /^\d*\.?\d*$/.test(v)) setRate(e.target.value); }} onFocus={(e) => { setRateFocused(true); e.target.select(); }} onBlur={() => setRateFocused(false)} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in space-y-4">
              <div className="group text-left">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-slate-400 transition-colors">
                    SALDO DEUDOR
                    <Tooltip iconClass="w-3.5 h-3.5 text-slate-300" color="indigo">
                        Buscá tu Saldo Deudor actual en tu Home Banking. Podés elegir ingresarlo en Pesos o en cantidad de UVAs.
                      </Tooltip>
                  </label>
                  <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg border dark:border-slate-600">
                    <button onClick={() => setBalanceCurrency('ars')} className={`px-3 py-1 text-[9px] font-black rounded ${balanceCurrency === 'ars' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>$ ARS</button>
                    <button onClick={() => setBalanceCurrency('uva')} className={`px-3 py-1 text-[9px] font-black rounded ${balanceCurrency === 'uva' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>UVA</button>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="text" inputMode="numeric"
                    value={amountFocused && amount === 0 ? '' : (balanceCurrency === 'ars' ? money(amount) : new Intl.NumberFormat('es-AR').format(amount))}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setAmount(v === '' ? 0 : Number(v)); }}
                    onFocus={(e) => { setAmountFocused(true); e.target.select(); }} onBlur={() => setAmountFocused(false)}
                    placeholder={balanceCurrency === 'ars' ? "$ 0" : "0"}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-mono text-lg md:text-xl font-bold outline-none border-2 border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-400/30 shadow-inner transition-all dark:text-white"
                  />
                  {balanceCurrency === 'uva' && <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 font-black text-xs dark:text-slate-400">UVAs</div>}
                  {balanceCurrency === 'ars' && <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 dark:text-slate-400"><DollarSign className="w-5 h-5" /></div>}
                </div>
                {balanceCurrency === 'ars' && amount > 0 && <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-2 px-1 font-bold">Equivale a {new Intl.NumberFormat('es-AR').format(Math.round(amount / uvaValue))} UVAs aprox.</p>}
                {balanceCurrency === 'uva' && amount > 0 && <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-2 px-1 font-bold">Equivale a {money(amount * uvaValue)} <span className="text-[8px] opacity-70">(A valor UVA de hoy)</span></p>}
              </div>
              
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800 text-center">
                  {/* Cambiado de <label> a <div> */}
                  <div className="text-[9px] sm:text-[11px] font-black text-indigo-500 mb-2 uppercase tracking-widest flex items-center justify-center gap-1.5 leading-none">
                    CUOTAS RESTANTES
                  </div>
                  <input type="text" inputMode="numeric" value={(remFocused && (remInstallments === 0 || remInstallments === '')) ? '' : remInstallments} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); setRemInstallments(num !== '' && num > 600 ? 600 : num); }} onFocus={(e) => { setRemFocused(true); e.target.select(); }} onBlur={() => setRemFocused(false)} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800 text-center">
                  {/* Cambiado de <label> a <div> */}
                  <div className="text-[11px] font-black text-indigo-500 mb-2 uppercase tracking-widest leading-none flex items-center justify-center gap-1.5">
                    TASA (TNA %)
                    <Tooltip iconClass="w-3 h-3 text-indigo-300" color="indigo">
                        Este dato lo define cada banco. Podés averiguarlo mirando su web o simulando tu crédito ahí mismo. Al final de esta columna tenés los links a los principales bancos del país para que consultes.
                      </Tooltip>
                  </div>
                  <input type="text" inputMode="numeric" value={(rateFocused && (rate === 0 || rate === '0')) ? '' : rate} onChange={(e) => { const v = e.target.value.replace(',','.'); if(v==='' || /^\d*\.?\d*$/.test(v)) setRate(e.target.value); }} onFocus={(e) => { setRateFocused(true); e.target.select(); }} onBlur={() => setRateFocused(false)} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 leading-none"><Scale className="w-3 h-3"/> SISTEMA DE AMORTIZACIÓN</label>
              <Tooltip iconClass="w-4 h-4 text-slate-300" color="indigo">
                  <b className="text-indigo-400">Francés:</b> Cuota total constante. Al principio pagás más intereses y poco capital. Es el más común en créditos hipotecarios UVA.<br/><br/>
                  <b className="text-amber-400">Alemán:</b> Amortización de capital constante. La cuota total empieza más alta pero baja mes a mes.
                </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSystem('french')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${system === 'french' ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-400/10' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}><span className={`text-xs font-black uppercase ${system === 'french' ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500'}`}>Francés</span></button>
              <button onClick={() => setSystem('german')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${system === 'german' ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10' : 'border-transparent bg-slate-50 dark:bg-slate-800'}`}><span className={`text-xs font-black uppercase ${system === 'german' ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500'}`}>Alemán</span></button>
            </div>
          </div>
          
          <div className="pt-4 border-t dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3"/> INFLACIÓN PROYECTADA
                <Tooltip iconClass="w-3.5 h-3.5 text-slate-300" color="indigo">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div><b className="text-indigo-400 uppercase tracking-wider">Modo REM (Oficial)</b></div>
                      <p className="mb-2">Relevamiento de Expectativas de Mercado del <span className="text-white">BCRA</span>. Expertos proyectan la inflación para el año actual y los dos siguientes. ProyectAR mapea estos datos <span className="text-indigo-300">mes a mes</span> automáticamente.</p>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/5"><p className="text-[9px] leading-snug"><span className="text-indigo-300 font-bold uppercase tracking-tighter">Inercia:</span> Para el tiempo restante sin datos oficiales, se aplica el <span className="text-white">último valor del REM</span> (Auto) o tu <span className="text-white">tasa propia</span> (Fija).</p></div>
                    <div className="h-px w-full bg-white/5 mb-3"></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><b className="text-emerald-400 uppercase tracking-wider">Modo Manual</b></div>
                      <p><span className="text-white font-bold">Control total.</span> Definí una tasa fija para todo el crédito. Ideal para simular escenarios propios.</p>
                    </div>
                  </div>
                </Tooltip>
              </label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button disabled={dateMode === 'generic'} onClick={() => setInflationMode('rem')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${inflationMode === 'rem' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'} ${dateMode === 'generic' ? 'opacity-50 cursor-not-allowed' : ''}`}>REM</button>
                <button onClick={() => setInflationMode('manual')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${inflationMode === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>MANUAL</button>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border dark:border-slate-800">
              {inflationMode === 'manual' ? (
                <div className="animate-in fade-in space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-500 uppercase leading-none">Tasa fija anual estimada</span><span className="text-[11px] font-mono font-black dark:text-white leading-none">{inflation}%</span></div>
                    <input type="range" min="0" max="100" step="0.5" value={Number(String(inflation).replace(',', '.')) || 0} onChange={(e)=>setInflation(String(e.target.value).replace('.', ','))} className="w-full accent-indigo-500" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3"><p className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 leading-none"><Zap className="w-3 h-3" /> Inercia Post-REM</p><div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl"><button onClick={() => setRemStabilizedMode('auto')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg ${remStabilizedMode === 'auto' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>AUTO</button><button onClick={() => setRemStabilizedMode('custom')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg ${remStabilizedMode === 'custom' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>FIJA</button></div></div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black dark:text-white uppercase leading-tight ">
                    {remStabilizedMode === 'auto' ? `Aplicando el último dato oficial (${(remData && remData.length > 0 ? remData[remData.length-1].valor : '---')}%) para los meses restantes.` : 
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
          
          {/* BLOQUE RCI AL FONDO */}
          <div className="pt-4 border-t dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">
            <CurrencyInput 
              label="SUELDO NETO MENSUAL (OPCIONAL)" 
              value={salary} 
              onChange={setSalary} 
              sublabel="Para calcular la afectación de tu primera cuota (RCI)." 
            />
            {salary > 0 && totals.cuotaInicial > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic font-medium leading-tight px-1">
                  Nota: Este cálculo es respecto a la cuota inicial. Si tu sueldo no se ajusta por inflación de forma recurrente, el peso de la cuota sobre tus ingresos aumentará mes a mes.
                </p>
                <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between border-2 transition-colors ${
                  (totals.cuotaInicial / salary) > 0.3 
                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                }`}>
                  <span className="flex items-center gap-2"><Activity className="w-4 h-4"/> Afectación (RCI)</span>
                  <span className="text-lg leading-none">{((totals.cuotaInicial / salary) * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BANCOS */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border dark:border-slate-800 shadow-xl space-y-4 text-left text-[11px]">
          <h4 className="font-black uppercase text-slate-800 dark:text-white flex items-center gap-2 leading-none"><Globe className="w-3 h-3 text-indigo-500" /> Webs de los principales bancos argentinos</h4>
          <div className="grid grid-cols-6 lg:grid-cols-3 gap-2">
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
      
      {/* --- COLUMNA DERECHA: RESULTADOS --- */}
      <div ref={resultsRef} className="lg:col-span-9 space-y-5 min-w-0">
        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap gap-3 w-full">
          <SummaryCard title={loanType === 'new' ? "Cuota Inicial" : "Próxima Cuota"} value={money(totals.cuotaInicial)} icon={Wallet} colorClass="indigo" sticky={true} tooltip="Monto estimado de la primera o próxima cuota a pagar, sumando capital e intereses." />
          <SummaryCard title="Carga Intereses" value={money(totals.totalIntereses)} icon={TrendingUp} colorClass="orange" tooltip="Costo financiero puro cobrado por el banco durante toda la proyección. No incluye la devolución del capital." />
          <SummaryCard title={loanType === 'new' ? "Pago Final Est." : "Restante a Pagar"} value={money(totals.totalPagadoFinal)} icon={CheckCircle2} colorClass="sky" tooltip="Suma total proyectada de todo el dinero que vas a desembolsar (Capital + Intereses) hasta quedar libre de deuda." />
          <SummaryCard title="Costo Financiero" value={totals.montoOriginalPesos > 0 ? `${(totals.totalPagadoFinal / totals.montoOriginalPesos).toFixed(1)}x` : "---"} icon={Activity} colorClass="amber" tooltip="Relación entre el Pago Final y el Monto/Saldo original. Ej: '2.0x' significa que terminás pagando el doble de pesos nominales de los que debías hoy." />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border dark:border-slate-800 shadow-sm relative z-40 text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
            <div className="flex items-center gap-3">
               <h3 className="font-black text-lg md:text-xl tracking-tight uppercase dark:text-white leading-none">Proyección de pagos del crédito</h3>
               <button onClick={() => setIsFullscreen(true)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-xl transition-all active:scale-95" title="Ver en Pantalla Completa" aria-label="Ver en pantalla completa"><Maximize2 className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-inner overflow-x-auto max-w-full no-scrollbar">
              {['2y', '3y', '5y', '10y', 'all'].map(t => (
                <button key={t} onClick={()=>setTimeframe(t)} className={`px-5 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${timeframe === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                  {t === 'all' ? 'TODO' : t.replace('y', ' AÑOS')}
                </button>
              ))}
            </div>
          </div>
          {showGastosBanner && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2.5 mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-600 dark:text-amber-400/80 font-medium leading-tight flex-1">Tu banco puede sumar seguros y gastos administrativos al CFT. Consultá con tu entidad para el costo final exacto.</p>
              <button onClick={() => setShowGastosBanner(false)} className="text-amber-400 hover:text-amber-600 transition-colors shrink-0" aria-label="Cerrar aviso"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="h-[220px] md:h-[350px] w-full"><CompositionChart data={filteredData} dateMode={dateMode} showRemMarker={inflationMode === 'rem'} /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden text-left text-[11px]">
          <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2 leading-none"><FileText className="w-4 h-4 text-indigo-500"/> TABLA DE AMORTIZACIÓN</span>
              <button onClick={() => { if(schedule.length > 0) setIsTableFullscreen(true); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-xl transition-all active:scale-95" title="Ver tabla en pantalla completa" aria-label="Ver tabla en pantalla completa"><Maximize2 className="w-4 h-4" /></button>
            </div>
            
            <div className="flex w-full lg:w-auto gap-2">
              <button onClick={() => { if(schedule.length > 0) handleExportClick('excel'); }} className="flex-1 lg:flex-none px-4 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-md transition-all uppercase tracking-widest leading-none" title="Descargar como Excel" aria-label="Descargar Excel">
                 <FileSpreadsheet className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">EXCEL</span>
              </button>
              <button onClick={() => { if(schedule.length > 0) handleExportClick('csv'); }} className="flex-1 lg:flex-none px-4 py-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white font-black rounded-xl shadow-sm hover:scale-105 transition-all uppercase tracking-widest leading-none">
                 <Download className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">CSV</span>
              </button>
              <button onClick={() => { if(schedule.length > 0) handleExportClick('pdf'); }} className="flex-[2] lg:flex-none px-4 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest leading-none whitespace-nowrap">
                 <FileText className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">PDF</span> 
              </button>
              <button onClick={copyToWhatsApp} className={`flex-none px-4 py-4 ${copiedWP ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-emerald-500'} font-black rounded-xl shadow-sm transition-all`} title="Copiar resumen para WhatsApp" aria-label="Copiar resumen para WhatsApp">
                 {copiedWP ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              </button>
              <button onClick={() => copyShareUrl(getShareParams(), setCopiedShare)} className={`flex-none px-4 py-4 ${copiedShare ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-emerald-500'} font-black rounded-xl shadow-sm transition-all`} title="Copiar link de simulación" aria-label="Copiar link para compartir">
                 {copiedShare ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="max-h-[400px] md:max-h-[850px] overflow-auto w-full no-scrollbar">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-left border-collapse min-w-[700px] md:min-w-[900px]">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 text-slate-400 font-black uppercase text-[10px] border-b dark:border-slate-800 z-10 shadow-sm leading-none">
                  <tr><th className="p-4 text-center">Periodo</th><th className="p-4 text-center">Origen</th><th className="p-4 text-center">Cuota Total</th><th className="p-4 text-center">Interés</th><th className="p-4 text-center">Capital</th><th className="p-4 text-center">Saldo</th></tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800 text-center">
                  {schedule.map((d) => (
                    <tr key={d.mes} className={`transition-colors ${d.isHalfWay ? 'bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40'}`}>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                        {d.label} {d.isHalfWay && <span title="50% del capital saldado" className="flex items-center gap-1 bg-sky-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter"><Flag className="w-2 h-2"/> 50%</span>}
                      </td>
                      <td className="p-4"><span className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase shadow-sm ${d.source === 'IPC' ? 'bg-emerald-600 text-white' : d.source === 'REM' ? 'bg-indigo-600 text-white' : 'bg-slate-500 text-white'}`}>{d.source}</span></td>
                      <td className="p-4 font-black text-slate-900 dark:text-white whitespace-nowrap">{money(d.cuotaTotal)}</td>
                      <td className="p-4 text-orange-600 font-bold whitespace-nowrap">{money(d.interes)}</td>
                      <td className="p-4 text-indigo-600 font-bold whitespace-nowrap">{money(d.principal)}</td>
                      <td className="p-4 text-slate-800 dark:text-slate-100 font-black font-mono whitespace-nowrap">{money(d.saldo)}</td>
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

  // CALCULO RENTABILIDAD (YIELD)
  const annualRentUsd = dolarOficial > 0 ? (totals.alquilerInicial * 12) / dolarOficial : 0;
  const grossYield = propertyValueUsd > 0 ? (annualRentUsd / propertyValueUsd) * 100 : 0;
  let yieldColor = "slate";
  let yieldIcon = Activity;
  if (propertyValueUsd > 0) {
      if (grossYield < 3) { yieldColor = "rose"; yieldIcon = AlertTriangle; }        // Malo
      else if (grossYield < 5) { yieldColor = "orange"; yieldIcon = TrendingUp; }     // Normal
      else if (grossYield <= 8) { yieldColor = "emerald"; yieldIcon = CheckCircle2; } // Bueno
      else { yieldColor = "sky"; yieldIcon = Flame; }                                  // Excelente
  }

  const exportToCSV = () => {
    if (schedule.length === 0) return;
    const headers = ["Periodo", "Total Mes", "Alquiler", "Expensas", "Origen"];
    const rows = schedule.map(d => [
      d.label, Math.round(d.cuotaTotal), Math.round(d.principal), Math.round(d.interes), d.source
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
    if (schedule.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(schedule.map(d => ({
      "Periodo": d.label,
      "Total Mes": Math.round(d.cuotaTotal),
      "Alquiler": Math.round(d.principal),
      "Expensas": Math.round(d.interes),
      "Origen Info": d.source
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alquileres");
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500 max-w-full">
      
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
              {({ loading }) => (<button disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2"><FileText className="w-4 h-4"/> {loading ? 'Generando...' : 'Descargar PDF Ahora'}</button>)}
            </PDFDownloadLink>
          }
        />
      )}

      <ChartModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} title="Proyección de pagos del alquiler">
          <CompositionChart data={schedule} dateMode={dateMode} showRemMarker={inflationMode === 'rem'} isRent={true} />
      </ChartModal>

      <TableModal isOpen={isTableFullscreen} onClose={() => setIsTableFullscreen(false)} title="Tabla de Pagos Mensuales">
        <table className="w-full text-left border-collapse text-[11px]" style={{ minWidth: 600 }}>
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-black uppercase text-[10px] border-b border-white/10 leading-none">
            <tr><th className="p-4 text-center">Periodo</th><th className="p-4 text-center">Origen</th><th className="p-4 text-center">Total Mes</th><th className="p-4 text-center">Alquiler</th><th className="p-4 text-center">Expensas</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-center">
            {schedule.map((d) => (
              <tr key={d.mes} className="transition-colors hover:bg-white/5">
                <td className="p-4 font-bold text-slate-200">{d.label}</td>
                <td className="p-4"><span className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase shadow-sm ${d.source === 'IPC' ? 'bg-emerald-600 text-white' : d.source === 'REM' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white'}`}>{d.source}</span></td>
                <td className="p-4 font-black text-white whitespace-nowrap">{money(d.cuotaTotal)}</td>
                <td className="p-4 text-indigo-400 font-bold whitespace-nowrap">{money(d.principal)}</td>
                <td className="p-4 text-orange-400 font-bold whitespace-nowrap">{money(d.interes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableModal>

      {/* --- COLUMNA IZQUIERDA: CONTROLES --- */}
      <div className="lg:col-span-3 space-y-4">
        
        {/* BLOQUE INICIO ALQUILERES (INTEGRADO) */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl shadow-xl border dark:border-slate-800 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg"><CalendarDays className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white leading-none flex items-center gap-2">
                INICIO Y TIPO
                <Tooltip iconClass="w-3.5 h-3.5 text-emerald-400" color="emerald">
                    <p className="mb-3"><b className="text-emerald-400 font-bold">Fecha Exacta:</b> Si sabés en qué mes vas a pagar, elegí esta opción. Nos permite sincronizar tu cuota con la inflación oficial (IPC real + REM proyectado) para ese mes puntual.</p>
                    <p><b className="text-emerald-200 font-bold">Sin Fecha Fija:</b> Ideal si recién estás averiguando y querés hacer una proyección estimada. Al no haber un mes específico, usás una inflación manual.</p>
                  </Tooltip>
              </h3>
            </div>
            <button onClick={handleReset} title="Limpiar todo" className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800" aria-label="Limpiar formulario"><RotateCcw className="w-4 h-4" /></button>
          </div>
          
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button onClick={() => setDateMode('calendar')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${dateMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>FECHA EXACTA</button>
            <button onClick={() => setDateMode('generic')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${dateMode === 'generic' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>SIN FECHA FIJA</button>
          </div>

          {dateMode === 'calendar' && (
             <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 border border-slate-200 dark:border-slate-700">
               <button onClick={() => setRentType('new')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${rentType === 'new' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}>NUEVO</button>
               <button onClick={() => setRentType('ongoing')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${rentType === 'ongoing' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}>
                 EN CURSO 
                 <Tooltip iconClass="w-3 h-3 text-slate-400" color="indigo">
                     Simulá contratos vigentes ajustados a la inflación actual.
                   </Tooltip>
               </button>
             </div>
          )}
          
          {dateMode === 'generic' && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-3 animate-pulse mb-4">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-black uppercase tracking-tighter text-rose-600 leading-tight">Sin fecha fija, usás inflación manual y no se conecta al calendario REM.</p>
            </div>
          )}

          {dateMode === 'calendar' && (
             rentType === 'new' ? (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                  <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">
                    {[CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-xs border dark:border-slate-700 outline-none">
                    {MESES.map((m, i) => <option key={m} value={i} disabled={startYear === hoy.getFullYear() && i < hoy.getMonth()}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
             ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center animate-in fade-in">
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Proyectando desde {MESES[hoy.getMonth()]} {hoy.getFullYear()}</span>
                </div>
             )
          )}
        </div>

        {/* BLOQUE DATOS DEL CONTRATO */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl shadow-xl border dark:border-slate-800 space-y-4 text-left">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg"><Settings2 className="w-4 h-4" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest dark:text-white leading-none">DATOS DEL CONTRATO</h3>
            </div>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 z-10"></div>
            <button onClick={() => setRentRole('tenant')} className={`flex-1 py-1.5 text-[9px] font-black rounded transition-all ${rentRole === 'tenant' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>MODO INQUILINO</button>
            <button onClick={() => setRentRole('owner')} className={`flex-1 py-1.5 text-[9px] font-black rounded transition-all ${rentRole === 'owner' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>MODO PROPIETARIO</button>
          </div>

          <div className="space-y-4 animate-in fade-in">
            <div className="group text-left">
              <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-widest">{rentType === 'new' ? (rentRole === 'owner' ? 'INGRESO DEL ALQUILER' : 'MONTO DEL ALQUILER') : 'ALQUILER ACTUAL (MES EN CURSO)'}</label>
              <div className="relative">
                <input type="text" inputMode="numeric" value={amountFocused && rentAmount === 0 ? '' : money(rentAmount)} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRentAmount(v === '' ? 0 : Number(v)); }} onFocus={(e) => { setAmountFocused(true); e.target.select(); }} onBlur={() => setAmountFocused(false)} placeholder="$ 0" className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-mono text-xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/50 shadow-inner dark:text-white" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 dark:text-slate-400"><DollarSign className="w-5 h-5" /></div>
              </div>
              {rentAmount > 0 && <p className="text-[10px] text-emerald-600 mt-2 px-1 font-bold">Aprox. USD {new Intl.NumberFormat('es-AR').format(Math.round(rentAmount / dolarOficial))} <span className="text-[8px] opacity-70">(Oficial)</span></p>}
            </div>

            <div className="group text-left">
              <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-widest">{rentRole === 'owner' ? 'EXPENSAS A CARGO INQUILINO' : 'EXPENSAS INICIALES'}</label>
              <div className="relative mb-2">
                <input type="text" inputMode="numeric" value={expFocused && expensesAmount === 0 ? '' : money(expensesAmount)} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setExpensesAmount(v === '' ? 0 : Number(v)); }} onFocus={(e) => { setExpFocused(true); e.target.select(); }} onBlur={() => setExpFocused(false)} placeholder="$ 0" className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-mono text-xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/50 shadow-inner dark:text-white" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700">
                <span className="text-[10px] font-black uppercase text-slate-500 leading-tight">¿Ajustar por inflación? (Mensual)</span>
                <button onClick={() => setAdjustExpenses(!adjustExpenses)} className={`w-10 h-5 rounded-full transition-all relative ${adjustExpenses ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${adjustExpenses ? 'left-5' : 'left-0.5'}`} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border dark:border-slate-800 text-center">
                <label className="text-[11px] font-black text-emerald-600 block mb-2 uppercase leading-none">{rentType === 'new' ? 'DURACIÓN (MESES)' : 'MESES RESTANTES'}</label>
                <input type="text" inputMode="numeric" value={(durFocused && (durationMonths === 0 || durationMonths === '')) ? '' : durationMonths} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); setDurationMonths(num !== '' && num > 240 ? 240 : num); }} onFocus={(e) => { setDurFocused(true); e.target.select(); }} onBlur={() => setDurFocused(false)} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border dark:border-slate-800 text-center">
                <label className="text-[11px] font-black text-emerald-600 block mb-2 uppercase leading-none">AJUSTA CADA (MESES)</label>
                <input type="text" inputMode="numeric" value={(adjFocused && (adjustPeriod === 0 || adjustPeriod === '')) ? '' : adjustPeriod} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); setAdjustPeriod(num !== '' && num > 120 ? 120 : num); }} onFocus={(e) => { setAdjFocused(true); e.target.select(); }} onBlur={() => setAdjFocused(false)} className="w-full bg-transparent font-mono text-xl font-black outline-none text-center dark:text-white" />
              </div>
            </div>

            {rentType === 'ongoing' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-500/20 text-center animate-in fade-in slide-in-from-top-2">
                <label className="text-[11px] font-black text-emerald-600 mb-2 uppercase flex justify-center items-center gap-1.5">
                  MESES DESDE EL ÚLTIMO AJUSTE
                  <Tooltip iconClass="w-3 h-3 text-emerald-400" color="emerald">
                      Ej: Si firmaste o tuviste el último aumento hace 2 meses exactos, ingresá "2". Esto permite calcular con precisión el próximo mes de ajuste.
                    </Tooltip>
                </label>
                <input type="text" inputMode="numeric" value={(sinceFocused && (monthsSinceLastAdjust === 0 || monthsSinceLastAdjust === '')) ? '' : monthsSinceLastAdjust} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const num = v === '' ? '' : Number(v); const maxVal = Number(adjustPeriod) > 0 ? Number(adjustPeriod) - 1 : 11; setMonthsSinceLastAdjust(num !== '' && num > maxVal ? maxVal : num); }} onFocus={(e) => { setSinceFocused(true); e.target.select(); }} onBlur={() => setSinceFocused(false)} className="w-full bg-transparent font-mono text-2xl font-black outline-none text-center text-emerald-700 dark:text-emerald-400" />
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                INFLACIÓN PROYECTADA
                <Tooltip iconClass="w-3.5 h-3.5 text-slate-300" color="emerald">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><b className="text-emerald-400 uppercase tracking-wider">Modo REM (Oficial)</b></div>
                      <p className="mb-2">Relevamiento de Expectativas de Mercado del <span className="text-white">BCRA</span>. Expertos proyectan la inflación para el año actual y los dos siguientes. ProyectAR mapea estos datos <span className="text-emerald-300">mes a mes</span> automáticamente como proxy del IPC/IPC.</p>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/5"><p className="text-[9px] leading-snug"><span className="text-emerald-300 font-bold uppercase tracking-tighter">Inercia:</span> Para el tiempo restante sin datos oficiales, se aplica el <span className="text-white">último valor del REM</span> (Auto) o tu <span className="text-white">tasa propia</span> (Fija).</p></div>
                    <div className="h-px w-full bg-white/5 mb-3"></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5"><div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div><b className="text-sky-400 uppercase tracking-wider">Modo Manual</b></div>
                      <p><span className="text-white font-bold">Control total.</span> Definí una tasa fija para todo el contrato. Ideal para simular escenarios propios.</p>
                    </div>
                  </div>
                </Tooltip>
              </label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button disabled={dateMode === 'generic'} onClick={() => setInflationMode('rem')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${inflationMode === 'rem' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'} ${dateMode === 'generic' ? 'opacity-50 cursor-not-allowed' : ''}`}>REM</button>
                <button onClick={() => setInflationMode('manual')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${inflationMode === 'manual' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>MANUAL</button>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border dark:border-slate-800">
              {inflationMode === 'manual' ? (
                <div className="animate-in fade-in space-y-2">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-emerald-600 uppercase leading-none">Tasa fija anual estimada</span><span className="text-[11px] font-mono font-black dark:text-white leading-none">{manualInf}%</span></div>
                    <input type="range" min="0" max="100" step="1" value={Number(String(manualInf).replace(',', '.')) || 0} onChange={(e)=>setManualInf(String(e.target.value).replace('.', ','))} className="w-full accent-emerald-500" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3"><p className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 leading-none"><Zap className="w-3 h-3" /> Inercia Post-REM</p><div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl"><button onClick={() => setRemStabilizedMode('auto')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg ${remStabilizedMode === 'auto' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>AUTO</button><button onClick={() => setRemStabilizedMode('custom')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg ${remStabilizedMode === 'custom' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>FIJA</button></div></div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black dark:text-white uppercase leading-tight ">
                    {remStabilizedMode === 'auto' ? `Aplicando el último dato oficial (${(remData && remData.length > 0 ? remData[remData.length-1].valor : '---')}%) para los meses restantes.` : 
                      <div>
                        <div className="flex justify-between mb-1"><span className="text-slate-500">Tasa Fija Post-REM (mensual):</span><span>{remStabilizedValue}%</span></div>
                        <input type="range" min="0" max="10" step="0.1" value={Number(String(remStabilizedValue).replace(',', '.')) || 0} onChange={(e)=>setRemStabilizedValue(String(e.target.value).replace('.', ','))} className="w-full accent-emerald-500" />
                      </div>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BLOQUE FINAL DE ALQUILERES: RCI O YIELD */}
          <div className="pt-4 border-t dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">
            {rentRole === 'owner' ? (
              <div className="group text-left">
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-widest">
                  VALOR DE LA PROPIEDAD (USD)
                  <span className="text-[8px] text-slate-400 font-medium lowercase ml-1">(Para calcular el Yield)</span>
                </label>
                <div className="relative">
                  <input
                    type="text" inputMode="numeric"
                    value={propFocused && propertyValueUsd === 0 ? '' : new Intl.NumberFormat('es-AR').format(propertyValueUsd)}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setPropertyValueUsd(v === '' ? 0 : Number(v)); }}
                    onFocus={(e) => { setPropFocused(true); e.target.select(); }} onBlur={() => setPropFocused(false)}
                    placeholder="USD 0"
                    className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl font-mono text-xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/50 shadow-inner dark:text-white"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 font-black text-xs dark:text-slate-400">USD</div>
                </div>
              </div>
            ) : (
              <div>
                <CurrencyInput 
                  label="SUELDO NETO MENSUAL (OPCIONAL)" 
                  value={salary} 
                  onChange={setSalary} 
                  sublabel="Para calcular la afectación de tu primer alquiler + expensas (RCI)." 
                />
                {salary > 0 && totals.cuotaTotalInicial > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic font-medium leading-tight px-1">
                      Nota: Este cálculo es respecto al mes inicial. Si tu sueldo no se ajusta a la par del alquiler y las expensas, el peso sobre tus ingresos aumentará.
                    </p>
                    <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between border-2 transition-colors ${
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
          </div>
        </div>
      </div>
      
      {/* --- COLUMNA DERECHA: RESULTADOS ALQUILERES --- */}
      <div ref={resultsRef} className="lg:col-span-9 space-y-5 min-w-0">
        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap gap-3 w-full">
          <SummaryCard title={rentType === 'new' ? (rentRole === 'owner' ? "Primer Ingreso" : "Primer Alquiler") : "Alquiler Actual"} value={money(totals.alquilerInicial)} icon={Wallet} colorClass={rentRole === 'owner' ? 'emerald' : 'indigo'} sticky={true} tooltip="Monto base del alquiler para el primer mes de la proyección." />
          <SummaryCard title="Total Expensas Est." value={money(totals.totalExpensas)} icon={TrendingUp} colorClass="orange" tooltip="Proyección de todas las expensas sumadas a lo largo de la simulación, asumiendo que acompañan la inflación mensual." />
          <SummaryCard title={rentRole === 'owner' ? "Ingreso Bruto Est." : "Costo Total Contrato"} value={money(totals.totalContrato)} icon={CheckCircle2} colorClass="sky" tooltip="La suma de todos los alquileres y expensas a pagar (o cobrar, si sos dueño) mes a mes hasta el final del contrato." />
          
          {rentRole === 'owner' ? (
             <SummaryCard 
                title="Rentabilidad (Yield)" 
                value={propertyValueUsd > 0 ? `${grossYield.toFixed(1)}%` : "---"} 
                icon={yieldIcon} 
                colorClass={yieldColor} 
                tooltip="Rentabilidad Bruta Anual (Yield). Se calcula anualizando el primer alquiler en dólares sobre el valor de la propiedad." 
                
             />
          ) : (
             <SummaryCard title="Multiplicador" value={totals.alquilerInicial > 0 ? `${(totals.totalContrato / (totals.alquilerInicial * durationMonths)).toFixed(1)}x` : "---"} icon={Activity} colorClass="amber" tooltip="Compara lo que pagás realmente contra lo que pagarías si no hubiera inflación. Ej: '1.3x' significa que la inflación acumulada encarece el contrato un 30% respecto a pagar siempre el mismo monto." />
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border dark:border-slate-800 shadow-sm relative z-40 text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
             <div className="flex items-center gap-3">
               <h3 className="font-black text-lg md:text-xl uppercase tracking-tight dark:text-white leading-none">Proyección de pagos del alquiler</h3>
               <button onClick={() => setIsFullscreen(true)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl transition-all active:scale-95" title="Ver en Pantalla Completa" aria-label="Ver en pantalla completa"><Maximize2 className="w-4 h-4" /></button>
             </div>
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-inner overflow-x-auto max-w-full no-scrollbar">
              {['1y', '2y', '3y', 'all'].map(t => (
                <button key={t} onClick={()=>setTimeframe(t)} className={`px-5 py-1.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${timeframe === t ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>
                  {t === 'all' ? 'TODO' : t.replace('y', ' AÑO' + (parseInt(t) > 1 ? 'S' : ''))}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[220px] md:h-[350px] w-full"><CompositionChart data={filteredData} dateMode={dateMode} showRemMarker={inflationMode === 'rem'} isRent={true} /></div>
        </div>

        {/* TABLA DE ALQUILERES */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden text-left text-[11px]">
          <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2 leading-none"><FileText className="w-4 h-4 text-emerald-500"/> TABLA DE PAGOS MENSUALES</span>
              <button onClick={() => { if(schedule.length > 0) setIsTableFullscreen(true); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl transition-all active:scale-95" title="Ver tabla en pantalla completa" aria-label="Ver tabla en pantalla completa"><Maximize2 className="w-4 h-4" /></button>
            </div>
            
            <div className="flex w-full lg:w-auto gap-2">
              <button onClick={() => { if(schedule.length > 0) handleExportClick('excel'); }} className="flex-1 lg:flex-none px-4 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-md transition-all uppercase tracking-widest leading-none" title="Descargar como Excel" aria-label="Descargar Excel">
                 <FileSpreadsheet className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">EXCEL</span>
              </button>
              <button onClick={() => { if(schedule.length > 0) handleExportClick('csv'); }} className="flex-1 lg:flex-none px-4 py-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white font-black rounded-xl shadow-sm hover:scale-105 transition-all uppercase tracking-widest leading-none">
                 <Download className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">CSV</span>
              </button>
              <button onClick={() => { if(schedule.length > 0) handleExportClick('pdf'); }} className="flex-[2] lg:flex-none px-4 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest leading-none whitespace-nowrap">
                 <FileText className="inline w-4 h-4 lg:mr-2" /> <span className="hidden lg:inline">PDF</span> 
              </button>
              <button onClick={copyToWhatsApp} className={`flex-none px-4 py-4 ${copiedWP ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-emerald-500'} font-black rounded-xl shadow-sm transition-all`} title="Copiar resumen para WhatsApp" aria-label="Copiar resumen para WhatsApp">
                 {copiedWP ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              </button>
              <button onClick={() => copyShareUrl(getShareParams(), setCopiedShare)} className={`flex-none px-4 py-4 ${copiedShare ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-emerald-500'} font-black rounded-xl shadow-sm transition-all`} title="Copiar link de simulación" aria-label="Copiar link para compartir">
                 {copiedShare ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="max-h-[400px] md:max-h-[850px] overflow-auto w-full no-scrollbar">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-left border-collapse min-w-[700px] md:min-w-[900px]">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 text-slate-400 font-black uppercase text-[10px] border-b dark:border-slate-800 z-10 shadow-sm leading-none">
                  <tr><th className="p-4 text-center">Periodo</th><th className="p-4 text-center">Origen</th><th className="p-4 text-center">Total Mes</th><th className="p-4 text-center">Alquiler</th><th className="p-4 text-center">Expensas</th></tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800 text-center">
                  {schedule.map((d) => (
                    <tr key={d.mes} className="transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{d.label}</td>
                      <td className="p-4"><span className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase shadow-sm ${d.source === 'IPC' ? 'bg-emerald-600 text-white' : d.source === 'REM' ? 'bg-indigo-600 text-white' : 'bg-slate-500 text-white'}`}>{d.source}</span></td>
                      <td className="p-4 font-black text-slate-900 dark:text-white whitespace-nowrap">{money(d.cuotaTotal)}</td>
                      <td className="p-4 text-indigo-600 font-bold whitespace-nowrap">{money(d.principal)}</td>
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
    <div className={`border dark:border-slate-800 rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white dark:bg-slate-800 shadow-xl border-amber-500/30 dark:border-amber-500/30' : 'bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}>
      <button onClick={onClick} className="w-full text-left p-5 md:p-6 flex justify-between items-center gap-4 outline-none">
        <h4 className="font-black text-sm md:text-base uppercase tracking-tight text-slate-800 dark:text-white leading-none">{question}</h4>
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

  const faqs = [
    {
      q: "¿Qué son los Créditos UVA?",
      a: <><p>Son préstamos hipotecarios donde el capital se expresa en <b>Unidades de Valor Adquisitivo (UVA)</b>, una unidad creada por el BCRA que se actualiza diariamente según la inflación (índice CER). Tu deuda y tu cuota se ajustan al ritmo de la inflación.</p><p>La ventaja es que la cuota inicial suele ser mucho más baja que en un crédito tradicional a tasa fija, lo que permite acceder con menores ingresos. La contrapartida es que si la inflación sube mucho, la cuota en pesos también lo hace.</p></>
    },
    {
      q: "¿De dónde sale el valor de la UVA?",
      a: <>
        <p>La UVA fue creada en 2016 con una equivalencia clara: <b>1.000 UVAs = costo promedio de 1 m² de construcción</b>. Hoy se ajusta diariamente por el CER (Coeficiente de Estabilización de Referencia), que sigue a la inflación oficial del INDEC.</p>
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-xl mt-3 space-y-2">
          <p className="text-sm font-bold">¿Mi cuota en UVAs cambia?</p>
          <p className="text-xs md:text-sm"><b>En Sistema Francés:</b> la cuota en UVAs es constante todo el crédito. <b>En Alemán:</b> baja mes a mes. Pero la cuota en pesos siempre cambia porque se multiplica por el valor diario de la UVA.</p>
        </div>
      </>
    },
    {
      q: "¿Qué es el IPC y qué es el REM? ¿Cómo los usamos?",
      a: <>
        <p>ProyectAR combina <b>dos fuentes oficiales</b> de datos de inflación para armar un timeline unificado:</p>
        <div className="space-y-3 mt-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <p className="text-sm"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-2 align-middle"></span><b>IPC (Índice de Precios al Consumidor)</b> — Dato real, cerrado. Lo publica el INDEC una vez al mes. Usamos los últimos 12 meses como dato histórico confirmado. Siempre tiene prioridad.</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <p className="text-sm"><span className="inline-block w-3 h-3 rounded-full bg-indigo-500 mr-2 align-middle"></span><b>REM (Relevamiento de Expectativas de Mercado)</b> — Proyección. El BCRA encuesta a las principales consultoras y bancos sobre cuánto creen que va a ser la inflación futura. Usamos la mediana de esas estimaciones.</p>
          </div>
        </div>
        <p className="mt-3">Cuando un mes tiene dato IPC (real) y REM (proyectado), siempre priorizamos el IPC. Para los meses futuros donde solo hay REM, usamos esa proyección. Si se agotan ambas fuentes, aplicamos <b>inercia</b>: repetimos el último valor disponible del REM.</p>
      </>
    },
    {
      q: "¿Cómo se calcula la inflación mensual a partir del REM anual?",
      a: <>
        <p>El REM publica estimaciones mensuales para los próximos meses y una estimación interanual (i.a.) para los años venideros. Cuando solo tenemos el dato anual, lo convertimos a mensual con esta fórmula:</p>
        <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto text-center my-3 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs md:text-sm">
          Inflación mensual = (1 + Inflación anual / 100) ^ (1/12) − 1
        </div>
        <p>Por ejemplo, si el REM proyecta 25% anual, la tasa mensual equivalente sería: (1.25)^(1/12) − 1 ≈ 1,88% mensual. Es una <b>tasa geométrica</b>, no una simple división por 12, para que al acumularla 12 meses dé exactamente el valor anual.</p>
      </>
    },
    {
      q: "¿Cómo se calcula la cuota del crédito UVA?",
      a: <>
        <p>Primero el banco calcula tu cuota en UVAs puras (sin inflación). Esa cuota tiene dos partes: devolución de capital + intereses. Dependiendo del sistema:</p>
        <div className="space-y-3 mt-3">
          <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl">
            <p className="text-sm font-bold mb-2">Sistema Francés (cuota constante en UVAs):</p>
            <div className="overflow-x-auto text-center text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs md:text-sm">
              PMT = Saldo × r / (1 − (1 + r) ^ −n)
            </div>
            <p className="text-xs mt-2 text-slate-500">Donde r = TNA/12 (tasa mensual) y n = cuotas restantes.</p>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl">
            <p className="text-sm font-bold mb-2">Sistema Alemán (amortización constante):</p>
            <div className="overflow-x-auto text-center text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs md:text-sm">
              Amortización = Capital total / n &nbsp;&nbsp;|&nbsp;&nbsp; Cuota = Amortización + Saldo × r
            </div>
            <p className="text-xs mt-2 text-slate-500">La cuota en UVAs baja cada mes porque el saldo sobre el que calculás intereses se va reduciendo.</p>
          </div>
        </div>
        <p className="mt-3">Para convertir a pesos:</p>
        <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto text-center my-2 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs md:text-sm">
          Cuota en $ = Cuota en UVAs × Valor UVA del día de pago
        </div>
        <p>Como el valor de la UVA sube con la inflación, tu cuota en pesos sube mes a mes aunque la cuota en UVAs sea fija.</p>
      </>
    },
    {
      q: "¿Cuál es la diferencia entre el Sistema Francés y el Alemán?",
      a: <><p>Son dos formas de devolver el préstamo con características opuestas:</p><ul className="list-disc pl-5 space-y-2 mt-2"><li><b>Francés (el más común):</b> Cuota en UVAs constante. Al inicio pagás mucho interés y poco capital. Es más fácil de calificar porque la cuota inicial es más baja.</li><li><b>Alemán:</b> Amortización de capital constante. La cuota arranca más alta pero baja cada mes. Pagás menos intereses totales a lo largo del crédito.</li></ul><p className="mt-2">En la práctica, la mayoría de los bancos argentinos ofrecen exclusivamente Sistema Francés para créditos UVA.</p></>
    },
    {
      q: "¿Qué es el Yield (rentabilidad bruta) y cómo se calcula?",
      a: <>
        <p>Es una métrica estándar del mercado inmobiliario que indica cuánto rinde una propiedad por año en relación a su valor. Se calcula así:</p>
        <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto text-center my-3 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs md:text-sm">
          Yield = (Alquiler mensual × 12 / Dólar oficial) / Valor propiedad USD × 100
        </div>
        <p>Es una medida <b>bruta</b> (no descuenta impuestos, vacancia, mantenimiento). En el mercado argentino, los rangos típicos son:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
          <li><b className="text-rose-500">Menor a 3%:</b> Rendimiento bajo. La propiedad se valoriza más por plusvalía que por renta.</li>
          <li><b className="text-orange-500">3% a 5%:</b> Rango normal del mercado argentino actual.</li>
          <li><b className="text-emerald-500">5% a 8%:</b> Buen rendimiento. Propiedad rentable.</li>
          <li><b className="text-sky-500">Más de 8%:</b> Excelente y poco frecuente. Suele darse en zonas emergentes o propiedades comerciales.</li>
        </ul>
      </>
    },
    {
      q: "¿Cómo funciona el ajuste de alquileres?",
      a: <>
        <p>La ley vigente permite que propietarios e inquilinos acuerden libremente la frecuencia y el índice de ajuste. En ProyectAR simulamos esto así:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2 text-sm">
          <li>Se define cada cuántos meses se ajusta (ej: cada 4 meses).</li>
          <li>Durante esos meses, se <b>acumula la inflación mensual</b> (IPC real o REM proyectado).</li>
          <li>Al llegar al mes de ajuste, el alquiler base se multiplica por ese factor acumulado.</li>
        </ol>
        <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto text-center my-3 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs md:text-sm">
          Factor = (1 + inf₁) × (1 + inf₂) × ... × (1 + infₙ)
          <br/>Nuevo alquiler = Alquiler anterior × Factor
        </div>
        <p>Para <b>alquileres en curso</b>, el sistema pre-acumula la inflación pasada (IPC) desde el último ajuste hasta hoy, para proyectar correctamente desde tu situación actual.</p>
      </>
    },
    {
      q: "¿Qué significa 'Inercia' en el origen de la inflación?",
      a: <><p>Cuando se agotan los datos del REM (que típicamente cubre 12-18 meses hacia adelante), la proyección necesita seguir. La <b>inercia</b> toma el último valor mensual disponible del REM y lo repite para los meses restantes.</p><p>Es la opción por defecto (modo "Auto"). Si preferís, podés cambiar a modo "Fija" e ingresar manualmente una tasa mensual que consideres más realista para el largo plazo.</p></>
    },
    {
      q: "¿Por qué ajustar las expensas por inflación?",
      a: <><p>Las expensas de un edificio cubren costos que suben con la inflación: sueldo del encargado, mantenimiento, servicios, limpieza. Si simulás un contrato asumiendo expensas congeladas durante dos años, el resultado subestima fuertemente el costo real de vivir en esa propiedad.</p><p>ProyectAR aplica la misma tasa de inflación mensual a las expensas para darte una imagen más fiel del gasto total.</p></>
    },
    {
      q: "¿Los datos de ProyectAR son exactos?",
      a: <><p>ProyectAR es una <b>herramienta de simulación</b>, no un oráculo. Usamos las mejores fuentes públicas disponibles (IPC-INDEC, REM-BCRA, UVA-BCRA, Dólar-BCRA), pero toda proyección a futuro es inherentemente incierta.</p><p>La inflación real puede diferir de las estimaciones del REM, los bancos pueden modificar sus tasas, y las condiciones macroeconómicas pueden cambiar. Usá los resultados como referencia para tomar decisiones informadas, no como una promesa de lo que va a pasar.</p><p>Ante cualquier decisión financiera importante, consultá siempre con un profesional idóneo.</p></>
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500 max-w-full">
      <div className="lg:col-span-12 space-y-8">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border dark:border-slate-800 shadow-sm relative z-40 text-left">
          <div className="flex flex-col mb-10 gap-2">
            <h2 className="font-black text-3xl md:text-4xl uppercase tracking-tighter dark:text-white flex items-center gap-3">
              <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
              Preguntas Frecuentes
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Conceptos básicos, fórmulas y teoría detrás de las simulaciones.</p>
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
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('proyectar_dark', JSON.stringify(darkMode)); } catch { /* storage lleno o bloqueado */ }
  }, [darkMode]);

  useEffect(() => {
    if (GA_MEASUREMENT_ID) { ReactGA.initialize(GA_MEASUREMENT_ID); ReactGA.send({ hitType: "pageview", page: window.location.pathname }); }
    try {
      const hasSeenWelcome = localStorage.getItem(`proyectar_welcome_v${APP_VERSION}`);
      if (!hasSeenWelcome) setShowWelcome(true);
    } catch { /* si no se puede leer, no mostramos el welcome */ }
  }, []);

  const handleCloseWelcome = () => {
    try { localStorage.setItem(`proyectar_welcome_v${APP_VERSION}`, 'true'); } catch { /* ignorar */ }
    setShowWelcome(false);
  };

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
        <Helmet>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        </Helmet>
        <div className={darkMode ? 'dark' : ''}>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors flex flex-col max-w-[100vw] overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
            
            {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}

            <div className="bg-slate-900 text-white py-3 border-b border-white/5 relative z-40 px-4 md:px-10 leading-none">
              <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-2 text-[10px] font-black tracking-widest uppercase text-slate-500 leading-none">
                <div className="flex items-center gap-3 sm:gap-6 leading-none">
                  <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> Fuentes: <a href="https://dolarapi.com" target="_blank" className="hover:text-emerald-400">DolarAPI</a></div>
                  <span className="hidden md:inline text-slate-700">|</span>
                  <div className="flex items-center gap-2 text-slate-400"><Clock className="w-3 h-3 text-indigo-500" /> <span>ACTUALIZADO: {formatDateTime(lastUpdate)}</span></div>
                  <span className="hidden lg:inline text-slate-700">|</span><span className="hidden sm:inline">REM: {remDateLabel || '---'}</span>
                </div>
                <div className="flex gap-4 sm:gap-12 items-center font-mono leading-none">
                  <div>DÓLAR OFICIAL <span className="text-emerald-400 font-black">${dolarOficial}</span></div>
                  <div>UVA <span className="text-indigo-400 font-black">${uvaValue}</span></div>
                </div>
              </div>
            </div>

            <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-b dark:border-slate-800 sticky top-0 z-40 min-h-[80px] h-auto md:h-28 flex flex-col md:flex-row items-center justify-between px-4 md:px-10 py-4 md:py-0 gap-4 md:gap-0 shadow-sm leading-none">
              <div className="flex items-center gap-3 md:gap-5">
                <img src="/favicon.png" alt="ProyectAR Logo" className="w-10 h-10 md:w-16 md:h-16 object-contain drop-shadow-md" />
                <div className="flex flex-col text-left leading-none"><span className="font-black text-lg md:text-3xl tracking-tighter uppercase leading-none ">Proyect<span className="text-violet-500">AR</span></span><span className="text-[9px] md:text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mt-1 md:mt-3 opacity-60 leading-none">v{APP_VERSION}</span></div>
              </div>
              <div className="flex items-center gap-2 md:gap-10 w-full md:w-auto justify-between md:justify-end">
                <NavigationMenu />
                <button onClick={() => setDarkMode(!darkMode)} aria-label="Cambiar tema claro/oscuro" className="p-2.5 md:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 shadow-md active:scale-90">{darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />}</button>
              </div>
            </nav>

            <main className="max-w-[1800px] mx-auto p-6 md:p-10 flex-grow w-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40 md:py-60 gap-6"><div className="w-20 h-20 border-[8px] border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div><p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse text-center">Sincronizando Mercados...</p></div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-1000">
                  <Routes>
                    {/* REDIRECCIÓN: Si entran a la home vacía, los mandamos a los créditos */}
                    <Route path="/" element={<Navigate to="/calculadora-creditos-uva" replace />} />

                    {/* RUTA 1: HIPOTECAS (NUEVA URL) */}
                    <Route path="/calculadora-creditos-uva" element={
                      <>
                        <Helmet>
                          <title>ProyectAR | Calculadora de Créditos UVA </title>
                          <meta name="description" content="Simulá tu crédito hipotecario UVA con ajuste por inflación y datos oficiales del REM (BCRA). Analizá el impacto del sistema francés y alemán." />
                          <script type="application/ld+json">{JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            "name": "ProyectAR - Calculadora de Créditos UVA",
                            "url": "https://proyectar.io/calculadora-creditos-uva",
                            "description": "Simulador de créditos hipotecarios UVA con inflación proyectada (IPC + REM BCRA), sistema francés y alemán, exportación a PDF/Excel.",
                            "applicationCategory": "FinanceApplication",
                            "operatingSystem": "Web",
                            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ARS" },
                            "author": { "@type": "Person", "name": "Maxi Navarro" }
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
                          <script type="application/ld+json">{JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            "name": "ProyectAR - Calculadora de Alquileres",
                            "url": "https://proyectar.io/calculadora-alquileres",
                            "description": "Simulador de contratos de alquiler con ajuste por inflación (IPC + REM BCRA), cálculo de expensas, yield para propietarios.",
                            "applicationCategory": "FinanceApplication",
                            "operatingSystem": "Web",
                            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ARS" },
                            "author": { "@type": "Person", "name": "Maxi Navarro" }
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
                          <meta name="description" content="Todo sobre créditos UVA, inflación IPC/REM, fórmulas de cálculo, sistemas de amortización y cómo funciona ProyectAR." />
                          <script type="application/ld+json">{JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            "mainEntity": [
                              {"@type": "Question", "name": "¿Qué son los Créditos UVA?", "acceptedAnswer": {"@type": "Answer", "text": "Son préstamos donde el capital se expresa en UVAs, una unidad que se ajusta diariamente por inflación (CER). La cuota en pesos sube con la inflación, pero el acceso inicial es más fácil."}},
                              {"@type": "Question", "name": "¿Qué es el REM?", "acceptedAnswer": {"@type": "Answer", "text": "El Relevamiento de Expectativas de Mercado es una encuesta del BCRA a consultoras sobre inflación futura. ProyectAR usa la mediana de esas estimaciones para proyectar cuotas."}},
                              {"@type": "Question", "name": "¿Cómo se calcula la cuota UVA?", "acceptedAnswer": {"@type": "Answer", "text": "La cuota en UVAs se calcula con la fórmula PMT estándar (sistema francés) o amortización constante (alemán). Luego se multiplica por el valor diario de la UVA para obtener pesos."}}
                            ]
                          })}</script>
                        </Helmet>
                        <FAQ />
                      </>
                    } />



                  </Routes>
                </div>
              )}
            </main>

            <div className="max-w-[1800px] mx-auto px-6 md:px-10 mt-10">
               <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 dark:from-indigo-500/5 dark:to-emerald-500/5 rounded-3xl p-8 md:p-12 text-center border border-indigo-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><HeartHandshake className="w-40 h-40 text-indigo-500" /></div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">¿Te sirvió ProyectAR?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-2xl mx-auto">Esta herramienta es 100% gratuita y la desarrollamos a pulmón para ayudarte a tomar mejores decisiones financieras. Si te aportó algún valor, considerá hacer una colaboración que nos ayuda enormemente a pagar los servidores y seguir mejorando la aplicación.</p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
                     <a href="https://cafecito.app/proyectar" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 bg-[#00cba9] hover:bg-[#00b899] text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg hover:-translate-y-1"><Coffee className="w-4 h-4"/> Invitar un Cafecito</a>
                     <a href="https://link.mercadopago.com.ar/proyectarapp" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 bg-[#009ee3] hover:bg-[#008ed0] text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg hover:-translate-y-1"><Handshake className="w-4 h-4"/> Aportar por Mercado Pago</a>
                  </div>
               </div>
            </div>

            <footer className="max-w-[1800px] mx-auto w-full border-t dark:border-slate-800 mt-10 md:mt-20 py-10 md:py-16 px-6 md:px-10 flex flex-col lg:flex-row justify-between items-center gap-10">
              <div className="flex-1 text-center lg:text-left leading-none"><p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50 ">{`República Argentina - ${CURRENT_YEAR}`}</p></div>
              <div className="flex-[2] max-w-2xl mx-auto text-center opacity-60"><p className="text-[10px] leading-relaxed uppercase tracking-tighter font-medium text-slate-500 dark:text-slate-400"><span className="font-black text-indigo-500">Aviso Legal:</span> {"ProyectAR proporciona esta información como un servicio de simulación financiera. No constituye una interpretación legal, asesoramiento financiero, ni garantiza resultados futuros. Las proyecciones se basan en datos de terceros (REM-BCRA) y pueden variar. Ante decisiones de renta, inversión o crédito, se recomienda consultar con profesionales idóneos."}</p></div>
              <div className="flex-1 flex flex-col items-center lg:items-end gap-2 text-[11px] font-bold text-slate-400 uppercase opacity-50 italic"><a href="https://github.com/MaxiNavarro97" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-400 transition-colors leading-none"><Github className="w-4 h-4" /> @MaxiNavarro97</a><a href="mailto:proyectarapp@gmail.com" className="flex items-center gap-2 hover:text-indigo-400 transition-colors leading-none"><Mail className="w-3.5 h-3.5" /> proyectarapp@gmail.com</a></div>
            </footer>
          </div>
        </div>
      </Router>
    </HelmetProvider>
  );
}