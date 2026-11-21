@echo off
REM Installs the Quick Notes panel for Premiere Pro on Windows.
set "SRC=%~dp0"
set "DEST=%APPDATA%\Adobe\CEP\extensions\com.quicknotes.premiere"

REM Allow unsigned extensions (CSXS 9 - 12)
for %%v in (9 10 11 12) do reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul

if exist "%DEST%" rmdir /s /q "%DEST%"
mkdir "%DEST%"
xcopy "%SRC%CSXS"  "%DEST%\CSXS\"  /e /i /y >nul
xcopy "%SRC%css"   "%DEST%\css\"   /e /i /y >nul
xcopy "%SRC%js"    "%DEST%\js\"    /e /i /y >nul
xcopy "%SRC%jsx"   "%DEST%\jsx\"   /e /i /y >nul
xcopy "%SRC%icons" "%DEST%\icons\" /e /i /y >nul
copy /y "%SRC%index.html" "%DEST%\" >nul
copy /y "%SRC%.debug" "%DEST%\" >nul

echo Installed to: %DEST%
echo Restart Premiere Pro, then open Window ^> Extensions ^> Quick Notes
pause
