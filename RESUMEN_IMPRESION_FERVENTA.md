# Resumen de Arquitectura y Estado del Sistema de Impresión (Ferventa Web)

> **Fecha de guardado:** 2 de Octubre de 2026  
> **Objetivo:** Registrar la solución completa implementada para impresión de tickets, cotizaciones, citas y códigos QR, asegurando que se pueda retomar o diagnosticar rápidamente si algo falla mañana.

---

## 1. El Problema Original
En Ferventa conviven 3 tipos de documentos con requerimientos completamente distintos:
1. **Tickets de Venta (58mm):** Mini-impresora térmica (ej. SUZWIP 58MM). El cajero necesita que al cobrar se imprima **inmediatamente y en silencio con 0 ventanas de vista previa** para no perder tiempo.
2. **Cotizaciones y Citas (PDF tamaño Carta / A4):** Se imprimen en impresora de oficina (ej. Brother, HP, Epson). El usuario **SÍ requiere ver la vista previa a todo color**, verificar importes y poder guardarlo como PDF para enviarlo por WhatsApp o imprimirlo en papel normal.
3. **Códigos QR y Etiquetas:** Stickers adhesivos con medidas fijas que requieren **vista previa** para verificar el código antes de estamparlo.

*Nota:* Intentar resolver esto con `--kiosk-printing` en Chrome falló porque `--kiosk-printing` fuerza **todas** las impresiones a la última impresora predeterminada sin distinguir si es un ticket de 58mm o una cotización tamaño Carta.

---

## 2. La Solución Implementada: Arquitectura Híbrida

### A. Para Tickets de Venta (58mm) ➔ Silencioso 100%
- Se creó **`FerventaPrintAgent.exe`**, un agente nativo ligero en C# (15 KB) que corre en segundo plano en Windows (puerto local `9123`) con ícono junto al reloj (`NotifyIcon`) y arranque automático con Windows.
- Recibe los bytes en crudo ESC/POS generados por Ferventa Web e inyecta directamente al spooler de Windows (`winspool.drv` vía `OpenPrinterW`), saltándose cualquier diálogo de navegador.
- Cuenta con renderizado inteligente fallback: si se manda a una impresora Brother o de oficina, lo imprime con GDI+ en papel para que no se atore.

### B. Para Cotizaciones, Citas y Remisiones (Carta / A4) ➔ Vista Previa Fiel a Color
- Se utiliza **`documentPrintService`** y **`PrintEngine`**.
- Se abre la ventana nativa de previsualización con todo el diseño gráfico original (membrete de *Moto Servicio Nova FV*, desglose de servicios de taller con sus tags a color, precios e importes), permitiendo elegir guardar como PDF o imprimir en hoja Carta.

### C. Para Códigos QR y Etiquetas ➔ Vista Previa de Etiqueta
- Abre el modal y previsualización con dimensiones exactas para stickers adhesivos (70x50mm o personalizado).

---

## 3. Compatibilidad con Producción en Render (`https://ferventa-web.onrender.com`)

### A. Descarga en 1 Clic del `.exe`
- El binario ejecutable está guardado en: `public/downloads/FerventaPrintAgent.exe`.
- Vite copia automáticamente los archivos de `public/` a la raíz de distribución `dist/downloads/FerventaPrintAgent.exe`.
- Al hacer `git push` a `main`, Render compila el proyecto y el cliente puede descargarlo directamente desde:
  `https://ferventa-web.onrender.com/downloads/FerventaPrintAgent.exe`.

### B. Comunicación HTTPS (Render) ➔ HTTP Local (127.0.0.1)
Google Chrome y Edge aplican la directiva **PNA (Private Network Access)** para proteger conexiones desde sitios públicos HTTPS hacia la máquina local.  
El agente ya responde a todos los endpoints (`OPTIONS`, `GET`, `POST`) con las cabeceras requeridas:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Allow-Private-Network: true
```
Esto garantiza que Chrome en `https://ferventa-web.onrender.com` tiene autorización completa para comunicarse con el agente en `http://127.0.0.1:9123`.

