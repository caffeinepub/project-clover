import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  type ReservationId = Nat;

  public type Event = {
    id : Nat;
    title : Text;
    date : Int;
    location : Text;
    price : Nat;
  };

  public type EventInput = {
    title : Text;
    date : Int;
    location : Text;
    price : Nat;
    recipientUsername : Text;
  };

  public type EventWithRecipient = {
    id : Nat;
    title : Text;
    date : Int;
    location : Text;
    price : Nat;
    recipientUsername : Text;
  };

  public type ReservationStatus = {
    #pending;
    #approved;
    #rejected;
  };

  // Unchanged — preserves stable variable compatibility
  public type Reservation = {
    id : ReservationId;
    eventId : Nat;
    imvuUsername : Text;
    transactionNote : Text;
    status : ReservationStatus;
    submittedAt : Time.Time;
  };

  // Snapshot stored separately so existing stable var is untouched
  public type EventSnapshot = {
    title : Text;
    date : Int;
    location : Text;
    price : Nat;
    recipientUsername : Text;
  };

  public type ReservationUpdate = {
    id : Nat;
    status : ReservationStatus;
  };

  public type ReservationOutput = {
    id : Nat;
    eventId : Nat;
    imvuUsername : Text;
    transactionNote : Text;
    status : ReservationStatus;
    submittedAt : Time.Time;
    eventDetails : EventWithRecipient;
  };

  public type UserProfile = {
    name : Text;
    imvuUsername : Text;
  };

  module Reservation {
    public func compare(reservation1 : Reservation, reservation2 : Reservation) : { #less; #equal; #greater } {
      Nat.compare(reservation1.id, reservation2.id);
    };
  };
  module ReservationOutput {
    public func compare(res1 : ReservationOutput, res2 : ReservationOutput) : { #less; #equal; #greater } {
      Nat.compare(res1.id, res2.id);
    };
  };

  module Event {
    public func compare(event1 : Event, event2 : Event) : { #less; #equal; #greater } {
      Nat.compare(event1.id, event2.id);
    };
  };

  // STABLE variables
  stable var events = Map.empty<Nat, Event>();
  stable var nextEventId = 0;
  stable var eventRecipients = Map.empty<Nat, Text>();
  stable var reservations = Map.empty<Nat, Reservation>();
  stable var nextReservationId = 0;
  stable var recipientUsername = "Iluvlean";
  stable var userProfiles = Map.empty<Principal, UserProfile>();
  // New stable map for reservation snapshots — starts empty, populated for new reservations
  stable var reservationSnapshots = Map.empty<Nat, EventSnapshot>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  private func withRecipient(event : Event) : EventWithRecipient {
    let recipient = switch (eventRecipients.get(event.id)) {
      case (?r) { r };
      case (null) { recipientUsername };
    };
    {
      id = event.id;
      title = event.title;
      date = event.date;
      location = event.location;
      price = event.price;
      recipientUsername = recipient;
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  public shared func addEvent(input : EventInput) : async Nat {
    let eventId = nextEventId;
    nextEventId += 1;
    let event : Event = {
      id = eventId;
      title = input.title;
      date = input.date;
      location = input.location;
      price = input.price;
    };
    events.add(eventId, event);
    let recipient = if (input.recipientUsername == "") { recipientUsername } else { input.recipientUsername };
    eventRecipients.add(eventId, recipient);
    eventId;
  };

  public shared func updateEvent(id : Nat, input : EventInput) : async () {
    switch (events.get(id)) {
      case (null) { Runtime.trap("Event not found.") };
      case (?existing) {
        let updated : Event = {
          id = existing.id;
          title = input.title;
          date = input.date;
          location = input.location;
          price = input.price;
        };
        events.add(id, updated);
        let recipient = if (input.recipientUsername == "") { recipientUsername } else { input.recipientUsername };
        eventRecipients.add(id, recipient);
      };
    };
  };

  public shared func deleteEvent(id : Nat) : async () {
    events.remove(id);
    eventRecipients.remove(id);
  };

  public func submitReservation(eventId : Nat, imvuUsername : Text, transactionNote : Text) : async Nat {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Could not find event. ") };
      case (?event) {
        let reservationId = nextReservationId;
        nextReservationId += 1;
        let reservation : Reservation = {
          id = reservationId;
          eventId;
          imvuUsername;
          transactionNote;
          status = #pending;
          submittedAt = Time.now();
        };
        reservations.add(reservationId, reservation);
        // Snapshot the event details at submission time
        let recipient = switch (eventRecipients.get(eventId)) {
          case (?r) { r };
          case (null) { recipientUsername };
        };
        let snapshot : EventSnapshot = {
          title = event.title;
          date = event.date;
          location = event.location;
          price = event.price;
          recipientUsername = recipient;
        };
        reservationSnapshots.add(reservationId, snapshot);
        reservationId;
      };
    };
  };

  // Build ReservationOutput: use snapshot when available, fall back to current event
  private func withEventDetails(reservation : Reservation) : ?ReservationOutput {
    let snapOpt = reservationSnapshots.get(reservation.id);
    switch (events.get(reservation.eventId)) {
      case (null) {
        // Event deleted — use snapshot if we have one
        switch (snapOpt) {
          case (null) { null };
          case (?snap) {
            ?{
              id = reservation.id;
              eventId = reservation.eventId;
              imvuUsername = reservation.imvuUsername;
              transactionNote = reservation.transactionNote;
              status = reservation.status;
              submittedAt = reservation.submittedAt;
              eventDetails = {
                id = reservation.eventId;
                title = snap.title;
                date = snap.date;
                location = snap.location;
                price = snap.price;
                recipientUsername = snap.recipientUsername;
              };
            };
          };
        };
      };
      case (?event) {
        // Prefer snapshot fields so existing tickets are unaffected by edits
        let details = switch (snapOpt) {
          case (?snap) {
            {
              id = event.id;
              title = snap.title;
              date = snap.date;
              location = snap.location;
              price = snap.price;
              recipientUsername = snap.recipientUsername;
            };
          };
          case (null) {
            // Old reservation with no snapshot — use live event data
            withRecipient(event);
          };
        };
        ?{
          id = reservation.id;
          eventId = reservation.eventId;
          imvuUsername = reservation.imvuUsername;
          transactionNote = reservation.transactionNote;
          status = reservation.status;
          submittedAt = reservation.submittedAt;
          eventDetails = details;
        };
      };
    };
  };

  public query func getAllReservations() : async [ReservationOutput] {
    let all = reservations.values().toArray();
    let mapped = all.filterMap(func(r : Reservation) : ?ReservationOutput { withEventDetails(r) });
    mapped.sort();
  };

  public query func getAllReservationsForEvent(eventId : Nat) : async [ReservationOutput] {
    let filtered = reservations.values().toArray().filter(
      func(r : Reservation) : Bool { r.eventId == eventId }
    );
    filtered.filterMap(func(r : Reservation) : ?ReservationOutput { withEventDetails(r) });
  };

  public query func getReservationsByUsername(imvuUsername : Text) : async [ReservationOutput] {
    let filtered = reservations.values().toArray().filter(
      func(reservation) { Text.equal(reservation.imvuUsername, imvuUsername) }
    );
    filtered.filterMap(func(r : Reservation) : ?ReservationOutput { withEventDetails(r) });
  };

  public query func getAllEvents() : async [EventWithRecipient] {
    events.values().toArray().sort().map(func(e) { withRecipient(e) });
  };

  public shared func updateReservation(request : ReservationUpdate) : async () {
    switch (reservations.get(request.id)) {
      case (null) { Runtime.trap("Reservation not found.") };
      case (?existing) {
        let updated : Reservation = {
          id = existing.id;
          eventId = existing.eventId;
          imvuUsername = existing.imvuUsername;
          transactionNote = existing.transactionNote;
          status = request.status;
          submittedAt = existing.submittedAt;
        };
        reservations.add(request.id, updated);
      };
    };
  };

  public shared func setRecipientUsername(username : Text) : async () {
    recipientUsername := username;
  };

  public query func getRecipientUsername() : async Text {
    recipientUsername
  };
};
