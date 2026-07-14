"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PositionSizeCalculator } from "@/components/dashboard/position-size-calculator";

export type AccountOption = {
  account_name: string;
  current_balance: number;
};

// Local YYYY-MM-DD (en-CA formats as ISO date).
const todayLocal = () => new Intl.DateTimeFormat("en-CA").format(new Date());

const emptyForm = {
  account_name: "",
  pair: "",
  side: "BUY",
  entry_price: "",
  exit_price: "",
  net_pnl: "",
  date: todayLocal(),
};

export function NewTradeDialog({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = React.useState<
    string | null
  >(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find(
    (a) => a.account_name === form.account_name,
  );

  function pickScreenshot(file: File | null) {
    setScreenshot(file);
    setScreenshotPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  const set = (field: keyof typeof emptyForm) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        account_name: form.account_name,
        pair: form.pair,
        side: form.side,
        entry_price: Number(form.entry_price),
        // A date picked as "today" keeps the current time so daily stats see it.
        date:
          form.date === todayLocal()
            ? new Date().toISOString()
            : new Date(form.date).toISOString(),
      };
      if (form.exit_price.trim() !== "")
        payload.exit_price = Number(form.exit_price);
      if (form.net_pnl.trim() !== "") payload.net_pnl = Number(form.net_pnl);

      if (screenshot) {
        const upload = new FormData();
        upload.append("file", screenshot);
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: upload,
        });
        const uploadBody = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.error(uploadBody.error ?? "Screenshot upload failed.");
          return;
        }
        payload.screenshot_url = uploadBody.url;
      }

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error ?? "Failed to log trade.");
        return;
      }

      toast.success(`${body.trade.pair} trade logged.`);
      const dd = body.daily_drawdown;
      if (dd?.level === "breached") {
        toast.error(
          `Daily drawdown limit BREACHED on ${dd.account_name} — stop trading today.`,
        );
      } else if (dd?.level === "warning") {
        toast.warning(
          `${dd.account_name} has used ${dd.used_pct.toFixed(0)}% of its daily drawdown limit.`,
        );
      }

      setForm(emptyForm);
      pickScreenshot(null);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — is the dev server running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-sm">
          <Plus data-slot="icon" />
          New trade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a new trade</DialogTitle>
          <DialogDescription>
            Leave exit price and net P&L empty for a position that&apos;s still
            open.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select
                required
                value={form.account_name}
                onValueChange={set("account_name")}
              >
                <SelectTrigger id="account" className="w-full rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.account_name}
                      value={account.account_name}
                    >
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Select value={form.side} onValueChange={set("side")}>
                <SelectTrigger id="side" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy / Long</SelectItem>
                  <SelectItem value="SELL">Sell / Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pair">Pair</Label>
              <Input
                id="pair"
                required
                placeholder="EURUSD"
                className="rounded-xl font-mono uppercase"
                value={form.pair}
                onChange={(e) => set("pair")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                className="rounded-xl"
                value={form.date}
                max={todayLocal()}
                onChange={(e) => set("date")(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry">Entry price</Label>
              <Input
                id="entry"
                type="number"
                step="any"
                required
                placeholder="1.0842"
                className="rounded-xl"
                value={form.entry_price}
                onChange={(e) => set("entry_price")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit">Exit price</Label>
              <Input
                id="exit"
                type="number"
                step="any"
                placeholder="—"
                className="rounded-xl"
                value={form.exit_price}
                onChange={(e) => set("exit_price")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pnl">Net P&L ($)</Label>
              <Input
                id="pnl"
                type="number"
                step="any"
                placeholder="—"
                className="rounded-xl"
                value={form.net_pnl}
                onChange={(e) => set("net_pnl")(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Chart screenshot (optional)</Label>
            <input
              ref={fileInputRef}
              id="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => pickScreenshot(e.target.files?.[0] ?? null)}
            />
            {screenshotPreview ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-accent/40 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotPreview}
                  alt="Selected chart screenshot"
                  className="h-14 w-20 rounded-lg object-cover"
                />
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
                  {screenshot?.name}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full"
                  onClick={() => {
                    pickScreenshot(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Remove screenshot</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-accent/30 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <ImagePlus className="size-4" />
                Attach a chart screenshot
              </button>
            )}
          </div>

          <PositionSizeCalculator
            accountBalance={selectedAccount?.current_balance}
          />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.account_name}
              className="rounded-full"
            >
              {submitting && (
                <LoaderCircle data-slot="icon" className="animate-spin" />
              )}
              Log trade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
