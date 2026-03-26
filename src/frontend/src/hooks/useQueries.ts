import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventInput, ReservationUpdate } from "../backend";
import { createActorWithConfig } from "../config";
import { useActor } from "./useActor";

export function useGetAllEvents() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["getAllEvents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEvents();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // auto-refresh every 30s so new events appear
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
    refetchInterval: 5000,
  });
}

export function useGetReservationsByUsername(username: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["reservationsByUsername", username],
    queryFn: async () => {
      if (!actor || !username) return [];
      return actor.getReservationsByUsername(username.trim().toLowerCase());
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
      const resolvedActor = actor ?? (await createActorWithConfig());
      // Normalize username: trim whitespace and lowercase for consistent lookup
      return resolvedActor.submitReservation(
        eventId,
        imvuUsername.trim().toLowerCase(),
        transactionNote.trim(),
      );
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
      const resolvedActor = actor ?? (await createActorWithConfig());
      return resolvedActor.updateReservation(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allReservations"] });
    },
  });
}

export function useAddEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const maxRetries = 3;
      let lastError: unknown;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const resolvedActor = actor ?? (await createActorWithConfig());
          return await resolvedActor.addEvent(input);
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (
            (msg.includes("stopped") || msg.includes("IC0508")) &&
            attempt < maxRetries - 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            throw err;
          }
        }
      }
      throw lastError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllEvents"] });
    },
  });
}

export function useDeleteEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const resolvedActor = actor ?? (await createActorWithConfig());
      return resolvedActor.deleteEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllEvents"] });
    },
  });
}

export function useGetRecipientUsername() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["recipientUsername"],
    queryFn: async () => {
      if (!actor) return "Iluvlean";
      return actor.getRecipientUsername();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetRecipientUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const resolvedActor = actor ?? (await createActorWithConfig());
      return resolvedActor.setRecipientUsername(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipientUsername"] });
    },
  });
}
