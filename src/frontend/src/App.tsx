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

// ── SVG Clover Particle Background ─────────────────────────────────────────────
// SVG clover shape as a small inline component
function CloveSVG({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      aria-hidden="true"
      role="img"
    >
      <title>Clover</title>
      <circle cx="10" cy="10" r="7" fill="oklch(0.82 0.16 85 / 0.6)" />
      <circle cx="22" cy="10" r="7" fill="oklch(0.82 0.16 85 / 0.6)" />
      <circle cx="10" cy="22" r="7" fill="oklch(0.82 0.16 85 / 0.6)" />
      <circle cx="22" cy="22" r="7" fill="oklch(0.82 0.16 85 / 0.6)" />
      <rect
        x="14"
        y="22"
        width="4"
        height="8"
        rx="2"
        fill="oklch(0.82 0.16 85 / 0.5)"
      />
    </svg>
  );
}

const PARTICLE_CONFIG = [
  { left: "8%", delay: "0s", duration: "14s", size: 18, opacity: 0.18 },
  { left: "22%", delay: "3s", duration: "18s", size: 12, opacity: 0.12 },
  { left: "37%", delay: "7s", duration: "12s", size: 22, opacity: 0.2 },
  { left: "54%", delay: "1.5s", duration: "16s", size: 14, opacity: 0.14 },
  { left: "68%", delay: "5s", duration: "20s", size: 20, opacity: 0.16 },
  { left: "82%", delay: "9s", duration: "13s", size: 10, opacity: 0.1 },
  { left: "93%", delay: "2.5s", duration: "17s", size: 16, opacity: 0.15 },
];

function FloatingParticles() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {PARTICLE_CONFIG.map((p) => (
        <div
          key={p.left}
          className="absolute bottom-0 animate-drift"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          <CloveSVG size={p.size} opacity={p.opacity} />
        </div>
      ))}
    </div>
  );
}

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
      <Badge
        className="font-bold"
        style={{
          background: "oklch(0.82 0.16 85 / 0.15)",
          color: "oklch(0.92 0.18 85)",
          border: "1px solid oklch(0.82 0.16 85 / 0.5)",
          boxShadow: "0 0 8px oklch(0.82 0.16 85 / 0.3)",
        }}
      >
        ✓ Approved
      </Badge>
    );
  }
  if (status === ReservationStatus.rejected) {
    return (
      <Badge
        className="font-bold"
        style={{
          background: "oklch(0.63 0.25 25 / 0.15)",
          color: "oklch(0.75 0.22 25)",
          border: "1px solid oklch(0.63 0.25 25 / 0.5)",
          boxShadow: "0 0 8px oklch(0.63 0.25 25 / 0.25)",
        }}
      >
        Rejected
      </Badge>
    );
  }
  return (
    <Badge
      className="font-bold"
      style={{
        background: "oklch(0.78 0.18 80 / 0.15)",
        color: "oklch(0.85 0.18 80)",
        border: "1px solid oklch(0.78 0.18 80 / 0.5)",
        boxShadow: "0 0 8px oklch(0.78 0.18 80 / 0.25)",
      }}
    >
      Pending
    </Badge>
  );
}

