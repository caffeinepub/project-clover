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
import Migration "migration";

(with migration = Migration.run)
actor {
  type ReservationId = Nat;

  // Stable Event type (original, no recipientUsername)
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

  // Event with recipient for frontend responses
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

  public type Reservation = {
    id : ReservationId;
    eventId : Nat;
    imvuUsername : Text;
    transactionNote : Text;
    status : ReservationStatus;
    submittedAt : Time.Time;
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

  var events = Map.empty<Nat, Event>();
  var nextEventId = 0;

  // Separate stable map for per-event recipient usernames (avoids schema migration)
  var eventRecipients = Map.empty<Nat, Text>();

  var reservations = Map.empty<Nat, Reservation>();
  var nextReservationId = 0;
  var recipientUsername = "Iluvlean";

  var userProfiles = Map.empty<Principal, UserProfile>();

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

  public shared func deleteEvent(id : Nat) : async () {
    events.remove(id);
    eventRecipients.remove(id);
  };

  public func submitReservation(eventId : Nat, imvuUsername : Text, transactionNote : Text) : async Nat {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Could not find event. ") };
      case (_) {
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
        reservationId;
      };
    };
  };

  private func withEventDetails(reservation : Reservation) : ?ReservationOutput {
    switch (events.get(reservation.eventId)) {
      case (null) { null };
      case (?event) {
        ?{
          id = reservation.id;
          eventId = reservation.eventId;
          imvuUsername = reservation.imvuUsername;
          transactionNote = reservation.transactionNote;
          status = reservation.status;
          submittedAt = reservation.submittedAt;
          eventDetails = withRecipient(event);
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
