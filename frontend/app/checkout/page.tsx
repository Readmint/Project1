"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { postJSON } from "@/lib/api";

export default function CheckoutPage() {
    const { cart, removeFromCart, totalAmount, clearCart } = useCart();
    const [loading, setLoading] = useState(false);

    // Simple form state for PayU params
    const [formData, setFormData] = useState({
        firstname: "",
        email: "",
        phone: ""
    });

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setLoading(true);

        try {
            // 1. Prepare Payload
            // productinfo in PayU is usually just a string description. 
            // We'll store Article IDs here for our webhook to parse.
            const productInfo = cart.map(i => i.id).join(',');

            const payload = {
                amount: totalAmount,
                productInfo: productInfo,
                firstname: formData.firstname,
                email: formData.email,
                phone: formData.phone
            };

            // 2. Call Backend to Initiate
            const res = await postJSON("/payment/initiate", payload);

            if (res.status === "success") {
                // 3. Auto-Submit Form to PayU
                const data = res.data;

                // Create a form dynamically
                const form = document.createElement("form");
                form.method = "POST";
                form.action = "https://test.payu.in/_payment"; // TEST URL - change to prod based on env
                // Note: PayU Test URL is https://test.payu.in/_payment
                // Prod URL is https://secure.payu.in/_payment

                // Append fields
                const fields: any = {
                    key: data.key,
                    txnid: data.txnid,
                    amount: data.amount,
                    productinfo: data.productInfo,
                    firstname: data.firstname,
                    email: data.email,
                    phone: data.phone,
                    surl: data.surl,
                    furl: data.furl,
                    hash: data.hash
                };

                for (const key in fields) {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = key;
                    input.value = fields[key];
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();

                // Clear cart immediately? 
                // Better to clear ONLY on success return, but localStorage persists.
                // For now, let's keep it until verified.
            } else {
                toast.error(res.message || "Payment initiation failed");
            }

        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid md:grid-cols-2 gap-8">

                {/* CART SUMMARY */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Order Summary</h2>
                    {cart.length === 0 ? (
                        <p className="text-muted-foreground">Your cart is empty.</p>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <div>
                                        <h3 className="font-medium">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.author}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold">${item.price.toFixed(2)}</span>
                                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-red-500">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-lg font-bold">
                                <span>Total</span>
                                <span>${totalAmount}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* CHECKOUT FORM */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <CreditCard className="text-indigo-600" /> Payment Details
                    </h2>

                    <form onSubmit={handlePayment} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstname">Full Name</Label>
                            <Input
                                id="firstname"
                                placeholder="John Doe"
                                required
                                value={formData.firstname}
                                onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="9999999999"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Required by payment gateway.</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-6"
                            disabled={loading || cart.length === 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
                                </>
                            ) : (
                                `Pay $${totalAmount}`
                            )}
                        </Button>
                    </form>
                </div>

            </div>
        </div>
    );
}
