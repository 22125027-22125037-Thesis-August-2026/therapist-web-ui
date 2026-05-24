# Tracking Service API controller

## Overview
Base paths:
- /api/v1/tracking
- /internal/v1/tracking
- /internal/v1/dashboard

Auth: endpoints that use `SecurityUtils` require a valid Bearer token.

## Data models
- DiaryEntryRequest
  - title (string, optional)
  - content (string, required)
  - moodTag (string)
  - positivityScore (integer, 1-10)
  - entryDate (string, date)

- DiaryEntryResponse
  - id (uuid)
  - content (string)
  - title (string)
  - moodTag (string)
  - positivityScore (integer)
  - entryDate (string, date)
  - attachments (MediaAttachmentResponse[])
  - createdAt (string, date-time)
  - updatedAt (string, date-time)

- FoodLogRequest
  - waterGlasses (integer, min 0)
  - foodDescription (string, required)
  - satietyLevel (string, required)
  - entryDate (string, date)

- FoodLogResponse
  - id (uuid)
  - waterGlasses (integer)
  - foodDescription (string)
  - satietyLevel (string)
  - entryDate (string, date)
  - createdAt (string, date-time)
  - updatedAt (string, date-time)

- MediaAttachmentRequest
  - referenceId (uuid)
  - referenceType (string)
  - fileUrl (string)
  - mediaType (string)
  - mimeType (string)
  - fileSizeBytes (number)

- MediaAttachmentResponse
  - id (uuid)
  - fileName (string)
  - fileType (string)
  - fileUrl (string)

- MoodLogRequest
  - positivityScore (integer, 1-10)
  - note (string)

- MoodLogResponse
  - id (uuid)
  - positivityScore (integer)
  - note (string)
  - logDate (string, date-time)

- SleepLogRequest
  - bedTime (string, date-time, required)
  - wakeTime (string, date-time, required)
  - sleepQuality (integer)
  - note (string)
  - entryDate (string, date)

- SleepLogResponse
  - id (uuid)
  - bedTime (string, date-time)
  - wakeTime (string, date-time)
  - durationMinutes (integer)
  - sleepQuality (integer)
  - note (string)
  - entryDate (string, date)
  - createdAt (string, date-time)
  - updatedAt (string, date-time)

- StreakRequest
  - streakType (string)
  - currentCount (integer)
  - longestCount (integer)
  - lastLoggedAt (string, date-time)

- StreakResponse
  - id (uuid)
  - streakType (string)
  - currentCount (integer)
  - longestCount (integer)
  - lastLoggedAt (string, date-time)
  - createdAt (string, date-time)
  - updatedAt (string, date-time)

- DataAccessGrantRequest
  - granteeProfileId (uuid, required)
  - accessScope (enum, required): READ_JOURNAL | READ_ALL
  - expiresAt (string, instant)

- DataAccessGrantResponse
  - grantId (uuid)
  - granterProfileId (uuid)
  - granteeProfileId (uuid)
  - status (enum): ACTIVE | REVOKED
  - accessScope (enum): READ_JOURNAL | READ_ALL
  - grantedAt (string, instant)
  - expiresAt (string, instant)
  - createdAt (string, instant)
  - updatedAt (string, instant)

- ApiResponse<T>
  - success (boolean)
  - message (string)
  - data (T)
  - error (string)

## Endpoints
### Diary
- POST /api/v1/tracking/diaries/
  - Auth: Bearer token
  - Content-Type: multipart/form-data
  - Form fields:
    - diary (string JSON, required)
    - attachments (binary[], optional)
  - Response: 201 Created, DiaryEntryResponse

- GET /api/v1/tracking/diaries/{profileId}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Response: 200 OK, List<DiaryEntryResponse>

- GET /api/v1/tracking/diaries/{profileId}/{id}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Response: 200 OK, DiaryEntryResponse

- PUT /api/v1/tracking/diaries/{id}
  - Auth: Bearer token
  - Content-Type: multipart/form-data
  - Form fields:
    - diary (string JSON, optional)
    - attachments (binary[], optional)
  - Response: 200 OK, DiaryEntryResponse

- DELETE /api/v1/tracking/diaries/{id}
  - Auth: Bearer token
  - Response: 204 No Content

### Food
- POST /api/v1/tracking/foods/
  - Auth: Bearer token
  - Body: FoodLogRequest
  - Response: 201 Created, FoodLogResponse

- GET /api/v1/tracking/foods/{profileId}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Query params:
    - startDate (date, optional)
    - endDate (date, optional)
  - Response: 200 OK, List<FoodLogResponse>

