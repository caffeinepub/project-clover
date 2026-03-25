# Project Clover

## Current State
React + Motoko ticket reservation app. Header uses old logo path. Admin panel restricted by backend role system. Event upload datetime-local input invisible in dark mode.

## Requested Changes (Diff)

### Add
- Nothing

### Modify
- Header logo: swap img src to new uploaded path
- Event upload: fix datetime-local dark mode visibility

### Remove
- Old logo path

## Implementation Plan
1. Update header img src to /assets/uploads/img_4224-019d22df-d36a-701e-b72a-4a02f87dcacb-1.png
2. Add style={{ colorScheme: 'dark' }} to datetime-local input in ManageEventsTab
