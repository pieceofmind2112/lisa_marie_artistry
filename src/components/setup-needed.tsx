import Link from "next/link";

export function SetupNeeded({ error }: { error: string }) {
  return (
    <div className="card space-y-3 border-ember/50">
      <h2 className="heading text-lg">Can&apos;t reach the Google Sheet yet</h2>
      <p className="text-sm text-silver">{error}</p>
      <Link href="/settings" className="btn btn-ghost">
        Open settings
      </Link>
    </div>
  );
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
