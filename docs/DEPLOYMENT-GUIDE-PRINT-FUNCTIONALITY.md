# Deployment Guide: Admin Dashboard Print Functionality

## Overview

This guide lists all files that need to be uploaded to your Hostinger hosting to deploy the print functionality feature for the admin dashboard.

## Deployment Date

**Date:** _____________________________
**Deployed By:** _____________________________

---

## Files to Upload

### 1. Core Print Services (NEW FILES)

These are new TypeScript service files that handle print functionality:

```
Chodams/resources/js/Services/
├── PrintHandlerService.ts          ⭐ NEW - Core print coordination service
├── PrintStyleManager.ts            ⭐ NEW - Manages print CSS rules
├── GraphPrintAdapter.ts            ⭐ NEW - Chart dimension optimization
├── PaperConfiguration.ts           ⭐ NEW - Paper format configurations
└── LegendFormatter.ts              ⭐ NEW - Chart legend formatting
```

**Upload Path:** `/public_html/resources/js/Services/`

---

### 2. Print Components (NEW FILES)

React/TypeScript components for print UI:

```
Chodams/resources/js/Components/
├── PrintButton.tsx                 ⭐ NEW - Reusable print button component
└── PrintMetadata.tsx               ⭐ NEW - Print metadata display component
```

**Upload Path:** `/public_html/resources/js/Components/`

---

### 3. Print Hooks (NEW FILES)

React hooks for print functionality:

```
Chodams/resources/js/hooks/
├── usePrintMode.ts                 ⭐ NEW - Detects print mode
├── usePrintWithPageBreaks.ts       ⭐ NEW - Manages page breaks
└── index.ts                        🔄 MODIFIED - Exports new hooks
```

**Upload Path:** `/public_html/resources/js/hooks/`

---

### 4. Main Dashboard Page (MODIFIED FILE)

The admin dashboard has been updated to include print buttons:

```
Chodams/resources/js/Pages/
└── AdminDashboard.jsx              🔄 MODIFIED - Added print buttons and integration
```

**Upload Path:** `/public_html/resources/js/Pages/`

---

### 5. CSS Styles (MODIFIED FILE)

Print media queries and styles have been added:

```
Chodams/resources/css/
└── app.css                         🔄 MODIFIED - Added @media print rules
```

**Upload Path:** `/public_html/resources/css/`

---

### 6. Chart Coordinator (MODIFIED FILE - if updated)

The chart rendering coordinator may have been updated:

```
Chodams/resources/js/Services/
└── ChartRenderingCoordinator.js    🔄 CHECK - May have print-related updates
```

**Upload Path:** `/public_html/resources/js/Services/`

---

## Build Process Required

⚠️ **IMPORTANT:** Since this is a Laravel + Inertia.js + React application, you need to build the assets before uploading.

### Step 1: Build Assets Locally

Run these commands in your local `Chodams` directory:

```bash
# Install dependencies (if not already done)
npm install

# Build production assets
npm run build
```

This will compile all TypeScript/JSX files and generate optimized production files in the `public/build` directory.

---

### Step 2: Files to Upload After Build

After running `npm run build`, upload these directories:

```
Chodams/public/build/               🔄 ENTIRE DIRECTORY - Compiled assets
```

**Upload Path:** `/public_html/public/build/`

⚠️ **Note:** The `public/build` directory contains all compiled JavaScript and CSS. You must upload the ENTIRE directory, replacing the old one.

---

## Detailed Upload Checklist

### ✅ Pre-Upload Checklist

- [ ] Run `npm install` locally
- [ ] Run `npm run build` locally
- [ ] Verify build completed without errors
- [ ] Backup current Hostinger files
- [ ] Test locally before deploying

### ✅ Upload Checklist - Source Files (Optional)

If you want to keep source files on the server (not required for production):

- [ ] Upload `Chodams/resources/js/Services/PrintHandlerService.ts`
- [ ] Upload `Chodams/resources/js/Services/PrintStyleManager.ts`
- [ ] Upload `Chodams/resources/js/Services/GraphPrintAdapter.ts`
- [ ] Upload `Chodams/resources/js/Services/PaperConfiguration.ts`
- [ ] Upload `Chodams/resources/js/Services/LegendFormatter.ts`
- [ ] Upload `Chodams/resources/js/Components/PrintButton.tsx`
- [ ] Upload `Chodams/resources/js/Components/PrintMetadata.tsx`
- [ ] Upload `Chodams/resources/js/hooks/usePrintMode.ts`
- [ ] Upload `Chodams/resources/js/hooks/usePrintWithPageBreaks.ts`
- [ ] Upload `Chodams/resources/js/hooks/index.ts`
- [ ] Upload `Chodams/resources/js/Pages/AdminDashboard.jsx`
- [ ] Upload `Chodams/resources/css/app.css`

### ✅ Upload Checklist - Compiled Assets (REQUIRED)

**This is the most important step:**

- [ ] Upload entire `Chodams/public/build/` directory
- [ ] Verify `manifest.json` is updated in build directory
- [ ] Clear browser cache after upload

---

## Hostinger Upload Instructions

### Method 1: Using File Manager (Recommended for Small Updates)

1. Log in to Hostinger control panel
2. Go to **File Manager**
3. Navigate to `/public_html/`
4. Upload the `public/build/` directory (replace existing)
5. Optionally upload source files to their respective directories

