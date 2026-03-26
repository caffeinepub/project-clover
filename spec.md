# Project Clover

## Current State
Each event shares a single global `recipientUsername` stored in the backend. The upload form has a "Send Credits To" field that updates this global value. The reservation modal reads the global recipient and displays it in payment instructions.

## Requested Changes (Diff)

### Add
- `recipientUsername: Text` field to `Event` and `EventInput` types in the backend
- Backend `addEvent` stores the per-event recipient in the event record

### Modify
- Upload form: "Send Credits To" now saves to the event record instead of the global setting
- `ReservationModal`: reads `event.recipientUsername` instead of the global `recipientUsername` prop
- `EventCard` and ticket display: show the per-event recipient where relevant
- Remove `setRecipientUsername` call from the upload handler (or keep global as fallback)

### Remove
- Passing global `recipientUsername` prop into `ReservationModal` (replaced by per-event value)

## Implementation Plan
1. Update `main.mo`: add `recipientUsername` to `Event` and `EventInput`, store it in `addEvent`
2. Regenerate backend bindings
3. Update frontend upload form to pass `recipientUsername` in `EventInput`
4. Update `ReservationModal` to use `event.recipientUsername` directly
5. Keep global recipient for backwards compatibility (existing events without the field fall back to global)
