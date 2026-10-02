/**
 * Ferventa Local Windows Print Agent Service
 * 
 * Communicates with FerventaPrintAgent.exe running locally on http://127.0.0.1:9123
 * Allows querying all installed Windows printers and sending 100% silent print jobs
 * directly to assigned thermal, document, and label printers.
 */

const AGENT_BASE_URL = 'http://127.0.0.1:9123';

export interface AgentStatusResponse {
  status: string;
  service: string;
  version: string;
}

export interface AgentPrintersResponse {
  printers: string[];
}

export class LocalAgentPrinterService {
  /**
   * Check if FerventaPrintAgent.exe is currently running on the user's machine
   */
  public async isAgentRunning(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${AGENT_BASE_URL}/status`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return false;
      const data: AgentStatusResponse = await res.json();
      return data && data.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Retrieves the full list of all printers installed in Windows
   */
  public async getInstalledPrinters(): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${AGENT_BASE_URL}/printers`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return [];
      const data: AgentPrintersResponse = await res.json();
      return Array.isArray(data.printers) ? data.printers : [];
    } catch (err) {
      console.warn('[LocalAgentPrinterService] Error al obtener impresoras:', err);
      return [];
    }
  }

  /**
   * Prints raw ESC/POS binary bytes silently to the specified Windows printer
   */
  public async printRawTicket(printerName: string, rawBytes: Uint8Array): Promise<boolean> {
    try {
      // Convert Uint8Array to Base64
      let binary = '';
      const len = rawBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(rawBytes[i]);
      }
      const rawBase64 = btoa(binary);

      const res = await fetch(`${AGENT_BASE_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerName,
          rawBase64,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[LocalAgentPrinterService] Error en impresión raw:', errorText);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[LocalAgentPrinterService] Error de conexión al imprimir ticket:', err);
      return false;
    }
  }

  /**
   * Prints an HTML document (Quotation / Appointment / QR) silently to the specified Windows printer
   */
  public async printHtmlDocument(printerName: string, html: string): Promise<boolean> {
    try {
      const res = await fetch(`${AGENT_BASE_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerName,
          html,
        }),
      });

      if (!res.ok) {
        return false;
      }
      return true;
    } catch (err) {
      console.error('[LocalAgentPrinterService] Error de conexión al imprimir documento:', err);
      return false;
    }
  }
}

export const localAgentPrinterService = new LocalAgentPrinterService();
