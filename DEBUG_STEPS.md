# 🔍 Debug Steps - Login Not Working

## Step 1: Open the App
Go to: **http://localhost:3000**

## Step 2: Open Browser Developer Tools
- **Chrome/Edge**: Press F12 or Right-click → Inspect
- **Safari**: Develop → Show JavaScript Console
- **Firefox**: Press F12

## Step 3: Check for Errors
Look in these tabs for red error messages:
1. **Console tab** - Look for JavaScript errors
2. **Network tab** - Look for failed API calls

## Step 4: What You Should See
On the login page, you should see:
- "Bite Club" logo at top
- "The smart way to order campus food" subtitle
- Login form with email/password fields
- "Sign up as Student" and "Register Restaurant" links

## Step 5: Test Login Step by Step

### 5a. Try typing in the login form:
- Email: `student@fau.edu`
- Password: `student123`
- Click "Sign In"

### 5b. Watch the Console tab for messages like:
- "Attempting login with: student@fau.edu"
- "Login successful: ..."
- OR any red error messages

## Step 6: Common Issues

### If you see a blank page:
- Check Console for JavaScript errors
- Try refreshing with Ctrl+Shift+R (hard refresh)

### If the form doesn't respond:
- Check if JavaScript is enabled
- Try in incognito/private mode

### If you get "Network Error":
- Make sure backend is running on port 3001
- Check if http://localhost:3001/health shows {"status":"OK"}

## Step 7: Manual Test
You can test the API directly:

Open a new tab and go to: **http://localhost:3001/health**
Should show: `{"status":"OK","timestamp":"..."}`

## Step 8: What to Look For
Please share what you see in:
1. **The browser page** (screenshot if possible)
2. **Console tab errors** (any red text)
3. **Network tab** (any failed requests in red)

This will help me identify exactly what's going wrong!