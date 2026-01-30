
!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Installing Visual C++ Redistributable..."
  SetOutPath "$TEMP"
  File "C:\Users\Tekena\Documents\Work\rmbg\src-tauri\binaries\vc_redist.x64.exe"
  ExecWait '"$TEMP\vc_redist.x64.exe" /install /quiet /norestart' $0
  DetailPrint "VC++ Redist return code: $0"
!macroend
