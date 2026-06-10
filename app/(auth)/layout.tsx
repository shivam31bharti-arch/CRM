// Authentication layout with centered responsive form panels.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
