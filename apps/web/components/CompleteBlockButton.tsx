"use client";
export function CompleteBlockButton({
  onClick,
}: {
  onClick: () => Promise<void>;
}) {
  return (
    <button
      onClick={() => onClick()}
      className="rounded px-3 py-1 text-white font-medium"
    >
      Complete
    </button>
  );
}
