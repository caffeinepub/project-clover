import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
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

type View = "events" | "lookup" | "admin";

// ── SVG Clover ───────────────────────────────────────────────────────────────
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
    >
      <title>Clover</title>
      <circle cx="10" cy="10" r="7" fill="oklch(0.85 0.28 145 / 0.6)" />
      <circle cx="22" cy="10" r="7" fill="oklch(0.85 0.28 145 / 0.6)" />
      <circle cx="10" cy="22" r="7" fill="oklch(0.85 0.28 145 / 0.6)" />
      <circle cx="22" cy="22" r="7" fill="oklch(0.85 0.28 145 / 0.6)" />
      <rect
        x="14"
        y="22"
        width="4"
        height="8"
        rx="2"
        fill="oklch(0.85 0.28 145 / 0.5)"
      />
    </svg>
  );
}

const PARTICLE_CONFIG = [
  { left: "8%", delay: "0s", duration: "14s", size: 18, opacity: 0.15 },
  { left: "22%", delay: "3s", duration: "18s", size: 12, opacity: 0.1 },
  { left: "37%", delay: "7s", duration: "12s", size: 22, opacity: 0.17 },
  { left: "54%", delay: "1.5s", duration: "16s", size: 14, opacity: 0.12 },
  { left: "68%", delay: "5s", duration: "20s", size: 20, opacity: 0.14 },
  { left: "82%", delay: "9s", duration: "13s", size: 10, opacity: 0.09 },
  { left: "93%", delay: "2.5s", duration: "17s", size: 16, opacity: 0.13 },
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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
        className="text-xs px-2 py-0.5 font-semibold"
        style={{
          background: "oklch(0.85 0.28 145 / 0.15)",
          color: "oklch(0.92 0.32 145)",
          border: "1px solid oklch(0.85 0.28 145 / 0.35)",
        }}
      >
        ✓ Confirmed
      </Badge>
    );
  }
  if (status === ReservationStatus.rejected) {
    return (
      <Badge
        variant="destructive"
        className="text-xs px-2 py-0.5 font-semibold"
      >
        ✗ Rejected
      </Badge>
    );
  }
  return (
    <Badge
      className="text-xs px-2 py-0.5 font-semibold"
      style={{
        background: "oklch(0.72 0.14 65 / 0.18)",
        color: "oklch(0.88 0.16 85)",
        border: "1px solid oklch(0.72 0.14 65 / 0.35)",
      }}
    >
      ⏳ Pending
    </Badge>
  );
}

