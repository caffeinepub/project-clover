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
export interface EventWithRecipient {
    id: bigint;
    title: string;
    date: bigint;
    price: bigint;
    recipientUsername: string;
    location: string;
}
export interface EventInput {
    title: string;
    date: bigint;
    price: bigint;
    recipientUsername: string;
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
    eventDetails: EventWithRecipient;
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
    addEvent(input: EventInput): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteEvent(id: bigint): Promise<void>;
    getAllEvents(): Promise<Array<EventWithRecipient>>;
    getAllReservations(): Promise<Array<ReservationOutput>>;
    getAllReservationsForEvent(eventId: bigint): Promise<Array<ReservationOutput>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getRecipientUsername(): Promise<string>;
    getReservationsByUsername(imvuUsername: string): Promise<Array<ReservationOutput>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRecipientUsername(username: string): Promise<void>;
    submitReservation(eventId: bigint, imvuUsername: string, transactionNote: string): Promise<bigint>;
    updateReservation(request: ReservationUpdate): Promise<void>;
}
