# Project Clover

## Current State
The IMVU credit recipient username is stored in localStorage only. Each device has its own copy, so changing it in admin only updates that browser.

## Requested Changes (Diff)

### Add
- Backend stable var `recipientUsername` defaulting to "Iluvlean"
- Backend `setRecipientUsername(username: Text) : async ()`
- Backend `getRecipientUsername() : async Text` query

### Modify
- Frontend: fetch recipient username from backend on load
- Frontend: save to backend on Done button click
- Remove localStorage reads/writes for recipient username

### Remove
- localStorage usage for imvuRecipient

## Implementation Plan
1. Add stable var and two functions to main.mo
2. Update backend.d.ts with new function signatures
3. Update App.tsx hooks and components to use backend