// ── Event Card (ticket style) ────────────────────────────────────────────────
function EventCard({
  event,
  onReserve,
}: { event: Event; onReserve: (e: Event) => void }) {
  const { date, time } = formatDateShort(event.date);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative flex rounded-2xl overflow-visible"
      style={{
        background: "oklch(0.10 0.04 145)",
        border: "1px solid oklch(0.85 0.28 145 / 0.22)",
        boxShadow: "0 4px 24px oklch(0 0 0 / 0.4)",
        minHeight: "170px",
        maxHeight: "200px",
        transition: "border-color 0.25s, box-shadow 0.25s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "oklch(0.85 0.28 145 / 0.55)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 28px oklch(0.85 0.28 145 / 0.18), 0 8px 40px oklch(0 0 0 / 0.5)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "oklch(0.85 0.28 145 / 0.22)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 24px oklch(0 0 0 / 0.4)";
      }}
    >
      {/* ── Main ticket body ── */}
      <div className="relative flex-1 flex flex-col overflow-hidden rounded-l-2xl">
        {/* Top color bar */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.72 0.25 145), oklch(0.92 0.30 145), oklch(0.72 0.25 145))",
          }}
        />
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.85 0.28 145) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            opacity: 0.03,
          }}
        />
        {/* Clover watermark */}
        <div
          className="absolute right-8 top-1/2 -translate-y-1/2 text-8xl pointer-events-none select-none"
          style={{ opacity: 0.05 }}
        >
          🍀
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-5 py-4 gap-2">
          {/* Title */}
          <h3
            className="text-lg font-bold leading-tight"
            style={{
              fontFamily: "Cinzel, Georgia, serif",
              color: "oklch(0.95 0.02 85)",
              textShadow: "0 0 20px oklch(0.85 0.28 145 / 0.15)",
            }}
          >
            {event.title}
          </h3>

          {/* Date + Location */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CalendarDays
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "oklch(0.85 0.28 145)" }}
              />
              <span className="text-xs text-muted-foreground">
                {date}{" "}
                <span
                  className="font-semibold"
                  style={{ color: "oklch(0.88 0.16 85)" }}
                >
                  @ {time}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "oklch(0.85 0.28 145)" }}
              />
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {event.location}
              </span>
            </div>
          </div>

          {/* Bottom row: price + reserve */}
          <div className="flex items-center justify-between gap-3 mt-auto">
            <div
              className="px-3 py-1 rounded-xl"
              style={{
                background: "oklch(0.85 0.28 145 / 0.08)",
                border: "1px solid oklch(0.85 0.28 145 / 0.22)",
              }}
            >
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Price
              </p>
              <p
                className="text-sm font-bold leading-none"
                style={{
                  fontFamily: "Cinzel, Georgia, serif",
                  color: "oklch(0.92 0.32 145)",
                }}
              >
                {event.price === 0n
                  ? "Free"
                  : `${event.price.toString()} credits`}
              </p>
            </div>
            <motion.button
              type="button"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))",
                color: "oklch(0.08 0.02 145)",
                boxShadow: "0 0 0 oklch(0.85 0.28 145 / 0)",
                transition: "box-shadow 0.2s",
              }}
              whileHover={
                {
                  scale: 1.05,
                  boxShadow: "0 0 20px oklch(0.85 0.28 145 / 0.55)",
                } as any
              }
              whileTap={{ scale: 0.95 }}
              onClick={() => onReserve(event)}
              data-ocid="events.reserve.button"
            >
              <Ticket className="w-4 h-4" />
              Reserve
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Perforated divider ── */}
      <div className="relative flex items-center justify-center w-5 shrink-0 z-10">
        {/* Notch top */}
        <div
          className="absolute -top-[1px] w-4 h-4 rounded-full z-20"
          style={{
            background: "oklch(0.06 0.02 145)",
            border: "1px solid oklch(0.85 0.28 145 / 0.22)",
            top: "-8px",
          }}
        />
        {/* Dashed vertical line */}
        <div
          className="h-full"
          style={{
            borderLeft: "2px dashed oklch(0.85 0.28 145 / 0.3)",
          }}
        />
        {/* Notch bottom */}
        <div
          className="absolute w-4 h-4 rounded-full z-20"
          style={{
            background: "oklch(0.06 0.02 145)",
            border: "1px solid oklch(0.85 0.28 145 / 0.22)",
            bottom: "-8px",
          }}
        />
      </div>

      {/* ── Stub ── */}
      <div
        className="w-24 flex flex-col items-center justify-between py-4 px-2 rounded-r-2xl shrink-0"
        style={{ background: "oklch(0.08 0.03 145)" }}
      >
        {/* Ticket number */}
        <span
          className="text-[10px] font-mono tracking-widest"
          style={{ color: "oklch(0.85 0.28 145 / 0.7)" }}
        >
          #{event.id.toString().padStart(3, "0")}
        </span>

        {/* Large clover */}
        <motion.div
          className="text-4xl select-none"
          style={{ filter: "drop-shadow(0 0 10px oklch(0.85 0.28 145 / 0.5))" }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          🍀
        </motion.div>

        {/* Barcode simulation */}
        <div className="flex flex-col gap-[2px] w-14">
          {[7, 5, 9, 6, 8, 4, 7, 5, 9, 3, 8, 6].map((w, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static decorative barcode
              key={i}
              style={{
                height: "2px",
                width: `${w * 7}%`,
                background: "oklch(0.85 0.28 145 / 0.4)",
                borderRadius: "1px",
              }}
            />
          ))}
        </div>

        {/* Admit One */}
        <span
          className="text-[8px] font-bold uppercase tracking-widest"
          style={{ color: "oklch(0.85 0.28 145 / 0.5)" }}
        >
          ADMIT ONE
        </span>
      </div>
    </motion.div>
  );
}

