#!/usr/bin/env python3
"""
QB Pharma - Simple deployment script
"""

import os
import tarfile
import tempfile
import subprocess
from pathlib import Path

BUILD_DIR = "./frontend/dist"
SERVER_IP = "209.38.78.122"

def create_archive():
    """Create tar archive of build files"""
    print("Creating build archive...")
    
    build_path = Path(BUILD_DIR)
    if not build_path.exists():
        print(f"Error: Build directory not found: {BUILD_DIR}")
        return None
    
    with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp:
        archive_path = tmp.name
    
    with tarfile.open(archive_path, 'w:gz') as tar:
        for file_path in build_path.rglob('*'):
            if file_path.is_file():
                arcname = file_path.relative_to(build_path)
                tar.add(file_path, arcname=arcname)
    
    print(f"Archive created: {archive_path}")
    return archive_path

def main():
    print("QB Pharma Deployment Tool")
    print("=" * 40)
    
    # Create archive
    archive_path = create_archive()
    if not archive_path:
        return
    
    try:
        # Upload to file.io for easy download
        print("Uploading to file.io...")
        cmd = f'curl -F "file=@{archive_path}" https://file.io'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Upload successful!")
            print("Output:", result.stdout)
            
            # Extract download URL if possible
            import json
            try:
                response = json.loads(result.stdout)
                if response.get('success') and response.get('link'):
                    download_url = response['link']
                    print(f"Download URL: {download_url}")
                    
                    # Create deployment script
                    deploy_script = f"""#!/bin/bash
# QB Pharma Auto-Deploy Script

echo "Starting QB Pharma deployment..."

# Install nginx
apt update
apt install -y nginx wget

# Create directory
mkdir -p /var/www/qb-pharma
cd /var/www/qb-pharma

# Download and extract
wget -O qb-pharma.tar.gz "{download_url}"
tar -xzf qb-pharma.tar.gz
chown -R www-data:www-data /var/www/qb-pharma

# Configure nginx
cat > /etc/nginx/sites-available/qb-pharma << 'EOF'
server {{
    listen 80;
    server_name {SERVER_IP};
    root /var/www/qb-pharma;
    index index.html;
    
    location / {{
        try_files $uri $uri/ /index.html;
    }}
    
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
}}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/qb-pharma /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "QB Pharma deployed successfully!"
echo "Access at: http://{SERVER_IP}"
"""
                    
                    with open('auto_deploy.sh', 'w') as f:
                        f.write(deploy_script)
                    
                    print("\nDeployment script created: auto_deploy.sh")
                    print("\nTo deploy on your server, run:")
                    print(f"ssh root@{SERVER_IP}")
                    print("Then paste and run this command:")
                    print(deploy_script)
                    
            except json.JSONDecodeError:
                print("Could not parse upload response")
                
        else:
            print("Upload failed:", result.stderr)
    
    finally:
        if archive_path and os.path.exists(archive_path):
            os.unlink(archive_path)

if __name__ == "__main__":
    main()