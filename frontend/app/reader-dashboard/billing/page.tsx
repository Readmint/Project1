"use client";

import { useState, useEffect } from "react";
import { getJSON } from "@/lib/api";
import { Loader2, Receipt, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface Order {
  id: string; // article_id
  title: string;
  author_name: string;
  purchased_at: string;
  price?: number; // Not always returned by getLibrary currently, might need update if we want exact price paid
}

export default function BillingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // Reusing library endpoint as it returns purchases. 
      // Ideally should be a dedicated /orders endpoint with amount paid.
      // For now, assuming price is on article metadata or we just show "Purchased"
      const res = await getJSON("/reader/library");
      if (res.status === "success") {
        setOrders(res.data);
      }
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Receipt className="text-indigo-600" /> Billing & Orders
      </h1>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id + order.purchased_at}>
                  <TableCell className="font-medium text-xs text-slate-500">
                    {new Date(order.purchased_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold">{order.title}</TableCell>
                  <TableCell className="text-slate-500">{order.author_name}</TableCell>
                  <TableCell>
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Paid</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="text-xs flex items-center gap-1 ml-auto text-slate-500 hover:text-indigo-600">
                      <Download size={12} /> Invoice
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 text-slate-500">
            No purchase history found.
          </div>
        )}
      </Card>
    </div>
  );
}
