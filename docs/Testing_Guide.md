# Testing Guide — Zelosify Clean Architecture

## Pre-Test Checklist

- [x] Docker containers running: PostgreSQL, Keycloak, MinIO
- [x] Backend running on port 5000
- [x] Frontend running on port 3000
- [x] Database seeded with openings

---

## 1. Authentication

### 1.1 Login as Vendor
1. Go to `http://localhost:3000/login`
2. Enter `vendor1` / `Vendor@1234`
3. **Expected**: Redirects to `/vendor/openings`

### 1.2 Login as Hiring Manager
1. Go to `http://localhost:3000/login`
2. Enter `admin` / `Admin@1234`
3. **Expected**: Redirects to `/hiring-manager/openings`

### 1.3 Login as Vendor2
1. Go to `http://localhost:3000/login`
2. Enter `vendor2` / `Vendor@1234`
3. **Expected**: Redirects to `/vendor/openings`

### 1.4 Logout
1. Click "Sign Out" in sidebar
2. **Expected**: Redirects to `/login`, cookies cleared

### 1.5 Unauthorized Access
1. Open `http://localhost:3000/vendor/openings` without logging in
2. **Expected**: Redirects to `/login`

---

## 2. IT Vendor — Openings

### 2.1 View Openings List
1. Login as `vendor1`
2. Navigate to Openings
3. **Expected**: List of openings with title, location, contract type, posted date

### 2.2 View Opening Details
1. Click on any opening
2. **Expected**: Opening details page with:
   - Title, description, location, contract type, experience range
   - Upload section (drag-drop + click)
   - Submitted profiles list (only YOUR profiles)

### 2.3 Pagination
1. If >10 openings, check pagination buttons
2. **Expected**: Previous/Next work correctly

### 2.4 Search/Openings
1. Use search bar to filter by title or location
2. **Expected**: Filter works correctly

---

## 3. IT Vendor — Profile Upload

### 3.1 Upload Single PDF
1. Go to opening details
2. Click upload area, select a PDF file
3. **Expected**: File uploads, appears in "Submitted Profiles" with SUBMITTED status

### 3.2 Upload Multiple Files
1. Select multiple PDF/PPTX files
2. **Expected**: All files upload successfully

### 3.3 Drag and Drop
1. Drag a file onto the upload area
2. **Expected**: File uploads successfully

### 3.4 Supported Formats
- [ ] PDF uploads OK
- [ ] PPTX uploads OK
- [ ] Other formats rejected

### 3.5 Delete Profile
1. Click the trash icon on a submitted profile
2. **Expected**: Profile disappears (soft deleted)

---

## 4. IT Vendor — Profile Isolation (CRITICAL)

### 4.1 Vendor1 Sees Only Own Profiles
1. Login as `vendor1`
2. Open any opening
3. **Expected**: Only profiles uploaded by vendor1 are shown

