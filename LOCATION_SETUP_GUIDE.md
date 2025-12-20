# Location Tracking Setup Guide

## Why isn't the location showing on the web dashboard?

For the location to appear on the web dashboard, you need to complete these steps:

### Step 1: Create a Parent Account (if not already done)
1. Open the **web dashboard** at `http://localhost:5173`
2. Register a new account or log in
3. This creates a parent profile automatically

### Step 2: Create a Child Profile
**Option A: From Web Dashboard**
1. Log in to the web dashboard
2. Click "Add Child" or go to "My Children"
3. Fill in:
   - Child's name
   - Age
   - Device ID (optional - can leave blank)
4. Click "Save"

**Option B: From Mobile App**
1. Log in to the mobile app with the same parent account
2. Go to "Add Child" from the dashboard
3. Fill in the child details and save

### Step 3: Log in to Mobile App
1. Open the mobile app on the emulator
2. Log in with the **same parent account** you used on the web dashboard
3. Make sure you're logged in successfully

### Step 4: Start Location Tracking
1. In the mobile app, go to **"Location Tracking"** screen
2. **Select a child** from the dropdown (if you have multiple children)
3. Click **"Start Tracking"** button
4. Grant location permissions when prompted
5. You should see a success message: "Location tracking and shake detection started!"

### Step 5: Verify on Web Dashboard
1. Go back to the web dashboard
2. The map should show the child's location
3. Location updates every 30 seconds (or as configured)

## Troubleshooting

### Still not seeing location?

1. **Check if child exists:**
   - Web dashboard → "My Children" → Should list your child
   - Mobile app → "Location Tracking" → Should show child in dropdown

2. **Check if tracking is active:**
   - Mobile app → "Location Tracking" → Should show "Tracking: Active"
   - Check for any error messages

3. **Check backend logs:**
   - Look for location update requests in backend terminal
   - Should see: `Location update sent successfully`

4. **Check permissions:**
   - Mobile app needs location permissions
   - Go to Android Settings → Apps → Child Security App → Permissions → Location → Allow

5. **Check API connection:**
   - Mobile app should connect to `http://10.0.2.2:8000` (emulator)
   - Backend should be running on `http://127.0.0.1:8000`

6. **Check Redis:**
   - Backend uses Redis to cache locations
   - Make sure Redis is running: `redis-cli ping` should return `PONG`

## Quick Test

To quickly test if everything is working:

1. **Mobile App:**
   - Open "Location Tracking"
   - Select a child
   - Click "Test Location" button
   - Should show current coordinates

2. **Web Dashboard:**
   - Refresh the page
   - Check the map - should show a marker

3. **Backend Logs:**
   - Should see: `PUT /api/locations/child/{child_id}` requests

## Common Issues

### "No child ID found"
- Make sure you've created a child profile
- Make sure you've selected a child in the Location Tracking screen

### "Failed to start location tracking"
- Check location permissions in Android settings
- Make sure location services are enabled on the emulator

### "Location not showing on dashboard"
- Make sure you're logged in as the same parent on both web and mobile
- Make sure location tracking is started on mobile
- Check backend logs for errors
- Check Redis is running

### "Permission denied"
- Go to Android Settings → Apps → Child Security App → Permissions
- Enable "Location" permission
- For background tracking, enable "Allow all the time"