### Method 2: Using FTP/SFTP (Recommended for Full Deployment)

1. Connect to your Hostinger server via FTP/SFTP
   - Host: Your Hostinger FTP hostname
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (FTP) or 22 (SFTP)

2. Navigate to `/public_html/`

3. Upload directories:
   ```
   Local: Chodams/public/build/
   Remote: /public_html/public/build/
   
   Local: Chodams/resources/
   Remote: /public_html/resources/
   ```

4. Ensure file permissions are correct (644 for files, 755 for directories)

### Method 3: Using Git (If You Have Git Deployment Set Up)

If you have Git deployment configured on Hostinger:

```bash
# Commit changes locally
git add .
git commit -m "Add print functionality feature"

# Push to repository
git push origin main

# SSH into Hostinger and pull changes
ssh your-username@your-server
cd /public_html
git pull origin main

# Build assets on server (if Node.js is available)
npm install
npm run build
```

---

## Post-Deployment Verification

### ✅ Verification Checklist

After uploading files, verify the deployment:

1. **Clear Cache**
   - [ ] Clear browser cache (Ctrl+Shift+Delete)
   - [ ] Clear Laravel cache (if you have SSH access):
     ```bash
     php artisan cache:clear
     php artisan config:clear
     php artisan view:clear
     ```

2. **Test Print Functionality**
   - [ ] Log in to admin dashboard
   - [ ] Verify print buttons are visible
   - [ ] Click "Print By Year Summary" button
   - [ ] Verify print preview opens correctly
   - [ ] Test print for each subclass table
   - [ ] Test filtered analytics print
   - [ ] Test browser print (Ctrl+P / Cmd+P)

3. **Check Console for Errors**
   - [ ] Open browser DevTools (F12)
   - [ ] Check Console tab for JavaScript errors
   - [ ] Verify no 404 errors for missing files

4. **Test in Multiple Browsers**
   - [ ] Test in Chrome
   - [ ] Test in Firefox
   - [ ] Test in Edge
   - [ ] Test in Safari (if available)

---

## Rollback Plan

If something goes wrong, you can rollback:

### Quick Rollback Steps

1. **Restore from Backup**
   - Restore the `public/build/` directory from your backup
   - Restore modified files from backup

2. **Clear Cache Again**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   ```

3. **Verify Site is Working**
   - Check admin dashboard loads
   - Verify existing functionality works

---

## File Size Reference

Approximate file sizes for upload planning:

```
PrintHandlerService.ts       ~25 KB
PrintStyleManager.ts         ~15 KB
GraphPrintAdapter.ts         ~12 KB
PaperConfiguration.ts        ~5 KB
LegendFormatter.ts           ~8 KB
PrintButton.tsx              ~10 KB
PrintMetadata.tsx            ~8 KB
usePrintMode.ts              ~5 KB
usePrintWithPageBreaks.ts    ~8 KB
AdminDashboard.jsx           ~150 KB (entire file)
app.css                      ~50 KB (entire file)

public/build/                ~2-5 MB (compiled assets)
```

**Total Upload Size:** Approximately 5-10 MB

---

## Troubleshooting

### Issue: Print buttons not visible

**Solution:**
- Clear browser cache
- Verify `public/build/manifest.json` is updated
- Check browser console for JavaScript errors
- Verify all files uploaded correctly

### Issue: Print preview shows errors

**Solution:**
- Check browser console for errors
- Verify Chart.js is loaded
- Check that `PrintHandlerService.ts` was compiled correctly
- Clear Laravel cache

### Issue: Styles not applied in print

**Solution:**
- Verify `app.css` was uploaded
- Clear browser cache
- Check that CSS is being loaded (DevTools > Network tab)
- Verify `@media print` rules are present in compiled CSS

### Issue: 404 errors for new files

**Solution:**
- Verify `public/build/` directory was uploaded completely
- Check file paths are correct
- Run `npm run build` again locally
- Re-upload `public/build/` directory

---

## Support Contacts

**Developer:** _____________________________
**Email:** _____________________________
**Phone:** _____________________________

---

## Deployment Sign-off

**Deployment Completed:** ⬜ Yes ⬜ No

**Verification Completed:** ⬜ Yes ⬜ No

**Issues Found:** ⬜ None ⬜ Minor ⬜ Major

**Notes:**
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

**Deployed By:** _____________________________
**Date:** _____________________________
**Signature:** _____________________________

---

## Quick Reference: Essential Files Only

If you want to do a minimal deployment (compiled assets only):

### Absolutely Required:
1. `Chodams/public/build/` - **ENTIRE DIRECTORY** (compiled assets)

### Recommended (for future edits):
2. `Chodams/resources/js/Services/` - All new `.ts` files
3. `Chodams/resources/js/Components/` - `PrintButton.tsx`, `PrintMetadata.tsx`
4. `Chodams/resources/js/hooks/` - All new `.ts` files
5. `Chodams/resources/js/Pages/AdminDashboard.jsx`
6. `Chodams/resources/css/app.css`

---

## Additional Notes

- The print functionality is entirely client-side (JavaScript/CSS)
- No database changes required
- No PHP/Laravel backend changes required
- No new routes or controllers needed
- Works with existing admin authentication

---

**End of Deployment Guide**