- GET /api/v1/tracking/foods/{profileId}/{id}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Response: 200 OK, FoodLogResponse

- PUT /api/v1/tracking/foods/{id}
  - Auth: Bearer token
  - Body: FoodLogRequest
  - Response: 200 OK, FoodLogResponse

- DELETE /api/v1/tracking/foods/{id}
  - Auth: Bearer token
  - Response: 204 No Content

### Mood
- POST /api/v1/tracking/moods/
  - Auth: Bearer token
  - Body: MoodLogRequest
  - Response: 201 Created, MoodLogResponse

- GET /api/v1/tracking/moods/{profileId}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Response: 200 OK, List<MoodLogResponse>

- GET /api/v1/tracking/moods/{profileId}/{id}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Response: 200 OK, MoodLogResponse

- PUT /api/v1/tracking/moods/{id}
  - Auth: Bearer token
  - Body: MoodLogRequest
  - Response: 200 OK, MoodLogResponse

- DELETE /api/v1/tracking/moods/{id}
  - Auth: Bearer token
  - Response: 204 No Content

### Sleep
- POST /api/v1/tracking/sleeps/
  - Auth: Bearer token
  - Body: SleepLogRequest
  - Response: 201 Created, SleepLogResponse

- GET /api/v1/tracking/sleeps/{profileId}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Response: 200 OK, List<SleepLogResponse>

- GET /api/v1/tracking/sleeps/{profileId}/{id}
  - Auth: Bearer token
  - Authorization: profile owner or granted access
  - Response: 200 OK, SleepLogResponse

- PUT /api/v1/tracking/sleeps/{id}
  - Auth: Bearer token
  - Body: SleepLogRequest
  - Response: 200 OK, SleepLogResponse

- DELETE /api/v1/tracking/sleeps/{id}
  - Auth: Bearer token
  - Response: 204 No Content

### Media Attachments
- POST /api/v1/tracking/media/
  - Auth: Bearer token
  - Body: MediaAttachmentRequest
  - Response: 201 Created, MediaAttachmentResponse

- GET /api/v1/tracking/media/
  - Auth: Bearer token
  - Response: 200 OK, List<MediaAttachmentResponse>

- GET /api/v1/tracking/media/{id}
  - Auth: Bearer token
  - Response: 200 OK, MediaAttachmentResponse

- PUT /api/v1/tracking/media/{id}
  - Auth: Bearer token
  - Body: MediaAttachmentRequest
  - Response: 200 OK, MediaAttachmentResponse

- DELETE /api/v1/tracking/media/{id}
  - Auth: Bearer token
  - Response: 204 No Content

### Streaks
- POST /api/v1/tracking/streaks/
  - Auth: Bearer token
  - Body: StreakRequest
  - Response: 201 Created, StreakResponse

- GET /api/v1/tracking/streaks/
  - Auth: Bearer token
  - Response: 200 OK, List<StreakResponse>

- GET /api/v1/tracking/streaks/{id}
  - Auth: Bearer token
  - Response: 200 OK, StreakResponse

- PUT /api/v1/tracking/streaks/{id}
  - Auth: Bearer token
  - Body: StreakRequest
  - Response: 200 OK, StreakResponse

- DELETE /api/v1/tracking/streaks/{id}
  - Auth: Bearer token
  - Response: 204 No Content

### Data Access Grants (Tracking)
All responses are wrapped in ApiResponse.

- POST /api/v1/tracking/grants
  - Auth: Bearer token (granter is current profile)
  - Body: DataAccessGrantRequest
  - Response: 200 OK, ApiResponse<DataAccessGrantResponse>

- DELETE /api/v1/tracking/grants/{granteeProfileId}
  - Auth: Bearer token (granter is current profile)
  - Response: 200 OK, ApiResponse<Void>

- GET /api/v1/tracking/grants
  - Auth: Bearer token (granter is current profile)
  - Response: 200 OK, ApiResponse<List<DataAccessGrantResponse>>

- GET /api/v1/tracking/grants/received
  - Auth: Bearer token (grantee is current profile)
  - Response: 200 OK, ApiResponse<List<DataAccessGrantResponse>>

### Internal
- GET /internal/v1/tracking/context/{profileId}
  - Query params:
    - days (integer, default 7)
  - Response: 200 OK, text/plain summary
  - Errors: 500 returns a fallback summary string

- GET /internal/v1/dashboard/{profileId}/summary
  - Response: 200 OK
    - latestMood (number, optional)
    - moodCount (number, optional)
    - avgSleepMinutes (number, optional)
    - sleepCount (number, optional)
    - currentStreak (number, optional)
    - longestStreak (number, optional)
