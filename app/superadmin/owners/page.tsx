import { listOwners } from "@/lib/actions/admin-owners";
import OwnersClient from "./owners-client";

// Owner data (profiles, KYC, status) changes constantly — never cache.
export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const owners = await listOwners();
  return <OwnersClient initialOwners={owners} />;
}
