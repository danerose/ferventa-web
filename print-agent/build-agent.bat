@echo off
echo ====================================================
echo  Compilando FerventaPrintAgent.exe...
echo ====================================================
if not exist "..\public\downloads" mkdir "..\public\downloads"
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /optimize+ /out:"..\public\downloads\FerventaPrintAgent.exe" /r:System.dll,System.Drawing.dll,System.Windows.Forms.dll "FerventaPrintAgent.cs"
if %ERRORLEVEL% EQU 0 (
    echo [OK] Compilado con exito en ..\public\downloads\FerventaPrintAgent.exe
) else (
    echo [ERROR] Fallo la compilacion.
)
pause
