"use client";

import { useTransition } from "react";
import type { VoteChoice } from "@prisma/client";
import { castVoteAction } from "@/lib/family/actions";
import { Button } from "@/components/ui/button";

export function VoteButtons({ discussionId }: { discussionId: string }) {
  const [pending, start] = useTransition();

  function vote(choice: VoteChoice) {
    start(async () => {
      await castVoteAction(discussionId, choice);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={() => vote("FOR")}>Pour</Button>
      <Button type="button" variant="outline" disabled={pending} onClick={() => vote("AGAINST")}>Contre</Button>
      <Button type="button" variant="outline" disabled={pending} onClick={() => vote("ABSTAIN")}>Abstention</Button>
    </div>
  );
}
