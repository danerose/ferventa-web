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
        public static void Main()
        {
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
                contextMenu.MenuItems.Add(new MenuItem("Ferventa Print Agent v1.1") { Enabled = false });
                contextMenu.MenuItems.Add("-");
                contextMenu.MenuItems.Add(new MenuItem("Ver Impresoras Detectadas", (s, e) => ShowPrinters()));
                contextMenu.MenuItems.Add(new MenuItem("Iniciar con Windows", (s, e) => ToggleStartup(s)));
                contextMenu.MenuItems[3].Checked = IsInStartup();
                contextMenu.MenuItems.Add("-");
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

                    if (string.IsNullOrEmpty(printerName))
                    {
                        printerName = GetDefaultPrinter();
                    }

                    // A) TICKET PRINTING (Raw ESC/POS bytes)
                    if (!string.IsNullOrEmpty(rawBase64))
                    {
                        byte[] bytes = Convert.FromBase64String(rawBase64);
                        bool isThermal = IsThermalPrinter(printerName);
                        bool ok = false;

                        if (isThermal)
                        {
                            // Send raw binary to thermal POS printer
                            ok = RawPrinterHelper.SendBytesToPrinter(printerName, bytes);
                            if (!ok)
                            {
                                // Retry fallback matching
                                foreach (string installed in PrinterSettings.InstalledPrinters)
                                {
                                    if (IsThermalPrinter(installed))
                                    {
                                        ok = RawPrinterHelper.SendBytesToPrinter(installed, bytes);
                                        if (ok) { printerName = installed; break; }
                                    }
                                }
                            }
                        }
                        else
                        {
                            // Printer is an office/inkjet printer (like Brother/HP)
                            // Render ticket text cleanly with native GDI+
                            string ticketText = ExtractTextFromEscPos(bytes);
                            ok = PrintTextWithGdi(printerName, ticketText, "Ticket Ferventa", true);
                        }

                        if (ok)
                        {
                            ShowNotification("Ticket Impreso", "Ticket enviado correctamente a: " + printerName);
                            SendJsonResponse(response, 200, "{\"success\":true,\"printer\":\"" + printerName.Replace("\"", "\\\"") + "\"}");
                        }
                        else
                        {
                            SendJsonResponse(response, 500, "{\"error\":\"No se pudo imprimir en la impresora " + printerName.Replace("\"", "\\\"") + "\"}");
                        }
                        return;
                    }

                    // B) DOCUMENT / HTML PRINTING (Cotizaciones / Citas / QR)
                    if (!string.IsNullOrEmpty(htmlContent))
                    {
                        string plainText = HtmlToPlainText(htmlContent);
                        bool ok = PrintTextWithGdi(printerName, plainText, "Documento Ferventa", false);

                        if (ok)
                        {
                            ShowNotification("Documento Impreso", "Documento enviado correctamente a: " + printerName);
                            SendJsonResponse(response, 200, "{\"success\":true,\"printer\":\"" + printerName.Replace("\"", "\\\"") + "\"}");
                        }
                        else
                        {
                            SendJsonResponse(response, 500, "{\"error\":\"Error al enviar documento a la impresora " + printerName.Replace("\"", "\\\"") + "\"}");
                        }
                        return;
                    }

                    SendJsonResponse(response, 400, "{\"error\":\"Falta rawBase64 o html en la peticion\"}");
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
