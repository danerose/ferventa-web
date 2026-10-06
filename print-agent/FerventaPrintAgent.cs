using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace FerventaPrintAgent
{
    public class RawPrinterHelper
    {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public class DOCINFOW
        {
            [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
            [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
            [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
        }

        [DllImport("winspool.Drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPWStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

        [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOW di);

        [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

        public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes)
        {
            IntPtr hPrinter = IntPtr.Zero;
            DOCINFOW di = new DOCINFOW();
            bool bSuccess = false;
            di.pDocName = "Ferventa Ticket";
            di.pDataType = "RAW";

            if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero))
            {
                if (StartDocPrinter(hPrinter, 1, di))
                {
                    if (StartPagePrinter(hPrinter))
                    {
                        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(pBytes.Length);
                        Marshal.Copy(pBytes, 0, pUnmanagedBytes, pBytes.Length);
                        int dwWritten;
                        bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, pBytes.Length, out dwWritten);
                        Marshal.FreeCoTaskMem(pUnmanagedBytes);
                        EndPagePrinter(hPrinter);
                    }
                    EndDocPrinter(hPrinter);
                }
                ClosePrinter(hPrinter);
            }
            return bSuccess;
        }
    }

    public static class Program
    {
        private static NotifyIcon trayIcon;
        private static HttpListener listener;
        private static Thread listenerThread;
        private static bool isRunning = true;
        private const int PORT = 9123;
        private const string APP_NAME = "FerventaPrintAgent";

        [STAThread]
        public static void Main(string[] args)
        {
            // Support CLI command line --uninstall or -u
            if (args != null && args.Length > 0)
            {
                foreach (string arg in args)
                {
                    if (arg.Equals("--uninstall", StringComparison.OrdinalIgnoreCase) ||
                        arg.Equals("/uninstall", StringComparison.OrdinalIgnoreCase) ||
                        arg.Equals("-u", StringComparison.OrdinalIgnoreCase))
                    {
                        UninstallAgent(silent: false);
                        return;
                    }
                }
            }

            bool isNewInstance;
            using (Mutex mutex = new Mutex(true, "Global\\FerventaPrintAgentMutex", out isNewInstance))
            {
                if (!isNewInstance)
                {
                    MessageBox.Show(
                        "Ferventa Print Agent ya se está ejecutando en segundo plano en esta computadora (Puerto " + PORT + ").\n\nRevisa los íconos de la barra de tareas junto al reloj.",
                        "Ferventa Print Agent",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information
                    );
                    return;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                // Auto register in Windows Startup (Run key)
                SetStartup(true);

                // Setup Tray Icon
                trayIcon = new NotifyIcon();
                trayIcon.Text = "Ferventa Print Agent (En línea en puerto " + PORT + ")";
                trayIcon.Icon = SystemIcons.Application;

                ContextMenu contextMenu = new ContextMenu();
                contextMenu.MenuItems.Add(new MenuItem("Ferventa Print Agent v1.2") { Enabled = false });
                contextMenu.MenuItems.Add("-");
                contextMenu.MenuItems.Add(new MenuItem("Ver Impresoras Detectadas", (s, e) => ShowPrinters()));
                contextMenu.MenuItems.Add(new MenuItem("Iniciar con Windows", (s, e) => ToggleStartup(s)));
                contextMenu.MenuItems[3].Checked = IsInStartup();
                contextMenu.MenuItems.Add("-");
                contextMenu.MenuItems.Add(new MenuItem("Desinstalar Agente de esta PC...", (s, e) => UninstallAgent(silent: false)));
                contextMenu.MenuItems.Add(new MenuItem("Salir", (s, e) => ExitApplication()));

                trayIcon.ContextMenu = contextMenu;
                trayIcon.Visible = true;

                // Start HTTP listener
                StartHttpServer();

                trayIcon.ShowBalloonTip(
                    2500,
                    "Ferventa Print Agent Iniciado",
                    "Listo para recibir impresiones silenciosas desde Ferventa Web (Puerto " + PORT + ").",
                    ToolTipIcon.Info
                );

                Application.Run();
            }
        }

        private static void ShowPrinters()
        {
            var printers = new List<string>();
            foreach (string p in PrinterSettings.InstalledPrinters)
            {
                printers.Add("• " + p);
            }
            string msg = printers.Count > 0
                ? "Impresoras detectadas en Windows:\n\n" + string.Join("\n", printers.ToArray())
                : "No se encontraron impresoras instaladas en Windows.";

            MessageBox.Show(msg, "Ferventa Print Agent - Impresoras", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private static void ToggleStartup(object sender)
        {
            var item = sender as MenuItem;
            if (item == null) return;
            bool enable = !item.Checked;
            SetStartup(enable);
            item.Checked = enable;
        }

        private static bool IsInStartup()
        {
            try
            {
                using (RegistryKey rk = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", false))
                {
                    return rk != null && rk.GetValue(APP_NAME) != null;
                }
            }
            catch
            {
                return false;
            }
        }

        private static void SetStartup(bool enable)
        {
            try
            {
                using (RegistryKey rk = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", true))
                {
                    if (rk != null)
                    {
                        if (enable)
                        {
                            string exePath = Application.ExecutablePath;
                            rk.SetValue(APP_NAME, "\"" + exePath + "\"");
                        }
                        else
                        {
                            rk.DeleteValue(APP_NAME, false);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al configurar inicio automatico: " + ex.Message);
            }
        }

        private static void UninstallAgent(bool silent = false)
        {
            if (!silent)
            {
                DialogResult dr = MessageBox.Show(
                    "¿Deseas desinstalar Ferventa Print Agent de esta computadora?\n\nEsto eliminará el agente del inicio automático de Windows y lo detendrá por completo.\n(No afectará tus archivos ni la plataforma web).",
                    "Desinstalar Ferventa Print Agent",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                );

                if (dr != DialogResult.Yes)
                {
                    return;
                }
            }

            try
            {
                SetStartup(false);
            }
            catch { }

            if (!silent)
            {
                MessageBox.Show(
                    "Ferventa Print Agent ha sido desinstalado del inicio de Windows y se detendrá ahora.\n\nPuedes volver a descargarlo e iniciarlo desde Ferventa Web en Ajustes cuando lo requieras.",
                    "Ferventa Print Agent Desinstalado",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }

            ExitApplication();
        }

        private static void ExitApplication()
        {
            isRunning = false;
            try
            {
                if (listener != null && listener.IsListening)
                {
                    listener.Stop();
                    listener.Close();
                }
            }
            catch { }

            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }

            Application.Exit();
        }

        private static void StartHttpServer()
        {
            listenerThread = new Thread(() =>
            {
                try
                {
                    listener = new HttpListener();
                    listener.Prefixes.Add("http://127.0.0.1:" + PORT + "/");
                    listener.Prefixes.Add("http://localhost:" + PORT + "/");
                    listener.Start();

                    while (isRunning && listener.IsListening)
                    {
                        var context = listener.GetContext();
                        ThreadPool.QueueUserWorkItem((ctx) => HandleRequest((HttpListenerContext)ctx), context);
                    }
                }
                catch (HttpListenerException)
                {
                    // Listener stopped
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error en HTTP listener: " + ex.Message);
                }
            });

            listenerThread.IsBackground = true;
            listenerThread.Start();
        }

        private static void HandleRequest(HttpListenerContext context)
        {
            HttpListenerRequest request = context.Request;
            HttpListenerResponse response = context.Response;

            // CORS & Private Network Access (PNA) headers for HTTPS sites (e.g. ferventa-web.onrender.com)
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "*");
            response.Headers.Add("Access-Control-Allow-Private-Network", "true");

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 204;
                response.Close();
                return;
            }

            string path = request.Url.AbsolutePath.ToLowerInvariant();

            try
            {
                // 1. Health Status
                if (request.HttpMethod == "GET" && path == "/status")
                {
                    SendJsonResponse(response, 200, "{\"status\":\"ok\",\"service\":\"Ferventa Windows Print Agent\",\"version\":\"1.1.0\"}");
                    return;
                }

                // 2. Installed Printers List
                if (request.HttpMethod == "GET" && path == "/printers")
                {
                    var list = new List<string>();
                    foreach (string p in PrinterSettings.InstalledPrinters)
                    {
                        list.Add("\"" + p.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"");
                    }
                    string json = "{\"printers\":[" + string.Join(",", list.ToArray()) + "]}";
                    SendJsonResponse(response, 200, json);
                    return;
                }

                // 3. Print Request
                if (request.HttpMethod == "POST" && path == "/print")
                {
                    string body = "";
                    using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
                    {
                        body = reader.ReadToEnd();
                    }

                    string printerName = ExtractJsonValue(body, "printerName");
                    string rawBase64 = ExtractJsonValue(body, "rawBase64");
                    string htmlContent = ExtractJsonValue(body, "html");
                    string ticketText = ExtractJsonValue(body, "ticketText");
                    string logoBase64 = ExtractJsonValue(body, "logoBase64");
                    string paperWidth = ExtractJsonValue(body, "paperWidth");

                    string actualPrinter = ResolvePrinter(printerName);

                    // A) TICKET PRINTING WITH GDI+ (Draw Graphic Logo + Crisp Text)
                    if (!string.IsNullOrEmpty(ticketText))
                    {
                        bool ok = PrintTicketWithGdi(actualPrinter, ticketText, logoBase64, "Ticket Ferventa", paperWidth);
                        if (!ok && !string.IsNullOrEmpty(rawBase64))
                        {
                            byte[] bytes = Convert.FromBase64String(rawBase64);
                            ok = RawPrinterHelper.SendBytesToPrinter(actualPrinter, bytes);
                        }

                        if (ok)
                        {
                            ShowNotification("Ticket Impreso", "Ticket enviado correctamente a: " + actualPrinter);
                            SendJsonResponse(response, 200, "{\"success\":true,\"printer\":\"" + actualPrinter.Replace("\"", "\\\"") + "\"}");
                        }
                        else
                        {
                            SendJsonResponse(response, 500, "{\"error\":\"No se pudo imprimir en la impresora " + actualPrinter.Replace("\"", "\\\"") + "\"}");
                        }
                        return;
                    }

                    // B) RAW ESC/POS TICKET FALLBACK
                    if (!string.IsNullOrEmpty(rawBase64))
                    {
                        byte[] bytes = Convert.FromBase64String(rawBase64);
                        bool ok = RawPrinterHelper.SendBytesToPrinter(actualPrinter, bytes);

                        if (!ok)
                        {
                            string extracted = ExtractTextFromEscPos(bytes);
                            ok = PrintTicketWithGdi(actualPrinter, extracted, logoBase64, "Ticket Ferventa", paperWidth);
                        }

                        if (ok)
                        {
                            ShowNotification("Ticket Impreso", "Ticket enviado correctamente a: " + actualPrinter);
                            SendJsonResponse(response, 200, "{\"success\":true,\"printer\":\"" + actualPrinter.Replace("\"", "\\\"") + "\"}");
                        }
                        else
                        {
                            SendJsonResponse(response, 500, "{\"error\":\"No se pudo imprimir en la impresora " + actualPrinter.Replace("\"", "\\\"") + "\"}");
                        }
                        return;
                    }

                    // C) DOCUMENT / HTML PRINTING (Cotizaciones / Citas / QR)
                    if (!string.IsNullOrEmpty(htmlContent))
                    {
                        string plainText = HtmlToPlainText(htmlContent);
                        bool ok = PrintTextWithGdi(actualPrinter, plainText, "Documento Ferventa", false);

                        if (ok)
                        {
                            ShowNotification("Documento Impreso", "Documento enviado correctamente a: " + actualPrinter);
                            SendJsonResponse(response, 200, "{\"success\":true,\"printer\":\"" + actualPrinter.Replace("\"", "\\\"") + "\"}");
                        }
                        else
                        {
                            SendJsonResponse(response, 500, "{\"error\":\"Error al enviar documento a la impresora " + actualPrinter.Replace("\"", "\\\"") + "\"}");
                        }
                        return;
                    }

                    SendJsonResponse(response, 400, "{\"error\":\"Falta ticketText, rawBase64 o html en la peticion\"}");
                    return;
                }

                response.StatusCode = 404;
                response.Close();
            }
            catch (Exception ex)
            {
                try
                {
                    SendJsonResponse(response, 500, "{\"error\":\"" + ex.Message.Replace("\"", "\\\"") + "\"}");
                }
                catch { }
            }
        }

        private static bool IsThermalPrinter(string printerName)
        {
            if (string.IsNullOrEmpty(printerName)) return false;
            string p = printerName.ToLowerInvariant();
            return p.Contains("pos") || p.Contains("58") || p.Contains("80") ||
                   p.Contains("suzwip") || p.Contains("thermal") || p.Contains("receipt") ||
                   p.Contains("ticket") || p.Contains("xprinter") || p.Contains("generic");
        }

        private static void ShowNotification(string title, string text)
        {
            try
            {
                if (trayIcon != null)
                {
                    trayIcon.ShowBalloonTip(2000, title, text, ToolTipIcon.Info);
                }
            }
            catch { }
        }

        private static string ExtractTextFromEscPos(byte[] bytes)
        {
            if (bytes == null || bytes.Length == 0) return "TICKET VACIO";
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                byte b = bytes[i];
                if (b == 0x1B || b == 0x1D) // ESC or GS command
                {
                    i++;
                    if (i < bytes.Length && (bytes[i] == 0x21 || bytes[i] == 0x61 || bytes[i] == 0x45 || bytes[i] == 0x4D || bytes[i] == 0x56 || bytes[i] == 0x64))
                    {
                        i++; // Skip argument
                    }
                    continue;
                }

                if (b == 0x0A) // Line Feed
                {
                    sb.AppendLine();
                }
                else if (b >= 32 && b <= 255)
                {
                    sb.Append((char)b);
                }
            }
            return sb.ToString().Trim();
        }

        private static string HtmlToPlainText(string html)
        {
            if (string.IsNullOrEmpty(html)) return "";
            string text = html;
            // Remove style and script blocks
            text = Regex.Replace(text, @"<style[^>]*>[\s\S]*?</style>", "", RegexOptions.IgnoreCase);
            text = Regex.Replace(text, @"<script[^>]*>[\s\S]*?</script>", "", RegexOptions.IgnoreCase);
            
            // Format block elements to newlines
            text = text.Replace("<br>", "\n").Replace("<br/>", "\n").Replace("<br />", "\n");
            text = text.Replace("</p>", "\n\n").Replace("</div>", "\n").Replace("</tr>", "\n");
            text = text.Replace("</td>", "  \t").Replace("</th>", "  \t");
            text = text.Replace("<li>", "• ");
            
            // Strip remaining tags
            text = Regex.Replace(text, @"<[^>]+>", "");

            // Decode HTML entities
            text = text.Replace("&nbsp;", " ").Replace("&amp;", "&").Replace("&quot;", "\"").Replace("&lt;", "<").Replace("&gt;", ">");
            return text.Trim();
        }

        private static string ResolvePrinter(string printerName)
        {
            if (string.IsNullOrEmpty(printerName))
            {
                return GetDefaultPrinter();
            }

            foreach (string p in PrinterSettings.InstalledPrinters)
            {
                if (p.Equals(printerName, StringComparison.OrdinalIgnoreCase))
                {
                    return p;
                }
            }

            // Fuzzy match
            string lower = printerName.ToLowerInvariant().Trim();
            foreach (string p in PrinterSettings.InstalledPrinters)
            {
                if (p.ToLowerInvariant().Contains(lower) || lower.Contains(p.ToLowerInvariant()))
                {
                    return p;
                }
            }

            // Thermal match
            if (lower.Contains("pos") || lower.Contains("58") || lower.Contains("80") || lower.Contains("thermal") || lower.Contains("suzwip"))
            {
                foreach (string p in PrinterSettings.InstalledPrinters)
                {
                    if (IsThermalPrinter(p)) return p;
                }
            }

            return GetDefaultPrinter();
        }

        private static bool PrintTicketWithGdi(string printerName, string text, string logoBase64, string docTitle, string paperWidth)
        {
            try
            {
                PrintDocument pd = new PrintDocument();
                pd.PrinterSettings.PrinterName = printerName;
                pd.DocumentName = docTitle;
                pd.PrintController = new StandardPrintController(); // Silent printing (no modal popup)

                if (!pd.PrinterSettings.IsValid)
                {
                    pd.PrinterSettings.PrinterName = GetDefaultPrinter();
                }

                pd.DefaultPageSettings.Margins = new Margins(2, 2, 0, 2);

                Bitmap logoBmp = null;
                if (!string.IsNullOrEmpty(logoBase64))
                {
                    try
                    {
                        byte[] imgBytes = Convert.FromBase64String(logoBase64);
                        using (MemoryStream ms = new MemoryStream(imgBytes))
                        {
                            logoBmp = new Bitmap(Image.FromStream(ms));
                        }
                    }
                    catch { }
                }

                pd.PrintPage += (s, ev) =>
                {
                    float y = 4;
                    float pageWidth = ev.PageBounds.Width;
                    bool isOfficePrinter = pageWidth > 350;

                    bool is80 = !string.IsNullOrEmpty(paperWidth) && paperWidth.Contains("80");
                    float printableWidth = is80 ? 270f : 195f;

                    float left = isOfficePrinter ? (pageWidth - printableWidth) / 2f : 2f;
                    float right = left + printableWidth;

                    ev.Graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                    ev.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                    ev.Graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;

                    // 1. Draw Graphic Logo
                    if (logoBmp != null)
                    {
                        float targetLogoW = Math.Min(printableWidth * 0.72f, 150f);
                        float targetLogoH = targetLogoW * ((float)logoBmp.Height / (float)logoBmp.Width);
                        float logoX = left + (printableWidth - targetLogoW) / 2f;

                        ev.Graphics.DrawImage(logoBmp, logoX, y, targetLogoW, targetLogoH);
                        y += targetLogoH + 6;
                    }

                    // 2. Draw Ticket Text
                    using (Font titleFont = new Font("Courier New", 9.0f, FontStyle.Bold))
                    using (Font bodyFont = new Font("Courier New", 7.8f, FontStyle.Regular))
                    using (Font boldFont = new Font("Courier New", 7.8f, FontStyle.Bold))
                    using (StringFormat centerFormat = new StringFormat { Alignment = StringAlignment.Center })
                    using (StringFormat leftFormat = new StringFormat { Alignment = StringAlignment.Near })
                    {
                        string[] lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
                        foreach (string rawLine in lines)
                        {
                            string line = rawLine.TrimEnd();

                            if (string.IsNullOrEmpty(line))
                            {
                                y += 4;
                                continue;
                            }

                            // Separator line
                            if (line.StartsWith("===") || line.StartsWith("---") || line.StartsWith("═══") || line.StartsWith("───"))
                            {
                                ev.Graphics.DrawLine(Pens.Black, left, y + 4, right, y + 4);
                                y += 8;
                                continue;
                            }

                            // Store title or header
                            if (line.Contains("MOTO SERVICIO NOVA FV") || line.Contains("SUCURSAL:") || line.Contains("RECEPCION DE VEHICULO") || line.Contains("COMPROBANTE DE CITA") || line.Contains("PEDIDO ESPECIAL"))
                            {
                                RectangleF rect = new RectangleF(left, y, printableWidth, 16);
                                ev.Graphics.DrawString(line, titleFont, Brushes.Black, rect, centerFormat);
                                y += titleFont.GetHeight(ev.Graphics) + 2;
                                continue;
                            }

                            // Subtitle / Tagline / Address / Phone
                            if (line.Contains("TALLER Y REFACCIONES PARA MOTOS") || line.Contains("Tel./WhatsApp:") || line.StartsWith("Calle 28") || line.Contains("Santa Barbara"))
                            {
                                RectangleF rect = new RectangleF(left, y, printableWidth, 14);
                                ev.Graphics.DrawString(line, bodyFont, Brushes.Black, rect, centerFormat);
                                y += bodyFont.GetHeight(ev.Graphics) + 1;
                                continue;
                            }

                            // Footer or policy headings
                            if (line.StartsWith("¡") || line.Contains("GRACIAS") || line.Contains("IMPORTANTE") || line.Contains("CONSERVE ESTE"))
                            {
                                RectangleF rect = new RectangleF(left, y, printableWidth, 14);
                                ev.Graphics.DrawString(line, boldFont, Brushes.Black, rect, centerFormat);
                                y += boldFont.GetHeight(ev.Graphics) + 2;
                                continue;
                            }

                            // Bold lines (Total, Subtotal, Table headers)
                            bool isBold = line.StartsWith("TOTAL:") || line.StartsWith("SUBTOTAL:") || line.StartsWith("CANT");
                            Font currentFont = isBold ? boldFont : bodyFont;

                            ev.Graphics.DrawString(line, currentFont, Brushes.Black, left, y);
                            y += currentFont.GetHeight(ev.Graphics) + 1;
                        }
                    }

                    ev.HasMorePages = false;
                };

                pd.Print();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al imprimir ticket con GDI+: " + ex.Message);
                return false;
            }
        }

        private static bool PrintTextWithGdi(string printerName, string text, string docTitle, bool isTicket)
        {
            try
            {
                PrintDocument pd = new PrintDocument();
                pd.PrinterSettings.PrinterName = printerName;
                pd.DocumentName = docTitle;

                if (!pd.PrinterSettings.IsValid)
                {
                    // Fallback to default printer if given name is invalid
                    pd.PrinterSettings.PrinterName = GetDefaultPrinter();
                }

                pd.PrintPage += (s, ev) =>
                {
                    float left = isTicket ? 50 : 80;
                    float top = isTicket ? 50 : 80;
                    float y = top;
                    float rightBound = ev.MarginBounds.Right;

                    using (Font titleFont = new Font("Arial", isTicket ? 12 : 15, FontStyle.Bold))
                    using (Font bodyFont = new Font("Courier New", isTicket ? 9 : 10, FontStyle.Regular))
                    using (Font subFont = new Font("Arial", 8, FontStyle.Italic))
                    {
                        string[] lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
                        foreach (string rawLine in lines)
                        {
                            string line = rawLine.TrimEnd();
                            if (y > ev.MarginBounds.Bottom - 30) break;

                            if (line.Contains("FERVENTA") || line.Contains("COMPROBANTE") || line.Contains("COTIZACIÓN") || line.Contains("ORDEN DE SERVICIO"))
                            {
                                ev.Graphics.DrawString(line, titleFont, Brushes.Black, left, y);
                                y += titleFont.GetHeight(ev.Graphics) + 4;
                            }
                            else if (line.StartsWith("===") || line.StartsWith("---"))
                            {
                                ev.Graphics.DrawLine(Pens.Gray, left, y + 6, rightBound, y + 6);
                                y += 14;
                            }
                            else
                            {
                                ev.Graphics.DrawString(line, bodyFont, Brushes.Black, left, y);
                                y += bodyFont.GetHeight(ev.Graphics) + 2;
                            }
                        }
                    }
                    ev.HasMorePages = false;
                };

                pd.Print();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al imprimir con GDI+: " + ex.Message);
                return false;
            }
        }

        private static string GetDefaultPrinter()
        {
            try
            {
                var settings = new PrinterSettings();
                return settings.PrinterName;
            }
            catch
            {
                return "POS-58";
            }
        }

        private static string ExtractJsonValue(string json, string key)
        {
            try
            {
                string searchKey = "\"" + key + "\"";
                int idx = json.IndexOf(searchKey, StringComparison.OrdinalIgnoreCase);
                if (idx < 0) return null;

                int colonIdx = json.IndexOf(':', idx + searchKey.Length);
                if (colonIdx < 0) return null;

                int quoteStart = json.IndexOf('\"', colonIdx + 1);
                if (quoteStart < 0) return null;

                int quoteEnd = quoteStart + 1;
                while (quoteEnd < json.Length)
                {
                    if (json[quoteEnd] == '\"' && json[quoteEnd - 1] != '\\')
                    {
                        break;
                    }
                    quoteEnd++;
                }

                if (quoteEnd >= json.Length) return null;

                string val = json.Substring(quoteStart + 1, quoteEnd - quoteStart - 1);
                return val.Replace("\\\"", "\"").Replace("\\\\", "\\").Replace("\\n", "\n").Replace("\\r", "\r");
            }
            catch
            {
                return null;
            }
        }

        private static void SendJsonResponse(HttpListenerResponse response, int statusCode, string json)
        {
            try
            {
                byte[] buffer = Encoding.UTF8.GetBytes(json);
                response.ContentType = "application/json; charset=utf-8";
                response.ContentLength64 = buffer.Length;
                response.StatusCode = statusCode;
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.OutputStream.Close();
            }
            catch { }
        }
    }
}
