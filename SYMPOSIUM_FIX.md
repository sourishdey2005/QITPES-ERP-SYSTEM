# Symposium Registry - Authorize Session Button Fix

## Issue
The "Authorize Session" button in the Symposium Registry (Collaboration Suite) was not working when users tried to create a new meeting/session.

## Root Cause
The issue was caused by passing an invalid `organizer_id` value to the database:
- The form was sending `organizer_id: 'internal'` (a string)
- The database expects `organizer_id` to be a UUID that references `auth.users(id)`
- This caused a foreign key constraint violation, preventing the meeting from being created

## Solution Implemented

### 1. Import useAuth Hook
```tsx
import { useAuth } from '../App';
```

### 2. Get Current User
```tsx
const { user } = useAuth();
```

### 3. Use Actual User ID
Changed from:
```tsx
createMeeting.mutate({ ...bookingForm, organizer_id: 'internal' })
```

To:
```tsx
createMeeting.mutate({ ...bookingForm, organizer_id: user?.id })
```

### 4. Added Error Handling
```tsx
onError: (error: any) => {
  console.error('Failed to create meeting:', error);
  alert(`Failed to create session: ${error.message || 'Unknown error'}`);
}
```

## Changes Made
- **File**: `pages/CollaborationSuite.tsx`
- Imported `useAuth` hook from App.tsx
- Added `const { user } = useAuth()` to get the authenticated user
- Updated form submission to use `user?.id` instead of hardcoded 'internal'
- Added error handling to show user-friendly error messages
- Removed unnecessary `!bookingForm.room_id` check from button disabled state (HTML5 validation handles this)

## Testing
The button should now:
1. ✅ Be clickable when all required fields are filled
2. ✅ Successfully create meetings with the authenticated user's ID
3. ✅ Show error messages if something goes wrong
4. ✅ Validate required fields using HTML5 validation
5. ✅ Refresh the meetings list after successful creation

## Database Schema Reference
```sql
CREATE TABLE IF NOT EXISTS meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  room_id UUID REFERENCES conference_rooms(id),
  organizer_id UUID REFERENCES auth.users(id),  -- Must be valid UUID
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  department TEXT DEFAULT 'General',
  agenda_url TEXT,
  status TEXT DEFAULT 'Scheduled'
);
```

## Date
February 13, 2026
