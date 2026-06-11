"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

import { askAssistant } from "@/lib/ai/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SUGGESTED = [
  "Which candidates are stuck in screening?",
  "Which jobs have the most applicants?",
  "How are referrals performing?",
  "What does the hiring funnel look like?",
];

type Message = { role: "user" | "assistant"; text: string };

export function AskHyre() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  function send(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    startTransition(async () => {
      const res = await askAssistant(q);
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
      );
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Ask True Hire AI</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan-400 text-primary-foreground">
                <Sparkles className="size-3.5" />
              </span>
              Ask True Hire AI
            </SheetTitle>
            <SheetDescription>
              Ask about your pipeline in plain language.
            </SheetDescription>
          </SheetHeader>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Try one of these:</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about candidates, jobs, referrals…"
              className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button type="submit" size="icon" disabled={pending || !input.trim()}>
              <ArrowUp className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
