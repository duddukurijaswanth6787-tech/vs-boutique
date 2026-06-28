$source = $pwd.Path
$destination = Join-Path (Split-Path $pwd.Path -Parent) "simple_app_temp_zip"
$zipPath = Join-Path $pwd.Path "simple-app-ub-ev-26-06.zip"


$exclude = @(
  'node_modules', 
  '.gradle', 
  '.gradle_home', 
  '.expo', 
  'build', 
  'temp_zip', 
  'simple-app.zip', 
  'simple-app-update-17-06.zip',
  'simple-app-up-ev-25-06.zip',
  'simple-app-ub-ev-26-06.zip',
  'postman.postman-for-vscode-1.19.1.vsix',
  '.git',
  '.vscode'
)


function Copy-Filtered ($src, $dest) {
    $leafName = Split-Path $src -Leaf
    if ($exclude -contains $leafName) { return }
    
    if (Test-Path $src -PathType Container) {
        $null = New-Item -ItemType Directory -Path $dest -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path $src -Force | ForEach-Object {
            Copy-Filtered $_.FullName (Join-Path $dest $_.Name)
        }
    } else {
        Copy-Item -Path $src -Destination $dest -Force
    }
}

Write-Host "Preparing files to zip..."
if (Test-Path $destination) { Remove-Item -Recurse -Force $destination }
Copy-Filtered $source $destination

Write-Host "Creating zip archive..."
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$destination\*" -DestinationPath $zipPath -Force

Write-Host "Cleaning up temporary files..."
Remove-Item -Recurse -Force $destination

Write-Host "Zip file successfully created at $zipPath"
