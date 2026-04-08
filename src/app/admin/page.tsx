"use client";

import { useEffect, useState } from "react";

interface Invitation {
  id: string;
  token: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export default function AdminPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  async function fetchInvitations() {
    const res = await fetch("/api/admin/invitations");
    if (res.ok) setInvitations(await res.json());
    setLoading(false);
  }

  async function handleCreate() {
    setCreating(true);
    const res = await fetch("/api/admin/invitations", { method: "POST" });
    if (res.ok) await fetchInvitations();
    setCreating(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/invitations?id=${id}`, { method: "DELETE" });
    await fetchInvitations();
  }

  function getLink(token: string) {
    return `${window.location.origin}/registro?token=${token}`;
  }

  function handleCopy(token: string) {
    navigator.clipboard.writeText(getLink(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function getStatus(inv: Invitation) {
    if (inv.used_at) return { label: "Usada", cls: "bg-olive/15 text-olive" };
    if (new Date(inv.expires_at) < new Date()) return { label: "Expirada", cls: "bg-red-100 text-red-600" };
    return { label: "Pendiente", cls: "bg-saffron/15 text-saffron" };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin</h1>
          <p className="mt-1 text-sm text-muted">Gestiona invitaciones de registro</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-50"
        >
          + Nueva invitacion
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-primary-light/20" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <p className="py-12 text-center text-muted">No hay invitaciones</p>
        ) : (
          invitations.map((inv) => {
            const status = getStatus(inv);
            return (
              <div
                key={inv.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                  {status.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-mono text-muted">
                    {inv.token.slice(0, 16)}...
                  </p>
                  <p className="text-[10px] text-muted">
                    Creada {new Date(inv.created_at).toLocaleDateString("es")} &middot; Expira {new Date(inv.expires_at).toLocaleDateString("es")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!inv.used_at && new Date(inv.expires_at) > new Date() && (
                    <button
                      onClick={() => handleCopy(inv.token)}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20"
                    >
                      {copied === inv.token ? "Copiado" : "Copiar enlace"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
