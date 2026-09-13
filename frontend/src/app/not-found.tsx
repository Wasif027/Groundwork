import Link from "next/link";

import { Mark } from "@/components/ui/Mark";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-surface-base px-5 text-center text-content-primary">
      <div>
        <Mark className="mx-auto mb-5 h-10 w-10 rounded-[10px]" />
        <h1 className="font-display text-[1.65rem] font-semibold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-2 max-w-[26rem] text-sm text-content-muted">
          That page doesn&apos;t exist, or it moved.
        </p>
        <Link href="/" className="btn btn-accent mt-6 inline-flex px-4 py-2">
          Back to Groundwork
        </Link>
      </div>
    </main>
  );
}
