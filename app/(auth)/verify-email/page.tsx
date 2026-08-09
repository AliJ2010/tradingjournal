import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import VerifyEmailForm from "@/components/VerifyEmailForm";

export default async function VerifyEmailPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerified) redirect("/journal");

  return <VerifyEmailForm email={user.email} />;
}
