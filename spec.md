# Project Clover

## Current State
- EventCard component renders event info in a glassmorphism card with a green color band, hex-grid texture banner, and info area
- ManageEventsTab upload form has: Event Title, Date & Time, Location, Price fields
- Logo is currently `/assets/uploads/55f4ba40-2e9e-485c-bea8-fba6aaa00668-019d284b-505a-74a9-85bd-52d46ddac793-1.png`
- Recipient username is managed separately in the Settings tab

## Requested Changes (Diff)

### Add
- EventCard redesigned to look like a physical concert/event ticket: horizontal layout, left main section with event details, right stub section separated by a perforated/dashed vertical divider with notched semi-circles, stub shows ticket number and barcode-like lines, clover watermark
- "Who to send credits to" field in the Upload Event form (alongside the other fields) so admin can set the recipient username directly when uploading an event — this is a display-only field on the upload form that pre-fills from the global recipient username and updates it when changed
- Logo updated to new image: `/assets/uploads/3daae5d6-06e7-40e5-afb4-391ab2b451ba-019d2b5c-92d0-72d0-8600-5d53241f36fa-1.png`

### Modify
- EventCard: transform from vertical card to horizontal ticket shape. Main body (left ~70%): green gradient header strip, event title, date/time, location, price, Reserve button. Stub (right ~30%): perforated border, ticket #, event name rotated or stacked, barcode lines, clover icon
- ManageEventsTab: add a 5th field "Send Credits To" (pre-filled with current recipientUsername from backend) that calls setRecipientUsername when the upload button is pressed

### Remove
- Nothing removed

## Implementation Plan
1. Update logo src in the header/nav to the new uploaded file path
2. Redesign EventCard JSX to physical ticket layout:
   - Outer wrapper: horizontal flex, rounded-xl, overflow-hidden, dark bg, green border glow
   - Left section (flex-1): top color bar, clover icon, event title, date/time/location chips, price + Reserve button
   - Perforated divider: vertical dashed border with two notched semicircles cut from top and bottom edges using pseudo or absolute positioned circles
   - Right stub (w-24 or w-28): rotated ticket number, barcode-style lines, clover emoji
3. In ManageEventsTab: accept recipientUsername prop or fetch it; add "Send Credits To" input field; on successful upload also call setRecipientUsername if that value changed
