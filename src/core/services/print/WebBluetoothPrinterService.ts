/**
 * Web Bluetooth Thermal Printer Service
 * 
 * Communicates directly with Bluetooth ESC/POS receipt printers (such as SUZWIP 58mm)
 * via the browser's native Web Bluetooth API (Chrome / Edge / Opera on Windows, Android, Mac)
 * without displaying any browser print preview dialog.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice: (options: any) => Promise<any>;
      getDevices?: () => Promise<any[]>;
    };
  }
}

// Well-known Bluetooth GATT services used by 58mm and 80mm ESC/POS thermal printers
const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer ESC/POS service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common HM-10 style serial service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // POS-58 specific service
  '0000af30-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
];

export class WebBluetoothPrinterService {
  private activeDevice: any = null;
  private writeCharacteristic: any = null;
  private isConnecting: boolean = false;

  /**
   * Check if current browser supports Web Bluetooth
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
  }

  /**
   * Check if currently attempting connection
   */
  public isConnectingToDevice(): boolean {
    return this.isConnecting;
  }

  /**
   * Check if currently connected to a device
   */
  public isConnected(): boolean {
    return Boolean(this.activeDevice && this.activeDevice.gatt && this.activeDevice.gatt.connected);
  }

  /**
   * Returns paired device name
   */
  public getDeviceName(): string | null {
    if (this.activeDevice && this.activeDevice.name) {
      return this.activeDevice.name;
    }
    return null;
  }

  /**
   * Prompts the user with Chrome's native Bluetooth device picker
   */
  public async requestAndPairDevice(): Promise<boolean> {
    if (!this.isSupported() || !navigator.bluetooth) {
      throw new Error('Tu navegador no soporta Web Bluetooth. Usa Google Chrome o Microsoft Edge.');
    }

    try {
      this.isConnecting = true;
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_SERVICES,
      });

      this.activeDevice = device;

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        console.warn('[WebBluetoothPrinter] Dispositivo Bluetooth desconectado.');
        this.writeCharacteristic = null;
      });

      // Connect to GATT
      await this.connectGatt();
      return true;
    } catch (err: any) {
      if (err?.name === 'NotFoundError') {
        // User cancelled picker
        return false;
      }
      console.error('[WebBluetoothPrinter] Error al emparejar Bluetooth:', err);
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Connects to GATT server and discovers writable characteristic
   */
  private async connectGatt(): Promise<boolean> {
    if (!this.activeDevice) return false;

    try {
      const server = await this.activeDevice.gatt.connect();

      // Find primary service and writable characteristic
      for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();

          for (const char of characteristics) {
            const props = char.properties;
            if (props.write || props.writeWithoutResponse) {
              this.writeCharacteristic = char;
              console.log(`[WebBluetoothPrinter] Canal listo: servicio ${serviceUuid}`);
              return true;
            }
          }
        } catch {
          // Service not supported on this device, continue searching
        }
      }

      // If not in standard list, search across all available services
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              const props = char.properties;
              if (props.write || props.writeWithoutResponse) {
                this.writeCharacteristic = char;
                console.log(`[WebBluetoothPrinter] Canal general encontrado: ${service.uuid}`);
                return true;
              }
            }
          } catch {
            // continue
          }
        }
      } catch {
        // continue
      }

      return false;
    } catch (err) {
      console.error('[WebBluetoothPrinter] Error al conectar GATT:', err);
      return false;
    }
  }

  /**
   * Disconnects current device
   */
  public disconnect(): void {
    if (this.activeDevice && this.activeDevice.gatt && this.activeDevice.gatt.connected) {
      try {
        this.activeDevice.gatt.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeDevice = null;
    this.writeCharacteristic = null;
  }

  /**
   * Sends raw ESC/POS binary data in chunks over Bluetooth GATT
   */
  public async printRaw(data: Uint8Array): Promise<boolean> {
    if (!this.activeDevice) {
      return false;
    }

    try {
      if (!this.isConnected() || !this.writeCharacteristic) {
        const reconnected = await this.connectGatt();
        if (!reconnected || !this.writeCharacteristic) {
          throw new Error('No se pudo reestablecer conexión con la impresora Bluetooth.');
        }
      }

      // BLE MTU chunking: send in chunks of 100 bytes to avoid packet drops
      const CHUNK_SIZE = 100;
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        if (this.writeCharacteristic.writeValueWithoutResponse) {
          await this.writeCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.writeCharacteristic.writeValue(chunk);
        }
        // Micro pause for slow printer buffer
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      return true;
    } catch (err) {
      console.error('[WebBluetoothPrinter] Error al enviar ticket por Bluetooth:', err);
      this.writeCharacteristic = null;
      return false;
    }
  }
}

export const webBluetoothPrinterService = new WebBluetoothPrinterService();
