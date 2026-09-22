import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { items, origin } = await req.json();
    if (!Array.isArray(items) || !items.length) throw new Error("Cart is empty.");

    const ids = items.map((x: { id: number }) => Number(x.id)).filter(Number.isInteger);
    const { data: products, error } = await supabaseAdmin.from("products").select("id,name,price,stock,status").in("id", ids);
    if (error) throw error;

    const byId = new Map((products ?? []).map((p) => [Number(p.id), p]));
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = byId.get(Number(item.id));
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      if (!product || product.status !== "Active") throw new Error("A product in your cart is no longer available.");
      if (quantity > Number(product.stock)) throw new Error(product.name + " does not have enough stock.");

      const unitAmount = Math.round(Number(product.price) * 100);
      subtotal += unitAmount * quantity;
      line_items.push({ quantity, price_data: { currency: "eur", unit_amount: unitAmount, product_data: { name: product.name } } });
    }

    const shipping = subtotal >= 5000 ? 0 : 499;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["SE", "DK", "NO", "FI", "DE", "NL", "FR"] },
      customer_creation: "always",
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shipping, currency: "eur" },
          display_name: shipping === 0 ? "Free shipping" : "Standard shipping",
        },
      }],
      success_url: (origin || "https://yazoniplay.is-a.dev") + "/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: (origin || "https://yazoniplay.is-a.dev") + "/catalog.html",
      metadata: { cart: JSON.stringify(items.map((x: { id: number; quantity: number }) => ({ id: Number(x.id), quantity: Math.floor(Number(x.quantity)) }))) },
    });

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Checkout failed." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
