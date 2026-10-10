import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Choose a new password for your Blog Studio account." },
      { property: "og:title", content: "Reset password — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Choose a new password for your Blog Studio account." },
    ],
  }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="glass w-full max-w-md space-y-4 rounded-3xl p-8">
        <div className="flex justify-center"><BrandMark /></div>
        <h1 className="text-center text-2xl font-bold">Set a new password</h1>
        <input type="password" minLength={8} required className="field" placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn-primary w-full justify-center" disabled={busy}>Update password</button>
      </form>
    </div>
  );
}
