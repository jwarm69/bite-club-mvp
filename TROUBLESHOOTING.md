# 🔧 Troubleshooting Login Issues

## Quick Fix Steps:

### 1. **Check Browser Developer Console**
- Right-click → Inspect → Console tab
- Look for any red error messages
- Common errors: CORS, Network, or API connection issues

### 2. **Restart Both Servers**
```bash
# Stop frontend (Ctrl+C in the terminal running npm start)
# Stop backend (Ctrl+C in the terminal running npm run dev)

# Restart backend
cd backend
npm run dev

# Restart frontend (new terminal)
cd frontend
npm start
```

### 3. **Clear Browser Cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or open in incognito/private mode

### 4. **Check Network Tab**
- Open Developer Tools → Network tab
- Try logging in again
- Look for failed API calls (red entries)

## Test Login Directly:

If you're still having issues, try these credentials:

**Student Account:**
- Email: `student@fau.edu`
- Password: `student123`

**Restaurant Account:**
- Email: `pizza@fau.edu`
- Password: `restaurant123`

**Admin Account:**
- Email: `admin@biteclub.com`
- Password: `admin123`

## Expected Flow:
1. Enter credentials on login page
2. Click "Sign In"
3. Should redirect to dashboard based on user role
4. Student sees: Credit balance, ordering sections
5. Restaurant sees: Menu management, orders
6. Admin sees: Platform management

## Manual Test:
You can test if the API is working by visiting:
http://localhost:3001/health

Should show: `{"status":"OK","timestamp":"..."}`

## Common Issues:

**"Site can't be reached":**
- Backend server not running
- Wrong port (should be 3000 for frontend, 3001 for backend)
- CORS issue

**Login form doesn't work:**
- Check browser console for JavaScript errors
- Verify environment variables in frontend/.env

**Redirect issues:**
- Clear browser localStorage
- Try incognito/private browsing mode