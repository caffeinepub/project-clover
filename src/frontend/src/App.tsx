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
  MapPin,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Event, ReservationOutput } from "./backend";
import { ReservationStatus } from "./backend";
import { SplashScreen } from "./components/SplashScreen";
import { useActor } from "./hooks/useActor";
import {
  useAddEvent,
  useDeleteEvent,
  useGetAllEvents,
  useGetAllReservations,
  useGetRecipientUsername,
  useSetRecipientUsername,
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

function formatDateShort(t: bigint): { date: string; time: string } {
  const ms = Number(t / 1_000_000n);
  const d = new Date(ms);
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
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

// ── Event Card (Ticket Design) ──────────────────────────────────────────
function EventCard({
  event,
  onReserve,
}: {
  event: Event;
  onReserve: (e: Event) => void;
}) {
  const { date, time } = formatDateShort(event.date);
  const ticketNum = `#${String(Number(event.id)).padStart(4, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
    >
      {/* Outer wrapper applies the notch cutouts */}
      <div
        className="relative flex rounded-xl overflow-visible"
        style={{
          filter: "drop-shadow(0 4px 24px oklch(0.79 0.21 142 / 0.18))",
        }}
      >
        {/* Main ticket body */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            background: "oklch(0.13 0.015 142)",
            borderRadius: "12px 0 0 12px",
            border: "1px solid oklch(0.79 0.21 142 / 0.35)",
            borderRight: "none",
          }}
        >
          {/* Ticket paper texture pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, oklch(0.79 0.21 142) 0px, oklch(0.79 0.21 142) 1px, transparent 1px, transparent 8px)," +
                "repeating-linear-gradient(-45deg, oklch(0.79 0.21 142) 0px, oklch(0.79 0.21 142) 1px, transparent 1px, transparent 8px)",
            }}
          />

          {/* Green glow top-left accent */}
          <div
            className="absolute -top-6 -left-6 w-24 h-24 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.79 0.21 142 / 0.12) 0%, transparent 70%)",
            }}
          />

          <div className="p-5 pr-6">
            {/* Top row: badge + ticket number */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.79 0.21 142 / 0.15)",
                  color: "oklch(0.79 0.21 142)",
                  border: "1px solid oklch(0.79 0.21 142 / 0.3)",
                }}
              >
                🍀 IMVU Event
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: "oklch(0.55 0 0)" }}
              >
                {ticketNum}
              </span>
            </div>

            {/* Event title */}
            <h3
              className="text-xl font-bold leading-tight mb-4"
              style={{ color: "oklch(0.96 0 0)" }}
            >
              {event.title}
            </h3>

            {/* Date + Location row */}
            <div className="flex flex-col gap-1.5 mb-5">
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: "oklch(0.79 0.21 142)" }}
                />
                <span className="text-xs" style={{ color: "oklch(0.65 0 0)" }}>
                  {date}{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "oklch(0.82 0.1 142)" }}
                  >
                    @ {time}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: "oklch(0.79 0.21 142)" }}
                />
                <span className="text-xs" style={{ color: "oklch(0.65 0 0)" }}>
                  {event.location}
                </span>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-0.5"
                  style={{ color: "oklch(0.5 0 0)" }}
                >
                  Price
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: "oklch(0.79 0.21 142)" }}
                >
                  {event.price === 0n
                    ? "Free"
                    : `${event.price.toString()} credits`}
                </p>
              </div>
              <Button
                type="button"
                className="font-semibold text-sm px-5 py-2 rounded-lg"
                style={{
                  background: "oklch(0.79 0.21 142)",
                  color: "oklch(0.06 0 0)",
                }}
                onClick={() => onReserve(event)}
                data-ocid="events.reserve.button"
              >
                <Ticket className="w-4 h-4 mr-1.5" />
                Reserve
              </Button>
            </div>
          </div>
        </div>

        {/* Perforation notch top */}
        <div
          className="absolute z-10"
          style={{
            left: "calc(100% - 72px - 6px)",
            top: "-8px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "oklch(0.06 0 0)",
            border: "1px solid oklch(0.12 0 0)",
          }}
        />
        {/* Perforation notch bottom */}
        <div
          className="absolute z-10"
          style={{
            left: "calc(100% - 72px - 6px)",
            bottom: "-8px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "oklch(0.06 0 0)",
            border: "1px solid oklch(0.12 0 0)",
          }}
        />

        {/* Stub section */}
        <div
          className="w-[72px] shrink-0 flex flex-col items-center justify-between relative overflow-hidden"
          style={{
            background: "oklch(0.11 0.018 142)",
            borderRadius: "0 12px 12px 0",
            border: "1px solid oklch(0.79 0.21 142 / 0.35)",
            borderLeft: "none",
          }}
        >
          {/* Dashed divider */}
          <div
            className="absolute left-0 top-4 bottom-4"
            style={{
              borderLeft: "2px dashed oklch(0.79 0.21 142 / 0.3)",
            }}
          />

          {/* Stub glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.79 0.21 142 / 0.07) 0%, transparent 70%)",
            }}
          />

          {/* Rotated ADMIT ONE text */}
          <div
            className="flex-1 flex items-center justify-center"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{ color: "oklch(0.79 0.21 142 / 0.7)" }}
            >
              ADMIT ONE
            </span>
          </div>

          {/* Clover icon */}
          <div className="pb-4 text-xl">🍀</div>

          {/* Ticket ID at bottom */}
          <div className="pb-3">
            <span
              className="text-[8px] font-mono block text-center"
              style={{ color: "oklch(0.45 0 0)", letterSpacing: "0.05em" }}
            >
              {ticketNum}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Reservation Form ───────────────────────────────────────────────────
function ReservationForm({
  event,
  onSuccess,
  onBack,
  recipientUsername,
}: {
  event: Event;
  onSuccess: () => void;
  onBack: () => void;
  recipientUsername: string;
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
          <p className="text-primary font-bold text-lg">
            {event.price === 0n ? "Free" : `${event.price.toString()} credits`}
          </p>
        </CardContent>
      </Card>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6 space-y-2">
        <p className="text-sm font-semibold text-primary">
          💳 Payment Instructions
        </p>
        <p className="text-sm text-foreground">
          Send credits via IMVU to:{" "}
          <span className="font-bold text-primary">{recipientUsername}</span>
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
      const res = await actor.getReservationsByUsername(
        searchInput.trim().toLowerCase(),
      );
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
    const priceTrimmed = price.trim();
    let priceBigInt: bigint;
    if (priceTrimmed.toLowerCase() === "free") {
      priceBigInt = 0n;
    } else {
      const parsed = Number.parseInt(priceTrimmed, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        toast.error("Price must be a number (e.g. 500) or 'Free'");
        return;
      }
      priceBigInt = BigInt(parsed);
    }
    const parsedDate = new Date(dateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error("Please enter a valid date and time");
      return;
    }
    const MAX_RETRIES = 5;
    const RETRY_DELAYS = [2000, 4000, 6000, 8000, 10000];
    const dateNs = BigInt(parsedDate.getTime()) * 1_000_000n;
    const payload = {
      title: title.trim(),
      date: dateNs,
      location: location.trim(),
      price: priceBigInt,
    };
    let lastError = "";
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await addEvent(payload);
        toast.success("Event uploaded! It's now visible to everyone.");
        setTitle("");
        setDateTime("");
        setLocation("");
        setPrice("");
        return;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        const isServerRestart =
          lastError.includes("stopped") ||
          lastError.includes("IC0508") ||
          lastError.includes("restarting");
        if (isServerRestart && attempt < MAX_RETRIES - 1) {
          toast.info(
            `Server is restarting... retrying (${attempt + 1}/${MAX_RETRIES - 1})`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAYS[attempt]),
          );
          continue;
        }
        break;
      }
    }
    if (
      lastError.includes("stopped") ||
      lastError.includes("IC0508") ||
      lastError.includes("restarting")
    ) {
      toast.error(
        "Server is still restarting after several attempts. Please wait a minute and try again.",
      );
    } else {
      toast.error(`Upload failed: ${lastError}`);
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
                placeholder="e.g. 500 or Free"
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
                      <span className="text-primary">
                        {event.price === 0n
                          ? "Free"
                          : `${event.price.toString()} credits`}
                      </span>
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

// ── Recipient Username Input ──────────────────────────────────────────────
function RecipientUsernameInput({
  recipientUsername,
}: {
  recipientUsername: string;
}) {
  const [localRecipient, setLocalRecipient] = useState(recipientUsername);
  const { mutateAsync: saveRecipient, isPending: isSaving } =
    useSetRecipientUsername();

  const handleDone = async () => {
    await saveRecipient(localRecipient.trim());
    toast.success("Recipient username saved for everyone!");
  };

  return (
    <>
      <Input
        id="recipient-username"
        placeholder="e.g. Iluvlean"
        value={localRecipient}
        onChange={(e) => setLocalRecipient(e.target.value)}
        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
        data-ocid="admin.recipient_username.input"
      />
      <Button
        type="button"
        onClick={handleDone}
        disabled={isSaving}
        className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 w-full"
        data-ocid="admin.recipient_done.button"
      >
        {isSaving ? "Saving..." : "Done"}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Users will be instructed to send credits to this username.
      </p>
    </>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────
function AdminPanel({
  recipientUsername,
}: {
  recipientUsername: string;
}) {
  const { data: reservations, isLoading } = useGetAllReservations();
  const { mutateAsync: updateRes } = useUpdateReservation();
  const [updating, setUpdating] = useState<string | null>(null);

  const _approvedReservations =
    reservations?.filter((r) => r.status === ReservationStatus.approved) ?? [];

  const allReservationsSorted = [...(reservations ?? [])].sort((a, b) =>
    Number(b.id - a.id),
  );
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
          <TabsTrigger
            value="ticket-holders"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            data-ocid="admin.ticket_holders.tab"
          >
            Ticket Holders
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            data-ocid="admin.settings.tab"
          >
            Settings
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

        <TabsContent value="ticket-holders">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-foreground">
              Ticket Holders
            </h3>
            <Badge className="bg-primary/20 text-primary border border-primary/50 text-sm px-3 py-1">
              {allReservationsSorted.length}
            </Badge>
          </div>

          {isLoading && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-ocid="admin.ticket_holders.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full bg-card" />
              ))}
            </div>
          )}

          {!isLoading && allReservationsSorted.length === 0 && (
            <div
              className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl"
              data-ocid="admin.ticket_holders.empty_state"
            >
              <div className="text-4xl mb-3">🍀</div>
              <p className="font-medium">No tickets submitted yet</p>
              <p className="text-sm mt-1 opacity-60">
                Ticket holders will appear here as soon as someone reserves
              </p>
            </div>
          )}

          {!isLoading && allReservationsSorted.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allReservationsSorted.map((r, i) => (
                <motion.div
                  key={r.id.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-ocid={`admin.ticket_holders.item.${i + 1}`}
                >
                  <Card
                    className="bg-card border border-primary/30 overflow-hidden"
                    style={{
                      background: "oklch(0.11 0.018 142)",
                      boxShadow: "0 0 0 1px oklch(0.79 0.21 142 / 0.2)",
                    }}
                  >
                    {/* Green top accent bar */}
                    <div
                      className="h-1 w-full"
                      style={{ background: "oklch(0.79 0.21 142 / 0.7)" }}
                    />
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-xl font-bold leading-tight"
                          style={{ color: "oklch(0.79 0.21 142)" }}
                        >
                          {r.imvuUsername}
                        </p>
                        {r.status === ReservationStatus.approved ? (
                          <Badge className="shrink-0 bg-primary/20 text-primary border border-primary/50 text-xs">
                            ✓ Confirmed
                          </Badge>
                        ) : r.status === ReservationStatus.rejected ? (
                          <Badge className="shrink-0 bg-red-500/20 text-red-400 border border-red-500/50 text-xs">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge className="shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {r.eventDetails.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {r.transactionNote}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-card border border-border max-w-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="recipient-username"
                  className="text-sm text-muted-foreground mb-1 block"
                >
                  IMVU Recipient Username
                </label>
                <RecipientUsernameInput recipientUsername={recipientUsername} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>("events");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const { data: recipientUsername = "Iluvlean" } = useGetRecipientUsername();
  const { data: events, isLoading: eventsLoading } = useGetAllEvents();

  const handleReserve = (event: Event) => {
    setSelectedEvent(event);
    setView("reserve");
  };

  const handleBack = () => {
    setSelectedEvent(null);
    setView("events");
  };

  const handleAdminNavClick = () => {
    if (adminUnlocked) {
      setView("admin");
    } else {
      setShowAdminPrompt(true);
    }
  };

  const handleAdminCode = () => {
    if (adminCodeInput === "clover2041") {
      setAdminUnlocked(true);
      setShowAdminPrompt(false);
      setAdminCodeInput("");
      setView("admin");
    } else {
      toast.error("Incorrect access code");
      setAdminCodeInput("");
    }
  };

  const navItems: { id: View; label: string; onClick?: () => void }[] = [
    { id: "events", label: "Events" },
    { id: "lookup", label: "My Reservation" },
    { id: "admin", label: "Admin", onClick: handleAdminNavClick },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AnimatePresence>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      </AnimatePresence>
      <Toaster theme="dark" />

      {/* Admin Code Modal */}
      <AnimatePresence>
        {showAdminPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            data-ocid="admin.modal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  Admin Access
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the access code to continue.
              </p>
              <Input
                type="password"
                placeholder="Access code"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminCode()}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground mb-4"
                autoFocus
                data-ocid="admin.input"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={handleAdminCode}
                  data-ocid="admin.confirm_button"
                >
                  Enter
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setShowAdminPrompt(false);
                    setAdminCodeInput("");
                  }}
                  data-ocid="admin.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              src="/assets/uploads/55f4ba40-2e9e-485c-bea8-fba6aaa00668-019d284b-505a-74a9-85bd-52d46ddac793-1.png"
              alt="Project Clover"
              className="h-14 w-auto object-contain"
            />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={item.onClick ?? (() => setView(item.id))}
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

          <div className="w-10" />
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-border/30 flex">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={item.onClick ?? (() => setView(item.id))}
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
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                recipientUsername={recipientUsername}
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

          {view === "admin" && adminUnlocked && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel recipientUsername={recipientUsername} />
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
