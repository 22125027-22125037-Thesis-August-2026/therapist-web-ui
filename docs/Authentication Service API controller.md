# Authentication Service API controller

## Overview
Base paths:
- /api/v1/auth
- /api/v1/auth/grants
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