### 4.2 Vendor2 Sees Only Own Profiles
1. Login as `vendor2`
2. Open the SAME opening
3. **Expected**: 0 profiles (vendor2 hasn't uploaded anything to this opening)

### 4.3 Upload as Vendor2
1. Login as `vendor2`
2. Upload a profile to the same opening
3. Login as `vendor1`, check the opening
4. **Expected**: vendor1 does NOT see vendor2's profile

---

## 5. IT Vendor — Sidebar

### 5.1 Vendor Sidebar Items
1. Login as `vendor1`
2. **Expected**: Sidebar shows ONLY "Openings" (no Payments)

---

## 6. Hiring Manager — Openings

### 6.1 View Openings List
1. Login as `admin` (HIRING_MANAGER)
2. Navigate to Openings
3. **Expected**: List of openings with stats (total, submitted, shortlisted, rejected)

### 6.2 View Opening Details
1. Click on any opening
2. **Expected**: Opening details with ALL profiles from ALL vendors

### 6.3 Profile Cards Show
For each profile:
- [ ] File name
- [ ] Upload date
- [ ] **Uploaded by** (vendor name/username)
- [ ] Status badge (SUBMITTED/SHORTLISTED/REJECTED)
- [ ] AI recommendation badge (if available)
- [ ] Score percentage
- [ ] Confidence percentage
- [ ] Explanation/reason
- [ ] Processing time (latency)
- [ ] **View button** (opens file in new tab)
- [ ] Shortlist button
- [ ] Reject button

---

## 7. Hiring Manager — Profile Actions

### 7.1 Shortlist Profile
1. Click "Shortlist" on a SUBMITTED profile
2. **Expected**:
   - Status changes to SHORTLISTED
   - Vendor receives email notification (if SMTP configured)

### 7.2 Reject Profile
1. Click "Reject" on a SUBMITTED profile
2. **Expected**:
   - Status changes to REJECTED
   - Vendor receives email notification (if SMTP configured)

### 7.3 View Profile File
1. Click the eye icon (View) on a profile
2. **Expected**: File opens in a new browser tab (PDF/PPTX preview)

### 7.4 Status Update
1. Change profile status via status endpoint
2. **Expected**: Status updates correctly

---

## 8. Hiring Manager — Notes

### 8.1 Add Note
1. On a profile, add a note with some text
2. **Expected**: Note appears with author name and timestamp

### 8.2 Delete Note
1. Delete a note you created
2. **Expected**: Note removed

### 8.3 Cannot Delete Others' Notes
1. Try to delete a note created by a different user
2. **Expected**: 403 Forbidden

---

## 9. AI Recommendation Agent

### 9.1 Auto-Trigger on Upload
1. Upload a resume as vendor
2. Check the profile in hiring manager view
3. **Expected**: AI recommendation appears (score, confidence, reason)

### 9.2 Manual Trigger (Batch)
1. As hiring manager, trigger recommendation for an opening
2. **Expected**: All submitted profiles get scored

### 9.3 Manual Trigger (Single)
1. As hiring manager, trigger recommendation for one profile
2. **Expected**: Score, confidence, reason, latency stored

### 9.4 Score Formula
Verify the deterministic score:
```
FinalScore = (0.5 * skillMatch) + (0.3 * experienceMatch) + (0.2 * locationMatch)
```

### 9.5 Decision Thresholds
- [ ] Score >= 0.75 → "Recommended"
- [ ] Score 0.5-0.74 → "Borderline"
- [ ] Score < 0.5 → "Not Recommended"

### 9.6 LLM Mode (Optional)
1. Set `useLLM: true` in the request body
2. **Expected**: LLM enhances the reasoning, token usage logged

---

## 10. Analytics Dashboard

### 10.1 View Dashboard
1. Login as hiring manager
2. Navigate to Analytics
3. **Expected**: Dashboard shows:
   - Total openings by status
   - Total profiles by status
   - Recent profiles (last 7 days)
   - Average recommendation score

---

## 11. RBAC Enforcement (CRITICAL)

### 11.1 Vendor Cannot Access Manager Routes
1. Login as `vendor1`
2. Try to access `/hiring-manager/openings` via API
3. **Expected**: 403 Forbidden

### 11.2 Manager Cannot Access Vendor Upload
1. Login as `admin`
2. Try to access `/vendor/openings/:id/profiles/upload`
3. **Expected**: 403 Forbidden

### 11.3 Vendor Cannot View AI Recommendations
1. Login as `vendor1`
2. Try to access `/ai/recommend/:openingId`
3. **Expected**: 403 Forbidden

### 11.4 Vendor Cannot Shortlist/Reject
1. Login as `vendor1`
2. Try to access shortlist/reject endpoints
3. **Expected**: 403 Forbidden

---

## 12. Tenant Isolation (CRITICAL)

### 12.1 Cross-Tenant Opening Access
1. If multiple tenants exist, vendor from tenant A cannot see tenant B's openings
2. **Expected**: Only same-tenant data visible

### 12.2 Cross-Tenant Profile Access
1. Vendor from tenant A cannot upload to tenant B's openings
2. **Expected**: 404 or 403

---

## 13. API Endpoints Quick Test

```bash
# Login
POST /api/v1/auth/verify-login
{ "usernameOrEmail": "vendor1", "password": "Vendor@1234" }

# Vendor Openings
GET /api/v1/vendor/openings

# Vendor Opening Details
GET /api/v1/vendor/openings/:id

# Presign Upload
POST /api/v1/vendor/openings/:id/profiles/presign
{ "fileName": "resume.pdf", "contentType": "application/pdf" }

# Submit Profile
POST /api/v1/vendor/openings/:id/profiles/upload
{ "s3Key": "tenant/opening/timestamp_resume.pdf" }

# Delete Profile
DELETE /api/v1/vendor/openings/:openingId/profiles/:profileId

# Hiring Manager Openings
GET /api/v1/hiring-manager/openings

# View Profile (get presigned URL)
GET /api/v1/hiring-manager/profiles/:profileId/view

# Shortlist
PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/shortlist

# Reject
PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/reject

# Add Note
POST /api/v1/hiring-manager/profiles/:profileId/notes
{ "content": "Great candidate" }

# Get Notes
GET /api/v1/hiring-manager/profiles/:profileId/notes

# AI Recommend (Batch)
POST /api/v1/ai/recommend/:openingId
{ "useLLM": false }

# AI Recommend (Single)
POST /api/v1/ai/recommend/:openingId/:profileId
{ "useLLM": false }

# Analytics
GET /api/v1/analytics/dashboard
```

---

## 14. Test Credentials

| User | Password | Role | Tenant |
|------|----------|------|--------|
| vendor1 | Vendor@1234 | IT_VENDOR | c36a8dbf-... |
| vendor2 | Vendor@1234 | IT_VENDOR | c36a8dbf-... |
| admin | Admin@1234 | HIRING_MANAGER | c36a8dbf-... |

---

## 15. What to Report

After testing, report:
1. ✅ Features that work
2. ❌ Features that fail (with steps to reproduce)
3. ⚠️ Unexpected behavior
