type ImportProgressOverlayProps = {
  title: string;
  message: string;
  progress?: number | null;
};

export function ImportProgressOverlay({
  title,
  message,
  progress = null,
}: ImportProgressOverlayProps) {
  const showPercent = typeof progress === "number";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="import-progress-title"
      aria-describedby="import-progress-message"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3
          id="import-progress-title"
          className="text-lg font-semibold text-slate-900"
        >
          {title}
        </h3>
        <p id="import-progress-message" className="mt-2 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
          {showPercent ? (
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          ) : (
            <div className="h-full w-2/5 rounded-full bg-blue-600 motion-safe:animate-[import-progress-indeterminate_1.4s_ease-in-out_infinite]" />
          )}
        </div>

        {showPercent ? (
          <p className="mt-2 text-center text-sm font-medium text-slate-700">
            {Math.round(progress ?? 0)}%
          </p>
        ) : null}

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Please keep this tab open and do not refresh or navigate away until the
          process finishes.
        </p>
      </div>
    </div>
  );
}
