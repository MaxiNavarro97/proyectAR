import pandas as pd
import re
import requests
import json
from bs4 import BeautifulSoup
from pathlib import Path
import urllib3
from datetime import datetime

# Desactivamos advertencias de certificados (el BCRA a veces tiene temas de SSL)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- CONFIGURACIÓN DE RUTAS DINÁMICAS ---
# Si el script está en /src/scripts/data_engine.py, subimos 2 niveles para llegar a la raíz
BASE_DIR = Path(__file__).resolve().parents[2]
RUTA_RAW = BASE_DIR / "public" / "REM" / "raw" / "REM.xlsx"
RUTA_PROCESSED = BASE_DIR / "public" / "REM" / "processed" / "proyeccion_inflacion.csv"
RUTA_MARKET = BASE_DIR / "public" / "market" / "market_status.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def fetch_market_data():
    """Captura el Dólar Oficial y el Índice UVA de APIs externas."""
    print("📡 Capturando Dólar y UVA de fuentes externas...")
    data = {
        "last_update": datetime.now().isoformat(),
        "dolar_oficial": 0,
        "uva_value": 0,
        "uva_date": ""
    }
    
    try:
        # 1. Dólar Oficial
        res_dolar = requests.get('https://dolarapi.com/v1/dolares/oficial', timeout=10)
        if res_dolar.ok:
            data["dolar_oficial"] = res_dolar.json().get('venta')
            print(f"💵 Dólar Oficial: ${data['dolar_oficial']}")
        
        # 2. Índice UVA
        res_uva = requests.get('https://api.argentinadatos.com/v1/finanzas/indices/uva', timeout=10)
        if res_uva.ok:
            uva_list = res_uva.json()
            if uva_list:
                latest = uva_list[-1]
                data["uva_value"] = latest.get('valor')
                data["uva_date"] = latest.get('fecha')
                print(f"🏠 Índice UVA: ${data['uva_value']} ({data['uva_date']})")
                
        # Guardar JSON
        RUTA_MARKET.parent.mkdir(parents=True, exist_ok=True)
        with open(RUTA_MARKET, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        print(f"✅ market_status.json actualizado en: {RUTA_MARKET}")
        return True
    except Exception as e:
        print(f"❌ Error capturando mercado: {e}")
        return False

def descargar_rem():
    """Busca y descarga el último Excel del REM usando el patrón de URL del BCRA."""
    print("🌐 Accediendo a la web del BCRA para el REM...")
    url_base = "https://www.bcra.gob.ar"
    url_rem = f"{url_base}/PublicacionesEstadisticas/Relevamiento_Expectativas_de_Mercado.asp"
    
    try:
        response = requests.get(url_rem, headers=HEADERS, verify=False, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        link_excel = None
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.endswith('.xlsx') and 'tablas-relevamiento-expectativas-mercado' in href.lower():
                link_excel = url_base + href if href.startswith('/') else href
                break
        
        if not link_excel:
            print("⚠️ No se encontró link de Excel nuevo. Usaremos el local si existe.")
            return RUTA_RAW.exists()

        archivo_res = requests.get(link_excel, headers=HEADERS, verify=False, timeout=15)
        RUTA_RAW.parent.mkdir(parents=True, exist_ok=True)
        with open(RUTA_RAW, 'wb') as f:
            f.write(archivo_res.content)
            
        print("✅ Archivo REM.xlsx descargado.")
        return True
    except Exception as e:
        print(f"❌ Error en descarga REM: {e}")
        return RUTA_RAW.exists()

def parseador_rem_python(df_input):
    """Lógica de procesamiento de inflación (tu función original)."""
    meses_map_inv = {1: "ene", 2: "feb", 3: "mar", 4: "abr", 5: "may", 6: "jun", 
                     7: "jul", 8: "ago", 9: "sep", 10: "oct", 11: "nov", 12: "dic"}
    
    proyeccion_mensual = []
    anclas_anuales = {}
    periodos_procesados = set()

    for _, row in df_input.iterrows():
        periodo_raw = str(row['Período']).strip()
        referencia = str(row['Referencia']).lower()
        
        try:
            valor = float(row['Mediana'])
        except (ValueError, TypeError):
            continue

        id_fila = f"{periodo_raw}_{referencia}"
        if id_fila in periodos_procesados: continue
        
        match_fecha = re.match(r"(\d{4})-(\d{2})-\d{2}", periodo_raw)
        if match_fecha and "mensual" in referencia:
            año, mes = int(match_fecha.group(1)), int(match_fecha.group(2))
            proyeccion_mensual.append({
                "mes": mes, "año": año, "valor_mensual": valor,
                "periodo": f"{meses_map_inv[mes]}-{str(año)[2:]}"
            })
            periodos_procesados.add(id_fila)
        elif re.match(r"^\d{4}$", periodo_raw) and "i.a." in referencia:
            anclas_anuales[int(periodo_raw)] = valor
            periodos_procesados.add(id_fila)

    proyeccion_mensual.sort(key=lambda x: (x['año'], x['mes']))
    if not proyeccion_mensual: return []
    
    resultado_final = list(proyeccion_mensual)
    año_actual = proyeccion_mensual[0]['año']
    if proyeccion_mensual[0]['mes'] == 12: año_actual += 1
    
    meses_conocidos_actual = [m for m in proyeccion_mensual if m['año'] == año_actual]
    if año_actual in anclas_anuales and meses_conocidos_actual:
        ultimo_mes_conocido = meses_conocidos_actual[-1]['mes']
        if ultimo_mes_conocido < 12:
            obj_anual = 1 + (anclas_anuales[año_actual] / 100)
            acum_real = 1.0
            for m in meses_conocidos_actual: acum_real *= (1 + m['valor_mensual'] / 100)
            meses_faltantes = 12 - ultimo_mes_conocido
            tasa_residua = (obj_anual / acum_real) ** (1 / meses_faltantes) - 1
            for m in range(ultimo_mes_conocido + 1, 13):
                resultado_final.append({
                    "mes": m, "año": año_actual, "valor_mensual": round(tasa_residua * 100, 2),
                    "periodo": f"{meses_map_inv[m]}-{str(año_actual)[2:]}"
                })

    for año in sorted(anclas_anuales.keys()):
        if año > año_actual:
            infla_anual = anclas_anuales[año] / 100
            media_mensual = ((1 + infla_anual) ** (1/12) - 1) * 100
            for m in range(1, 13):
                resultado_final.append({
                    "mes": m, "año": año, "valor_mensual": round(media_mensual, 2),
                    "periodo": f"{meses_map_inv[m]}-{str(año)[2:]}"
                })
    return resultado_final

def main():
    print(f"🚀 Iniciando Data Engine de ProyectAR - {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    
    # 1. Mercado (Dólar y UVA) - Siempre intentamos actualizarlo
    fetch_market_data()
    
    # 2. REM (Inflación Proyectada)
    if descargar_rem():
        try:
            df_raw = pd.read_excel(RUTA_RAW, sheet_name="Cuadros de resultados", header=5, nrows=13, usecols="B:M")
            df_raw.columns = [str(c).strip() for c in df_raw.columns]
            df_filtered = df_raw[['Período', 'Referencia', 'Mediana']].dropna(subset=['Período'])
            
            data_final = parseador_rem_python(df_filtered)
            RUTA_PROCESSED.parent.mkdir(parents=True, exist_ok=True)
            
            df_output = pd.DataFrame(data_final)
            df_output.to_csv(RUTA_PROCESSED, index=False, sep=';', encoding='utf-8-sig')
            print(f"✅ REM: Se generaron {len(df_output)} periodos en {RUTA_PROCESSED}")
        except Exception as e:
            print(f"❌ Error procesando Excel: {e}")
    
    print("🏁 Proceso finalizado.")

if __name__ == "__main__":
    main()