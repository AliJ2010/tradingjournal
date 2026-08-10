import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PreviewLanding from "@/components/preview/PreviewLanding";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <PreviewLanding />;
}
