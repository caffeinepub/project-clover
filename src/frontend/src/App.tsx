import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Event, ReservationOutput } from "./backend";
import { ReservationStatus } from "./backend";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAddEvent,
  useDeleteEvent,
  useGetAllEvents,
  useGetAllReservations,
  useIsCallerAdmin,
  useSubmitReservation,
  useUpdateReservation,
} from "./hooks/useQueries";

type View = "events" | "reserve" | "confirm" | "lookup" | "admin";

function formatDateTime(t: bigint): string {
  const ms = Number(t / 1_000_000n);
  return new Date(ms).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  if (status === ReservationStatus.approved) {
    return (
      <Badge className="bg-primary/20 text-primary border border-primary/50">
        Approved
      </Badge>
    );
  }
  if (status === ReservationStatus.rejected) {
    return (
      <Badge className="bg-destructive/20 text-destructive border border-destructive/50">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
      Pending
    </Badge>
  );
}

// ── Event Card ──────────────────────────────────────────────────────────
function EventCard({
  event,
  onReserve,
}: {
  event: Event;
  onReserve: (e: Event) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border border-border hover:shadow-glow transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              🎟 Ticket
            </span>
          </div>
          <CardTitle className="text-foreground text-xl font-bold">
            {event.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span>{formatDateTime(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{event.location}</span>
          </div>
          <p className="text-primary font-bold text-lg mt-2">{event.price}</p>
          <Button
            type="button"
            className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={() => onReserve(event)}
            data-ocid="events.reserve.button"
          >
            <Ticket className="w-4 h-4 mr-2" />
            Reserve Ticket
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Reservation Form ───────────────────────────────────────────────────
function ReservationForm({
  event,
  onSuccess,
  onBack,
}: {
  event: Event;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [imvuUsername, setImvuUsername] = useState("");
  const [transactionNote, setTransactionNote] = useState("");
  const { mutateAsync, isPending } = useSubmitReservation();

  const handleSubmit = async () => {
    if (!imvuUsername.trim() || !transactionNote.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await mutateAsync({
        eventId: event.id,
        imvuUsername: imvuUsername.trim(),
        transactionNote: transactionNote.trim(),
      });
      onSuccess();
    } catch {
      toast.error("Failed to submit reservation. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-md mx-auto"
    >
      <Button
        type="button"
        variant="ghost"
        className="mb-4 text-muted-foreground hover:text-foreground"
        onClick={onBack}
        data-ocid="reserve.back.button"
      >
        ← Back to Events
      </Button>

      <h2 className="text-2xl font-bold text-foreground mb-1">
        Reserve Ticket
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Complete your reservation below
      </p>

      <Card className="bg-card border border-border mb-6">
        <CardContent className="p-4 space-y-1">
          <p className="text-foreground font-semibold">{event.title}</p>
          <p className="text-muted-foreground text-sm">
            {formatDateTime(event.date)} · {event.location}
          </p>
          <p className="text-primary font-bold text-lg">{event.price}</p>
        </CardContent>
      </Card>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6 space-y-2">
        <p className="text-sm font-semibold text-primary">
          💳 Payment Instructions
        </p>
        <p className="text-sm text-foreground">
          Send credits via IMVU to:{" "}
          <span className="font-bold text-primary">Iluvlean</span>
        </p>
        <p className="text-sm text-foreground">
          Include note:{" "}
          <span className="font-bold text-primary">
            CLOVER{event.id.toString()}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="imvu-username"
            className="text-sm text-muted-foreground mb-1 block"
          >
            IMVU Username
          </label>
          <Input
            id="imvu-username"
            placeholder="Your IMVU username"
            value={imvuUsername}
            onChange={(e) => setImvuUsername(e.target.value)}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="reserve.username.input"
          />
        </div>
        <div>
          <label
            htmlFor="txn-note"
            className="text-sm text-muted-foreground mb-1 block"
          >
            Transaction Note / ID
          </label>
          <Input
            id="txn-note"
            placeholder="Transaction note or confirmation ID"
            value={transactionNote}
            onChange={(e) => setTransactionNote(e.target.value)}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="reserve.transaction.input"
          />
        </div>
        <Button
          type="button"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={handleSubmit}
          disabled={isPending}
          data-ocid="reserve.submit.button"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Ticket className="w-4 h-4 mr-2" />
          )}
          {isPending ? "Submitting..." : "Submit Reservation"}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Confirmation ───────────────────────────────────────────────────────────
function Confirmation({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md mx-auto py-12"
      data-ocid="reserve.success_state"
    >
      <div className="text-6xl mb-4">🍀</div>
      <h2 className="text-3xl font-bold text-primary mb-3">
        Request Submitted!
      </h2>
      <p className="text-muted-foreground mb-6">
        Your ticket is pending approval. Once verified, you will receive
        confirmation.
      </p>
      <Button
        type="button"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={onBack}
        data-ocid="confirm.back.button"
      >
        Back to Events
      </Button>
    </motion.div>
  );
}

// ── Lookup View ────────────────────────────────────────────────────────────
function LookupView() {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<ReservationOutput[] | null>(null);
  const [searching, setSearching] = useState(false);
  const { actor } = useActor();

  const handleSearch = async () => {
    if (!actor || !searchInput.trim()) return;
    setSearching(true);
    try {
      const res = await actor.getReservationsByUsername(searchInput.trim());
      setResults(res);
    } catch {
      toast.error("Failed to fetch reservations");
    } finally {
      setSearching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Check My Reservation
      </h2>

      <div className="flex gap-3 mb-8">
        <Input
          placeholder="Enter your IMVU username"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          data-ocid="lookup.search_input"
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchInput.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          data-ocid="lookup.search.button"
        >
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span className="ml-2">Search</span>
        </Button>
      </div>

      {results === null && (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="lookup.empty_state"
        >
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Enter your IMVU username to check your reservations</p>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="lookup.empty_state"
        >
          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reservations found for this username</p>
        </div>
      )}

      {results !== null && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <Card
              key={r.id.toString()}
              className="bg-card border border-border"
              data-ocid={`lookup.item.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-foreground">
                      {r.eventDetails.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDateTime(r.eventDetails.date)} ·{" "}
                      {r.eventDetails.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: {r.transactionNote}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Manage Events Tab ──────────────────────────────────────────────────────
function ManageEventsTab() {
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const { data: events, isLoading: eventsLoading } = useGetAllEvents();
  const { mutateAsync: addEvent, isPending: adding } = useAddEvent();
  const { mutateAsync: deleteEvent } = useDeleteEvent();
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const handleUpload = async () => {
    if (!title.trim() || !dateTime || !location.trim() || !price.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const dateNs = BigInt(new Date(dateTime).getTime()) * 1_000_000n;
      await addEvent({
        title: title.trim(),
        date: dateNs,
        location: location.trim(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        price: price.trim() as any,
      });
      toast.success("Event uploaded! It's now visible to everyone.");
      setTitle("");
      setDateTime("");
      setLocation("");
      setPrice("");
    } catch {
      toast.error("Failed to upload event. Please try again.");
    }
  };

  const handleDelete = async (id: bigint) => {
    setDeletingId(id);
    try {
      await deleteEvent(id);
      toast.success("Event deleted.");
    } catch {
      toast.error("Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Upload New Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="event-title"
                className="text-sm text-muted-foreground mb-1 block"
              >
                Event Title
              </label>
              <Input
                id="event-title"
                placeholder="e.g. Clover Party Night"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                data-ocid="admin.event_title.input"
              />
            </div>
            <div>
              <label
                htmlFor="event-date"
                className="text-sm text-muted-foreground mb-1 block"
              >
                Event Date & Time
              </label>
              <Input
                id="event-date"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="bg-input border-border text-foreground"
                style={{ colorScheme: "dark" }}
                data-ocid="admin.event_date.input"
              />
            </div>
            <div>
              <label
                htmlFor="event-location"
                className="text-sm text-muted-foreground mb-1 block"
              >
                Location
              </label>
              <Input
                id="event-location"
                placeholder="e.g. IMVU Rooftop Room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                data-ocid="admin.event_location.input"
              />
            </div>
            <div>
              <label
                htmlFor="event-price"
                className="text-sm text-muted-foreground mb-1 block"
              >
                Price
              </label>
              <Input
                id="event-price"
                placeholder="e.g. 500 credits"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                data-ocid="admin.event_price.input"
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={handleUpload}
            disabled={adding}
            data-ocid="admin.upload_event.button"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Ticket className="w-4 h-4 mr-2" />
            )}
            {adding ? "Uploading..." : "Upload Event"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing events list */}
      <div>
        <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Existing Events
        </h3>

        {eventsLoading && (
          <div className="space-y-2" data-ocid="admin.events.loading_state">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full bg-card" />
            ))}
          </div>
        )}

        {!eventsLoading && (!events || events.length === 0) && (
          <div
            className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-lg"
            data-ocid="admin.events.empty_state"
          >
            <Ticket className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No events uploaded yet</p>
          </div>
        )}

        {!eventsLoading && events && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event, i) => (
              <Card
                key={event.id.toString()}
                className="bg-card border border-border"
                data-ocid={`admin.events.item.${i + 1}`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        🎟 Ticket
                      </span>
                    </div>
                    <p className="text-foreground font-semibold truncate">
                      {event.title}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {formatDateTime(event.date)} · {event.location} ·{" "}
                      <span className="text-primary">{event.price}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="shrink-0 h-8 px-3 text-xs opacity-80 hover:opacity-100"
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingId === event.id}
                    data-ocid={`admin.events.delete_button.${i + 1}`}
                  >
                    {deletingId === event.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    <span className="ml-1">Delete</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────
function AdminPanel() {
  const { data: reservations, isLoading } = useGetAllReservations();
  const { mutateAsync: updateRes } = useUpdateReservation();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdate = async (id: bigint, status: ReservationStatus) => {
    const key = `${id}-${status}`;
    setUpdating(key);
    try {
      await updateRes({ id, status });
      toast.success(`Reservation ${status}`);
    } catch {
      toast.error("Failed to update reservation");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Admin Panel</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Admin access is restricted.
      </p>

      <Tabs defaultValue="manage-events" className="w-full">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger
            value="manage-events"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            data-ocid="admin.manage_events.tab"
          >
            Manage Events
          </TabsTrigger>
          <TabsTrigger
            value="reservations"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            data-ocid="admin.reservations.tab"
          >
            Reservations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage-events">
          <ManageEventsTab />
        </TabsContent>

        <TabsContent value="reservations">
          {isLoading && (
            <div className="space-y-2" data-ocid="admin.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-card" />
              ))}
            </div>
          )}

          {!isLoading && reservations && reservations.length === 0 && (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="admin.empty_state"
            >
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reservations yet</p>
            </div>
          )}

          {!isLoading && reservations && reservations.length > 0 && (
            <div className="overflow-x-auto" data-ocid="admin.table">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">
                      Event
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      IMVU User
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Txn Note
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r, i) => (
                    <TableRow
                      key={r.id.toString()}
                      className="border-border hover:bg-card/50"
                      data-ocid={`admin.row.${i + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        #{r.id.toString()}
                      </TableCell>
                      <TableCell className="text-foreground text-sm">
                        {r.eventDetails.title}
                      </TableCell>
                      <TableCell className="text-foreground text-sm">
                        {r.imvuUsername}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {r.transactionNote}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {r.status !== ReservationStatus.approved && (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 h-7 px-2 text-xs"
                              onClick={() =>
                                handleUpdate(r.id, ReservationStatus.approved)
                              }
                              disabled={
                                updating ===
                                `${r.id}-${ReservationStatus.approved}`
                              }
                              data-ocid={`admin.approve.button.${i + 1}`}
                            >
                              {updating ===
                              `${r.id}-${ReservationStatus.approved}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                          )}
                          {r.status !== ReservationStatus.rejected && (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs opacity-80 hover:opacity-100"
                              onClick={() =>
                                handleUpdate(r.id, ReservationStatus.rejected)
                              }
                              disabled={
                                updating ===
                                `${r.id}-${ReservationStatus.rejected}`
                              }
                              data-ocid={`admin.reject.button.${i + 1}`}
                            >
                              {updating ===
                              `${r.id}-${ReservationStatus.rejected}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Reject"
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>("events");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: events, isLoading: eventsLoading } = useGetAllEvents();
  const { data: isAdmin } = useIsCallerAdmin();

  const isLoggedIn = loginStatus === "success" && !!identity;

  const handleReserve = (event: Event) => {
    setSelectedEvent(event);
    setView("reserve");
  };

  const handleBack = () => {
    setSelectedEvent(null);
    setView("events");
  };

  const navItems: { id: View; label: string }[] = [
    { id: "events", label: "Events" },
    { id: "lookup", label: "My Reservation" },
    ...(isAdmin ? [{ id: "admin" as View, label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster theme="dark" />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/90">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center hover:opacity-80 transition-opacity"
            onClick={handleBack}
            data-ocid="nav.home.link"
          >
            <img
              src="/assets/uploads/img_4224-019d22df-d36a-701e-b72a-4a02f87dcacb-1.png"
              alt="Project Clover"
              className="h-14 w-auto object-contain"
            />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === item.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                data-ocid={`nav.${item.id}.tab`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {identity.getPrincipal().toString().slice(0, 10)}...
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="text-muted-foreground hover:text-foreground"
                  data-ocid="nav.logout.button"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={login}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loginStatus === "logging-in"}
                data-ocid="nav.login.button"
              >
                {loginStatus === "logging-in" ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : null}
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-border/30 flex">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                view === item.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
              data-ocid={`nav.mobile.${item.id}.tab`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          {view === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  🍀 Upcoming Events
                </h1>
                <p className="text-muted-foreground">
                  Reserve your spot at the hottest IMVU parties
                </p>
              </div>

              {eventsLoading && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  data-ocid="events.loading_state"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-52 w-full bg-card" />
                  ))}
                </div>
              )}

              {!eventsLoading && (!events || events.length === 0) && (
                <div
                  className="text-center py-20 text-muted-foreground"
                  data-ocid="events.empty_state"
                >
                  <Ticket className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No upcoming events at this time</p>
                  <p className="text-sm mt-1">
                    Check back soon for new events!
                  </p>
                </div>
              )}

              {!eventsLoading && events && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => (
                    <EventCard
                      key={event.id.toString()}
                      event={event}
                      onReserve={handleReserve}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "reserve" && selectedEvent && (
            <motion.div
              key="reserve"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ReservationForm
                event={selectedEvent}
                onSuccess={() => setView("confirm")}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {view === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Confirmation onBack={handleBack} />
            </motion.div>
          )}

          {view === "lookup" && (
            <motion.div
              key="lookup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LookupView />
            </motion.div>
          )}

          {view === "admin" && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 text-center">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