// ── Event Card (Ticket Design) ────────────────────────────────────────────────
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.18 } }}
    >
      {/* Outer wrapper — notch cutouts via drop-shadow */}
      <div
        className="relative flex rounded-xl overflow-visible card-neon"
        style={{
          filter: "drop-shadow(0 4px 40px oklch(0.82 0.16 85 / 0.22))",
          transition: "filter 0.3s ease",
        }}
      >
        {/* Main ticket body */}
        <div
          className="flex-1 relative overflow-hidden group ticket-scanline"
          style={{
            background: "oklch(0.12 0.06 280)",
            borderRadius: "12px 0 0 12px",
            border: "1px solid oklch(0.82 0.16 85 / 0.30)",
            borderRight: "none",
          }}
        >
          {/* Ticket texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, oklch(0.82 0.16 85) 0px, oklch(0.82 0.16 85) 1px, transparent 1px, transparent 8px)," +
                "repeating-linear-gradient(-45deg, oklch(0.82 0.16 85) 0px, oklch(0.82 0.16 85) 1px, transparent 1px, transparent 8px)",
            }}
          />

          {/* Shimmer hover */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(105deg, transparent 30%, oklch(0.82 0.16 85 / 0.08) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
            }}
          />

          {/* Neon glow orb top-left */}
          <div
            className="absolute -top-8 -left-8 w-28 h-28 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.82 0.16 85 / 0.10) 0%, transparent 70%)",
            }}
          />

          <div className="p-5 pr-6">
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.82 0.16 85 / 0.12)",
                  color: "oklch(0.92 0.18 85)",
                  border: "1px solid oklch(0.82 0.16 85 / 0.28)",
                }}
              >
                🍀 IMVU Event
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: "oklch(0.45 0.05 280)" }}
              >
                {ticketNum}
              </span>
            </div>

            {/* Event title — Fraunces italic for drama */}
            <h3
              className="text-2xl font-bold italic leading-tight mb-4"
              style={{
                fontFamily: "Cinzel, Georgia, serif",
                color: "oklch(0.95 0.02 85)",
                textShadow: "0 0 24px oklch(0.82 0.16 85 / 0.2)",
              }}
            >
              {event.title}
            </h3>

            {/* Date + Location */}
            <div className="flex flex-col gap-1.5 mb-5">
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: "oklch(0.82 0.16 85)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "oklch(0.60 0.05 280)" }}
                >
                  {date}{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "oklch(0.88 0.16 85)" }}
                  >
                    @ {time}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: "oklch(0.82 0.16 85)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "oklch(0.60 0.05 280)" }}
                >
                  {event.location}
                </span>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-0.5"
                  style={{ color: "oklch(0.45 0.05 280)" }}
                >
                  Price
                </p>
                <p
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    color: "oklch(0.92 0.18 85)",
                    textShadow: "0 0 12px oklch(0.82 0.16 85 / 0.4)",
                  }}
                >
                  {event.price === 0n
                    ? "Free"
                    : `${event.price.toString()} credits`}
                </p>
              </div>
              <motion.button
                type="button"
                className="btn-glow animate-pulse-glow inline-flex items-center gap-1.5 font-bold text-sm px-5 py-2.5 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
                  color: "oklch(0.08 0.04 280)",
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReserve(event)}
                data-ocid="events.reserve.button"
              >
                <Ticket className="w-4 h-4" />
                Reserve 🏟
              </motion.button>
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
            background: "oklch(0.08 0.04 280)",
            border: "1px solid oklch(0.16 0.06 280)",
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
            background: "oklch(0.08 0.04 280)",
            border: "1px solid oklch(0.16 0.06 280)",
          }}
        />

        {/* Stub section */}
        <div
          className="w-[72px] shrink-0 flex flex-col items-center justify-between relative overflow-hidden"
          style={{
            background: "oklch(0.14 0.06 280)",
            borderRadius: "0 12px 12px 0",
            border: "1px solid oklch(0.82 0.16 85 / 0.3)",
            borderLeft: "none",
          }}
        >
          {/* Dashed divider */}
          <div
            className="absolute left-0 top-4 bottom-4"
            style={{
              borderLeft: "2px dashed oklch(0.82 0.16 85 / 0.35)",
            }}
          />

          {/* Stub glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.82 0.16 85 / 0.09) 0%, transparent 70%)",
            }}
          />

          {/* Rotated ADMIT ONE text */}
          <div
            className="flex-1 flex items-center justify-center"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{ color: "oklch(0.82 0.16 85 / 0.75)" }}
            >
              ADMIT ONE
            </span>
          </div>

          {/* Clover SVG */}
          <div className="pb-4">
            <CloveSVG size={20} opacity={0.8} />
          </div>

          {/* Ticket ID */}
          <div className="pb-3">
            <span
              className="text-[8px] font-mono block text-center"
              style={{ color: "oklch(0.40 0.02 240)", letterSpacing: "0.05em" }}
            >
              {ticketNum}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Reservation Form ───────────────────────────────────────────────────────
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

      <h2
        className="text-3xl font-bold italic mb-1"
        style={{
          fontFamily: "Cinzel, Georgia, serif",
          color: "oklch(0.95 0.02 85)",
        }}
      >
        Reserve Ticket
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Complete your reservation below
      </p>

      <Card
        className="border mb-6 glass"
        style={{ borderColor: "oklch(0.82 0.16 85 / 0.25)" }}
      >
        <CardContent className="p-4 space-y-1">
          <p
            className="font-bold text-lg italic"
            style={{
              fontFamily: "Cinzel, Georgia, serif",
              color: "oklch(0.95 0.02 85)",
            }}
          >
            {event.title}
          </p>
          <p className="text-muted-foreground text-sm">
            {formatDateTime(event.date)} · {event.location}
          </p>
          <p
            className="font-bold text-xl"
            style={{
              color: "oklch(0.92 0.18 85)",
              fontFamily: "Cinzel, Georgia, serif",
            }}
          >
            {event.price === 0n ? "Free" : `${event.price.toString()} credits`}
          </p>
        </CardContent>
      </Card>

      <div
        className="rounded-xl p-4 mb-6 space-y-2"
        style={{
          background: "oklch(0.82 0.16 85 / 0.08)",
          border: "1px solid oklch(0.82 0.16 85 / 0.3)",
          boxShadow: "inset 0 0 20px oklch(0.82 0.16 85 / 0.05)",
        }}
      >
        <p
          className="text-sm font-semibold"
          style={{ color: "oklch(0.92 0.18 85)" }}
        >
          💳 Payment Instructions
        </p>
        <p className="text-sm text-foreground">
          Send credits via IMVU to:{" "}
          <span className="font-bold" style={{ color: "oklch(0.92 0.18 85)" }}>
            {recipientUsername}
          </span>
        </p>
        <p className="text-sm text-foreground">
          Include note:{" "}
          <span className="font-bold" style={{ color: "oklch(0.92 0.18 85)" }}>
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
            placeholder={`e.g. CLOVER${event.id.toString()}`}
            value={transactionNote}
            onChange={(e) => setTransactionNote(e.target.value)}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="reserve.transaction_note.input"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button
          type="button"
          className="w-full btn-glow font-bold text-base py-3 rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
            color: "oklch(0.08 0.04 280)",
          }}
          onClick={handleSubmit}
          disabled={isPending}
          data-ocid="reserve.submit_button"
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

