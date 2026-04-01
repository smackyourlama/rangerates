import { AdminPanel } from "@/components/admin-panel";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#eef2ff] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <AdminPanel />
      </div>
    </div>
  );
}
