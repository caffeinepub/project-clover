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
    refetchInterval: 30000,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      onRetry,
    }: {
      input: EventInput;
      onRetry?: (attempt: number, total: number) => void;
    }) => {
      const maxRetries = 10;
      // Increasing delays: give canister plenty of time to restart between attempts
      const delays = [
        2000, 4000, 8000, 12000, 18000, 25000, 35000, 45000, 60000, 60000,
      ];
      let lastError: unknown;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const resolvedActor = await createActorWithConfig();
          return await resolvedActor.addEvent(input);
        } catch (err) {
          lastError = err;
          if (attempt < maxRetries - 1) {
            onRetry?.(attempt + 1, maxRetries);
            await new Promise((resolve) =>
              setTimeout(resolve, delays[attempt]),
            );
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

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: EventInput }) => {
      const resolvedActor = await createActorWithConfig();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (resolvedActor as any).updateEvent(id, input);
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

export function useGetReservationsForEvent(eventId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["reservationsForEvent", eventId?.toString()],
    queryFn: async () => {
      if (!eventId) return [];
      const resolvedActor = actor ?? (await createActorWithConfig());
      return resolvedActor.getAllReservationsForEvent(eventId);
    },
    enabled: !isFetching && eventId !== null,
    refetchInterval: 5000,
  });
}
