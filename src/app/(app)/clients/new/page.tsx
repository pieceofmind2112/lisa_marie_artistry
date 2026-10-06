import { ClientForm } from "@/components/client-form";
import { requireUser } from "@/lib/auth";

export default async function NewClientPage() {
  await requireUser();
  return (
    <div className="space-y-4">
      <h1 className="heading text-2xl">New client</h1>
      <ClientForm initial={{ name: "", phone: "", email: "", okToText: true, notes: "" }} />
    </div>
  );
}
