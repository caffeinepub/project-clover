# Project Clover

## Current State
Admins can upload events with title, date, location, price, and recipientUsername. Events are stored in stable memory. Reservations reference eventId and dynamically join event details at query time via `withEventDetails`. There is no way to edit an event after upload.

## Requested Changes (Diff)

### Add
- `updateEvent` backend function: admin can update event title, date, location, price, and recipientUsername after upload
- Snapshot event details (title, date, location, price, recipientUsername) stored on each reservation at submission time so existing tickets are never affected by edits
- Edit button on each event in the admin panel (opens a pre-filled form modal)

### Modify
- `Reservation` type: add optional snapshot fields `snapshotTitle`, `snapshotDate`, `snapshotLocation`, `snapshotPrice`, `snapshotRecipient` (optional to preserve existing data)
- `submitReservation`: capture event snapshot at submission time
- `ReservationOutput` / ticket popup: prefer snapshot fields over live event fields when present
- `withEventDetails`: falls back to current event data if snapshot fields are null (backward compat)

### Remove
- Nothing removed

## Implementation Plan
1. Update `Reservation` stable type to include optional snapshot fields
2. Add `updateEvent(id, input)` shared function to backend
3. Update `submitReservation` to write snapshot fields from event at time of submission
4. Update `withEventDetails` to use snapshot when available, fall back to live event
5. Update `backend.d.ts` to expose `updateEvent`
6. Frontend: add Edit button per event in admin panel, opens edit modal pre-filled with current event data
7. Frontend: ticket popup reads snapshot fields from reservation (already returned in `eventDetails` via the fallback logic)
