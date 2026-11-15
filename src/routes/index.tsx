import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Coffee, Heart, Search, SlidersHorizontal } from "lucide-react";
import espresso from "@/assets/espresso.jpg";
import flatwhite from "@/assets/flatwhite.jpg";
import icedlatte from "@/assets/icedlatte.jpg";
import frappe from "@/assets/frappe.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kahve Menüsü — Sıcak, Soğuk & Frappuccino" },
      { name: "description", content: "Espresso, flat white, buzlu latte ve frappuccino çeşitlerimizi keşfedin." },
      { property: "og:title", content: "Kahve Menüsü" },
      { property: "og:description", content: "Sıcak ve soğuk kahve menümüzü keşfedin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Menu,
});

type Item = { id: number; name: string; category: string; price: number; old?: number; img: string; desc: string };

const CATEGORIES = [
  { id: "all", label: "Tümü" },
  { id: "sicak", label: "Sıcak Kahve" },
  { id: "soguk", label: "Soğuk Kahve" },
  { id: "frappe", label: "Frappuccino" },
  { id: "mocha", label: "Mocha" },
];

const ITEMS: Item[] = [
  { id: 1, name: "Espresso", category: "sicak", price: 65, old: 80, img: espresso, desc: "Yoğun ve aromatik" },
  { id: 2, name: "Flat White", category: "sicak", price: 140, old: 170, img: flatwhite, desc: "İpeksi süt köpüğü" },
  { id: 3, name: "Cappuccino", category: "sicak", price: 120, img: flatwhite, desc: "Klasik İtalyan" },
  { id: 4, name: "Americano", category: "sicak", price: 90, img: espresso, desc: "Sıcak su ve espresso" },
  { id: 5, name: "Iced Latte", category: "soguk", price: 150, img: icedlatte, desc: "Buz, süt ve espresso" },
  { id: 6, name: "Cold Brew", category: "soguk", price: 160, img: icedlatte, desc: "18 saat demlenmiş" },
  { id: 7, name: "Karamel Frappuccino", category: "frappe", price: 190, old: 220, img: frappe, desc: "Karamel soslu" },
  { id: 8, name: "Vanilya Frappuccino", category: "frappe", price: 180, img: frappe, desc: "Kremalı vanilya" },
  { id: 9, name: "Mocha", category: "mocha", price: 160, img: flatwhite, desc: "Çikolata ve espresso" },
  { id: 10, name: "Iced Mocha", category: "mocha", price: 170, img: icedlatte, desc: "Buzlu çikolatalı" },
];

const SORTS = [
  { id: "default", label: "Önerilen" },
  { id: "asc", label: "Fiyat: Artan" },
  { id: "desc", label: "Fiyat: Azalan" },
];

function Menu() {
  const [category, setCategory] = useState("sicak");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("default");
  const [showSort, setShowSort] = useState(false);
  const [favs, setFavs] = useState<number[]>([]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = q
      ? ITEMS.filter((i) => (i.name + " " + i.desc).toLocaleLowerCase("tr").includes(q))
      : category === "all" ? ITEMS : ITEMS.filter((i) => i.category === category);
    if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [category, query, sort]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 pb-10">
      <header className="-mx-4 flex h-44 items-center justify-center rounded-b-3xl bg-cream">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cream-foreground/50 text-cream-foreground">
          <Coffee className="h-8 w-8" strokeWidth={1.25} />
        </div>
      </header>

      <nav className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setCategory(c.id); setQuery(""); }}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${category === c.id && !query ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {c.label}
          </button>
        ))}
      </nav>

      <div className="relative mt-4 flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-input px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kahve ara..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </label>
        <button aria-label="Sırala" onClick={() => setShowSort((s) => !s)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        {showSort && (
          <div className="absolute right-0 top-12 z-10 w-44 rounded-2xl bg-card p-2 shadow-xl">
            {SORTS.map((s) => (
              <button key={s.id} onClick={() => { setSort(s.id); setShowSort(false); }}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${sort === s.id ? "bg-secondary text-primary" : "text-card-foreground"}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Aradığınız kahve menüde yok.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4">
          {visible.map((item) => {
            const fav = favs.includes(item.id);
            return (
              <article key={item.id} className="rounded-3xl bg-card p-2.5">
                <div className="relative">
                  <img src={item.img} alt={item.name} loading="lazy" width={816} height={816}
                    className="aspect-square w-full rounded-2xl object-cover" />
                  <button aria-label="Favori"
                    onClick={() => setFavs((f) => fav ? f.filter((x) => x !== item.id) : [...f, item.id])}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-overlay text-foreground backdrop-blur">
                    <Heart className={`h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />
                  </button>
                </div>
                <div className="px-1.5 pb-1.5 pt-3">
                  <h3 className="truncate font-medium">{item.name}</h3>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="font-semibold text-primary">{item.price} Birr</span>
                    {item.old && <span className="text-xs text-muted-foreground line-through">{item.old} Birr</span>}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
