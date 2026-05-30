# Authentication Service API controller

## Overview
Base paths:
- /api/v1/auth
- /api/v1/auth/grants
- /api/v1/patients
- /admin/v1/therapists
- /internal/v1

Auth: endpoints that use `SecurityContextHolder` or `SecurityUtils` require a valid Bearer token.

## Data models
- RegisterRequest
  - fullName (string, required)
  - avatarUrl (string)
  - email (string, required, email)
  - password (string, required)
  - phoneNumber (string)
  - dob (string, date)
  - role (enum, required): TEEN | PARENT | THERAPIST | ADMIN
  - gender (string)
  - pinCode (string)
  - accountType (enum): PARENT | CHILD
  - school (string)
  - emergencyContact (string)
  - specialization (string)
  - bio (string)
  - yearsOfExperience (integer)
  - consultationFee (number)
  - verified (boolean)

- LoginRequest
  - email (string)
  - password (string)

- ProfileUpdateRequest
  - fullName (string)
  - avatarUrl (string)
  - phoneNumber (string)
  - specialization (string) — therapist only, ignored for other roles
  - bio (string) — therapist only
  - yearsOfExperience (integer) — therapist only
  - consultationFee (number) — therapist only
  - languages (string[]) — therapist only

- ChangePasswordRequest
  - currentPassword (string, required)
  - newPassword (string, required, min length 8, must differ from current)

- LicenseResponse
  - profileId (uuid)
  - status (enum): PENDING_VERIFICATION | VERIFIED | REJECTED | EXPIRED
  - licenseNumber (string)
  - licenseAuthority (string)
  - licenseExpiresAt (string, date)
  - documentUrl (string) — presigned URL to the uploaded document
  - verified (boolean) — legacy convenience flag, true iff status == VERIFIED

- PatientDetailResponse
  - profileId (uuid)
  - fullName (string)
  - email (string)
  - role (string)
  - avatarUrl (string)
  - dateOfBirth (string, date)
  - age (integer) — derived from dateOfBirth
  - gender (string)
  - phoneNumber (string)
  - school (string) — teen profiles only
  - emergencyContact (string) — teen profiles only

- AuthResponse
  - token (string)
  - profileId (uuid)
  - email (string)
  - role (string)

- UserResponse
  - id (uuid)
  - fullName (string)
  - email (string)
  - phoneNumber (string)
  - dob (string, date)
  - role (string)
  - creditsBalance (integer)
  - avatarUrl (string)
  - Therapist-only fields (omitted/null for other roles):
    - specialization (string)
    - bio (string)
    - yearsOfExperience (integer)
    - consultationFee (number)
    - languages (string[])
    - licenseNumber (string)
    - licenseAuthority (string)
    - licenseExpiresAt (string, date)
    - licenseStatus (enum): PENDING_VERIFICATION | VERIFIED | REJECTED | EXPIRED

- GrantAccessRequest
  - granteeProfileId (uuid, required)
  - accessScope (enum, required): READ_JOURNAL | READ_ALL
  - expiresAt (string, instant, optional, must be future)

- DataAccessGrantResponse
  - grantId (uuid)
  - granterProfileId (uuid)
  - granteeProfileId (uuid)
  - status (enum): ACTIVE | REVOKED
  - accessScope (enum): READ_JOURNAL | READ_ALL
  - grantedAt (string, instant)
  - expiresAt (string, instant)

- GrantStatusResponse
  - iGaveThemAccess (boolean)
  - theyGaveMeAccess (boolean)
  - myGrant (DataAccessGrantResponse)
  - theirGrant (DataAccessGrantResponse)

- ApiResponse<T>
  - success (boolean)
  - message (string)
  - data (T)
  - error (string)

## Endpoints
### Auth
- POST /api/v1/auth/register
  - Body: RegisterRequest
  - Response: 200 OK, AuthResponse

- POST /api/v1/auth/login
  - Body: LoginRequest
  - Response: 200 OK, AuthResponse

