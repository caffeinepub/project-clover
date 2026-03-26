/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface Event {
  'id' : bigint,
  'title' : string,
  'date' : bigint,
  'price' : bigint,
  'location' : string,
}
export interface EventInput {
  'title' : string,
  'date' : bigint,
  'price' : bigint,
  'location' : string,
}
export interface ReservationOutput {
  'id' : bigint,
  'status' : ReservationStatus,
  'eventId' : bigint,
  'transactionNote' : string,
  'eventDetails' : Event,
  'submittedAt' : Time,
  'imvuUsername' : string,
}
export type ReservationStatus = { 'pending' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface ReservationUpdate {
  'id' : bigint,
  'status' : ReservationStatus,
}
export type Time = bigint;
export interface UserProfile { 'name' : string, 'imvuUsername' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'addEvent' : ActorMethod<[EventInput], bigint>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'deleteEvent' : ActorMethod<[bigint], undefined>,
  'getAllEvents' : ActorMethod<[], Array<Event>>,
  'getAllReservations' : ActorMethod<[], Array<ReservationOutput>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getReservation' : ActorMethod<[bigint], ReservationOutput>,
  'getReservationsByUsername' : ActorMethod<[string], Array<ReservationOutput>>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'submitReservation' : ActorMethod<[bigint, string, string], bigint>,
  'updateReservation' : ActorMethod<[ReservationUpdate], undefined>,
  'setRecipientUsername' : ActorMethod<[string], undefined>,
  'getRecipientUsername' : ActorMethod<[], string>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
