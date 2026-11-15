import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type FormEvent } from "react";
import { Coffee, LayoutGrid, UtensilsCrossed, QrCode, ExternalLink, Plus, Pencil, Trash2, LogOut, Download, Copy, Search, Eye, EyeOff, Check, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { dashboardQuery } from "@/lib/menu-queries";
import { saveItem, saveCategory, deleteEntry } from "@/lib/menu.functions";
import { itemSchema } from "@/lib/menu-schema";
import { menuImages, menuImage } from "@/lib/menu-images";
export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  head: () => ({ meta: [
    { title: "Yönetim Paneli — Kahve Menüsü" }, { name: "description", content: "Kategorilerinizi, ürünlerinizi, fiyatlarınızı ve menü QR kodunuzu yönetin." },
    { property: "og:title", content: "Kahve Menüsü Yönetim Paneli" }, { property: "og:description", content: "Menü ve kategori yönetimi." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" },
  ] }), component: Dashboard,
});
type Item = Tables<"menu_items">;
type Category = Tables<"menu_categories">;
const tabs = [{ id: "items", label: "Ürünler", icon: UtensilsCrossed }, { id: "categories", label: "Kategoriler", icon: LayoutGrid }, { id: "qr", label: "QR kod", icon: QrCode }] as const;
const field = "w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring";
function Dashboard() {
  const menuUrl = typeof window === "undefined" ? "/" : `${window.location.origin}/`;
  const { data } = useSuspenseQuery(dashboardQuery);
  const client = useQueryClient(); const navigate = useNavigate();
  const saveProduct = useServerFn(saveItem); const saveCat = useServerFn(saveCategory); const remove = useServerFn(deleteEntry);
  const [tab, setTab] = useState<"items" | "categories" | "qr">("items");
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [category, setCategory] = useState<Partial<Category> | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; kind: "item" | "category"; name: string } | null>(null);
  const [saving, setSaving] = useState(false); const qr = useRef<HTMLDivElement>(null);
  async function refresh() { await client.invalidateQueries({ queryKey: ["dashboard"] }); await client.invalidateQueries({ queryKey: ["menu"] }); }
  async function signout() { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }
  async function submitItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editing) return;
    const values = new FormData(e.currentTarget);
    const parsed = itemSchema.safeParse({ id: editing.id, name: values.get("name"), category_id: values.get("category_id"), description: values.get("description"), price: Number(values.get("price")), old_price: values.get("old_price") ? Number(values.get("old_price")) : null, image: editing.image ?? "espresso", available: values.get("available") === "on", position: Number(values.get("position")) });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Alanları kontrol edin."); return; }
    setSaving(true);
    try { await saveProduct({ data: parsed.data }); await refresh(); setEditing(null); toast.success("Ürün kaydedildi."); } catch (err) { toast.error(err instanceof Error ? err.message : "Kaydedilemedi."); } finally { setSaving(false); }
  }
  async function submitCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!category) return;
    const values = new FormData(e.currentTarget); setSaving(true);
    try { await saveCat({ data: { id: category.id, name: String(values.get("name")), position: Number(values.get("position")) } }); await refresh(); setCategory(null); toast.success("Kategori kaydedildi."); } catch { toast.error("Kategori kaydedilemedi."); } finally { setSaving(false); }
  }
  async function confirmDelete() {
    if (!deleting) return; setSaving(true);
    try { await remove({ data: deleting }); await refresh(); setDeleting(null); toast.success("Silindi."); } catch (err) { toast.error(err instanceof Error ? err.message : "Silinemedi."); } finally { setSaving(false); }
  }
  function downloadQr() {
    const svg = qr.current?.querySelector("svg"); if (!svg) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    const link = document.createElement("a"); link.href = url; link.download = "kahve-menu-qr.svg"; link.click(); URL.revokeObjectURL(url);
  }
  const products = data.items.filter((i) => (!filter || i.category_id === filter) && i.name.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));
  return <main className="dashboard min-h-screen lg:flex">
    <aside className="border-b border-border bg-card px-5 py-5 lg:fixed lg:inset-y-0 lg:w-60 lg:border-b-0 lg:border-r lg:py-8">
      <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Coffee/></div><div><p className="font-semibold">Kahve Menüsü</p><p className="text-xs text-muted-foreground">Yönetim paneli</p></div></div>
      <nav className="mt-6 flex gap-2 lg:mt-10 lg:flex-col">{tabs.map((t) => <Button key={t.id} variant={tab === t.id ? "secondary" : "ghost"} onClick={() => setTab(t.id)} className={`flex-1 justify-start lg:flex-none ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}><t.icon/>{t.label}</Button>)}</nav>
      <div className="mt-5 flex gap-2 lg:absolute lg:bottom-7 lg:left-5 lg:right-5 lg:flex-col"><Button variant="outline" asChild><Link to="/"><ExternalLink/>Menüyü görüntüle</Link></Button><Button variant="ghost" onClick={signout}><LogOut/>Çıkış yap</Button></div>
    </aside>
    <section className="min-w-0 flex-1 px-5 py-7 lg:ml-60 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-medium text-primary">MENÜ YÖNETİMİ</p><h1 className="mt-2 text-3xl font-semibold">{tabs.find((t) => t.id === tab)?.label}</h1></div><span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-success"/>Menü yayında</span></header>
        {!data.isAdmin && <div role="status" className="mt-6 flex gap-3 border-l-2 border-primary bg-primary/10 p-4 text-sm"><ShieldCheck className="size-5 shrink-0 text-primary"/><p>Hesabınızın yönetici yetkisi henüz yok. Menü düzenlemek için hesabınıza yetki verilmesi gerekiyor.</p></div>}
        <div className="my-8 grid grid-cols-3 gap-3 border-y border-border py-5">{[{ label: "Toplam ürün", value: data.items.length }, { label: "Kategori", value: data.categories.length }, { label: "Yayındaki ürün", value: data.items.filter((i) => i.available).length }].map((s) => <div key={s.label}><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-1 text-2xl font-semibold">{s.value}</p></div>)}</div>
        {tab === "items" && <>
          <div className="mb-5 flex flex-wrap gap-3"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3"><Search className="size-4 text-muted-foreground"/><input aria-label="Ürün ara" placeholder="Ürün ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 w-full bg-transparent py-2.5 text-sm outline-none"/></label><select aria-label="Kategori filtrele" value={filter} onChange={(e) => setFilter(e.target.value)} className={`${field} w-auto`}><option value="">Tüm kategoriler</option>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Button disabled={!data.isAdmin || !data.categories.length} onClick={() => setEditing({ available: true, image: "espresso", position: data.items.length + 1 })}><Plus/>Ürün ekle</Button></div>
          <div className="overflow-hidden rounded-lg border border-border"><div className="hidden grid-cols-[1fr_150px_110px_95px_85px] gap-3 bg-secondary px-5 py-3 text-xs text-muted-foreground md:grid"><span>ÜRÜN</span><span>KATEGORİ</span><span>FİYAT</span><span>DURUM</span><span className="text-right">İŞLEMLER</span></div>
            {products.map((i) => <article key={i.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-border bg-card p-4 first:border-t-0 md:grid-cols-[1fr_150px_110px_95px_85px] md:px-5">
              <div className="flex min-w-0 items-center gap-3"><img src={menuImage(i.image)} alt={i.name} className="size-12 shrink-0 rounded-md object-cover"/><div className="min-w-0"><h2 className="break-words text-sm font-medium">{i.name}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{i.description}</p><p className="mt-1 text-sm text-primary md:hidden">{i.price} Birr · {i.available ? "Yayında" : "Gizli"}</p></div></div>
              <span className="hidden text-xs text-muted-foreground md:block">{data.categories.find((c) => c.id === i.category_id)?.name}</span><div className="hidden text-sm md:block">{i.price} Birr{i.old_price && <p className="text-xs text-muted-foreground line-through">{i.old_price} Birr</p>}</div><span className={`hidden items-center gap-1 text-xs md:flex ${i.available ? "text-success" : "text-muted-foreground"}`}>{i.available ? <Eye className="size-3.5"/> : <EyeOff className="size-3.5"/>}{i.available ? "Yayında" : "Gizli"}</span>
              <div className="flex justify-end"><Button title="Ürünü düzenle" aria-label={`${i.name} düzenle`} variant="ghost" size="icon" disabled={!data.isAdmin} onClick={() => setEditing(i)}><Pencil/></Button><Button title="Ürünü sil" aria-label={`${i.name} sil`} variant="ghost" size="icon" disabled={!data.isAdmin} onClick={() => setDeleting({ id: i.id, kind: "item", name: i.name })}><Trash2 className="text-destructive"/></Button></div>
            </article>)}{!products.length && <p className="p-10 text-center text-sm text-muted-foreground">Ürün bulunamadı.</p>}
          </div>
        </>}
        {tab === "categories" && <><div className="mb-5 flex justify-end"><Button disabled={!data.isAdmin} onClick={() => setCategory({ position: data.categories.length + 1 })}><Plus/>Kategori ekle</Button></div><div className="grid gap-4 sm:grid-cols-2">{data.categories.map((c) => <article key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-5"><div><LayoutGrid className="mb-4 size-5 text-primary"/><h2 className="font-medium">{c.name}</h2><p className="mt-1 text-xs text-muted-foreground">{data.items.filter((i) => i.category_id === c.id).length} ürün · Sıra {c.position}</p></div><div className="flex"><Button title="Kategori düzenle" aria-label={`${c.name} düzenle`} variant="ghost" size="icon" disabled={!data.isAdmin} onClick={() => setCategory(c)}><Pencil/></Button><Button title="Kategori sil" aria-label={`${c.name} sil`} variant="ghost" size="icon" disabled={!data.isAdmin} onClick={() => setDeleting({ id: c.id, kind: "category", name: c.name })}><Trash2 className="text-destructive"/></Button></div></article>)}</div></>}
        {tab === "qr" && <div className="grid items-start gap-8 md:grid-cols-[320px_1fr]"><div className="qr-paper rounded-lg p-8 text-center"><Coffee className="mx-auto size-7"/><h2 className="mb-5 mt-3 text-xl font-medium">Kahve Menüsü</h2><div ref={qr} className="mx-auto w-fit"><QRCodeSVG value={menuUrl} size={232} marginSize={2} level="M"/></div><p className="mt-5 text-sm">Menü için okutun</p></div><div className="space-y-5 py-2"><h2 className="text-xl font-semibold">Menünüzün QR kodu</h2><div><p className="mb-2 text-xs text-muted-foreground">MENÜ BAĞLANTISI</p><p className="break-all rounded-md border border-border bg-card p-3 text-sm">{menuUrl}</p></div><div className="flex flex-wrap gap-3"><Button onClick={downloadQr}><Download/>QR kodu indir</Button><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(menuUrl); toast.success("Bağlantı kopyalandı."); } catch { toast.error("Bağlantı kopyalanamadı."); } }}><Copy/>Bağlantıyı kopyala</Button></div><Button variant="ghost" asChild><Link to="/"><ExternalLink/>Menüyü aç</Link></Button></div></div>}
      </div>
    </section>
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open && !saving) setEditing(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"><DialogTitle>{editing?.id ? "Ürünü düzenle" : "Yeni ürün"}</DialogTitle><DialogDescription>Ürün bilgileri</DialogDescription>{editing && <form onSubmit={submitItem} className="space-y-4"><label className="block space-y-1.5 text-sm"><span>Ürün adı</span><input className={field} name="name" required maxLength={120} defaultValue={editing.name}/></label><label className="block space-y-1.5 text-sm"><span>Kategori</span><select className={field} name="category_id" defaultValue={editing.category_id ?? data.categories[0]?.id}>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="space-y-1.5 text-sm"><span>Fiyat (Birr)</span><input className={field} type="number" step="0.01" min="0" name="price" required defaultValue={editing.price}/></label><label className="space-y-1.5 text-sm"><span>Eski fiyat (Birr)</span><input className={field} type="number" step="0.01" min="0" name="old_price" defaultValue={editing.old_price ?? ""}/></label></div><label className="block space-y-1.5 text-sm"><span>Açıklama</span><textarea className={field} name="description" maxLength={500} defaultValue={editing.description}/></label><div><p className="mb-2 text-sm">Fotoğraf</p><div className="flex gap-2">{Object.entries(menuImages).map(([key, image]) => <Button key={key} aria-label={`${key} fotoğrafı`} variant="ghost" className={`size-14 p-0 ${editing.image === key ? "ring-2 ring-primary" : ""}`} type="button" onClick={() => setEditing({ ...editing, image: key })}><img alt="" src={image} className="size-full rounded-md object-cover"/></Button>)}</div><label className="mt-3 block text-xs text-muted-foreground">Fotoğraf yükle<input aria-label="Fotoğraf yükle" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-xs" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2000000) { toast.error("Fotoğraf en fazla 2 MB olabilir."); return; } const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === "string") setEditing({ ...editing, image: reader.result }); }; reader.readAsDataURL(file); }}/></label>{editing.image && !menuImages[editing.image] && <img alt="Seçilen fotoğraf" src={menuImage(editing.image)} className="mt-2 size-16 rounded-md object-cover"/>}</div><div className="flex items-center justify-between gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="available" defaultChecked={editing.available}/>Menüde göster</label><label className="flex items-center gap-2 text-sm">Sıra<input className={`${field} w-20`} type="number" min="0" name="position" defaultValue={editing.position ?? 0}/></label></div><Button disabled={saving} className="w-full" type="submit"><Check/>{saving ? "Kaydediliyor..." : "Kaydet"}</Button></form>}</DialogContent></Dialog>
    <Dialog open={category !== null} onOpenChange={(open) => { if (!open && !saving) setCategory(null); }}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogTitle>{category?.id ? "Kategori düzenle" : "Yeni kategori"}</DialogTitle><DialogDescription>Kategori bilgileri</DialogDescription>{category && <form onSubmit={submitCategory} className="space-y-4"><label className="block space-y-2 text-sm">Kategori adı<input name="name" required maxLength={80} className={field} defaultValue={category.name}/></label><label className="block space-y-2 text-sm">Sıra<input name="position" type="number" min="0" required className={field} defaultValue={category.position}/></label><Button disabled={saving} className="w-full" type="submit"><Check/>Kaydet</Button></form>}</DialogContent></Dialog>
    <Dialog open={deleting !== null} onOpenChange={(open) => { if (!open && !saving) setDeleting(null); }}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogTitle>Silmek istiyor musunuz?</DialogTitle><DialogDescription>{deleting?.name} kalıcı olarak silinecek.</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleting(null)} disabled={saving}>Vazgeç</Button><Button variant="destructive" onClick={confirmDelete} disabled={saving}><Trash2/>Sil</Button></div></DialogContent></Dialog>
  </main>;
}
