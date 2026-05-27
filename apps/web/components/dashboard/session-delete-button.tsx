"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function SessionDeleteButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this session?")) return;

    setDeleting(true);
    const res = await fetch(`/api/me/sessions/${sessionId}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete session");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={deleting}
      title="Delete session"
    >
      <Trash2 className="size-4" />
      <span className="sr-only">Delete session</span>
    </Button>
  );
}
