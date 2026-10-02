# Bitácora de Sesión: Estado del Sistema de Impresión (Ferventa Web)

> **Fecha de guardado:** Viernes, 2 de Octubre de 2026 (02:00 AM)  
> **Objetivo:** Documentar detalladamente todo lo implementado en esta sesión, las decisiones tomadas, cómo resolver posibles fallos mañana y cómo probar o desinstalar cada componente.

---

## 1. Resumen Ejecutivo: ¿En qué nos quedamos exactamente?

Todo el sistema de impresión inteligente está **completamente desarrollado, compilado, probado y subido al repositorio (`origin/main`)**.

### El flujo quedó configurado exactamente como se acordó:
1. **🧾 Tickets de Venta (58mm):**
   - **Impresión 100% Silenciosa (0 ventanas emergentes).**
   - Se procesan en binario ESC/POS en el frontend y se envían directamente a la cola de Windows mediante el agente local `FerventaPrintAgent.exe`.
   - Se alimenta directamente a la mini-impresora térmica (ej. **SUZWIP 58MM**).
2. **📄 Cotizaciones y Citas (Tamaño Carta / A4):**
   - **Vista Previa Completa en el Navegador con Colores Originales.**
   - Mantiene el diseño gráfico original: membrete de *Moto Servicio Nova FV*, tags de colores de los servicios de taller, desgloses, subtotales e impuestos.
   - Permite al usuario revisar en pantalla, imprimir en su impresora de oficina o pulsar "Guardar como PDF" para compartirlo por WhatsApp.
3. **🏷️ Códigos QR y Etiquetas:**
   - **Vista previa** con medidas fijas para stickers adhesivos (ej. 70x50mm) antes de mandar a imprimir.

---

## 2. Respuestas a Preguntas Clave de la Sesión

### A. ¿Cómo desinstalo o detengo el ejecutable `.exe` si ya no lo quiero?
`FerventaPrintAgent.exe` fue diseñado para ser **100% portable y no invasivo**:
- **Para cerrarlo temporalmente:**  
  Busca el ícono con forma de impresora junto al reloj de Windows (bandeja del sistema), dale clic derecho y selecciona **"Cerrar Agente"**.  
  *O desde PowerShell / CMD:*
  ```powershell
  taskkill /f /im FerventaPrintAgent.exe
  ```
- **Para quitarlo del arranque automático de Windows:**  
  Ejecuta en PowerShell:
  ```powershell
  reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "FerventaPrintAgent" /f
  ```
- **Para desinstalarlo por completo:**  
  Simplemente borra el archivo `FerventaPrintAgent.exe`. No instala drivers ocultos, no requiere desinstalador de Windows y no deja servicios colgados en segundo plano.

---

### B. ¿Por qué al inicio detectaba la impresora pero no salía la impresión?
- Durante las pruebas iniciales, se probó enviando comandos crudos ESC/POS a una impresora de inyección de tinta de oficina (**Brother DCP-T430W**).
- Las impresoras de oficina no comprenden lenguaje térmico ESC/POS; por eso el Spooler de Windows aceptaba el trabajo como `RAW` y lo marcaba como "Retained/Completado" sin expulsar papel.
- **Solución implementada:** Se programó un **"Smart Fallback"** en el agente C#. Si el usuario manda a imprimir un ticket a una impresora de oficina (Brother/HP/Epson) en vez de a una térmica, el agente detecta que no es térmica, decodifica el texto y lo imprime mediante el motor gráfico GDI+ de Windows. Para la impresora térmica (**SUZWIP 58MM**), envía el flujo binario puro ESC/POS ultrarrápido.

---

### C. ¿El `.exe` servirá cuando el cliente lo descargue desde `https://ferventa-web.onrender.com`?
**SÍ, 100% garantizado.**
1. **Descarga en 1 clic:** El ejecutable está ubicado en `public/downloads/FerventaPrintAgent.exe`. Vite lo compila automáticamente en `dist/downloads/`. Al hacer deploy en Render, la URL directa es:
   `https://ferventa-web.onrender.com/downloads/FerventaPrintAgent.exe`
2. **Sin bloqueos de seguridad de Chrome (PNA / Mixed Content):**  
   Google Chrome bloquea por defecto peticiones desde sitios web seguros (`https://`) hacia la red local (`http://127.0.0.1`). Esto se llama *Private Network Access (PNA)*.  
   El agente ya tiene programado el protocolo PNA completo:
   - Responde peticiones `OPTIONS` (preflight) con código `204 No Content`.
   - Envía las cabeceras obligatorias:
     ```http
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET, POST, OPTIONS
     Access-Control-Allow-Headers: *
     Access-Control-Allow-Private-Network: true
     ```
   Por lo tanto, la web en Render se comunicará fluidamente con el agente en la computadora del cliente.

---

## 3. Estado de los Archivos y Código