- GET /api/v1/auth/me
  - Auth: Bearer token
  - Response: 200 OK, UserResponse

- PATCH /api/v1/auth/profile
  - Auth: Bearer token
  - Body: ProfileUpdateRequest
  - Response: 200 OK, UserResponse

- POST /api/v1/auth/profile/avatar
  - Auth: Bearer token
  - Content-Type: multipart/form-data
  - Form fields:
    - file (binary, required)
  - Response: 200 OK, { "url": "https://..." }
  - Errors: 400 with { "error": "..." } for invalid file, 500 with { "error": "Failed to upload avatar" }

- POST /api/v1/auth/logout
  - Auth: Bearer token
  - Response: 200 OK, "Logged out successfully"
  - Errors: 400 "No token found"

- POST /api/v1/auth/password/change
  - Auth: Bearer token
  - Body: ChangePasswordRequest
  - Response: 200 OK, { "message": "Password changed successfully" }
  - Errors: 400 with { "error": "..." } when the current password is wrong,
    the new password is too short, or it equals the current one

### Therapist license (Auth)
The current profile must be a THERAPIST.

- GET /api/v1/auth/license
  - Auth: Bearer token
  - Response: 200 OK, LicenseResponse
  - Errors: 400 if the profile is not a therapist

- POST /api/v1/auth/license/renew
  - Auth: Bearer token
  - Content-Type: multipart/form-data
  - Form fields (all optional; submit what changed):
    - document (binary) — PDF/JPEG/PNG, max 10MB
    - licenseNumber (string)
    - licenseAuthority (string)
    - licenseExpiresAt (string, date, ISO yyyy-MM-dd)
  - Effect: stores the document and resets status to PENDING_VERIFICATION
  - Response: 200 OK, LicenseResponse
  - Errors: 400 with { "error": "..." } for invalid document type/size

### Admin — therapists
The {id} path variable is the therapist's profile id. Caller must be ADMIN.

- POST /admin/v1/therapists/{id}/license/verify
  - Auth: Bearer token (ADMIN)
  - Effect: status -> VERIFIED
  - Response: 200 OK, LicenseResponse

- POST /admin/v1/therapists/{id}/license/reject
  - Auth: Bearer token (ADMIN)
  - Effect: status -> REJECTED
  - Response: 200 OK, LicenseResponse

### Patients (therapist-facing)
- GET /api/v1/patients/{profileId}
  - Auth: Bearer token
  - Authorization: ADMIN, the profile owner, or a caller holding an ACTIVE
    data-access grant from the patient (same rule as reading tracking data)
  - Response: 200 OK, PatientDetailResponse
  - Errors: 403 if not authorized, 404 if profile not found

### Data Access Grants (Auth)
All responses are wrapped in ApiResponse.

- POST /api/v1/auth/grants
  - Auth: Bearer token (granter is current profile)
  - Body: GrantAccessRequest
  - Response: 200 OK, ApiResponse<DataAccessGrantResponse>

- DELETE /api/v1/auth/grants/{granteeProfileId}
  - Auth: Bearer token (granter is current profile)
  - Response: 200 OK, ApiResponse<Void>

- GET /api/v1/auth/grants/{profileId}
  - Auth: Bearer token
  - Authorization: ADMIN or profile owner
  - Response: 200 OK, ApiResponse<List<DataAccessGrantResponse>>

- GET /api/v1/auth/grants/{profileId}/received
  - Auth: Bearer token
  - Authorization: ADMIN or profile owner
  - Response: 200 OK, ApiResponse<List<DataAccessGrantResponse>>

- GET /api/v1/auth/grants/status/{otherProfileId}
  - Auth: Bearer token
  - Response: 200 OK, ApiResponse<GrantStatusResponse>

### Internal
- GET /internal/v1/profile/{profileId}/summary
  - Response: 200 OK
    - profileId (string)
    - name (string)
    - email (string)
    - role (string)
    - avatarUrl (string)
  - Errors: 404 if profile not found
