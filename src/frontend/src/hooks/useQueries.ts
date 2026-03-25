import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReservationUpdate } from "../backend";
import { useActor } from "./useActor";

export function useGetAllEvents() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllReservations() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allReservations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReservations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetReservationsByUsername(username: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["reservationsByUsername", username],
    queryFn: async () => {
      if (!actor || !username) return [];
      return actor.getReservationsByUsername(username);
    },
    enabled: !!actor && !isFetching && username.length > 0,
  });
}

export function useSubmitReservation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      imvuUsername,
      transactionNote,
    }: {
      eventId: bigint;
      imvuUsername: string;
      transactionNote: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitReservation(eventId, imvuUsername, transactionNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    },
  });
}

export function useUpdateReservation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: ReservationUpdate) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateReservation(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    },
  });
}
