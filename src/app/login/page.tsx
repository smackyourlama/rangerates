import { AuthCard } from "@/components/auth-card";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string | string[] };
}) {
  const nextParam = searchParams?.next;
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  return <AuthCard mode="login" nextPath={nextPath || "/dashboard"} />;
}
