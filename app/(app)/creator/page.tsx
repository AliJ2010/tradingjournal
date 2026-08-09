import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CreatorDashboard from "@/components/CreatorDashboard";

export default async function CreatorPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "creator" && user.role !== "admin")) redirect("/dashboard");
  return <CreatorDashboard />;
}
