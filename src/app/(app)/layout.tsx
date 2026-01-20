import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-0 px-4 pb-24 pt-20 lg:px-10 lg:pb-10 lg:pt-10">
          <div className="mx-auto w-full max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
