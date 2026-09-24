export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-50 flex items-center justify-center px-4 py-12 md:py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
