import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // Always redirect to landing for now
  redirect("/landing");
}
