import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldEvent = {
    id : Nat;
    title : Text;
    date : Int;
    location : Text;
    price : Nat;
  };

  type OldReservationStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type OldReservation = {
    id : Nat;
    eventId : Nat;
    imvuUsername : Text;
    transactionNote : Text;
    status : OldReservationStatus;
    submittedAt : Int;
  };

  type OldUserProfile = {
    name : Text;
    imvuUsername : Text;
  };

  type OldActor = {
    events : Map.Map<Nat, OldEvent>;
    nextEventId : Nat;
    eventRecipients : Map.Map<Nat, Text>;
    reservations : Map.Map<Nat, OldReservation>;
    nextReservationId : Nat;
    recipientUsername : Text;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewActor = {
    events : Map.Map<Nat, OldEvent>;
    nextEventId : Nat;
    eventRecipients : Map.Map<Nat, Text>;
    reservations : Map.Map<Nat, OldReservation>;
    nextReservationId : Nat;
    recipientUsername : Text;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
