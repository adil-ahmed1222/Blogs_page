import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard, FileText, FolderTree, Tags, Image, Users, Search, BarChart3, PenLine, CalendarClock,
  CheckCircle2, Settings, ChevronsLeft, Moon, Sun, Bell, Plus, Shield, History, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";
import { roleLabel, useMe, invalidate } from "@/lib/blog-store";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/posts", label: "Blog Posts", icon: FileText },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/media", label: "Media Library", icon: Image },
  { to: "/authors", label: "Authors", icon: Users },
  { to: "/seo", label: "SEO Management", icon: Search },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/drafts", label: "Drafts", icon: PenLine },
  { to: "/scheduled", label: "Scheduled Posts", icon: CalendarClock },
  { to: "/published", label: "Published Posts", icon: CheckCircle2 },
  { to: "/activity", label: "Activity Log", icon: History },
  { to: "/users", label: "Users & Roles", icon: Shield },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(true);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("glass sticky top-0 z-20 hidden h-screen shrink-0 flex-col rounded-none border-y-0 border-l-0 transition-all duration-300 md:flex", collapsed ? "w-[72px]" : "w-64")}>
        <div className={cn("flex h-[4.75rem] items-center gap-2.5", collapsed ? "justify-center px-2" : "px-4")}>
          <BrandMark />
          {!collapsed && <div className="font-display text-sm font-bold leading-tight">NeuralVarsity<span className="text-brand">.ai</span><div className="text-[11px] font-medium text-muted-foreground">Blog Studio</div></div>}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {nav.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} title={n.label}
                className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground", active && "bg-muted text-foreground")}>
                {active && <span className="bg-brand absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full" />}
                <n.icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
          <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Collapse"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 flex h-16 items-center gap-2 rounded-none border-x-0 border-t-0 px-4 md:px-8">
          <BrandMark className="md:hidden" />
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="btn px-2.5" aria-label="Toggle theme">{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
            <Notifications />
            <Link to="/posts/new" className="btn-primary"><Plus className="size-4" /><span className="hidden sm:inline">New post</span></Link>
            <UserMenu />
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground" activeProps={{ className: "bg-muted text-foreground" }}>{n.label}</Link>)}
        </nav>
        <main className="flex-1 px-4 py-8 md:px-8 animate-in fade-in duration-500">{children}</main>
      </div>
    </div>
  );
}

function useOutside(ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, close]);
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  const { data } = useQuery({
    queryKey: ["search", term],
    enabled: term.length >= 2,
    queryFn: async () => {
      const like = `%${term.replace(/[%_]/g, "")}%`;
      const [b, a, c, t] = await Promise.all([
        supabase.from("blogs").select("id, title, status").ilike("title", like).limit(6),
        supabase.from("profiles").select("id, full_name, email").or(`full_name.ilike.${like},email.ilike.${like}`).limit(4),
        supabase.from("categories").select("id, name").ilike("name", like).limit(4),
        supabase.from("tags").select("id, name").ilike("name", like).limit(4),
      ]);
      return { blogs: b.data ?? [], authors: a.data ?? [], categories: c.data ?? [], tags: t.data ?? [] };
    },
  });
  const empty = data && !data.blogs.length && !data.authors.length && !data.categories.length && !data.tags.length;
  return (
    <div ref={ref} className="relative max-w-md flex-1">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input className="field pl-9" value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} placeholder="Search blogs, authors, categories, tags…" />
      {open && term.length >= 2 && data && (
        <div className="glass absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl bg-popover p-2 text-sm animate-in fade-in">
          {empty && <div className="p-3 text-muted-foreground">No results</div>}
          {data.blogs.length > 0 && <Group label="Blogs">{data.blogs.map((b) => <Link key={b.id} to="/posts/new" search={{ id: b.id }} onClick={() => setOpen(false)} className="block truncate rounded-md px-2 py-1.5 hover:bg-muted">{b.title}</Link>)}</Group>}
          {data.authors.length > 0 && <Group label="Authors">{data.authors.map((a) => <Link key={a.id} to="/authors" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 hover:bg-muted">{a.full_name || a.email}</Link>)}</Group>}
          {data.categories.length > 0 && <Group label="Categories">{data.categories.map((c) => <Link key={c.id} to="/categories" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 hover:bg-muted">{c.name}</Link>)}</Group>}
          {data.tags.length > 0 && <Group label="Tags">{data.tags.map((t) => <Link key={t.id} to="/tags" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 hover:bg-muted">#{t.name}</Link>)}</Group>}
        </div>
      )}
    </div>
  );
}
function Group({ label, children }: { label: string; children: ReactNode }) {
  return <div className="mb-1"><div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>{children}</div>;
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  const { data = [] } = useQuery({
    queryKey: ["notifications"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });
  const unread = data.filter((n) => !n.read).length;
  const markAll = async () => {
    const ids = data.filter((n) => !n.read).map((n) => n.id);
    if (ids.length) await supabase.from("notifications").update({ read: true }).in("id", ids);
    invalidate("notifications");
  };
  return (
    <div ref={ref} className="relative">
      <button className="btn relative px-2.5" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <Bell className="size-4" />
        {unread > 0 && <span className="bg-brand absolute -right-1 -top-1 grid size-4 place-items-center rounded-full text-[10px] font-bold text-accent-foreground">{unread}</span>}
      </button>
      {open && (
        <div className="glass absolute right-0 top-full z-30 mt-2 w-80 rounded-xl bg-popover p-2 animate-in fade-in">
          <div className="flex items-center justify-between px-2 py-1"><span className="text-sm font-semibold">Notifications</span>{unread > 0 && <button onClick={markAll} className="text-xs text-primary">Mark all read</button>}</div>
          <div className="max-h-80 overflow-y-auto">
            {data.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">You're all caught up.</div>}
            {data.map((n) => (
              <a key={n.id} href={n.link ?? "#"} className={cn("block rounded-lg px-2 py-2 text-sm hover:bg-muted", !n.read && "bg-primary/5")}>
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="truncate text-xs text-muted-foreground">{n.body}</div>}
                <div className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const initials = (me?.name ?? "?").split(/[\s@]/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="bg-brand grid size-9 place-items-center rounded-full text-xs font-bold text-accent-foreground" aria-label="Account">{initials}</button>
      {open && me && (
        <div className="glass absolute right-0 top-full z-30 mt-2 w-60 rounded-xl bg-popover p-2 animate-in fade-in">
          <div className="px-2 py-2"><div className="truncate text-sm font-semibold">{me.name}</div><div className="truncate text-xs text-muted-foreground">{me.email}</div><div className="mt-1 text-xs text-primary">{me.roles.map((r) => roleLabel[r]).join(", ")}</div></div>
          <Link to="/settings" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted">Profile settings</Link>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-muted"><LogOut className="size-4" />Sign out</button>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-6 py-14 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative mb-5 grid size-16 place-items-center">
        <span className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
        <span className="relative grid size-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary [&_svg]:size-7">
          {icon ?? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>}
        </span>
      </div>
      <div className="font-display text-lg font-semibold">{title}</div>
      <div className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls = { Published: "bg-success/15 text-success", Scheduled: "bg-primary/15 text-primary", Approved: "bg-accent/15 text-accent", Review: "bg-destructive/15 text-destructive" }[status] ?? "bg-muted text-muted-foreground";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}