---

## 4. Estructura de Archivos Creados y Modificados

| Archivo | Función |
| :--- | :--- |
| `print-agent/FerventaPrintAgent.cs` | Código fuente del agente Windows en C# (.NET 4.0 / C# 5). |
| `print-agent/build-agent.bat` | Script por lotes para compilar el `.exe` con `csc.exe` nativo de Windows. |
| `public/downloads/FerventaPrintAgent.exe` | Binario ejecutable compilado (15 KB, portable, sin dependencias externas). |
| `src/core/services/print/LocalAgentPrinterService.ts` | Servicio TypeScript para comunicarse con `http://127.0.0.1:9123`. |
| `src/core/services/print/escpos/escPosEncoder.ts` | Codificador binario de comandos ESC/POS (58mm, 32 caracteres, acentos en español). |
| `src/core/services/print/escpos/ticketEscPosGenerators.ts` | Generador de tickets de venta, recepción, pedidos especiales en formato binario. |
| `src/core/services/print/ThermalPrintService.ts` | Despachador de tickets (Agente Local ➔ Bluetooth Directo ➔ USB ➔ Fallback). |
| `src/core/services/print/documentPrintService.ts` | Coordinador de cotizaciones, citas y etiquetas con vista previa completa y colores. |
| `src/core/services/print/PrintEngine.ts` | Motor de iframes aislados para renderizado de documentos y cálculo dinámico de hojas. |
| `src/core/services/print/WebBluetoothPrinterService.ts` | Cliente Web Bluetooth para conectar impresoras SUZWIP sin drivers. |
| `src/core/services/print/DirectUsbPrinterService.ts` | Cliente WebUSB / WebSerial para conectar impresoras por cable sin drivers. |
| `src/app/presentation/stores/printer/printer.store.ts` | Estado reactivo con Zustand y persistencia en `localStorage`. |
| `src/app/presentation/pages/settings/SettingsPage.tsx` | UI con tarjeta del Agente, botón de descarga directa, 3 selectores de impresora y pruebas. |
| `src/app/presentation/pages/pos/POSPage.tsx` | Punto de venta: botón de cobro e indicador de estado de impresora. |

---

## 5. Instrucciones Rápidas para el Cliente

1. **Descargar:** Entrar a Ferventa Web ➔ **Configuración** ➔ **Impresora & Tickets** y pulsar **`Descargar Agente (.exe)`**.
2. **Ejecutar:** Abrirlo una sola vez en Windows. Se iniciará junto al reloj del sistema y arrancará solo cada vez que encienda la computadora.
3. **Vincular:** Pulsar **`Detectar Impresoras`** en Ferventa Web y seleccionar su mini-impresora de 58mm en el selector de **Tickets de Venta**.

---

## 6. Comandos Útiles de Mantenimiento (Por si mañana se necesita compilar o revisar)

### Compilar el agente de Windows manualmente:
```powershell
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /optimize /out:public\downloads\FerventaPrintAgent.exe /r:System.Drawing.dll,System.Windows.Forms.dll print-agent\FerventaPrintAgent.cs
Copy-Item public\downloads\FerventaPrintAgent.exe dist\downloads\FerventaPrintAgent.exe -Force
```

### Comprobar estado del agente desde PowerShell:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:9123/status"
# Debe retornar: status: ok, service: Ferventa Windows Print Agent, version: 1.1.0

Invoke-RestMethod -Uri "http://127.0.0.1:9123/printers"
# Debe listar las impresoras instaladas en Windows
```

### Probar compilación del proyecto web:
```powershell
npm run build
```

---

## 7. Estado del Repositorio
- Compilación de TypeScript y Vite: **0 errores**.
- Archivos pendientes para Git:
  - `git add .`
  - `git commit -m "feat: implement native print agent, 3-way printer routing and high-fidelity previews"`
  - `git push origin main`
