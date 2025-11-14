#!/bin/bash
# Quick build and test script for Patent SPA

cd "$(dirname "$0")"

echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Build successful! Starting preview server..."
echo ""

# Kill any existing servers on port 8080
pkill -f "vite preview.*8080" 2>/dev/null
pkill -f "serve.*8080" 2>/dev/null
sleep 1

# Start vite preview
npm run preview -- --port 8080 --host 0.0.0.0 &

sleep 3

# Get IP addresses
PRIVATE_IP=$(hostname -I | awk '{print $1}')
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "N/A")

echo "=========================================="
echo "Server is running!"
echo "=========================================="
echo "Local access:    http://localhost:8080"
echo "Private IP:      http://${PRIVATE_IP}:8080"
if [ "$PUBLIC_IP" != "N/A" ]; then
    echo "Public IP:       http://${PUBLIC_IP}:8080"
fi
echo ""
echo "To stop: pkill -f 'vite preview'"
echo "=========================================="