// ── Confirmation ──────────────────────────────────────────────────────────────
function Confirmation({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative text-center max-w-md mx-auto py-12 overflow-visible"
      data-ocid="reserve.success_state"
    >
      {/* Confetti emojis */}
      {["🎉", "✨", "🍀", "🎊", "💚", "✨2", "🍀2", "🎉2"].map((emoji, i) => (
        <motion.span
          key={emoji}
          className="absolute text-2xl pointer-events-none select-none"
          style={{ left: `${10 + i * 11}%`, top: "30%" }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: -160,
            opacity: 0,
            scale: 0.5,
            rotate: i % 2 === 0 ? 180 : -180,
          }}
          transition={{ delay: i * 0.12, duration: 1.4, ease: "easeOut" }}
        >
          {emoji}
        </motion.span>
      ))}

      {/* Big spinning clover */}
      <motion.div
        className="text-8xl mb-6 select-none inline-block"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.1 }}
        style={{ filter: "drop-shadow(0 0 30px oklch(0.82 0.16 85 / 0.85))" }}
      >
        🍀
      </motion.div>

      <motion.h2
        className="text-4xl font-bold italic mb-3 text-gradient-green"
        style={{ fontFamily: "Cinzel, Georgia, serif" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        You’re In! 🎉
      </motion.h2>
      <motion.p
        className="text-lg font-semibold mb-2"
        style={{ color: "oklch(0.92 0.18 85)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        Ticket request received!
      </motion.p>
      <motion.p
        className="text-muted-foreground mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        Hang tight — once your payment is verified you’re on the guest list. 💚
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <Button
          type="button"
          className="btn-glow font-bold px-8 py-3 text-base rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
            color: "oklch(0.08 0.04 280)",
          }}
          onClick={onBack}
          data-ocid="confirm.back.button"
        >
          🏟 Back to Events
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ── Lookup View ──────────────────────────────────────────────────────────────
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
      <h2
        className="text-3xl font-bold italic mb-6"
        style={{
          fontFamily: "Cinzel, Georgia, serif",
          color: "oklch(0.95 0.02 85)",
        }}
      >
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
          className="btn-glow shrink-0 font-semibold"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
            color: "oklch(0.08 0.04 280)",
          }}
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
              className="glass border card-neon"
              style={{ borderColor: "oklch(0.82 0.16 85 / 0.22)" }}
              data-ocid={`lookup.item.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      className="font-bold text-lg italic"
                      style={{
                        fontFamily: "Cinzel, Georgia, serif",
                        color: "oklch(0.95 0.02 85)",
                      }}
                    >
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

// ── Manage Events Tab ───────────────────────────────────────────────────────────
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
      <Card
        className="glass border"
        style={{ borderColor: "oklch(0.82 0.16 85 / 0.22)" }}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className="text-lg flex items-center gap-2"
            style={{ color: "oklch(0.95 0.02 85)" }}
          >
            <Plus
              className="w-5 h-5"
              style={{ color: "oklch(0.92 0.18 85)" }}
            />
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
                placeholder="e.g. IMVU Virtual Lounge"
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
            onClick={handleUpload}
            disabled={adding}
            className="btn-glow w-full font-bold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
              color: "oklch(0.08 0.04 280)",
            }}
            data-ocid="admin.upload_event.button"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {adding ? "Uploading..." : "Upload Event"}
          </Button>
        </CardContent>
      </Card>

      {/* Events list */}
      {eventsLoading && (
        <div className="space-y-2" data-ocid="admin.events.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-14 w-full"
              style={{ background: "oklch(0.16 0.06 280)" }}
            />
          ))}
        </div>
      )}

      {!eventsLoading && events && events.length > 0 && (
        <div className="space-y-3">
          {events.map((ev, i) => (
            <div
              key={ev.id.toString()}
              className="flex items-center justify-between p-4 rounded-xl glass border"
              style={{ borderColor: "oklch(0.82 0.16 85 / 0.18)" }}
              data-ocid={`admin.event.item.${i + 1}`}
            >
              <div>
                <p
                  className="font-semibold italic"
                  style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    color: "oklch(0.95 0.02 85)",
                  }}
                >
                  {ev.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(ev.date)} · {ev.location}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="opacity-70 hover:opacity-100"
                onClick={() => handleDelete(ev.id)}
                disabled={deletingId === ev.id}
                data-ocid={`admin.event.delete_button.${i + 1}`}
              >
                {deletingId === ev.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Recipient Username Input ──────────────────────────────────────────────────
function RecipientUsernameInput({
  recipientUsername,
}: { recipientUsername: string }) {
  const [value, setValue] = useState(recipientUsername);
  const { mutateAsync: setUsername } = useSetRecipientUsername();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await setUsername(value.trim());
      toast.success("Recipient username updated!");
    } catch {
      toast.error("Failed to update recipient username.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Input
        id="recipient-username"
        placeholder="e.g. Iluvlean"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-input border-border text-foreground placeholder:text-muted-foreground mb-3"
        data-ocid="admin.recipient_username.input"
      />
      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-2 btn-glow w-full font-bold"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
          color: "oklch(0.08 0.04 280)",
        }}
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

// ── Admin Panel ─────────────────────────────────────────────────────────────────
function AdminPanel({ recipientUsername }: { recipientUsername: string }) {
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
      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck
          className="w-6 h-6"
          style={{ color: "oklch(0.92 0.18 85)" }}
        />
        <h2
          className="text-3xl font-bold italic"
          style={{
            fontFamily: "Cinzel, Georgia, serif",
            color: "oklch(0.95 0.02 85)",
          }}
        >
          Admin Panel
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Admin access is restricted.
      </p>

      <Tabs defaultValue="manage-events" className="w-full">
        {/* Pill-style tabs with neon active indicator */}
        <TabsList
          className="mb-6 flex gap-1 p-1 rounded-full"
          style={{
            background: "oklch(0.12 0.06 280)",
            border: "1px solid oklch(0.82 0.16 85 / 0.18)",
          }}
        >
          {[
            {
              value: "manage-events",
              label: "Manage Events",
              ocid: "admin.manage_events.tab",
            },
            {
              value: "reservations",
              label: "Reservations",
              ocid: "admin.reservations.tab",
            },
            {
              value: "ticket-holders",
              label: "Ticket Holders",
              ocid: "admin.ticket_holders.tab",
            },
            {
              value: "settings",
              label: "Settings",
              ocid: "admin.settings.tab",
            },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-full text-xs font-semibold transition-all duration-200 data-[state=active]:text-[oklch(0.06_0.01_240)] data-[state=inactive]:text-muted-foreground"
              style={{}}
              data-ocid={tab.ocid}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="manage-events">
          <ManageEventsTab />
        </TabsContent>

        <TabsContent value="reservations">
          {isLoading && (
            <div className="space-y-2" data-ocid="admin.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-12 w-full"
                  style={{ background: "oklch(0.16 0.06 280)" }}
                />
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
                  <TableRow
                    className="hover:bg-transparent"
                    style={{
                      borderBottom: "1px solid oklch(0.82 0.16 85 / 0.15)",
                    }}
                  >
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
                      className="hover:bg-muted/30"
                      style={{
                        borderBottom: "1px solid oklch(0.82 0.16 85 / 0.08)",
                      }}
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
                              className="h-7 px-2 text-xs font-semibold"
                              style={{
                                background: "oklch(0.82 0.16 85 / 0.15)",
                                color: "oklch(0.92 0.18 85)",
                                border: "1px solid oklch(0.82 0.16 85 / 0.35)",
                              }}
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
            <h3
              className="text-xl font-bold italic"
              style={{
                fontFamily: "Cinzel, Georgia, serif",
                color: "oklch(0.95 0.02 85)",
              }}
            >
              Ticket Holders
            </h3>
            <Badge
              style={{
                background: "oklch(0.82 0.16 85 / 0.15)",
                color: "oklch(0.92 0.18 85)",
                border: "1px solid oklch(0.82 0.16 85 / 0.4)",
                boxShadow: "0 0 8px oklch(0.82 0.16 85 / 0.2)",
              }}
              className="text-sm px-3 py-1 font-bold"
            >
              {allReservationsSorted.length}
            </Badge>
          </div>

          {isLoading && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-ocid="admin.ticket_holders.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-32 w-full"
                  style={{ background: "oklch(0.16 0.06 280)" }}
                />
              ))}
            </div>
          )}

          {!isLoading && allReservationsSorted.length === 0 && (
            <div
              className="text-center py-16 text-muted-foreground rounded-xl"
              style={{
                border: "1px dashed oklch(0.82 0.16 85 / 0.2)",
              }}
              data-ocid="admin.ticket_holders.empty_state"
            >
              <div className="flex justify-center mb-3">
                <CloveSVG size={40} opacity={0.3} />
              </div>
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
                    className="glass overflow-hidden card-neon"
                    style={{
                      border: "1px solid oklch(0.82 0.16 85 / 0.25)",
                    }}
                  >
                    {/* Neon top accent bar */}
                    <div
                      className="h-[2px] w-full"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, oklch(0.92 0.18 85), transparent)",
                        boxShadow: "0 0 8px oklch(0.82 0.16 85 / 0.6)",
                      }}
                    />
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-xl font-bold italic leading-tight"
                          style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            color: "oklch(0.92 0.18 85)",
                            textShadow: "0 0 12px oklch(0.82 0.16 85 / 0.35)",
                          }}
                        >
                          {r.imvuUsername}
                        </p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "oklch(0.95 0.02 85)" }}
                      >
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
          <Card
            className="glass border max-w-lg"
            style={{ borderColor: "oklch(0.82 0.16 85 / 0.22)" }}
          >
            <CardHeader className="pb-3">
              <CardTitle
                className="text-lg flex items-center gap-2"
                style={{ color: "oklch(0.95 0.02 85)" }}
              >
                <Settings
                  className="w-5 h-5"
                  style={{ color: "oklch(0.92 0.18 85)" }}
                />
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

// ── Root App ──────────────────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-mesh text-foreground flex flex-col">
      <FloatingParticles />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
            data-ocid="admin.modal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
              style={{
                borderColor: "oklch(0.82 0.16 85 / 0.3)",
                boxShadow:
                  "0 0 40px oklch(0.82 0.16 85 / 0.15), 0 24px 60px oklch(0 0 0 / 0.6)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck
                  className="w-5 h-5"
                  style={{ color: "oklch(0.92 0.18 85)" }}
                />
                <h2
                  className="text-xl font-bold italic"
                  style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    color: "oklch(0.95 0.02 85)",
                  }}
                >
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
                  className="flex-1 btn-glow font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
                    color: "oklch(0.08 0.04 280)",
                  }}
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

      {/* Header — glass morphism nav */}
      <header className="glass-nav sticky top-0 z-10">
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
              className="h-16 w-auto object-contain"
              style={{
                filter: "drop-shadow(0 0 10px oklch(0.82 0.16 85 / 0.4))",
              }}
            />
          </button>

          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={item.onClick ?? (() => setView(item.id))}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  view === item.id
                    ? "text-[oklch(0.06_0.01_240)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
                style={
                  view === item.id
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.88 0.18 85), oklch(0.72 0.14 65))",
                        boxShadow:
                          "0 0 16px oklch(0.82 0.16 85 / 0.5), 0 0 32px oklch(0.82 0.16 85 / 0.2)",
                      }
                    : {}
                }
                data-ocid={`nav.${item.id}.tab`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="w-10" />
        </div>

        {/* Mobile nav */}
        <div
          className="md:hidden flex"
          style={{ borderTop: "1px solid oklch(0.82 0.16 85 / 0.12)" }}
        >
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={item.onClick ?? (() => setView(item.id))}
              className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                view === item.id ? "border-b-2" : "text-muted-foreground"
              }`}
              style={
                view === item.id
                  ? {
                      color: "oklch(0.92 0.18 85)",
                      borderColor: "oklch(0.82 0.16 85)",
                      textShadow: "0 0 8px oklch(0.82 0.16 85 / 0.5)",
                    }
                  : {}
              }
              data-ocid={`nav.mobile.${item.id}.tab`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 relative z-[1]">
        <AnimatePresence mode="wait">
          {view === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* ── HERO SECTION ── */}
              <div className="mb-12 text-center">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="animate-hero-glow inline-block mb-2"
                >
                  <h1
                    className="text-6xl md:text-8xl lg:text-9xl font-bold italic leading-none text-gradient-hero"
                    style={{ fontFamily: "Cinzel, Georgia, serif" }}
                  >
                    PROJECT
                    <br />
                    CLOVER
                  </h1>
                </motion.div>
                <motion.p
                  className="text-muted-foreground text-lg md:text-xl mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Reserve your spot at the hottest IMVU parties ✨
                </motion.p>
                {/* Neon divider */}
                <motion.div
                  className="mx-auto mt-6 h-px w-48 md:w-72"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.82 0.16 85 / 0.8), transparent)",
                    boxShadow: "0 0 10px oklch(0.82 0.16 85 / 0.5)",
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                />
              </div>

              {eventsLoading && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  data-ocid="events.loading_state"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-52 w-full"
                      style={{ background: "oklch(0.12 0.015 240)" }}
                    />
                  ))}
                </div>
              )}

              {!eventsLoading && (!events || events.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 text-muted-foreground"
                  data-ocid="events.empty_state"
                >
                  <motion.div
                    className="inline-block mb-4"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      delay: 0.2,
                    }}
                    style={{
                      filter: "drop-shadow(0 0 20px oklch(0.82 0.16 85 / 0.6))",
                    }}
                  >
                    <CloveSVG size={64} opacity={0.7} />
                  </motion.div>
                  <p
                    className="text-2xl font-bold italic mb-2"
                    style={{
                      fontFamily: "Cinzel, Georgia, serif",
                      color: "oklch(0.95 0.02 85)",
                    }}
                  >
                    No parties yet...
                  </p>
                  <p
                    className="text-lg"
                    style={{ color: "oklch(0.92 0.18 85)" }}
                  >
                    Check back soon! Something fun is coming 🎉
                  </p>
                </motion.div>
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
      <footer
        className="py-6 text-center"
        style={{ borderTop: "1px solid oklch(0.82 0.16 85 / 0.12)" }}
      >
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.92 0.18 85)" }}
            className="hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
