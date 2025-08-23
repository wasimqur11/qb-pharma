# QB Pharma - Digital Ocean Deployment Script (PowerShell)
param(
    [string]$ServerIP = "209.38.78.122",
    [string]$Username = "root",
    [string]$Password = "W@h!dp0R@A"
)

Write-Host "🚀 Starting QB Pharma deployment to Digital Ocean..." -ForegroundColor Green

# Create secure password
$SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential ($Username, $SecurePassword)

# Function to execute SSH commands
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Server = $ServerIP,
        [System.Management.Automation.PSCredential]$Cred = $Credential
    )
    
    try {
        # Using PLINK (PuTTY) for SSH commands
        $plink = "plink.exe"
        $sshCommand = "$plink -ssh -l $($Cred.UserName) -pw $($Cred.GetNetworkCredential().Password) -batch $Server `"$Command`""
        Write-Host "Executing: $Command" -ForegroundColor Yellow
        Invoke-Expression $sshCommand
    }
    catch {
        Write-Host "Error executing SSH command: $_" -ForegroundColor Red
    }
}

# Function to upload files using PSCP
function Copy-FilesToServer {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [string]$Server = $ServerIP,
        [System.Management.Automation.PSCredential]$Cred = $Credential
    )
    
    try {
        $pscp = "pscp.exe"
        $copyCommand = "$pscp -r -scp -l $($Cred.UserName) -pw $($Cred.GetNetworkCredential().Password) -batch `"$LocalPath\*`" $Server`:$RemotePath"
        Write-Host "Uploading files to $RemotePath..." -ForegroundColor Yellow
        Invoke-Expression $copyCommand
    }
    catch {
        Write-Host "Error uploading files: $_" -ForegroundColor Red
    }
}

# Check if PuTTY tools are available
$puttyPath = Get-Command plink.exe -ErrorAction SilentlyContinue
if (-not $puttyPath) {
    Write-Host "❌ PuTTY tools not found. Installing..." -ForegroundColor Red
    
    # Download and install PuTTY
    $puttyUrl = "https://the.earth.li/~sgtatham/putty/latest/w64/putty-64bit-0.81-installer.msi"
    $puttyInstaller = "$env:TEMP\putty-installer.msi"
    
    Write-Host "📥 Downloading PuTTY..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $puttyUrl -OutFile $puttyInstaller
    
    Write-Host "📦 Installing PuTTY..." -ForegroundColor Yellow
    Start-Process msiexec.exe -Wait -ArgumentList "/i $puttyInstaller /quiet"
    
    # Add PuTTY to PATH
    $env:PATH += ";C:\Program Files\PuTTY"
    
    Remove-Item $puttyInstaller -Force
    Write-Host "✅ PuTTY installed successfully!" -ForegroundColor Green
}

# Test connection
Write-Host "📡 Testing server connection..." -ForegroundColor Cyan
$testResult = Test-NetConnection -ComputerName $ServerIP -Port 22 -WarningAction SilentlyContinue

if ($testResult.TcpTestSucceeded) {
    Write-Host "✅ Server connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to connect to server on port 22" -ForegroundColor Red
    exit 1
}

# Install required packages on server
Write-Host "📦 Installing Nginx on server..." -ForegroundColor Cyan
Invoke-SSHCommand "apt update && apt install -y nginx"
Invoke-SSHCommand "systemctl enable nginx && systemctl start nginx"
Invoke-SSHCommand "ufw allow 'Nginx Full'"

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Cyan
Invoke-SSHCommand "mkdir -p /var/www/qb-pharma"
Invoke-SSHCommand "chown -R www-data:www-data /var/www/qb-pharma"
Invoke-SSHCommand "chmod -R 755 /var/www/qb-pharma"

# Upload build files
Write-Host "📤 Uploading application files..." -ForegroundColor Cyan
$buildPath = ".\frontend\dist"
Copy-FilesToServer -LocalPath $buildPath -RemotePath "/var/www/qb-pharma"

# Configure Nginx
Write-Host "⚙️ Configuring Nginx..." -ForegroundColor Cyan
$nginxConfig = @"
server {
    listen 80;
    server_name $ServerIP;
    root /var/www/qb-pharma;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Main location block for SPA routing
    location / {
        try_files `$uri `$uri/ /index.html;
        add_header Cache-Control \"no-cache, no-store, must-revalidate\";
        add_header Pragma \"no-cache\";
        add_header Expires \"0\";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)`$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
}
"@

# Write nginx config
Invoke-SSHCommand "echo '$nginxConfig' > /etc/nginx/sites-available/qb-pharma"
Invoke-SSHCommand "ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/"
Invoke-SSHCommand "rm -f /etc/nginx/sites-enabled/default"

# Test and restart nginx
Invoke-SSHCommand "nginx -t"
Invoke-SSHCommand "systemctl restart nginx"

# Test deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://$ServerIP" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host "🌐 Your QB Pharma application is now live at: http://$ServerIP" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
        Write-Host "   - Server: $ServerIP" -ForegroundColor White
        Write-Host "   - Application: QB Pharma" -ForegroundColor White
        Write-Host "   - Web Server: Nginx" -ForegroundColor White
        Write-Host "   - SSL: Not configured (HTTP only)" -ForegroundColor White
        Write-Host ""
        Write-Host "🔗 Access your application: http://$ServerIP" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Deployment may have issues. Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🏁 Deployment script completed!" -ForegroundColor Green