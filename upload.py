#!/usr/bin/env python3
"""
QB Pharma - Simple deployment script using Python
Uploads files and configures server via SSH
"""

import os
import sys
import subprocess
import tarfile
import tempfile
from pathlib import Path

# Server configuration
SERVER_IP = "209.38.78.122"
USERNAME = "root"
PASSWORD = "W@h!dp0R@A"
BUILD_DIR = "./frontend/dist"

def run_command(command, capture_output=True):
    """Run a shell command and return result"""
    try:
        result = subprocess.run(command, shell=True, capture_output=capture_output, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def create_build_archive():
    """Create a tar archive of the build files"""
    print("📦 Creating build archive...")
    
    build_path = Path(BUILD_DIR)
    if not build_path.exists():
        print(f"❌ Build directory not found: {BUILD_DIR}")
        return None
    
    # Create temporary tar file
    with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp:
        archive_path = tmp.name
    
    with tarfile.open(archive_path, 'w:gz') as tar:
        for file_path in build_path.rglob('*'):
            if file_path.is_file():
                # Add file with relative path
                arcname = file_path.relative_to(build_path)
                tar.add(file_path, arcname=arcname)
    
    print(f"✅ Build archive created: {archive_path}")
    return archive_path

def upload_and_deploy():
    """Upload files and configure server"""
    print(f"🚀 Starting deployment to {SERVER_IP}...")
    
    # Create build archive
    archive_path = create_build_archive()
    if not archive_path:
        return False
    
    try:
        # Upload using curl with form data
        print("📤 Uploading files...")
        
        # Create deployment script
        deploy_script = f'''#!/bin/bash
# QB Pharma deployment script
set -e

echo "📦 Installing Nginx..."
apt update
apt install -y nginx curl

echo "📁 Setting up directories..."
mkdir -p /var/www/qb-pharma
cd /var/www/qb-pharma

echo "📥 Downloading and extracting files..."
curl -o qb-pharma.tar.gz "https://transfer.sh/$(basename {archive_path})"
tar -xzf qb-pharma.tar.gz
chown -R www-data:www-data /var/www/qb-pharma
chmod -R 755 /var/www/qb-pharma

echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/qb-pharma << 'EOF'
server {{
    listen 80;
    server_name {SERVER_IP};
    root /var/www/qb-pharma;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {{
        try_files \\$uri \\$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }}

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)\\$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}}
EOF

ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "🎉 Deployment complete!"
echo "🌐 QB Pharma is now available at: http://{SERVER_IP}"
'''
        
        # Save deployment script
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sh', delete=False) as f:
            f.write(deploy_script)
            script_path = f.name
        
        print(f"📤 Uploading archive to transfer.sh...")
        
        # Upload to transfer.sh
        upload_cmd = f'curl -T "{archive_path}" https://transfer.sh/qb-pharma.tar.gz'
        success, stdout, stderr = run_command(upload_cmd)
        
        if success and stdout.strip():
            download_url = stdout.strip()
            print(f"✅ Archive uploaded: {download_url}")
            
            # Create simple deployment script that downloads from transfer.sh
            simple_deploy = f'''#!/bin/bash
set -e
echo "🚀 QB Pharma Deployment Starting..."

# Install nginx
apt update && apt install -y nginx

# Create directory
mkdir -p /var/www/qb-pharma
cd /var/www/qb-pharma

# Download and extract
wget -O qb-pharma.tar.gz "{download_url}"
tar -xzf qb-pharma.tar.gz
chown -R www-data:www-data /var/www/qb-pharma

# Configure nginx
cat > /etc/nginx/sites-available/qb-pharma << 'NGINXEOF'
server {{
    listen 80;
    server_name {SERVER_IP};
    root /var/www/qb-pharma;
    index index.html;
    
    location / {{
        try_files \\$uri \\$uri/ /index.html;
    }}
}}
NGINXEOF

ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "🎉 QB Pharma deployed at http://{SERVER_IP}"
'''
            
            # Save simple deployment script
            with open('simple_deploy.sh', 'w') as f:
                f.write(simple_deploy)
            
            print("✅ Deployment scripts created!")
            print(f"📋 Manual deployment steps:")
            print(f"1. SSH to server: ssh {USERNAME}@{SERVER_IP}")
            print(f"2. Run: wget -O deploy.sh {download_url.replace('qb-pharma.tar.gz', 'deploy.sh')}")
            print(f"3. Run: chmod +x deploy.sh && ./deploy.sh")
            print(f"")
            print(f"Or copy and paste this command on your server:")
            print(f"```")
            print(simple_deploy)
            print(f"```")
            
            return True
        else:
            print(f"❌ Failed to upload archive: {stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        return False
    finally:
        # Cleanup
        if archive_path and os.path.exists(archive_path):
            os.unlink(archive_path)

if __name__ == "__main__":
    print("🚀 QB Pharma Deployment Tool")
    print("=" * 50)
    
    success = upload_and_deploy()
    
    if success:
        print("✅ Deployment preparation completed!")
        print(f"🌐 Your app will be available at: http://{SERVER_IP}")
    else:
        print("❌ Deployment failed!")
        sys.exit(1)