# Vercel Deployment Guide

## Prerequisites
1. Push code to GitHub/GitLab
2. Connect repository to Vercel

## Environment Variables (Optional)
Add to Vercel project settings:
- `REACT_APP_API_URL` - Your backend API URL
- `PUBLIC_URL` - Should be your Vercel app URL

## Build Settings in Vercel
- **Framework Preset**: Create React App
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

## Important Notes for PWA:
1. **HTTPS is automatic** on Vercel ✓
2. **Service Worker** requires HTTPS ✓
3. **Custom domain** recommended for PWA installs

## Testing Offline Mode:
1. Deploy to Vercel
2. Open in Chrome
3. Go to DevTools → Application → Service Workers
4. Check "Offline" and refresh
5. Or install as PWA and test with Airplane mode