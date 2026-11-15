import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Coffee, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/auth")({ head: () => ({ meta: [
  { title: "Yönetici Girişi — Kahve Menüsü" }, { name: "description", content: "Kahve menüsü yönetim paneline güvenli giriş." },
  { property: "og:title", content: "Kahve Menüsü Yönetici Girişi" }, { property: "og:description", content: "Menünüzü yönetmek için giriş yapın." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: Auth });
function Auth() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/dashboard" }); }); }, [navigate]);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [info, setInfo] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setInfo("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim(); const password = String(f.get("password"));
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError("E-posta veya şifre hatalı."); else await navigate({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
        if (error) setError(error.message.includes("registered") ? "Bu e-posta zaten kayıtlı." : "Hesap oluşturulamadı. Şifre en az 6 karakter olmalı.");
        else if (data.session) await navigate({ to: "/dashboard" });
        else { setInfo("E-postana bir onay bağlantısı gönderdik. Onayladıktan sonra buradan giriş yap."); setMode("in"); }
      }
    } catch { setError("Bir sorun oluştu. Lütfen yeniden deneyin."); }
    finally { setBusy(false); }
  }
  const field = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  return <main className="flex min-h-screen flex-col items-center justify-center px-6">
    <div className="w-full max-w-sm space-y-7">
      <Coffee className="size-10 text-primary" strokeWidth={1.4}/>
      <div><p className="text-sm text-primary">KAHVE MENÜSÜ</p><h1 className="mt-2 text-3xl font-semibold">{mode === "in" ? "Yönetici girişi" : "Hesap oluştur"}</h1></div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block space-y-1.5 text-sm"><span>E-posta</span><input className={field} type="email" name="email" required autoComplete="email"/></label>
        <label className="block space-y-1.5 text-sm"><span>Şifre</span><input className={field} type="password" name="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"}/></label>
        <Button disabled={busy} type="submit" className="h-11 w-full">{busy ? "Bekleyin..." : mode === "in" ? "Giriş yap" : "Hesap oluştur"}</Button>
      </form>
      <button type="button" className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); }}>{mode === "in" ? "Hesabın yok mu? Hesap oluştur" : "Zaten hesabın var mı? Giriş yap"}</button>
      {info && <p role="status" className="text-sm text-foreground">{info}</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4"/>Yalnızca yetkili hesaplar menüyü düzenleyebilir.</p>
      <Button asChild variant="ghost"><Link to="/"><ArrowLeft/>Menüye dön</Link></Button>
    </div>
  </main>;
}
