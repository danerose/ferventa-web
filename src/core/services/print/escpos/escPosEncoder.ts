/**
 * ESC/POS Binary Command Encoder
 * 
 * Generates low-level binary ESC/POS command sequences for direct thermal printer hardware
 * communication via WebBluetooth and WebSerial without browser print dialogs.
 */

import { NOVA_FV_LOGO_ESCPOS_58MM, NOVA_FV_LOGO_ESCPOS_80MM } from '../logoDataUri';

export type EscPosAlign = 'left' | 'center' | 'right';
export type EscPosPaperWidth = '58mm' | '80mm';

export class EscPosEncoder {
  private buffer: number[] = [];
  private textLines: string[] = [''];
  private readonly maxChars: number;

  constructor(paperWidth: EscPosPaperWidth = '58mm') {
    // 58mm roll: standard 32 characters in Font A (12x24)
    // 80mm roll: standard 48 characters in Font A (12x24)
    this.maxChars = paperWidth === '80mm' ? 48 : 32;
    this.init();
  }

  public getMaxChars(): number {
    return this.maxChars;
  }

  /**
   * Reset/Initialize printer state
   */
  public init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    // Select standard code table (CP437)
    this.buffer.push(0x1b, 0x74, 0x00); // ESC t 0
    return this;
  }

  /**
   * Text justification
   */
  public align(alignment: EscPosAlign): this {
    const code = alignment === 'center' ? 0x01 : alignment === 'right' ? 0x02 : 0x00;
    this.buffer.push(0x1b, 0x61, code); // ESC a n
    return this;
  }

  /**
   * Bold mode
   */
  public bold(enabled: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enabled ? 0x01 : 0x00); // ESC E n
    return this;
  }

  /**
   * Double size (height and width)
   */
  public doubleSize(enabled: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enabled ? 0x11 : 0x00); // GS ! n
    return this;
  }

  /**
   * Double height only
   */
  public doubleHeight(enabled: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enabled ? 0x01 : 0x00); // GS ! n
    return this;
  }

  /**
   * Underline mode
   */
  public underline(enabled: boolean = true): this {
    this.buffer.push(0x1b, 0x2d, enabled ? 0x01 : 0x00); // ESC - n
    return this;
  }

  /**
   * Sanitize text: normalize accents, map Spanish letters into standard single-byte representation
   * to prevent garbled characters on generic POS-58 firmware.
   */
  private sanitize(str: string): string {
    return str
      .replace(/[áäàâ]/g, 'a')
      .replace(/[ÁÄÀÂ]/g, 'A')
      .replace(/[éëèê]/g, 'e')
      .replace(/[ÉËÈÊ]/g, 'E')
      .replace(/[íïìî]/g, 'i')
      .replace(/[ÍÏÌÎ]/g, 'I')
      .replace(/[óöòô]/g, 'o')
      .replace(/[ÓÖÒÔ]/g, 'O')
      .replace(/[úüùû]/g, 'u')
      .replace(/[ÚÜÙÛ]/g, 'U')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N')
      .replace(/¿/g, '')
      .replace(/¡/g, '');
  }

  /**
   * Add raw text bytes
   */
  public text(str: string): this {
    const clean = this.sanitize(str);
    for (let i = 0; i < clean.length; i++) {
      this.buffer.push(clean.charCodeAt(i) & 0xff);
    }
    this.textLines[this.textLines.length - 1] += clean;
    return this;
  }

  /**
   * Splits text into lines that fit within maxLen characters, breaking on word boundaries where possible.
   */
  public wrapText(text: string, maxLen: number): string[] {
    const clean = this.sanitize(text).trim();
    if (!clean) return [];
    if (clean.length <= maxLen) return [clean];

    const words = clean.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (word.length > maxLen) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        let remaining = word;
        while (remaining.length > maxLen) {
          lines.push(remaining.slice(0, maxLen));
          remaining = remaining.slice(maxLen);
        }
        currentLine = remaining;
      } else if (currentLine.length + 1 + word.length <= maxLen) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Appends newline byte to binary buffer and advances plain-text line list.
   */
  public newLine(): this {
    this.buffer.push(0x0a);
    this.textLines.push('');
    return this;
  }

  /**
   * Print a line of text (with newline). Automatically wraps on word boundaries if longer than maxChars.
   */
  public line(str: string = ''): this {
    if (str.length > 0) {
      const clean = this.sanitize(str);
      if (clean.length > this.maxChars && !clean.startsWith('=') && !clean.startsWith('-') && !clean.startsWith('*')) {
        const wrapped = this.wrapText(clean, this.maxChars);
        wrapped.forEach((l) => {
          this.text(l);
          this.newLine();
        });
        return this;
      }
      this.text(clean);
    }
    this.newLine();
    return this;
  }

  /**
   * Feed empty lines
   */
  public feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.newLine();
    }
    return this;
  }

  /**
   * Print horizontal separator line (e.g. '=' or '-')
   */
  public separator(char: string = '-'): this {
    const lineStr = char.charAt(0).repeat(this.maxChars);
    this.text(lineStr);
    this.newLine();
    return this;
  }

  /**
   * Formats a row with two columns (left-aligned label, right-aligned value).
   * If left label exceeds available space, wraps cleanly across 2, 3 or N lines without truncating.
   */
  public rowTwoColumns(left: string, right: string, boldLeft: boolean = false, boldRight: boolean = false): this {
    const cleanRight = this.sanitize(right).trim();
    const available = Math.max(8, this.maxChars - cleanRight.length - 1);
    const leftLines = this.wrapText(left, available);

    if (leftLines.length === 0) {
      this.bold(boldRight);
      this.text(cleanRight.padStart(this.maxChars, ' '));
      this.newLine();
      this.bold(false);
      return this;
    }

    // First line with right value aligned to the right margin
    const firstLeft = leftLines[0];
    const spaces = ' '.repeat(Math.max(1, this.maxChars - firstLeft.length - cleanRight.length));

    if (boldLeft === boldRight) {
      this.bold(boldLeft);
      this.text(firstLeft + spaces + cleanRight);
      this.newLine();
      this.bold(false);
    } else {
      this.bold(boldLeft);
      this.text(firstLeft + spaces);
      this.bold(boldRight);
      this.text(cleanRight);
      this.newLine();
      this.bold(false);
    }

    // Subsequent lines for left text (2, 3 or N lines)
    for (let i = 1; i < leftLines.length; i++) {
      this.bold(boldLeft);
      this.text(`  ${leftLines[i]}`);
      this.newLine();
      this.bold(false);
    }

    return this;
  }

  /**
   * Formats table header: CANT, CONCEPTO, IMPORTE
   */
  public itemHeader(cantLabel: string = 'CANT', conceptLabel: string = 'CONCEPTO', amtLabel: string = 'IMPORTE'): this {
    const qtyColLen = 4;
    const cleanAmt = this.sanitize(amtLabel).trim();
    const amtStr = cleanAmt.padStart(8, ' ');
    const nameMaxLen = Math.max(8, this.maxChars - qtyColLen - amtStr.length);
    const firstLineName = this.sanitize(conceptLabel).padEnd(nameMaxLen, ' ');
    this.text(`${cantLabel.padEnd(qtyColLen, ' ')}${firstLineName}${amtStr}`);
    this.newLine();
    return this;
  }

  /**
   * Formats an item row: Quantity (col 1), Concept/Name (col 2), Amount (col 3).
   * If concept exceeds available line length, wraps cleanly across 2, 3 or N lines.
   */
  public itemRow(qty: number, name: string, amount: string): this {
    const qtyColLen = 4;
    const qtyStr = String(qty).padEnd(qtyColLen, ' ');
    const cleanAmt = this.sanitize(amount).trim();
    const amtStr = cleanAmt.padStart(8, ' ');
    const nameMaxLen = Math.max(8, this.maxChars - qtyColLen - amtStr.length);

    const nameLines = this.wrapText(name, nameMaxLen);

    if (nameLines.length === 0) {
      this.text(`${qtyStr}${' '.repeat(nameMaxLen)}${amtStr}`);
      this.newLine();
      return this;
    }

    // First line: Qty + First part of Name + Amount
    const firstLineName = nameLines[0].padEnd(nameMaxLen, ' ');
    this.text(`${qtyStr}${firstLineName}${amtStr}`);
    this.newLine();

    // Subsequent lines (2, 3 or N lines): indented under the Name column
    const indent = ' '.repeat(qtyColLen);
    for (let i = 1; i < nameLines.length; i++) {
      this.text(`${indent}${nameLines[i]}`);
      this.newLine();
    }

    return this;
  }

  /**
   * Formats an indented supply row under a service:
   * e.g. "  - 4x Balatas (Incluido)" or
   * "  - 9x Balatas\n    (+$150.00)"
   */
  public supplyRow(qty: number, name: string, tag: string): this {
    const qtyPrefix = qty > 1 ? `${qty}x ` : '';
    const cleanName = this.sanitize(name).trim();
    const cleanTag = this.sanitize(tag).trim();
    const prefix = `  - ${qtyPrefix}`;
    const oneLine = `${prefix}${cleanName} ${cleanTag}`;

    if (oneLine.length <= this.maxChars) {
      this.text(oneLine);
      this.newLine();
      return this;
    }

    // Wrap name with prefix
    const subIndent = '    ';
    const nameMaxLen = Math.max(8, this.maxChars - prefix.length);
    const wrapped = this.wrapText(cleanName, nameMaxLen);

    if (wrapped.length > 0) {
      this.text(`${prefix}${wrapped[0]}`);
      this.newLine();
      for (let i = 1; i < wrapped.length; i++) {
        this.text(`${subIndent}${wrapped[i]}`);
        this.newLine();
      }
    }

    // Indented tag on its line
    this.text(`${subIndent}${cleanTag}`);
    this.newLine();

    return this;
  }

  /**
   * Appends raw binary bytes (e.g. graphics/raster bit-images) to buffer
   */
  public appendRawBytes(bytes: Uint8Array | number[]): this {
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  /**
   * Prints the high-contrast Moto Servicio Nova FV logo as an ESC/POS raster bit-image
   */
  public printLogo(paperWidth: EscPosPaperWidth = '58mm'): this {
    const rasterBytes = paperWidth === '80mm' ? NOVA_FV_LOGO_ESCPOS_80MM : NOVA_FV_LOGO_ESCPOS_58MM;
    this.appendRawBytes(rasterBytes);
    this.feed(1);
    return this;
  }

  /**
   * Cash drawer open pulse (Pin 2 / Pin 5 standard pulse)
   */
  public openDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  /**
   * Feed and Cut paper (Partial cut command with paper feed)
   */
  public cut(): this {
    this.feed(4);
    this.buffer.push(0x1d, 0x56, 0x42, 0x00); // GS V 'B' 0 (Feed and Cut)
    return this;
  }

  /**
   * Export the accumulated plain text of the ticket
   */
  public getText(): string {
    return this.textLines.join('\n').trim();
  }

  /**
   * Export the assembled byte sequence as Uint8Array
   */
  public encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