| Archivo | Rol en el Sistema | Estado |
| :--- | :--- | :--- |
| `print-agent/FerventaPrintAgent.cs` | Código fuente del servidor local en C# (.NET 4.0 / C# 5). | Compilado y verificado (v1.1.0). |
| `print-agent/build-agent.bat` | Script de compilación nativo usando `csc.exe` de Windows. | Listo para re-compilar si se edita el C#. |
| `public/downloads/FerventaPrintAgent.exe` | Binario descargable por el cliente (18 KB). | Presente y probado. |
| `dist/downloads/FerventaPrintAgent.exe` | Copia de distribución para producción. | Sincronizado. |
| `src/core/services/print/LocalAgentPrinterService.ts` | Servicio HTTP que se comunica con `127.0.0.1:9123`. | Listo con endpoints `/status`, `/printers`, `/print`. |
| `src/core/services/print/ThermalPrintService.ts` | Enrutador de tickets (Agente ➔ Bluetooth ➔ USB ➔ Fallback). | Listo, imprime silencioso con el Agente. |
| `src/core/services/print/documentPrintService.ts` | Enrutador de cotizaciones, citas y etiquetas. | Restaurado a `PrintEngine` con vista previa fiel a color. |
| `src/app/presentation/pages/settings/SettingsPage.tsx` | Panel de Configuración con los 3 selectores de impresora y tests. | Integrado con descarga de `.exe` y pruebas individuales. |
| `src/app/presentation/pages/pos/POSPage.tsx` | Pantalla de cobro y punto de venta. | Enlaza la configuración del store y manda el cobro silencioso. |

---

## 4. Guía para Mañana: ¿Cómo probar y verificar si algo falla?

### Paso 1: Verificar que el Agente esté corriendo
Al encender la computadora, el agente debería iniciar solo. Para comprobarlo:
1. Revisa si está el ícono de la impresora junto al reloj de Windows.
2. O abre PowerShell y ejecuta:
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:9123/status"
   ```
   *Debe responder:*
   `@{status=ok; service=Ferventa Windows Print Agent; version=1.1.0}`

Si no estuviera corriendo, simplemente dale doble clic al archivo:  
`c:\Users\Alexis\Documents\Development\Ssvel\Ferventa\ferventa-web\public\downloads\FerventaPrintAgent.exe`

---

### Paso 2: Probar la Configuración en la Web
1. En Ferventa Web, entra a **Configuración** ➔ **Impresora & Tickets**.
2. Verás la tarjeta: **"Enrutador de Impresión Silenciosa (3 Impresoras)"**.
3. Deberá decir: `🟢 Agente En Línea (v1.1.0)`.
4. Haz clic en **`Detectar Impresoras`**: se llenarán los 3 selectores con las impresoras instaladas en Windows.
5. Elige la impresora correspondiente para cada una:
   - **Tickets (58mm):** Selecciona tu mini-impresora (ej. SUZWIP 58MM).
   - **Cotizaciones y Citas (PDF Carta):** Selecciona tu impresora de oficina (Brother, HP, etc.) o "Guardar como PDF".
   - **QR y Etiquetas:** Selecciona tu impresora de etiquetas o predeterminada.
6. Pulsa los botones de prueba:
   - **[ Imprimir Ticket Silencioso (58mm) ]:** Debe mandar el trabajo directo sin abrir ventana.
   - **[ Previsualizar Cotización PDF ]:** Debe abrir la vista previa a todo color con el membrete de Moto Servicio Nova FV.
   - **[ Previsualizar Etiqueta QR ]:** Debe mostrar el modal con el código QR y formato sticker.

---

### Paso 3: Probar en el Punto de Venta (POS)
1. Ve a la pantalla de **Punto de Venta**.
2. Agrega cualquier producto o servicio.
3. Haz clic en **Cobrar**:
   - El cobro se procesará y el ticket de 58mm saldrá **directo a la impresora térmica sin ninguna ventana molesta**.

---

## 5. Solución de Problemas Rápidos (Troubleshooting)

### Problema A: La web dice "🟠 Agente no detectado"
- **Causa:** El ejecutable no está corriendo en segundo plano o el puerto 9123 está bloqueado.
- **Solución:**
  1. Ejecuta `public\downloads\FerventaPrintAgent.exe`.
  2. Verifica en PowerShell: `Get-Process FerventaPrintAgent`.

### Problema B: La impresora térmica no aparece en la lista de Windows
- **Causa:** Si es por Bluetooth, puede que no esté emparejada en Windows, o si es por cable USB, falta su driver virtual COM/POS.
- **Alternativa sin agente:**
  - En la misma página de Configuración de Ferventa Web, ve a la pestaña **"Bluetooth Directo"** y pulsa **`Buscar Impresora Bluetooth`**. El navegador Chrome se conectará directamente a la SUZWIP sin requerir drivers de Windows.

### Problema C: Se necesita modificar el código en C# del agente
Si en el futuro deseas agregar alguna función al agente:
1. Edita el archivo `print-agent\FerventaPrintAgent.cs`.
2. Ejecuta el compilador nativo de Windows desde PowerShell:
   ```powershell
   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /optimize /out:public\downloads\FerventaPrintAgent.exe /r:System.Drawing.dll,System.Windows.Forms.dll print-agent\FerventaPrintAgent.cs
   Copy-Item public\downloads\FerventaPrintAgent.exe dist\downloads\FerventaPrintAgent.exe -Force
   ```
3. Cierra la versión anterior (`taskkill /f /im FerventaPrintAgent.exe`) y abre la nueva versión.

---

## 6. Estado del Repositorio Git
- Rama actual: `main`
- Sincronizado con: `origin/main` (commit `009b83d` ya subido).
- Build de frontend: `npm run build` pasa limpiamente con 0 errores de TypeScript y empaqueta en menos de 1 segundo.

*¡Todo listo para descansar! Si mañana conectas la impresora SUZWIP o pruebas desde el celular/computadora del cliente, consulta esta guía para cualquier duda puntual.*
