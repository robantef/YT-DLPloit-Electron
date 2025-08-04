# Custom NSIS installer script for YT-DLPloit

# Custom install confirmation
Function .onInstSuccess
    MessageBox MB_YESNO "Installation completed successfully!$\n$\nWould you like to launch YT-DLPloit now?" IDNO NoLaunch
    Exec "$INSTDIR\YT-DLPloit.exe"
    NoLaunch:
FunctionEnd

# Custom uninstall confirmation
Function un.onInit
    MessageBox MB_YESNO "Are you sure you want to completely remove YT-DLPloit and all of its components?" IDYES +2
    Abort
FunctionEnd
