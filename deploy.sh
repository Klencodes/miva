#!/bin/bash
echo "Building project..."
npm run build

echo "Copying files..."
cp vercel.json build/

echo "Deploying to Vercel..."
cd build && vercel --prod