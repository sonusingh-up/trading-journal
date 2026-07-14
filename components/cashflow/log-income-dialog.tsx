"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
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

// Local YYYY-MM-DD (en-CA formats as ISO date).
const todayLocal = () => new Intl.DateTimeFormat("en-CA").format(new Date());

export function LogIncomeDialog({ sources }: { sources: string[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [sourceName, setSourceName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(todayLocal());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_name: sourceName,
          amount: Number(amount),
          date:
            date === todayLocal()
              ? new Date().toISOString()
              : new Date(date).toISOString(),
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error ?? "Failed to log income.");
        return;
      }

      toast.success(`${body.source_name} income logged.`);
      setSourceName("");
      setAmount("");
      setDate(todayLocal());
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
          Log income
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log income</DialogTitle>
          <DialogDescription>
            Record revenue from one of your business streams.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-source">Source</Label>
            <Input
              id="income-source"
              required
              list="income-sources"
              placeholder="e.g. Affiliate Revenue"
              className="rounded-xl"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
            <datalist id="income-sources">
              {sources.map((source) => (
                <option key={source} value={source} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount ($)</Label>
              <Input
                id="income-amount"
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="2500"
                className="rounded-xl"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-date">Date</Label>
              <Input
                id="income-date"
                type="date"
                required
                className="rounded-xl"
                value={date}
                max={todayLocal()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

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
              disabled={submitting}
              className="rounded-full"
            >
              {submitting && (
                <LoaderCircle data-slot="icon" className="animate-spin" />
              )}
              Log income
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
