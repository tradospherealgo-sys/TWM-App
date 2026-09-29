'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { Layers, CheckCircle2, XCircle, FileText } from 'lucide-react';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  requiredDocuments: string;
  configJson: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleProductActive(product: Product) {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          isActive: !product.isActive,
        }),
      });
      const data = await res.json();
      if (data.product) {
        setProducts(products.map((p) => (p.id === product.id ? data.product : p)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Approved Product Catalog</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure financial services, required document checklists &amp; active desks
        </p>
      </div>

      <StatusBanner
        type="regulatory"
        title="Compliance Boundary"
        message="Only approved products with verified regulatory arrangements (Authorised Person for SMC Global, licensed insurance facilitators, NBFC loan correspondents) may be activated in the catalog."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((prod) => {
          const reqDocs = JSON.parse(prod.requiredDocuments || '[]') as string[];

          return (
            <Card key={prod.id} className="p-4 space-y-3 bg-[#131C2E]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{prod.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">{prod.code}</div>
                </div>
                <button
                  onClick={() => toggleProductActive(prod)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                    prod.isActive
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {prod.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{prod.description}</p>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Required KYC &amp; Onboarding Documents:
                </span>
                <div className="flex flex-wrap gap-1">
                  {reqDocs.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
