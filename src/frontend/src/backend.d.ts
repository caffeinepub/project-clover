import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface ReservationUpdate {
    id: bigint;
    status: ReservationStatus;
}
export interface Event {
    id: bigint;
    title: string;
    date: Time;
    price: string;
    location: string;
}
export interface UserProfile {
    name: string;
    imvuUsername: string;
}
export interface ReservationOutput {
    id: bigint;
    status: ReservationStatus;
    eventId: bigint;
    transactionNote: string;
    eventDetails: Event;
    submittedAt: Time;
    imvuUsername: string;
}
export enum ReservationStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllEventReservations(eventId: bigint): Promise<Array<ReservationOutput>>;
    getAllEvents(): Promise<Array<Event>>;
    getAllReservations(): Promise<Array<ReservationOutput>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getReservation(id: bigint): Promise<ReservationOutput>;
    getReservationsByUsername(imvuUsername: string): Promise<Array<ReservationOutput>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitReservation(eventId: bigint, imvuUsername: string, transactionNote: string): Promise<bigint>;
    updateReservation(request: ReservationUpdate): Promise<void>;
}
