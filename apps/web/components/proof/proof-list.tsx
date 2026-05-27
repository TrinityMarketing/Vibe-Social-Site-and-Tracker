import { ProofCard, type ProofCardData } from "./proof-card";

export function ProofList({
  proofs,
  emptyLabel = "No proof objects yet.",
}: {
  proofs: ProofCardData[];
  emptyLabel?: string;
}) {
  if (proofs.length === 0) {
    return (
      <div className="vc-panel p-8 text-center">
        <p className="font-mono text-lg font-semibold text-foreground">
          Proof feed is warming up
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {emptyLabel} Once builders attach repos, demos, PRs, and build notes,
          they will appear here as public proof objects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proofs.map((proof) => (
        <ProofCard key={proof.id} proof={proof} />
      ))}
    </div>
  );
}
