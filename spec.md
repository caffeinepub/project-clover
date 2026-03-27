# Project Clover

## Current State
After a user submits a reservation, a `ConfirmationBanner` is shown in-page with a generic "You're In! 🎉" message and confetti. There is no visual representation of the actual ticket they received.

## Requested Changes (Diff)

### Add
- A `TicketPopup` modal/overlay that appears immediately after a successful reservation submission
- The popup displays a styled physical-ticket visual showing: event title, date & time, location, price, ticket number (event ID), IMVU username, transaction note, barcode decoration, "ADMIT ONE", clover branding, and a perforated stub — matching the existing ticket card aesthetic
- The popup includes an animated entrance (scale in from center)
- A close/dismiss button on the popup

### Modify
- `ReservationModal`: after `submitReservation` succeeds, instead of immediately calling `onSuccess()`, capture the reservation details and trigger the ticket popup to show. After the popup is closed, call `onSuccess()`.
- Keep the existing `ConfirmationBanner` as-is but it can be shown after the ticket popup is dismissed

### Remove
- Nothing

## Implementation Plan
1. Create a `TicketPopup` component that takes `event`, `imvuUsername`, `reservationId`/ticket number as props and renders a full-screen overlay with a physical-ticket styled card
2. In `ReservationModal`, after successful submission, store the submitted username and show the ticket popup instead of immediately calling `onSuccess()`
3. When ticket popup is closed, call `onSuccess()` to proceed to the confirmation banner
