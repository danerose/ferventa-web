/**
 * ESC/POS Binary Command Encoder
 * 
 * Generates low-level binary ESC/POS command sequences for direct thermal printer hardware
 * communication via WebBluetooth and WebSerial without browser print dialogs.
 */

export type EscPosAlign = 'left' | 'center' | 'right';
export type EscPosPaperWidth = '58mm' | '80mm';

export class EscPosEncoder {
  private buffer: number[] = [];
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
    return this;
  }

  /**
   * Print a line of text (with newline)
   */
  public line(str: string = ''): this {
    if (str.length > 0) {
      this.text(str);
    }
    this.buffer.push(0x0a); // LF
    return this;
  }

  /**
   * Feed empty lines
   */
  public feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  /**
   * Print horizontal separator line (e.g. '=' or '-')
   */
  public separator(char: string = '-'): this {
    const lineStr = char.charAt(0).repeat(this.maxChars);
    return this.line(lineStr);
  }

  /**
   * Formats a row with two columns (left-aligned label, right-aligned value)
   */
  public rowTwoColumns(left: string, right: string, boldLeft: boolean = false, boldRight: boolean = false): this {
    const cleanLeft = this.sanitize(left);
    const cleanRight = this.sanitize(right);
    const available = this.maxChars - cleanRight.length;

    if (available <= 0) {
      this.line(cleanLeft);
      this.line(cleanRight.padStart(this.maxChars, ' '));
      return this;
    }

    const truncatedLeft = cleanLeft.slice(0, available);
    const spaces = ' '.repeat(Math.max(1, this.maxChars - truncatedLeft.length - cleanRight.length));

    if (boldLeft === boldRight) {
      this.bold(boldLeft);
      this.line(truncatedLeft + spaces + cleanRight);
      this.bold(false);
    } else {
      this.bold(boldLeft);
      this.text(truncatedLeft + spaces);
      this.bold(boldRight);
      this.line(cleanRight);
      this.bold(false);
    }
    return this;
  }

  /**
   * Formats an item row: Quantity (col 1), Concept/Name (col 2), Amount (col 3)
   */
  public itemRow(qty: number, name: string, amount: string): this {
    const qtyStr = String(qty).padEnd(3, ' ');
    const amtStr = amount.padStart(8, ' ');
    const nameMaxLen = this.maxChars - qtyStr.length - amtStr.length;

    const cleanName = this.sanitize(name);

    if (cleanName.length <= nameMaxLen) {
      const paddedName = cleanName.padEnd(nameMaxLen, ' ');
      this.line(`${qtyStr}${paddedName}${amtStr}`);
    } else {
      const firstLineName = cleanName.slice(0, nameMaxLen).padEnd(nameMaxLen, ' ');
      this.line(`${qtyStr}${firstLineName}${amtStr}`);

      let remaining = cleanName.slice(nameMaxLen);
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, nameMaxLen);
        this.line(`   ${chunk}`);
        remaining = remaining.slice(nameMaxLen);
      }
    }
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
   * Export the assembled byte sequence as Uint8Array
   */
  public encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
