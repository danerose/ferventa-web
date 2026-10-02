/**
 * Direct USB & Serial Printer Service
 * 
 * Directly communicates with USB and Virtual COM thermal printers (such as SUZWIP 58mm)
 * via WebUSB and WebSerial native APIs in Google Chrome and Microsoft Edge without
 * opening any browser print preview dialog.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Navigator {
    usb?: {
      requestDevice: (options: { filters: any[] }) => Promise<any>;
      getDevices: () => Promise<any[]>;
    };
    serial?: {
      requestPort: (options?: any) => Promise<any>;
      getPorts: () => Promise<any[]>;
    };
  }
}

export class DirectUsbPrinterService {
  private activeUsbDevice: any = null;
  private activeSerialPort: any = null;

  /**
   * Check if current browser supports WebUSB or WebSerial
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && (Boolean(navigator.usb) || Boolean(navigator.serial));
  }

  /**
   * Check if user has already granted permission to a USB or Serial device
   */
  public async isPortPaired(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      if (navigator.usb) {
        const usbDevices = await navigator.usb.getDevices();
        if (usbDevices.length > 0) return true;
      }
      if (navigator.serial) {
        const serialPorts = await navigator.serial.getPorts();
        if (serialPorts.length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Returns a friendly name for the currently paired USB or Serial device
   */
  public async getPairedDeviceName(): Promise<string | null> {
    if (!this.isSupported()) return null;
    try {
      if (navigator.usb) {
        const usbDevices = await navigator.usb.getDevices();
        if (usbDevices.length > 0) {
          const dev = usbDevices[0];
          const name = dev.productName || dev.manufacturerName;
          if (name) return name;
          return `Dispositivo USB (ID: ${dev.vendorId.toString(16)}:${dev.productId.toString(16)})`;
        }
      }
      if (navigator.serial) {
        const serialPorts = await navigator.serial.getPorts();
        if (serialPorts.length > 0) {
          const info = serialPorts[0].getInfo ? serialPorts[0].getInfo() : {};
          if (info.usbVendorId) {
            return `Puerto Serial USB (VID: ${info.usbVendorId.toString(16)})`;
          }
          return 'Puerto Serie / COM';
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Prompts the user with Chrome's native USB device selector (WebUSB).
   */
  public async requestUsbDevice(): Promise<boolean> {
    if (!navigator.usb) {
      throw new Error('Tu navegador no soporta WebUSB. Usa Google Chrome o Microsoft Edge.');
    }

    try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      this.activeUsbDevice = device;
      return true;
    } catch (err: any) {
      if (err?.name === 'NotFoundError') {
        return false;
      }
      throw err;
    }
  }

  /**
   * Prompts user with Chrome's WebSerial port picker (COM / USB-Serial)
   */
  public async requestSerialPort(): Promise<boolean> {
    if (!navigator.serial) {
      throw new Error('Tu navegador no soporta WebSerial. Usa Google Chrome o Microsoft Edge.');
    }

    try {
      const port = await navigator.serial.requestPort();
      this.activeSerialPort = port;
      return true;
    } catch (err: any) {
      if (err?.name === 'NotFoundError') {
        return false;
      }
      throw err;
    }
  }

  /**
   * Universal pairing: tries WebUSB first, falls back to WebSerial
   */
  public async requestAndPairPort(): Promise<boolean> {
    if (navigator.serial) {
      try {
        const ok = await this.requestSerialPort();
        if (ok) return true;
      } catch (err: any) {
        if (err?.name !== 'NotFoundError' && navigator.usb) {
          return await this.requestUsbDevice();
        }
        throw err;
      }
    } else if (navigator.usb) {
      return await this.requestUsbDevice();
    }
    return false;
  }

  /**
   * Gets paired WebUSB device if available
   */
  private async getUsbDevice(): Promise<any | null> {
    if (this.activeUsbDevice) return this.activeUsbDevice;
    if (navigator.usb) {
      try {
        const devices = await navigator.usb.getDevices();
        if (devices.length > 0) {
          this.activeUsbDevice = devices[0];
          return this.activeUsbDevice;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  /**
   * Gets paired WebSerial port if available
   */
  private async getSerialPort(): Promise<any | null> {
    if (this.activeSerialPort) return this.activeSerialPort;
    if (navigator.serial) {
      try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          this.activeSerialPort = ports[0];
          return this.activeSerialPort;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  /**
   * Disconnects / forgets active device references
   */
  public forgetPort(): void {
    if (this.activeUsbDevice) {
      try {
        if (this.activeUsbDevice.opened) {
          this.activeUsbDevice.close().catch(() => {});
        }
      } catch {
        // ignore
      }
      this.activeUsbDevice = null;
    }

    if (this.activeSerialPort) {
      try {
        if (this.activeSerialPort.readable || this.activeSerialPort.writable) {
          this.activeSerialPort.close().catch(() => {});
        }
      } catch {
        // ignore
      }
      this.activeSerialPort = null;
    }
  }

  /**
   * Sends raw binary ESC/POS byte array directly to USB / Serial POS-58 printer.
   */
  public async printRaw(data: Uint8Array, baudRate: number = 9600): Promise<boolean> {
    // 1. Try WebSerial first (most reliable for Windows virtual COM and USB POS-58)
    const serialPort = await this.getSerialPort();
    if (serialPort) {
      try {
        if (!serialPort.writable) {
          await serialPort.open({
            baudRate: baudRate || 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none',
          });
        }

        const writer = serialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return true;
      } catch (serialErr) {
        console.warn('[DirectUsbPrinterService] Error en WebSerial, probando WebUSB:', serialErr);
        this.activeSerialPort = null;
      }
    }

    // 2. Try WebUSB if Serial is not active or failed
    const usbDevice = await this.getUsbDevice();
    if (usbDevice) {
      try {
        if (!usbDevice.opened) {
          await usbDevice.open();
        }

        if (usbDevice.configuration === null) {
          await usbDevice.selectConfiguration(1);
        }

        let targetInterface = 0;
        let endpointOut = 1;

        const config = usbDevice.configuration;
        if (config && config.interfaces) {
          for (const iface of config.interfaces) {
            const alternates = iface.alternates || [iface.alternate];
            for (const alt of alternates) {
              if (alt && alt.endpoints) {
                const out = alt.endpoints.find((ep: any) => ep.direction === 'out');
                if (out) {
                  targetInterface = iface.interfaceNumber;
                  endpointOut = out.endpointNumber;
                  break;
                }
              }
            }
          }
        }

        try {
          await usbDevice.claimInterface(targetInterface);
        } catch {
          // May already be claimed
        }

        const result = await usbDevice.transferOut(endpointOut, data);
        if (result && (result.status === 'ok' || result.bytesWritten > 0)) {
          return true;
        }
      } catch (usbErr) {
        console.error('[DirectUsbPrinterService] Error en WebUSB:', usbErr);
        this.activeUsbDevice = null;
      }
    }

    return false;
  }
}

export const directUsbPrinterService = new DirectUsbPrinterService();
