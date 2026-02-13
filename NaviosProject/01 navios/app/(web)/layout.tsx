import { WebHeader } from "@/components/layout/WebHeader";
import { Footer } from "@/components/layout/Footer";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <WebHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
