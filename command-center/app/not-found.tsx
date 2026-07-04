import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-center animate-in">
      <div>
        <span className="inline-grid place-items-center size-14 rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text-faint)] mb-4">
          <Compass size={26} />
        </span>
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          That page or report doesn’t exist.
        </p>
        <Link
          href="/"
          className="inline-flex mt-5 rounded-xl bg-[var(--color-brand)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
