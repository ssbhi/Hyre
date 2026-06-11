"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addApplicationNote } from "@/lib/actions/pipeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AddNoteForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addApplicationNote(applicationId, body);
      if (res.ok) {
        setBody("");
        toast.success("Note added");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Add a note about this candidate…"
      />
      <div className="flex justify-end">
        <Button size="sm" type="submit" disabled={pending || !body.trim()}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
