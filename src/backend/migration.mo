import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type OldActor = {
    events : Map.Map<Nat, OldEvent>;
    reservations : Map.Map<Nat, Reservation>;
    nextEventId : Nat;
    nextReservationId : Nat;
    recipientUsername : Text;
  };

  type OldEvent = {
    id : Nat;
    title : Text;
    date : Int;
    location : Text;
    price : Nat;
  };

  public type Event = {
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
    id : Nat;
    eventId : Nat;
    imvuUsername : Text;
    transactionNote : Text;
    status : ReservationStatus;
    submittedAt : Time.Time;
  };

  type NewActor = {
    events : Map.Map<Nat, Event>;
    reservations : Map.Map<Nat, Reservation>;
    nextEventId : Nat;
    nextReservationId : Nat;
    recipientUsername : Text;
  };

  public func run(old : OldActor) : NewActor {
    let newEvents = old.events.map<Nat, OldEvent, Event>(
      func(_id, oldEvent) {
        {
          oldEvent with
          recipientUsername = old.recipientUsername;
        };
      }
    );
    {
      old with
      events = newEvents;
    };
  };
};
