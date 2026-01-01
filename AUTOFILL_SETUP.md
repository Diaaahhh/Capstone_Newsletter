# DOI Auto-Fill Feature - Installation & Setup Guide

## 📦 **Step 1: Install Required Packages**

Open PowerShell as Administrator and run:

```powershell
# Navigate to project directory
cd "d:\Academic\Capstone\NewLetterEWU_Digital_AlertGeneral\NewLetterEWU"

# Install packages
npm install axios cheerio puppeteer doi-regex express-rate-limit node-cache
```

**If you get execution policy error:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install axios cheerio puppeteer doi-regex express-rate-limit node-cache
```

---

## 🚀 **Step 2: Start the Server**

```powershell
cd backend
node server.js
```

**Expected Output:**
```
🚀 Server running on port 5000
```

---

## 🧪 **Step 3: Test the Auto-Fill Feature**

### **Option A: Using the Frontend**

1. Open browser: `http://localhost:5000/createJournalPublications.html`
2. Enter a DOI: `10.1038/nature12373`
3. Click "Auto-Fill" button
4. Watch the form populate automatically!

### **Option B: Using curl (Command Line)**

```powershell
# Test with valid DOI
curl -X POST http://localhost:5000/api/autofill/publication `
  -H "Content-Type: application/json" `
  -d '{\"doi\": \"10.1038/nature12373\"}'
```

### **Option C: Using Postman**

1. Method: POST
2. URL: `http://localhost:5000/api/autofill/publication`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "doi": "10.1038/nature12373"
}
```

---

## ✅ **Expected Results**

### **Success Response:**
```json
{
  "success": true,
  "data": {
    "title": "Paper Title Here",
    "authors": "Smith, J., Johnson, A.",
    "journal": "Nature",
    "year": "2023",
    "volume": "123",
    "issue": "4",
    "pages": "456-789",
    "doi": "10.1038/nature12373"
  },
  "sources": ["CrossRef"],
  "message": "Publication data fetched successfully"
}
```

### **Frontend Behavior:**
1. Click "Auto-Fill" → Button shows "Fetching..."
2. Blue loading indicator appears
3. After 1-3 seconds, form fields populate
4. Green success message: "Data loaded from CrossRef"
5. Toast notification: "Form auto-filled successfully!"

---

## 🐛 **Troubleshooting**

### **Issue 1: npm install fails**

**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
```

### **Issue 2: Puppeteer installation takes too long**

**Solution:**
```powershell
# Skip Chromium download during install
npm install puppeteer --ignore-scripts

# Install Chromium separately
npx puppeteer browsers install chrome
```

### **Issue 3: Server doesn't start**

**Check:**
- Port 5000 is not in use
- MongoDB is running
- All packages are installed

**Solution:**
```powershell
# Check if port is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <process_id> /F
```

### **Issue 4: Auto-fill returns 404**

**Possible causes:**
- Invalid DOI format
- DOI doesn't exist in CrossRef
- Network connectivity issues

**Solution:**
- Try a known DOI: `10.1038/nature12373`
- Check internet connection
- Check server logs for errors

---

## 📝 **Test DOIs**

Use these DOIs for testing:

| DOI | Expected Result |
|-----|-----------------|
| `10.1038/nature12373` | ✅ Success (Nature journal) |
| `10.1126/science.1259855` | ✅ Success (Science journal) |
| `10.1016/j.cell.2014.05.010` | ✅ Success (Cell journal) |
| `invalid-doi` | ❌ Error (Invalid format) |
| `10.9999/nonexistent` | ❌ Error (Not found) |

---

## 🎯 **Quick Start Commands**

```powershell
# 1. Install packages
npm install

# 2. Start server
cd backend
node server.js

# 3. Open browser
start http://localhost:5000/createJournalPublications.html

# 4. Test with DOI: 10.1038/nature12373
```

---

## ✨ **Features Enabled**

After installation, you'll have:

✅ **DOI Auto-Fill** - One-click form population  
✅ **CrossRef Integration** - Official API access  
✅ **Google Scholar Enhancement** - Citation counts  
✅ **Rate Limiting** - 30 requests per 15 minutes  
✅ **Error Handling** - Graceful fallbacks  
✅ **Loading States** - User-friendly feedback  
✅ **Toast Notifications** - Success/error messages  

---

## 🎉 **You're All Set!**

The DOI auto-fill feature is now fully functional. Enjoy automatic form filling! 🚀
