[Setup]
AppName=Nekolinic 医疗管理系统
AppVersion=alpha0.1.3
AppPublisher=moeyukisako
AppPublisherURL=https://github.com/moeyukisako
AppSupportURL=https://github.com/moeyukisako
AppUpdatesURL=https://github.com/moeyukisako
DefaultDirName={autopf}\Nekolinic
DefaultGroupName=Nekolinic
AllowNoIcons=yes
LicenseFile=
OutputDir=installer
OutputBaseFilename=Nekolinic-Setup-v{#SetupSetting("AppVersion")}
SetupIconFile=frontend\assets\icons\app.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "chinesesimp"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1

[Files]
Source: "dist\Nekolinic\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\Nekolinic 医疗管理系统"; Filename: "{app}\Nekolinic.exe"
Name: "{group}\{cm:UninstallProgram,Nekolinic}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Nekolinic 医疗管理系统"; Filename: "{app}\Nekolinic.exe"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\Nekolinic 医疗管理系统"; Filename: "{app}\Nekolinic.exe"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\Nekolinic.exe"; Description: "{cm:LaunchProgram,Nekolinic 医疗管理系统}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\backups"
Type: filesandordirs; Name: "{app}\*.db"
Type: filesandordirs; Name: "{app}\*.log"

[Code]
function GetUninstallString(): String;
var
  sUnInstPath: String;
  sUnInstallString: String;
begin
  sUnInstPath := ExpandConstant('Software\Microsoft\Windows\CurrentVersion\Uninstall\{#emit SetupSetting("AppId")}_is1');
  sUnInstallString := '';
  if not RegQueryStringValue(HKLM, sUnInstPath, 'UninstallString', sUnInstallString) then
    RegQueryStringValue(HKCU, sUnInstPath, 'UninstallString', sUnInstallString);
  Result := sUnInstallString;
end;

function IsUpgrade(): Boolean;
begin
  Result := (GetUninstallString() <> '');
end;

function UnInstallOldVersion(): Integer;
var
  sUnInstallString: String;
  iResultCode: Integer;
begin
  Result := 0;
  sUnInstallString := GetUninstallString();
  if sUnInstallString <> '' then begin
    sUnInstallString := RemoveQuotes(sUnInstallString);
    if Exec(sUnInstallString, '/SILENT /NORESTART /SUPPRESSMSGBOXES','', SW_HIDE, ewWaitUntilTerminated, iResultCode) then
      Result := 3
    else
      Result := 2;
  end else
    Result := 1;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if (CurStep=ssInstall) then
  begin
    if (IsUpgrade()) then
    begin
      UnInstallOldVersion();
    end;
  end;
end;