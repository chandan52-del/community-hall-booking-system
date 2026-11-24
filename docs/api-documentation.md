# Community Hall Booking System - API Documentation

This document describes the REST API endpoints enhanced for the ElevenLabs AI Voice Receptionist and web booking workflows.

All API responses strictly adhere to the unified envelope structure:
```json
{
  "success": true,
  "message": "Optional human-readable confirmation",
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "meta": { ... }
}
```

---

## 1. Hall Availability API

### Endpoint
`GET /api/halls/:id/availability`

### Query Parameters

| Parameter | Type | Required | Format | Description |
| :--- | :---: | :---: | :---: | :--- |
| `date` | `string` | **Yes** | `YYYY-MM-DD` | Target date to check. |
| `startTime` | `string` | Optional* | `HH:mm` (24h) | Event start time. *Must be provided if `endTime` is present. |
| `endTime` | `string` | Optional* | `HH:mm` (24h) | Event end time. *Must be strictly after `startTime`. |

*Note: If either `startTime` or `endTime` is specified, both must be provided.*

### Availability Rules
1. **Maintenance Blackouts:** Any active maintenance (`SCHEDULED` or `IN_PROGRESS`) covering the date immediately marks the hall unavailable with reason `MAINTENANCE`.
2. **Approved Bookings:** Only bookings with `status = APPROVED` block a requested slot. `PENDING`, `REJECTED`, or `CANCELLED` bookings do not block availability.
3. **Interval-Overlap Formula:** A conflict exists between requested interval `[requestedStart, requestedEnd]` and existing booking interval `[existingStart, existingEnd]` if and only if:
   $$\text{requestedStart} < \text{existingEnd} \quad \text{AND} \quad \text{requestedEnd} > \text{existingStart}$$
4. **Full-Day Bookings:** If an approved booking spans `09:00` to `21:00` or beyond, the entire day is marked `FULLY_BOOKED`.

### Responses

#### 200 OK — Time Slot Available
```json
{
  "success": true,
  "data": {
    "hallId": "ecc-centre-whitefield",
    "date": "2026-12-15",
    "startTime": "14:00",
    "endTime": "18:00",
    "isAvailable": true,
    "reason": "AVAILABLE",
    "bookedSlots": [
      {
        "id": "BK-20261215-1102",
        "startTime": "09:00",
        "endTime": "13:00",
        "eventType": "Seminar"
      }
    ]
  }
}
```

#### 200 OK — Time Slot Conflict
```json
{
  "success": true,
  "data": {
    "hallId": "ecc-centre-whitefield",
    "date": "2026-12-15",
    "startTime": "11:00",
    "endTime": "15:00",
    "isAvailable": false,
    "reason": "SLOT_CONFLICT",
    "details": {
      "conflictingSlot": {
        "id": "BK-20261215-1102",
        "startTime": "09:00",
        "endTime": "13:00",
        "eventType": "Seminar"
      }
    },
    "bookedSlots": [...]
  }
}
```

#### 200 OK — Maintenance Blackout
```json
{
  "success": true,
  "data": {
    "hallId": "ecc-centre-whitefield",
    "date": "2026-12-15",
    "startTime": "10:00",
    "endTime": "14:00",
    "isAvailable": false,
    "reason": "MAINTENANCE",
    "details": {
      "description": "Annual deep clean and electrical inspection",
      "startDate": "2026-12-14",
      "endDate": "2026-12-16",
      "status": "SCHEDULED"
    },
    "bookedSlots": []
  }
}
```

#### 400 Bad Request — Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid availability query parameters",
    "details": {
      "startTime": ["startTime must precede endTime"]
    }
  }
}
```

---

## 2. Booking Submission API

### Endpoint
`POST /api/bookings`

### Authentication
Optional. Open for guest submissions (e.g. ElevenLabs AI Receptionist). If an Authorization Bearer token is passed, the booking is automatically associated with the authenticated user ID.

### Request Payload

```json
{
  "hallId": "ecc-centre-whitefield",
  "eventType": "Wedding Reception",
  "eventDate": "2026-12-20",
  "startTime": "10:00",
  "endTime": "16:00",
  "guestsCount": 500,
  "contactName": "Aarav Sharma",
  "contactEmail": "aarav.sharma@example.com",
  "contactPhone": "+919876543210",
  "specialRequests": "Stage lighting and podium setup"
}
```

### Validation & Capacity Rules
1. `hallId`: Must reference an existing, active hall. Returns `404 HALL_NOT_FOUND` or `400 HALL_INACTIVE`.
2. `guestsCount`: Must be a positive integer ($> 0$).
3. **Capacity Validation:** `guestsCount` cannot exceed the hall's maximum capacity ($\max(\text{floatingCapacity}, \text{seatedCapacity})$). If it exceeds, returns `400 CAPACITY_EXCEEDED`.
4. `startTime` & `endTime`: Must be in `HH:mm` 24-hour format and `startTime < endTime`.
5. **Initial Status:** All created bookings are assigned `PENDING` status. Only an authorized administrator can approve or reject the request.

### Responses

#### 201 Created — Booking Request Submitted
```json
{
  "success": true,
  "message": "Booking request submitted successfully",
  "data": {
    "id": "BK-20261220-4821",
    "hallId": "ecc-centre-whitefield",
    "userId": null,
    "eventType": "Wedding Reception",
    "eventDate": "2026-12-20",
    "startTime": "10:00",
    "endTime": "16:00",
    "guestsCount": 500,
    "contactName": "Aarav Sharma",
    "contactEmail": "aarav.sharma@example.com",
    "contactPhone": "+919876543210",
    "specialRequests": "Stage lighting and podium setup",
    "status": "PENDING",
    "totalAmount": 89500,
    "createdAt": "2026-11-23T11:40:00.000Z",
    "updatedAt": "2026-11-23T11:40:00.000Z"
  }
}
```

#### 400 Bad Request — Capacity Exceeded
```json
{
  "success": false,
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "message": "Requested guest count (1200) exceeds the maximum capacity of ECC Centre Community Hall (800 guests)",
    "details": {
      "requestedGuests": 1200,
      "maxCapacity": 800,
      "seatedCapacity": 500,
      "floatingCapacity": 800
    }
  }
}
```
