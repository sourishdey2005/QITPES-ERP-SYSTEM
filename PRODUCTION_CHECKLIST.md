# Production Deployment Checklist - QITPES ERP

## 🔐 Security & Access Control

- [ ] **Database Migration**
  - Run `db_approved_users.sql` in Supabase SQL Editor to create the `approved_users` table and policies.
  - Verify that the owner email `abhradeephazra99@gmail.com` is inserted correctly.

- [ ] **Environment Configuration**
  - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in `.env`.
  - Check that RLS policies are enabled on all tables including `approved_users`.

- [ ] **Owner Account Setup**
  - Log in with the hardcoded owner credentials (`abhradeephazra99@gmail.com` / `Ahazra@987`).
  - Verify access to the **Access Control** menu item.

## 🚀 Feature Validation

- [ ] **User Management**
  - Add a test user via Access Control page.
  - Verify the user receives an "Approved" status.
  - Register with the test email (should succeed).
  - Try registering with a random email (should fail with "Access Denied").

- [ ] **Login Protection**
  - Log in with the test user.
  - Revoke access from the owner account.
  - Try logging in again (should fail with "Access Revoked").
  - Restore access and verify login works.

## 📦 Build & Deploy

- [ ] Run `npm run build` to generate production assets.
- [ ] Deploy the `dist` folder to your hosting provider (Vercel/Netlify/etc).
- [ ] Configure environment variables on the hosting platform.

---

**Version**: 1.0.0
**Date**: February 13, 2026
