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

  public type Event = {
    id : Nat;
    title : Text;
    date : Int;
    location : Text;
    price : Nat;
    recipientUsername : Text;
  };

  public type EventInput = {
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
    eventDetails : Event;
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

  let events = Map.empty<Nat, Event>();
  var nextEventId = 0;

  let reservations = Map.empty<Nat, Reservation>();
  var nextReservationId = 0;
  var recipientUsername = "Iluvlean";
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addEvent(input : EventInput) : async Nat {
    if ((not (AccessControl.isAdmin(accessControlState, caller)))) {
      Runtime.trap("Unauthorized: Only admins can add events");
    };
    let eventId = nextEventId;
    nextEventId += 1;
    let event : Event = {
      id = eventId;
      title = input.title;
      date = input.date;
      location = input.location;
      price = input.price;
      recipientUsername = if (input.recipientUsername == "") { recipientUsername } else { input.recipientUsername };
    };
    events.add(eventId, event);
    eventId;
  };

  public shared ({ caller }) func deleteEvent(id : Nat) : async () {
    if ((not (AccessControl.isAdmin(accessControlState, caller)))) {
      Runtime.trap("Unauthorized: Only admins can delete events");
    };
    events.remove(id);
  };

  public shared ({ caller }) func submitReservation(eventId : Nat, imvuUsername : Text, transactionNote : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reservations");
    };
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

  private func withEventDetails(reservation : Reservation) : ReservationOutput {
    let eventDetails = switch (events.get(reservation.eventId)) {
      case (?details) { details };
      case (null) { Runtime.trap("Event not found for this reservation. ") };
    };
    {
      id = reservation.id;
      eventId = reservation.eventId;
      imvuUsername = reservation.imvuUsername;
      transactionNote = reservation.transactionNote;
      status = reservation.status;
      submittedAt = reservation.submittedAt;
      eventDetails;
    };
  };

  public query ({ caller }) func getAllReservations() : async [ReservationOutput] {
    if ((not (AccessControl.isAdmin(accessControlState, caller)))) {
      Runtime.trap("Unauthorized: Only admins can see all reservations");
    };
    reservations.values().toArray().map(func(reservation) { withEventDetails(reservation) }).sort();
  };

  public query ({ caller }) func getCallerReservations() : async [ReservationOutput] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access own reservations");
    };
    let userProfile = switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("Could not find user profile") };
    };
    reservations.values().toArray().filter(
      func(reservation) { Text.equal(reservation.imvuUsername, userProfile.imvuUsername) }
    ).map(func(reservation) { withEventDetails(reservation) });
  };

  public query ({ caller }) func getReservationsByUsername(imvuUsername : Text) : async [ReservationOutput] {
    if ((not (AccessControl.isAdmin(accessControlState, caller)))) {
      Runtime.trap("Unauthorized: Only admins can see reservations for a user");
    };
    reservations.values().toArray().filter(
      func(reservation) { Text.equal(reservation.imvuUsername, imvuUsername) }
    ).map(func(reservation) { withEventDetails(reservation) });
  };

  public query ({ caller }) func getAllEvents() : async [Event] {
    events.values().toArray().sort();
  };

  public shared ({ caller }) func updateReservation(request : ReservationUpdate) : async () {
    if ((not (AccessControl.isAdmin(accessControlState, caller)))) {
      Runtime.trap("Unauthorized: Only admins can update reservations");
    };
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

  public shared ({ caller }) func setRecipientUsername(username : Text) : async () {
    if ((not (AccessControl.isAdmin(accessControlState, caller)))) {
      Runtime.trap("Unauthorized: Only admins can change the recipient username ");
    };
    recipientUsername := username;
  };

  public query func getRecipientUsername() : async Text {
    recipientUsername;
  };
};
