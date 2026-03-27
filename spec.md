# Project Clover

## Current State
React ticket reservation platform for IMVU events. Backend uses `mo:core/Map` for stable storage of events, reservations, and recipient usernames. Frontend has retry logic for event upload (10 attempts). Event cards are styled as physical tickets. Admin panel has Ticket Holders tab with 5-second polling. `getAllReservationsForEvent` exists in `backend.ts` but is NOT implemented in `main.mo` — this causes a Candid mismatch. Event cards don't show per-event reservation counts.

## Requested Changes (Diff)

### Add
- `getAllReservationsForEvent(eventId: Nat)` properly implemented in backend Motoko
- Per-event reservation count shown live on event ticket cards (e.g. "3 reserved")
- `useGetReservationsForEvent(eventId)` hook with 5-second polling

### Modify
- Backend regenerated cleanly to fix any Map API issues causing upload failures
- Event cards show a live ticket count badge/indicator

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate backend Motoko with all existing functions + `getAllReservationsForEvent`
2. Update `useQueries.ts` to add `useGetReservationsForEvent` hook with 5-second refetch
3. Update event ticket cards in `App.tsx` to show live reservation count per event