// ── Reservation Modal ─────────────────────────────────────────────────────────
function ReservationModal({
  event,
  recipientUsername,
  open,
  onClose,
  onSuccess,
}: {
  event: Event | null;
  recipientUsername: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [imvuUsername, setImvuUsername] = useState("");
  const [transactionNote, setTransactionNote] = useState("");
  const { mutateAsync: submitReservation, isPending } = useSubmitReservation();

  const handleSubmit = async () => {
    if (!event) return;
    if (!imvuUsername.trim() || !transactionNote.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await submitReservation({
        eventId: event.id,
        imvuUsername: imvuUsername.trim().toLowerCase(),
        transactionNote: transactionNote.trim(),
      });
      setImvuUsername("");
      setTransactionNote("");
      onSuccess();
    } catch {
      toast.error("Failed to submit reservation");
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md w-full"
        style={{
          background: "oklch(0.09 0.03 145)",
          border: "1px solid oklch(0.85 0.28 145 / 0.28)",
          boxShadow:
            "0 0 60px oklch(0.85 0.28 145 / 0.12), 0 24px 60px oklch(0 0 0 / 0.7)",
        }}
        data-ocid="reserve.dialog"
      >
        {/* Neon top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.85 0.28 145), transparent)",
          }}
        />

        <DialogHeader className="pb-2">
          <DialogTitle
            className="text-xl font-bold"
            style={{
              fontFamily: "Cinzel, Georgia, serif",
              color: "oklch(0.95 0.02 85)",
            }}
          >
            Reserve Ticket
          </DialogTitle>
        </DialogHeader>

        {/* Event summary */}
        <div
          className="rounded-xl p-3.5 mb-4"
          style={{
            background: "oklch(0.85 0.28 145 / 0.06)",
            border: "1px solid oklch(0.85 0.28 145 / 0.18)",
          }}
        >
          <p
            className="font-bold text-base"
            style={{
              fontFamily: "Cinzel, Georgia, serif",
              color: "oklch(0.92 0.32 145)",
            }}
          >
            {event.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDateTime(event.date)} · {event.location}
          </p>
          <p
            className="text-sm font-bold mt-1.5"
            style={{ color: "oklch(0.92 0.32 145)" }}
          >
            {event.price === 0n ? "Free" : `${event.price.toString()} credits`}
          </p>
        </div>

        {/* Payment instructions */}
        <div
          className="rounded-xl p-3.5 mb-5 space-y-1.5"
          style={{
            background: "oklch(0.14 0.06 145)",
            border: "1px solid oklch(0.85 0.28 145 / 0.22)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "oklch(0.92 0.32 145)" }}
          >
            💳 Payment Instructions
          </p>
          <p className="text-sm text-foreground">
            Send credits via IMVU to:{" "}
            <span
              className="font-bold"
              style={{ color: "oklch(0.92 0.32 145)" }}
            >
              {recipientUsername}
            </span>
          </p>
          <p className="text-sm text-foreground">
            Include note:{" "}
            <span
              className="font-bold"
              style={{ color: "oklch(0.92 0.32 145)" }}
            >
              CLOVER{event.id.toString()}
            </span>
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="imvu-username"
              className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider"
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
              className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider"
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

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-border text-muted-foreground hover:text-foreground"
            onClick={onClose}
            data-ocid="reserve.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 font-bold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))",
              color: "oklch(0.08 0.02 145)",
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
      </DialogContent>
    </Dialog>
  );
}

// ── Confirmation ──────────────────────────────────────────────────────────────
function ConfirmationBanner({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative text-center max-w-lg mx-auto py-16 px-4 overflow-visible"
      data-ocid="reserve.success_state"
    >
      {["🎉a", "✨b", "🍀c", "🎊d", "💚e", "✨f", "🍀g", "🎉h"].map(
        (emoji, i) => (
          <motion.span
            key={emoji}
            className="absolute text-2xl pointer-events-none select-none"
            style={{ left: `${8 + i * 12}%`, top: "28%" }}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{
              y: -150,
              opacity: 0,
              scale: 0.5,
              rotate: i % 2 === 0 ? 180 : -180,
            }}
            transition={{ delay: i * 0.12, duration: 1.4, ease: "easeOut" }}
          >
            {emoji}
          </motion.span>
        ),
      )}

      <motion.div
        className="text-8xl mb-6 select-none inline-block"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.1 }}
        style={{ filter: "drop-shadow(0 0 30px oklch(0.85 0.28 145 / 0.85))" }}
      >
        🍀
      </motion.div>

      <motion.h2
        className="text-4xl font-bold mb-3 text-gradient-green"
        style={{ fontFamily: "Cinzel, Georgia, serif" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        You're In! 🎉
      </motion.h2>
      <motion.p
        className="text-lg font-semibold mb-2"
        style={{ color: "oklch(0.92 0.32 145)" }}
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
        Hang tight — once your payment is verified you're on the guest list. 💚
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <Button
          type="button"
          className="font-bold px-8 py-3 text-base rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))",
            color: "oklch(0.08 0.02 145)",
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

// ── Lookup View ───────────────────────────────────────────────────────────────
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
      <div className="mb-8">
        <h2
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: "Cinzel, Georgia, serif",
            color: "oklch(0.95 0.02 85)",
          }}
        >
          My Reservation
        </h2>
        <p className="text-muted-foreground text-sm">
          Enter your IMVU username to look up your reservation status.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: "oklch(0.10 0.04 145)",
          border: "1px solid oklch(0.85 0.28 145 / 0.18)",
        }}
      >
        <div className="flex gap-3">
          <Input
            placeholder="Your IMVU username"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground flex-1"
            data-ocid="lookup.search_input"
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="font-bold shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))",
              color: "oklch(0.08 0.02 145)",
            }}
            data-ocid="lookup.search_button"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {results !== null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {results.length === 0 ? (
            <div className="text-center py-12" data-ocid="lookup.empty_state">
              <Ticket
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: "oklch(0.45 0.05 145)" }}
              />
              <p className="text-muted-foreground">
                No reservations found for that username.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div
                  key={r.id.toString()}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{
                    background: "oklch(0.10 0.04 145)",
                    border: "1px solid oklch(0.85 0.28 145 / 0.18)",
                  }}
                  data-ocid={`lookup.item.${i + 1}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.85 0.28 145 / 0.12)" }}
                  >
                    <Ticket
                      className="w-5 h-5"
                      style={{ color: "oklch(0.85 0.28 145)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{
                        fontFamily: "Cinzel, Georgia, serif",
                        color: "oklch(0.95 0.02 85)",
                      }}
                    >
                      {r.eventDetails.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(r.eventDetails.date)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {r.transactionNote}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Manage Events Tab ─────────────────────────────────────────────────────────
const MAX_RETRIES = 5;
const RETRY_DELAYS = [2000, 4000, 6000, 8000, 10000];

function ManageEventsTab() {
  const { data: events, isLoading: eventsLoading } = useGetAllEvents();
  const { mutateAsync: addEvent } = useAddEvent();
  const { mutateAsync: deleteEvent } = useDeleteEvent();
  const { data: fetchedRecipient = "" } = useGetRecipientUsername();
  const { mutateAsync: setRecipientUsername } = useSetRecipientUsername();
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [sendCreditsTo, setSendCreditsTo] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  useEffect(() => {
    if (fetchedRecipient) setSendCreditsTo(fetchedRecipient);
  }, [fetchedRecipient]);

  const handleUpload = async () => {
    if (!title || !dateTime || !location || !price) {
      toast.error("Please fill in all fields");
      return;
    }
    const dateMs = new Date(dateTime).getTime();
    if (Number.isNaN(dateMs)) {
      toast.error("Invalid date");
      return;
    }
    setAdding(true);
    const priceNum = Number.parseFloat(price);
    const priceBigInt = Number.isNaN(priceNum)
      ? 0n
      : BigInt(Math.round(priceNum));
    let lastError = "Unknown error";
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await addEvent({
          title,
          date: BigInt(dateMs) * 1_000_000n,
          location,
          price: priceBigInt,
        });
        toast.success("Event uploaded!");
        setTitle("");
        setDateTime("");
        setLocation("");
        setPrice("");
        if (sendCreditsTo && sendCreditsTo !== fetchedRecipient) {
          try {
            await setRecipientUsername(sendCreditsTo);
          } catch {
            // non-critical, ignore
          }
        }
        setAdding(false);
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        if (
          msg.includes("stopped") ||
          msg.includes("IC0508") ||
          msg.includes("restarting")
        ) {
          if (attempt < MAX_RETRIES - 1) {
            toast.info(
              `Server is restarting... retrying (${attempt + 1}/${MAX_RETRIES - 1})`,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAYS[attempt]),
            );
            continue;
          }
        }
        break;
      }
    }
    setAdding(false);
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
    <div className="space-y-6">
      {/* Upload form */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "oklch(0.10 0.04 145)",
          border: "1px solid oklch(0.85 0.28 145 / 0.22)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4" style={{ color: "oklch(0.92 0.32 145)" }} />
          <h3 className="font-bold" style={{ color: "oklch(0.95 0.02 85)" }}>
            Upload New Event
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label
              htmlFor="event-title"
              className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider"
            >
              Event Title
            </label>
            <Input
              id="event-title"
              placeholder="e.g. Clover Party Night"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border"
              data-ocid="admin.event_title.input"
            />
          </div>
          <div>
            <label
              htmlFor="event-date"
              className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider"
            >
              Date & Time
            </label>
            <Input
              id="event-date"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="bg-input border-border"
              style={{ colorScheme: "dark" }}
              data-ocid="admin.event_date.input"
            />
          </div>
          <div>
            <label
              htmlFor="event-location"
              className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider"
            >
              Location
            </label>
            <Input
              id="event-location"
              placeholder="e.g. IMVU Virtual Lounge"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-input border-border"
              data-ocid="admin.event_location.input"
            />
          </div>
          <div>
            <label
              htmlFor="event-price"
              className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider"
            >
              Price
            </label>
            <Input
              id="event-price"
              placeholder="e.g. 500 credits"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-input border-border"
              data-ocid="admin.event_price.input"
            />
          </div>
        </div>
        {/* Send Credits To - prominent full-width field */}
        <div
          className="rounded-xl p-3 mb-4"
          style={{
            background: "oklch(0.85 0.28 145 / 0.06)",
            border: "1px solid oklch(0.85 0.28 145 / 0.22)",
          }}
        >
          <label
            htmlFor="send-credits-to"
            className="text-xs font-bold mb-1 block uppercase tracking-wider"
            style={{ color: "oklch(0.92 0.32 145)" }}
          >
            Send Credits To
          </label>
          <Input
            id="send-credits-to"
            placeholder="e.g. Iluvlean"
            value={sendCreditsTo}
            onChange={(e) => setSendCreditsTo(e.target.value)}
            className="bg-input border-border"
            data-ocid="admin.send_credits_to.input"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Users will be instructed to send credits to this IMVU username
          </p>
        </div>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={adding}
          className="w-full font-bold"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))",
            color: "oklch(0.08 0.02 145)",
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
      </div>

      {/* Events list */}
      {eventsLoading && (
        <div className="space-y-2" data-ocid="admin.events.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-14 w-full"
              style={{ background: "oklch(0.14 0.05 145)" }}
            />
          ))}
        </div>
      )}

      {!eventsLoading && events && events.length > 0 && (
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div
              key={ev.id.toString()}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: "oklch(0.10 0.04 145)",
                border: "1px solid oklch(0.85 0.28 145 / 0.15)",
              }}
              data-ocid={`admin.event.item.${i + 1}`}
            >
              <div>
                <p
                  className="font-semibold text-sm"
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
                className="opacity-70 hover:opacity-100 shrink-0"
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
        className="bg-input border-border text-foreground mb-3"
        data-ocid="admin.recipient_username.input"
      />
      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full font-bold"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))",
          color: "oklch(0.08 0.02 145)",
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

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ recipientUsername }: { recipientUsername: string }) {
  const { data: reservations, isLoading } = useGetAllReservations();
  const { mutateAsync: updateRes } = useUpdateReservation();
  const [updating, setUpdating] = useState<string | null>(null);

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
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "oklch(0.85 0.28 145 / 0.12)",
            border: "1px solid oklch(0.85 0.28 145 / 0.25)",
          }}
        >
          <ShieldCheck
            className="w-5 h-5"
            style={{ color: "oklch(0.92 0.32 145)" }}
          />
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: "Cinzel, Georgia, serif",
              color: "oklch(0.95 0.02 85)",
            }}
          >
            Admin Panel
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage events and reservations
          </p>
        </div>
      </div>

      <Tabs defaultValue="manage-events" className="w-full">
        <TabsList
          className="mb-6 h-auto flex gap-1 p-1 rounded-xl w-full"
          style={{
            background: "oklch(0.10 0.04 145)",
            border: "1px solid oklch(0.85 0.28 145 / 0.15)",
          }}
        >
          {[
            {
              value: "manage-events",
              label: "Events",
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
              className="flex-1 text-xs font-semibold rounded-lg py-2 transition-all data-[state=active]:text-[oklch(0.06_0.01_240)] data-[state=inactive]:text-muted-foreground"
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
                  style={{ background: "oklch(0.14 0.05 145)" }}
                />
              ))}
            </div>
          )}
          {!isLoading && reservations && reservations.length === 0 && (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="admin.empty_state"
            >
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reservations yet</p>
            </div>
          )}
          {!isLoading && reservations && reservations.length > 0 && (
            <div
              className="overflow-x-auto rounded-xl"
              style={{ border: "1px solid oklch(0.85 0.28 145 / 0.15)" }}
              data-ocid="admin.table"
            >
              <Table>
                <TableHeader>
                  <TableRow
                    className="hover:bg-transparent"
                    style={{
                      borderBottom: "1px solid oklch(0.85 0.28 145 / 0.15)",
                      background: "oklch(0.10 0.04 145)",
                    }}
                  >
                    <TableHead className="text-muted-foreground text-xs">
                      ID
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Event
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      IMVU User
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Txn Note
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r, i) => (
                    <TableRow
                      key={r.id.toString()}
                      className="hover:bg-muted/20"
                      style={{
                        borderBottom: "1px solid oklch(0.85 0.28 145 / 0.08)",
                      }}
                      data-ocid={`admin.row.${i + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        #{r.id.toString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.eventDetails.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.imvuUsername}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
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
                              className="h-7 px-2 text-xs"
                              style={{
                                background: "oklch(0.85 0.28 145 / 0.15)",
                                color: "oklch(0.92 0.32 145)",
                                border: "1px solid oklch(0.85 0.28 145 / 0.35)",
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
          <div className="flex items-center gap-3 mb-5">
            <Users
              className="w-5 h-5"
              style={{ color: "oklch(0.92 0.32 145)" }}
            />
            <h3
              className="text-lg font-bold"
              style={{
                fontFamily: "Cinzel, Georgia, serif",
                color: "oklch(0.95 0.02 85)",
              }}
            >
              Ticket Holders
            </h3>
            <Badge
              style={{
                background: "oklch(0.85 0.28 145 / 0.15)",
                color: "oklch(0.92 0.32 145)",
                border: "1px solid oklch(0.85 0.28 145 / 0.3)",
              }}
            >
              {allReservationsSorted.length}
            </Badge>
          </div>
          {isLoading && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              data-ocid="admin.ticket_holders.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-28"
                  style={{ background: "oklch(0.14 0.05 145)" }}
                />
              ))}
            </div>
          )}
          {!isLoading && allReservationsSorted.length === 0 && (
            <div
              className="text-center py-16 text-muted-foreground rounded-2xl"
              style={{ border: "1px dashed oklch(0.85 0.28 145 / 0.2)" }}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allReservationsSorted.map((r, i) => (
                <motion.div
                  key={r.id.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background: "oklch(0.10 0.04 145)",
                    border: "1px solid oklch(0.85 0.28 145 / 0.22)",
                  }}
                  data-ocid={`admin.ticket_holders.item.${i + 1}`}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, oklch(0.85 0.28 145), transparent)",
                    }}
                  />
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p
                      className="font-bold"
                      style={{
                        color: "oklch(0.92 0.32 145)",
                        fontFamily: "Cinzel, Georgia, serif",
                      }}
                    >
                      {r.imvuUsername}
                    </p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.95 0.02 85)" }}
                  >
                    {r.eventDetails.title}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {r.transactionNote}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div
            className="rounded-2xl p-5 max-w-lg"
            style={{
              background: "oklch(0.10 0.04 145)",
              border: "1px solid oklch(0.85 0.28 145 / 0.22)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings
                className="w-4 h-4"
                style={{ color: "oklch(0.92 0.32 145)" }}
              />
              <h3
                className="font-bold"
                style={{ color: "oklch(0.95 0.02 85)" }}
              >
                Payment Settings
              </h3>
            </div>
            <label
              htmlFor="recipient-username"
              className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider"
            >
              IMVU Recipient Username
            </label>
            <RecipientUsernameInput recipientUsername={recipientUsername} />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>("events");
  const [reserveEvent, setReserveEvent] = useState<Event | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const { data: recipientUsername = "Iluvlean" } = useGetRecipientUsername();
  const { data: events, isLoading: eventsLoading } = useGetAllEvents();

  const handleReserve = (event: Event) => {
    setReserveEvent(event);
    setReserveOpen(true);
  };

  const handleReserveSuccess = () => {
    setReserveOpen(false);
    setShowConfirm(true);
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

      {/* Reservation Modal */}
      <ReservationModal
        event={reserveEvent}
        recipientUsername={recipientUsername}
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        onSuccess={handleReserveSuccess}
      />

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
              className="rounded-2xl p-6 w-full max-w-sm mx-4"
              style={{
                background: "oklch(0.09 0.03 145)",
                border: "1px solid oklch(0.85 0.28 145 / 0.3)",
                boxShadow:
                  "0 0 40px oklch(0.85 0.28 145 / 0.15), 0 24px 60px oklch(0 0 0 / 0.6)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className="w-5 h-5"
                    style={{ color: "oklch(0.92 0.32 145)" }}
                  />
                  <h2
                    className="text-lg font-bold"
                    style={{
                      fontFamily: "Cinzel, Georgia, serif",
                      color: "oklch(0.95 0.02 85)",
                    }}
                  >
                    Admin Access
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminPrompt(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="admin.close_button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                type="password"
                placeholder="Enter access code"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminCode()}
                className="bg-input border-border mb-4"
                data-ocid="admin.code.input"
              />
              <Button
                type="button"
                className="w-full font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))",
                  color: "oklch(0.08 0.02 145)",
                }}
                onClick={handleAdminCode}
                data-ocid="admin.code.submit_button"
              >
                Enter
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Navbar */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "oklch(0.06 0.02 145 / 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid oklch(0.85 0.28 145 / 0.18)",
          boxShadow:
            "0 1px 0 oklch(0.85 0.28 145 / 0.08), 0 8px 32px oklch(0 0 0 / 0.4)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => {
              setView("events");
              setShowConfirm(false);
            }}
            className="flex items-center gap-2.5 group"
            data-ocid="nav.logo.button"
          >
            <img
              src="/assets/uploads/3daae5d6-06e7-40e5-afb4-391ab2b451ba-019d2b5c-92d0-72d0-8600-5d53241f36fa-1.png"
              alt="Project Clover"
              className="h-9 w-9 object-contain"
              style={{
                filter: "drop-shadow(0 0 8px oklch(0.85 0.28 145 / 0.5))",
              }}
            />
            <span
              className="hidden sm:block font-bold text-sm tracking-widest uppercase"
              style={{
                fontFamily: "Cinzel, Georgia, serif",
                color: "oklch(0.92 0.32 145)",
                textShadow: "0 0 10px oklch(0.85 0.28 145 / 0.4)",
              }}
            >
              Project Clover
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={
                  item.onClick ??
                  (() => {
                    setView(item.id);
                    setShowConfirm(false);
                  })
                }
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color:
                    view === item.id
                      ? "oklch(0.08 0.02 145)"
                      : "oklch(0.65 0.08 145)",
                  background:
                    view === item.id
                      ? "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))"
                      : "transparent",
                  boxShadow:
                    view === item.id
                      ? "0 0 14px oklch(0.85 0.28 145 / 0.4)"
                      : "none",
                }}
                data-ocid={`nav.${item.id}.tab`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile nav */}
          <nav className="flex md:hidden items-center gap-1">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={
                  item.onClick ??
                  (() => {
                    setView(item.id);
                    setShowConfirm(false);
                  })
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  color:
                    view === item.id
                      ? "oklch(0.08 0.02 145)"
                      : "oklch(0.65 0.08 145)",
                  background:
                    view === item.id
                      ? "linear-gradient(135deg, oklch(0.90 0.30 145), oklch(0.78 0.28 145))"
                      : "transparent",
                }}
                data-ocid={`nav.mobile.${item.id}.tab`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 relative z-[1]">
        <AnimatePresence mode="wait">
          {/* ── EVENTS VIEW ── */}
          {view === "events" && !showConfirm && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero */}
              <section className="relative mb-16 text-center pt-8 pb-4">
                {/* Background glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.85 0.28 145 / 0.06), transparent)",
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <img
                      src="/assets/uploads/3daae5d6-06e7-40e5-afb4-391ab2b451ba-019d2b5c-92d0-72d0-8600-5d53241f36fa-1.png"
                      alt="Clover"
                      className="h-14 w-14 object-contain"
                      style={{
                        filter:
                          "drop-shadow(0 0 16px oklch(0.85 0.28 145 / 0.8))",
                      }}
                    />
                  </div>
                  <h1
                    className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none text-gradient-hero mb-2"
                    style={{ fontFamily: "Cinzel, Georgia, serif" }}
                  >
                    PROJECT CLOVER
                  </h1>
                  <motion.p
                    className="text-base md:text-lg text-muted-foreground mt-4 max-w-md mx-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Reserve your spot at the hottest IMVU parties ✨
                  </motion.p>
                </motion.div>

                {/* Neon divider */}
                <motion.div
                  className="mx-auto mt-8 h-px w-64"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.85 0.28 145 / 0.7), transparent)",
                    boxShadow: "0 0 10px oklch(0.85 0.28 145 / 0.4)",
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </section>

              {/* Events section header */}
              <div className="flex items-center gap-3 mb-6">
                <h2
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    color: "oklch(0.95 0.02 85)",
                  }}
                >
                  Upcoming Events
                </h2>
                <div
                  className="flex-1 h-px"
                  style={{ background: "oklch(0.85 0.28 145 / 0.15)" }}
                />
                {events && events.length > 0 && (
                  <span
                    className="text-xs font-mono px-2.5 py-1 rounded-full"
                    style={{
                      background: "oklch(0.85 0.28 145 / 0.1)",
                      color: "oklch(0.85 0.28 145)",
                      border: "1px solid oklch(0.85 0.28 145 / 0.2)",
                    }}
                  >
                    {events.length} {events.length === 1 ? "event" : "events"}
                  </span>
                )}
              </div>

              {/* Loading */}
              {eventsLoading && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  data-ocid="events.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-72 w-full rounded-2xl"
                      style={{ background: "oklch(0.12 0.04 145)" }}
                    />
                  ))}
                </div>
              )}

              {/* Empty */}
              {!eventsLoading && (!events || events.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-24"
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
                      filter:
                        "drop-shadow(0 0 20px oklch(0.85 0.28 145 / 0.6))",
                    }}
                  >
                    <CloveSVG size={60} opacity={0.7} />
                  </motion.div>
                  <p
                    className="text-2xl font-bold mb-2"
                    style={{
                      fontFamily: "Cinzel, Georgia, serif",
                      color: "oklch(0.95 0.02 85)",
                    }}
                  >
                    No parties yet...
                  </p>
                  <p
                    className="text-lg"
                    style={{ color: "oklch(0.92 0.32 145)" }}
                  >
                    Check back soon! Something fun is coming 🎉
                  </p>
                </motion.div>
              )}

              {/* Grid */}
              {!eventsLoading && events && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {events.map((event, i) => (
                    <motion.div
                      key={event.id.toString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <EventCard event={event} onReserve={handleReserve} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CONFIRMATION ── */}
          {view === "events" && showConfirm && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ConfirmationBanner
                onBack={() => {
                  setShowConfirm(false);
                }}
              />
            </motion.div>
          )}

          {/* ── LOOKUP ── */}
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

          {/* ── ADMIN ── */}
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
        style={{ borderTop: "1px solid oklch(0.85 0.28 145 / 0.1)" }}
      >
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.92 0.32 145)" }}
            className="hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
