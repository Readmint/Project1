"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Clock,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  MapPin,
  Undo2,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

export default function BillingPage() {
  const [billingAddress, setBillingAddress] = useState({
    name: "Aditya Sharma",
    street: "221B Baker Street",
    city: "Delhi",
    state: "Delhi",
    zip: "110001",
    country: "India",
  });

  const [editAddress, setEditAddress] = useState(false);

  const orders = [
    { id: 1, date: "Feb 21, 2025", amount: "₹199", status: "Paid", invoice: true },
    { id: 2, date: "Jan 21, 2025", amount: "₹199", status: "Paid", invoice: true },
    { id: 3, date: "Dec 21, 2024", amount: "₹199", status: "Paid", invoice: false },
  ];

  const issuesPurchased = [
    { id: "ISS-001", title: "January Tech Special", date: "Jan 05, 2025", amount: "₹49" },
    { id: "ISS-002", title: "Green Planet Edition", date: "Feb 01, 2025", amount: "₹39" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-4xl mx-auto"
    >
      <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-600">
        <CreditCard size={20} /> Billing & Orders
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        View your payment history, invoices, and purchased magazine issues.
      </p>

      {/* DOWNLOAD STATEMENT */}
      <div className="flex justify-end mb-4">
        <Button className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-1.5 flex items-center gap-1">
          <Download size={14} /> Download Full Statement (PDF)
        </Button>
      </div>

      {/* BILLING ADDRESS */}
      <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-800 mb-8">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin size={14} /> Billing Address
          </h3>

          {!editAddress ? (
            <div className="space-y-1 text-xs">
              <p>{billingAddress.name}</p>
              <p>{billingAddress.street}</p>
              <p>
                {billingAddress.city}, {billingAddress.state} - {billingAddress.zip}
              </p>
              <p>{billingAddress.country}</p>

              <Button
                onClick={() => setEditAddress(true)}
                className="mt-3 text-xs bg-indigo-600 text-white rounded-full px-4 py-1.5"
              >
                Edit Address
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {Object.keys(billingAddress).map((key) => (
                <input
                  key={key}
                  className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border"
                  value={(billingAddress as any)[key]}
                  onChange={(e) =>
                    setBillingAddress((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              ))}

              <div className="flex gap-2 pt-2">
                <Button
                  className="bg-green-600 text-white rounded-full text-xs px-4 py-1.5"
                  onClick={() => setEditAddress(false)}
                >
                  Save
                </Button>

                <Button
                  variant="outline"
                  className="text-xs rounded-full px-4 py-1.5"
                  onClick={() => setEditAddress(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ORDER HISTORY */}
      <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-800 mb-8">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <FileText size={14} /> Billing History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Refund</th>
                  <th className="p-2 text-right">Invoice</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2">{order.date}</td>
                    <td className="p-2">{order.amount}</td>
                    <td className="p-2">
                      {order.status === "Paid" ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={12} /> Paid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle size={12} /> Failed
                        </span>
                      )}
                    </td>

                    {/* Refund Request */}
                    <td className="p-2">
                      <Button
                        variant="outline"
                        className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full"
                      >
                        <Undo2 size={12} /> Request Refund
                      </Button>
                    </td>

                    {/* Invoice */}
                    <td className="p-2 text-right">
                      {order.invoice ? (
                        <Button
                          variant="outline"
                          className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full"
                        >
                          <Download size={12} /> Invoice
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ISSUES PURCHASED */}
      <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-800">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <BookOpen size={14} /> Purchased Issues
          </h3>

          {issuesPurchased.length === 0 ? (
            <p className="text-xs text-slate-500">You haven't purchased any issues yet.</p>
          ) : (
            <div className="space-y-3">
              {issuesPurchased.map((issue) => (
                <div
                  key={issue.id}
                  className="flex justify-between items-center p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border text-xs"
                >
                  <div>
                    <p className="font-semibold">{issue.title}</p>
                    <p className="text-slate-500">{issue.date}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{issue.amount}</p>
                    <Button
                      variant="outline"
                      className="text-[10px] mt-1 rounded-full px-3 py-1.5"
                    >
                      Read Issue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
