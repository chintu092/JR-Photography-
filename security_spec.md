# Security Specification

## Data Invariants
- Site settings can only be read by anyone (public) but written only by admins.
- The `admins` collection can only be read/written by existing admins.
- The `supriyos9@gmail.com` user is the initial admin.

## Initial Admin Setup
As per the instructions, we will bootstrap `supriyos9@gmail.com` as an admin.

## "Dirty Dozen" Payloads
1. Create setting as non-auth user. (Denied)
2. Update setting as non-auth user. (Denied)
3. Update setting as auth user but non-admin. (Denied)
4. Create admin record as non-admin. (Denied)
5. Update `updatedBy` to another user's UID. (Denied)
6. Inject 1MB string into `logoUrl`. (Denied)
7. Delete site settings as non-admin. (Denied)
8. Update setting without `updatedAt` field. (Denied)
9. Malformed UID as adminId. (Denied)
10. Update terminal state if any. (N/A)
11. Read `admins` collection as non-auth user. (Denied)
12. Read `admins` collection as non-admin auth user. (Denied)
