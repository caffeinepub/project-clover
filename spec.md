# Project Clover

## Current State
Each event stores: id, title, date, location, price. There is a single global `recipientUsername` in the backend. The Upload Event form has a "Send Credits To" field that updates this global value. All events show the same recipient.

## Requested Changes (Diff)

### Add
- `recipientUsername` field to the `Event` and `EventInput` types in the backend
- Per-event recipient stored and returned with each event

### Modify
- `addEvent` to accept and store `recipientUsername` per event
- `getAllEvents` to return `recipientUsername` per event
- Upload Event form: "Send Credits To" field saves per-event (not global)
- Reservation modal: show the specific event's `recipientUsername` (not global)

### Remove
- Dependency on global `recipientUsername` for per-event payment instructions (keep global as fallback default in the form)

## Implementation Plan
1. Update `Event` and `EventInput` types in `main.mo` to include `recipientUsername: Text`
2. Update `addEvent` to store `recipientUsername` from input
3. Update `backend.d.ts` to reflect new Event/EventInput shapes
4. Update frontend Upload Event form to pass `recipientUsername` when creating an event
5. Update reservation modal to read `event.recipientUsername` instead of fetching global
