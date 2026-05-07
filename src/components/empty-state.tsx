export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded bg-white px-6 py-16 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-muted">{text}</p>
    </div>
  );
}
