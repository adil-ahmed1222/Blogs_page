import { cn } from "@/lib/utils";

export function BrandMark({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  return (
    <div className={cn("brand-crest relative grid shrink-0 place-items-center", size === "lg" ? "size-36" : "size-12", className)}>
      <span aria-hidden className="pointer-events-none absolute inset-[22%] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_72%)]" />
      <img src="/nv-logo.png" alt="NeuralVarsity" className="relative size-full object-contain" />
    </div>
  );
}
