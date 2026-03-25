# Project Clover

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Event listing page with 2 events (Clover Party Night and VIP Clover Lounge)
- Ticket reservation flow: select event → payment instructions → submit form
- Backend to store reservation submissions (IMVU username, transaction note, event)
- Admin view to see pending/approved reservations

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store reservations with fields (eventId, imvuUsername, transactionNote, status: pending/approved/rejected)
2. Backend: query all reservations (admin), submit reservation (public)
3. Frontend: event cards grid → reservation form flow → confirmation screen
4. Use authorization for admin access to view reservations
