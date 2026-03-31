import { AuthCard } from "@/components/auth-card";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { next?: string | string[] };
}) {
  const nextParam = searchParams?.next;
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  return <AuthCard mode="signup" nextPath={nextPath || "/dashboard"} />;
}
