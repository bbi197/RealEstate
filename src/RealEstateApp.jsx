\
        import React, { useState, useMemo, useEffect } from "react";

        // RealEstateApp.jsx
        // Single-file React app (Tailwind CSS classes) designed to be deployed to Netlify.
        // Features:
        // - Responsive listing grid with image carousel
        // - Advanced filters (price range, beds, baths, property type)
        // - Full-text search + sorting
        // - Map view (Mapbox placeholder: set REACT_APP_MAPBOX_TOKEN to enable)
        // - Listing detail modal and Netlify contact form for lead capture
        // - Save favorites (localStorage), CSV export, pagination
        // - Accessible, production-minded structure (no external libs required)

        // ---------- Mock dataset ----------
        const MOCK_LISTINGS = Array.from({ length: 24 }).map((_, i) => ({
          id: `L-${1000 + i}`,
          title: [
            "Modern 2BR apartment in Kilimani",
            "Spacious family home near CBD",
            "Stylish studio — perfect for students",
            "Renovated 3BR townhouse with garden",
          ][i % 4],
          price: Math.round((6 + (i % 10)) * 10000),
          beds: (i % 4) + 1,
          baths: (i % 3) + 1,
          type: ["Apartment", "House", "Studio", "Townhouse"][i % 4],
          sqft: 500 + (i % 10) * 120,
          address: [
            "Kilimani, Nairobi",
            "Westlands, Nairobi",
            "Langata, Nairobi",
            "Karen, Nairobi",
          ][i % 4],
          images: [
            `https://picsum.photos/seed/${i}-1/800/600`,
            `https://picsum.photos/seed/${i}-2/800/600`,
            `https://picsum.photos/seed/${i}-3/800/600`,
          ],
          lat: -1.2921 + (i % 5) * 0.01,
          lng: 36.8219 + (i % 5) * 0.01,
          description:
            "Beautiful property with excellent natural light, modern finishes, and convenient access to transport and amenities.",
        }));

        // ---------- Small helpers ----------
        function currency(n) {
          return (n ?? 0).toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 });
        }

        function saveToLocal(key, value) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            console.warn("localStorage failed", e);
          }
        }

        function loadFromLocal(key, fallback) {
          try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
          } catch (e) {
            return fallback;
          }
        }

        // ---------- Main component ----------
        export default function RealEstateApp() {
          const [listings] = useState(MOCK_LISTINGS);

          // UI state
          const [query, setQuery] = useState("");
          const [typeFilter, setTypeFilter] = useState("Any");
          const [minPrice, setMinPrice] = useState(0);
          const [maxPrice, setMaxPrice] = useState(1_000_0000);
          const [beds, setBeds] = useState(0);
          const [sortBy, setSortBy] = useState("relevance");
          const [selected, setSelected] = useState(null);
          const [favorites, setFavorites] = useState(() => loadFromLocal("rs:favs", []));
          const [page, setPage] = useState(1);
          const PAGE_SIZE = 8;
          const [mapView, setMapView] = useState(false);

          useEffect(() => saveToLocal("rs:favs", favorites), [favorites]);

          // Filters + search
          const filtered = useMemo(() => {
            const q = query.trim().toLowerCase();
            let out = listings.filter((l) => {
              if (typeFilter !== "Any" && l.type !== typeFilter) return false;
              if (l.price < minPrice || l.price > maxPrice) return false;
              if (beds && l.beds < beds) return false;
              if (!q) return true;
              // full text search across title, address, description
              return [l.title, l.address, l.description].some((str) => str.toLowerCase().includes(q));
            });

            // sorting
            if (sortBy === "price-asc") out = out.sort((a, b) => a.price - b.price);
            else if (sortBy === "price-desc") out = out.sort((a, b) => b.price - a.price);
            else if (sortBy === "beds") out = out.sort((a, b) => b.beds - a.beds);

            return out;
          }, [listings, query, typeFilter, minPrice, maxPrice, beds, sortBy]);

          const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);

          const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

          // favorites
          function toggleFav(id) {
            setFavorites((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
          }

          function exportCSV() {
            const rows = [
              ["id", "title", "price", "beds", "baths", "type", "address"],
              ...filtered.map((l) => [l.id, l.title, l.price, l.beds, l.baths, l.type, l.address]),
            ];
            const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "listings.csv";
            a.click();
            URL.revokeObjectURL(url);
          }

          // Netlify form handler (progressive enhancement) — form name 'lead-contact'
          function ContactForm({ listing }) {
            return (
              <form
                name="lead-contact"
                method="POST"
                data-netlify="true"
                onSubmit={(e) => {
                  /* netlify handles submit; we still close modal for UX */
                  setTimeout(() => setSelected(null), 600);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="form-name" value="lead-contact" />
                <input type="hidden" name="listing-id" value={listing?.id} />
                <div>
                  <label className="text-sm">Your name</label>
                  <input name="name" required className="w-full mt-1 input" />
                </div>
                <div>
                  <label className="text-sm">Phone or email</label>
                  <input name="contact" required className="w-full mt-1 input" />
                </div>
                <div>
                  <label className="text-sm">Message</label>
                  <textarea name="message" rows={3} className="w-full mt-1 input">{`I'm interested in ${listing?.title} (${listing?.id})`}</textarea>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">Send inquiry</button>
                  <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>Close</button>
                </div>
              </form>
            );
          }

          return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-gray-800">
              <header className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Nairobi Realty — Advanced Listings</h1>
                  <p className="text-sm text-gray-600 mt-1">Fast, searchable property listings ready for Netlify deployment.</p>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setMapView((s) => !s)}
                    className="px-3 py-2 border rounded shadow-sm bg-white hover:bg-gray-100"
                  >
                    {mapView ? "Hide map" : "Show map"}
                  </button>
                  <button onClick={exportCSV} className="px-3 py-2 border rounded shadow-sm bg-white hover:bg-gray-100">Export CSV</button>
                  <div className="px-3 py-2 bg-white rounded shadow-sm">Saved: {favorites.length}</div>
                </div>
              </header>

              <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters */}
                <aside className="col-span-1 bg-white p-4 rounded shadow-sm">
                  <h2 className="font-semibold mb-3">Filters</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm">Search</label>
                      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search by title, area..." className="w-full mt-1 input" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm">Min price (KES)</label>
                        <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value || 0))} className="w-full mt-1 input" />
                      </div>
                      <div>
                        <label className="text-sm">Max price (KES)</label>
                        <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value || 10000000))} className="w-full mt-1 input" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm">Type</label>
                      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full mt-1 input">
                        <option>Any</option>
                        <option>Apartment</option>
                        <option>House</option>
                        <option>Studio</option>
                        <option>Townhouse</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm">Min beds</label>
                      <select value={beds} onChange={(e) => setBeds(Number(e.target.value))} className="w-full mt-1 input">
                        <option value={0}>Any</option>
                        <option value={1}>1+</option>
                        <option value={2}>2+</option>
                        <option value={3}>3+</option>
                        <option value={4}>4+</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm">Sort</label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full mt-1 input">
                        <option value="relevance">Relevance</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="beds">Most beds</option>
                      </select>
                    </div>
                  </div>
                </aside>

                {/* Listings */}
                <section className="col-span-1 lg:col-span-3">
                  {mapView && (
                    <div className="mb-4 h-64 rounded overflow-hidden shadow-sm bg-gray-200">
                      {/* Mapbox embed if token present - replace with your own component or Mapbox GL */}
                      {process.env.REACT_APP_MAPBOX_TOKEN ? (
                        <iframe
                          title="map"
                          src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11.html?title=copy&access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">Map placeholder — set REACT_APP_MAPBOX_TOKEN to enable interactive map</div>
                      )}
                    </div>
                  )}

                  <div className="bg-white p-4 rounded shadow-sm mb-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">Showing <strong>{filtered.length}</strong> results</div>
                    <div className="flex gap-2 items-center">
                      <div className="text-sm text-gray-600">Page</div>
                      <input type="number" min={1} max={totalPages} value={page} onChange={(e) => setPage(Number(e.target.value || 1))} className="w-16 input" />
                      <div className="text-sm text-gray-500">/ {totalPages}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pageItems.map((l) => (
                      <article key={l.id} className="bg-white rounded shadow hover:shadow-md overflow-hidden">
                        <div className="relative">
                          <img src={l.images[0]} alt={l.title} className="w-full h-44 object-cover" />
                          <button
                            onClick={() => toggleFav(l.id)}
                            aria-label="Save favorite"
                            className={`absolute top-3 right-3 p-2 rounded-full shadow ${favorites.includes(l.id) ? "bg-yellow-300" : "bg-white"}`}
                          >
                            ★
                          </button>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{l.title}</h3>
                            <div className="text-sm text-gray-600">{currency(l.price)}</div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{l.address} • {l.sqft} sqft</div>
                          <div className="flex gap-2 text-xs text-gray-600 mt-3">
                            <div className="px-2 py-1 bg-gray-100 rounded">{l.beds} beds</div>
                            <div className="px-2 py-1 bg-gray-100 rounded">{l.baths} baths</div>
                            <div className="px-2 py-1 bg-gray-100 rounded">{l.type}</div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button onClick={() => setSelected(l)} className="btn-primary flex-1">View</button>
                            <a className="btn-ghost" href={`mailto:agent@realty.example?subject=Interest in ${l.id}&body=I%20am%20interested%20in%20${encodeURIComponent(l.title)}`}>
                              Contact
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* pagination controls */}
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 bg-white rounded border">Prev</button>
                    <div className="px-3 py-2 bg-white rounded">{page} / {totalPages}</div>
                    <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-2 bg-white rounded border">Next</button>
                  </div>
                </section>
              </main>

              {/* Floating favorites panel */}
              <div className="fixed bottom-6 right-6 w-80 max-w-[90vw]">
                <div className="bg-white rounded shadow p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold">Saved properties</div>
                    <div className="text-xs text-gray-500">{favorites.length}</div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {favorites.length === 0 && <div className="text-sm text-gray-500">No saved items yet</div>}
                    {favorites.map((id) => {
                      const l = listings.find((x) => x.id === id);
                      if (!l) return null;
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <img src={l.images[0]} className="w-12 h-8 object-cover rounded" />
                          <div className="flex-1 text-sm">{l.title} <div className="text-xs text-gray-500">{currency(l.price)}</div></div>
                          <button className="text-sm text-red-500" onClick={() => toggleFav(id)}>Remove</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detail modal */}
              {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded max-w-4xl w-full p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      {/* simple image carousel */}
                      <div className="relative">
                        <img src={selected.images[0]} alt="primary" className="w-full h-72 object-cover rounded" />
                        <div className="flex gap-2 mt-2">
                          {selected.images.map((src, idx) => (
                            <img key={idx} src={src} onClick={(e) => { e.currentTarget.parentElement.previousSibling.src = src; }} className="w-20 h-14 object-cover rounded cursor-pointer" />
                          ))}
                        </div>
                      </div>
                      <div className="mt-3">
                        <h3 className="text-xl font-semibold">{selected.title}</h3>
                        <div className="text-sm text-gray-600">{selected.address}</div>
                        <div className="text-lg font-bold mt-1">{currency(selected.price)}</div>
                        <p className="mt-2 text-sm text-gray-700">{selected.description}</p>

                        <div className="mt-3 flex gap-2">
                          <button className="btn-primary" onClick={() => { navigator.clipboard?.writeText(window.location.href); }}>Share link</button>
                          <button className="btn-ghost" onClick={() => toggleFav(selected.id)}>{favorites.includes(selected.id) ? "Unsave" : "Save"}</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Quick facts</div>
                        <ul className="mt-2 text-sm space-y-1">
                          <li><strong>ID:</strong> {selected.id}</li>
                          <li><strong>Beds:</strong> {selected.beds}</li>
                          <li><strong>Baths:</strong> {selected.baths}</li>
                          <li><strong>Area:</strong> {selected.sqft} sqft</li>
                        </ul>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Contact agent</h4>
                        <ContactForm listing={selected} />
                        <div className="mt-3 text-xs text-gray-500">Or call +254 700 000000</div>
                      </div>

                    </div>

                    <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-white bg-gray-800/60 px-3 py-1 rounded">Close</button>
                  </div>
                </div>
              )}

              {/* tiny styles to mimic component library */}
              <style>{`
                .input{ padding:0.5rem; border:1px solid #e5e7eb; border-radius:0.375rem }
                .btn-primary{ background:#0ea5a4; color:white; padding:0.5rem 0.75rem; border-radius:0.375rem }
                .btn-ghost{ background:transparent; border:1px solid #e5e7eb; padding:0.5rem 0.75rem; border-radius:0.375rem }
              `}</style>

            </div>
          );
        }
