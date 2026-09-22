import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, cryptoProvider);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return new Response(JSON.stringify({ received: true }));

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return new Response(JSON.stringify({ received: true }));

  const existing = await supabaseAdmin.from("orders").select("id").eq("stripe_session_id", session.id).maybeSingle();
  if (existing.data) return new Response(JSON.stringify({ received: true }));

  const cart = session.metadata?.cart ? JSON.parse(session.metadata.cart) : [];
  if (!Array.isArray(cart) || !cart.length) return new Response("Missing cart metadata", { status: 400 });

  const ids = cart.map((x: { id: number }) => Number(x.id));
  const { data: products, error: productsError } = await supabaseAdmin.from("products").select("id,name,price,stock,status").in("id", ids);
  if (productsError) throw productsError;

  const byId = new Map((products ?? []).map((p) => [Number(p.id), p]));
  for (const item of cart) {
    const product = byId.get(Number(item.id));
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (!product || product.status !== "Active" || quantity > Number(product.stock)) return new Response("Inventory mismatch", { status: 409 });
  }

  const subtotal = Number(session.amount_subtotal ?? 0) / 100;
  const total = Number(session.amount_total ?? 0) / 100;
  const shipping = Math.max(0, total - subtotal);

  const { data: order, error: orderError } = await supabaseAdmin.from("orders").insert({
    stripe_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    customer_email: session.customer_details?.email ?? null,
    currency: session.currency ?? "eur",
    subtotal, shipping, total, status: "paid"
  }).select("id").single();
  if (orderError) throw orderError;

  for (const item of cart) {
    const product = byId.get(Number(item.id));
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    await supabaseAdmin.from("order_items").insert({
      order_id: order.id, product_id: product.id, product_name: product.name, unit_price: product.price, quantity
    });
    await supabaseAdmin.from("products").update({ stock: Number(product.stock) - quantity, updated_at: new Date().toISOString() }).eq("id", product.id);
  }

  return new Response(JSON.stringify({ received: true }));
});
