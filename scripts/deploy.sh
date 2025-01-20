#!/bin/bash

# Build the application
npm run build

# Create necessary directories
mkdir -p dist/public
cp node_modules/pdfjs-dist/build/pdf.worker.min.js dist/public/

# Create a basic nginx configuration
cat > nginx.conf << EOL
server {
    listen 80;
    server_name your_domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cross-Origin-Embedder-Policy require-corp;
        add_header Cross-Origin-Opener-Policy same-origin;
    }

    location /pdf.worker.min.js {
        alias /var/www/html/public/pdf.worker.min.js;
        add_header Content-Type application/javascript;
    }
}
EOL

# Instructions for deployment
echo "
Deployment Instructions:

1. Copy the contents of the 'dist' directory to your web server's root directory:
   scp -r dist/* user@your-server:/var/www/html/

2. Copy the nginx configuration:
   scp nginx.conf user@your-server:/etc/nginx/sites-available/your-domain.conf

3. On your server, create a symbolic link:
   sudo ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/

4. Test and reload nginx:
   sudo nginx -t
   sudo systemctl reload nginx

5. Set up environment variables on your server:
   - Create /var/www/html/.env with your OpenAI API key
   - Ensure proper permissions: chmod 600 /var/www/html/.env

6. The application should now be accessible at: http://your_domain.com
"