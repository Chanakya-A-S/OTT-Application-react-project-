; Quick Notes for Premiere Pro – one-click Windows installer
; Build: makensis installer/windows.nsi   (run from the premiere-quick-notes folder)

Unicode true
!include "MUI2.nsh"

Name "Quick Notes for Premiere Pro"
OutFile "..\dist\QuickNotes-Installer-Windows.exe"
RequestExecutionLevel user           ; no admin needed – installs per user
InstallDir "$APPDATA\Adobe\CEP\extensions\com.quicknotes.premiere"
BrandingText "Quick Notes"
SetCompressor /SOLID lzma

!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_FINISHPAGE_TITLE "Quick Notes is installed"
!define MUI_FINISHPAGE_TEXT "Restart Premiere Pro, then open:$\r$\n$\r$\nWindow > Extensions > Quick Notes"
!define MUI_INSTFILESPAGE_AUTOCLOSE  ; jump straight to the finish page

!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  ; Allow unsigned CEP panels for every Premiere version (CSXS 9 – 12)
  WriteRegStr HKCU "Software\Adobe\CSXS.9"  "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.10" "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.11" "PlayerDebugMode" "1"
  WriteRegStr HKCU "Software\Adobe\CSXS.12" "PlayerDebugMode" "1"

  RMDir /r "$INSTDIR"
  SetOutPath "$INSTDIR"
  File "..\index.html"
  File "..\.debug"
  SetOutPath "$INSTDIR\CSXS"
  File "..\CSXS\manifest.xml"
  SetOutPath "$INSTDIR\css"
  File "..\css\*.css"
  SetOutPath "$INSTDIR\js"
  File "..\js\*.js"
  SetOutPath "$INSTDIR\jsx"
  File "..\jsx\*.jsx"
  SetOutPath "$INSTDIR\icons"
  File "..\icons\*.png"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  ; Show up in Settings > Apps
  !define UNKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuickNotesPremiere"
  WriteRegStr HKCU "${UNKEY}" "DisplayName" "Quick Notes for Premiere Pro"
  WriteRegStr HKCU "${UNKEY}" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "${UNKEY}" "Publisher" "Quick Notes"
  WriteRegStr HKCU "${UNKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNKEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuickNotesPremiere"
SectionEnd
