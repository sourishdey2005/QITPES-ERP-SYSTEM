# Enterprise Access Control System - Feature Documentation

## Overview
A strict, invite-only access control system designed to secure the QITPES ERP platform. Access is restricted to pre-approved emails managed solely by the system owner.

## Core Features

### 1. Hardcoded Owner Access
- **Credential Lock**: Hardcoded credentials for the owner to ensure recovery access.
- **Email**: `abhradeephazra99@gmail.com`
- **Role**: `owner` (Full Admin Privileges)
- **Privilege**: Can bypass approval checks during registration/login.

### 2. Approval-Based User Access
- **Strict Verification**: Only emails present in the `approved_users` table can register or log in.
- **Owner-Managed**: Only the owner can add, revoke, or delete approved users.
- **Role Pre-Assignment**: Roles are assigned at the time of approval, ensuring users get the correct permissions automatically.

### 3. Dedicated Access Control Page
- **Location**: Admin > Access Control (`/access-control`)
- **Access**: Restricted to `owner` role only.
- **Capabilities**:
  - View all approved users
  - Add new detailed user approvals
  - Revoke/Restore access instantly
  - Permanently delete approvals
  - Search and filter functionality

### 4. Registration Protection
- **Pre-Check**: Validates email against approved list before creating Supabase account.
- **Error Handling**: Custom messages for unapproved emails ("Access Denied").
- **Auto-Role**: Automatically sets the user's role based on the approval record.

### 5. Login Protection
- **Pre-Check**: Validates email against approved list before attempting authentication.
- **Status Check**: Ensures the user's approval status is `Active`. Revoked users cannot log in even with correct passwords.

---

## Technical Implementation

### Database Schema (`approved_users`)
```sql
CREATE TABLE approved_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'accounting',
  is_active BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  ...
);
```

### RLS Policies
- **Select/Insert/Update/Delete**: Restricted strictly to users with `role = 'owner'` in their profile.

### Security Logic
1. **User attempts Login/Register**
2. **Frontend** calls Supabase to check `approved_users` table for the email.
3. **If Found & Active**: Proceed to Supabase Auth.
4. **If Not Found or Inactive**: Block request and show error.

---

## User Workflows

### For the Owner
1. **Login** using hardcoded credentials.
2. Navigate to **Access Control**.
3. Click "Approve New User".
4. Enter Full Name, Email, and select Role.
5. Click "Grant Access".
6. Share credentials/invite with the employee.

### For Employees
1. Receive notification from Owner that they are approved.
2. Go to **Register** page.
3. Enter the approved email and their own chosen password.
4. System verifies approval and creates account.
5. Log in to access assigned modules.

### Revoking Access
1. Owner goes to **Access Control**.
2. Finds user in the list.
3. Toggles status button (Green Check → Red X).
4. User is immediately blocked from logging in.

---

## Setup & Deployment

1. **Database**: Run the SQL script `db_approved_users.sql` to create the table and policies.
2. **Environment**: Ensure Supabase URL and Key are correct in `.env`.
3. **Owner Bootstrapping**: The SQL script automatically inserts the owner email as pre-approved.

## Testing Checklist

- [ ] Owner can log in with hardcoded credentials
- [ ] Owner can access Access Control page
- [ ] Non-owner cannot access Access Control page
- [ ] Unapproved email is blocked from registering
- [ ] Approved email can register successfully
- [ ] Revoked user is blocked from logging in
- [ ] Access restored user can log in again
- [ ] Duplicate email approval is prevented

---

**Version**: 1.0.0
**Date**: February 13, 2026
**Security Level**: High (Invite-Only)
