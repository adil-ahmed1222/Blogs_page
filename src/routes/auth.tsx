import { createFileRoute, useNavigate, useHydrated } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/nv-logo.png.asset.json";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Sign in to the NeuralVarsity.ai Blog Studio." },
      { property: "og:title", content: "Sign in — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Sign in to the NeuralVarsity.ai Blog Studio." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin" || mode === "signup") {
        if (mode === "signup") {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });
          if (signUpError) throw signUpError;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: prof } = await supabase.from("profiles").select("deactivated_at").eq("id", data.user.id).maybeSingle();
        if (prof?.deactivated_at) {
          await supabase.auth.signOut();
          throw new Error("This account has been deactivated. Please contact an admin.");
        }
        await supabase.from("activity_logs").insert({ actor_id: data.user.id, action: "User login", entity: "user", details: data.user.email ?? "" });
        if (remember) localStorage.removeItem("nv-forget");
        else { localStorage.setItem("nv-forget", "1"); sessionStorage.setItem("nv-session", "1"); }
        nav({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset link sent — check your email.");
        setMode("signin");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(/email not confirmed/i.test(message)
        ? "Email confirmation is still turned on for this Supabase project, so sign-in is rejected until that setting is off."
        : message);
    }
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8 animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className="grid size-20 place-items-center rounded-2xl bg-foreground p-1"><img src={logo.url} alt="NeuralVarsity logo" className="size-full object-contain" /></div>
          <h1 className="mt-4 text-2xl font-bold">NeuralVarsity<span className="text-brand">.ai</span> Blog Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Welcome back. Sign in to continue." : mode === "signup" ? "Create your writer account." : "We'll email you a reset link."}</p>
        </div>
        {mode !== "forgot" && (
          <div className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cn("rounded-md py-1.5 font-medium text-muted-foreground transition-colors", mode === m && "bg-background text-foreground shadow-sm")}>{m === "signin" ? "Sign in" : "Sign up"}</button>
            ))}
          </div>
        )}
        <form method="post" onSubmit={submit} className="mt-6">
          <fieldset disabled={!hydrated} className="space-y-4">
          {mode === "signup" && <Field label="Full name"><input className="field" required value={name} onChange={(e) => setName(e.target.value)} /></Field>}
          <Field label="Email"><input type="email" className="field" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          {mode !== "forgot" && <Field label="Password"><input type="password" className="field" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></Field>}
          {mode === "signin" && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember me</label>
              <button type="button" onClick={() => setMode("forgot")} className="text-primary">Forgot password?</button>
            </div>
          )}
          <button className="btn-primary w-full justify-center py-2.5" disabled={busy || !hydrated}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
          {mode === "forgot" && <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-muted-foreground">Back to sign in</button>}
          </fieldset>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}
