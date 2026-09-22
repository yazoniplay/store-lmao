const STORE_KEY="nova-products",CART_KEY="nova-cart";
const money=v=>"€"+Number(v||0).toFixed(2);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let products=[],cart=[];
try{products=JSON.parse(localStorage.getItem(STORE_KEY)||"[]");if(!Array.isArray(products))products=[];}catch{products=[]}
try{cart=JSON.parse(localStorage.getItem(CART_KEY)||"[]");if(!Array.isArray(cart))cart=[];}catch{cart=[]}
const activeProducts=()=>products.filter(p=>p.status!=="Draft");
const saveProducts=()=>localStorage.setItem(STORE_KEY,JSON.stringify(products));
const saveCart=()=>{localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart();};

function badge(p){return p.badge&&p.badge!=="None"?'<span class="product-badge">'+esc(p.badge)+"</span>":""}
function card(p){
 return '<article class="product-card" data-id="'+p.id+'"><a class="product-image" href="product.html?id='+encodeURIComponent(p.id)+'">'+badge(p)+'<img src="'+p.image+'" alt="'+esc(p.name)+'" loading="lazy"></a><div class="product-info"><a class="product-name" href="product.html?id='+encodeURIComponent(p.id)+'">'+esc(p.name)+'</a><span class="product-price">'+money(p.price)+'</span><span class="product-category">'+esc(p.category||"Collection")+'</span><button class="add-button" data-add="'+p.id+'" type="button">Add to bag</button></div></article>'
}
function renderProducts(list=activeProducts()){
 const grid=document.getElementById("productGrid"); if(!grid)return;
 grid.innerHTML=list.map(card).join("");
 const empty=document.getElementById("emptyHome"),catEmpty=document.getElementById("catalogEmpty");
 if(empty)empty.classList.toggle("visible",list.length===0);
 if(catEmpty)catEmpty.classList.toggle("visible",list.length===0);
 const count=document.getElementById("catalogCount"); if(count)count.textContent=list.length+" "+(list.length===1?"PRODUCT":"PRODUCTS");
 document.querySelectorAll("[data-add]").forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();add(Number(b.dataset.add));});
}
function add(id,qty=1){
 const p=activeProducts().find(x=>x.id===id);if(!p)return;
 const current=cart.find(x=>x.id===id);
 const next=(current?.quantity||0)+qty;
 if(p.stock!==undefined&&p.stock!==""&&next>Number(p.stock)){toast("Not enough stock available.");return}
 current?current.quantity=next:cart.push({id:p.id,quantity:qty});
 saveCart();openCart();toast("Added to bag");
}
function changeQty(id,delta){
 const item=cart.find(x=>x.id===id),p=activeProducts().find(x=>x.id===id);if(!item)return;
 const next=item.quantity+delta;
 if(next<=0){removeItem(id);return}
 if(p?.stock!==undefined&&p.stock!==""&&next>Number(p.stock)){toast("Only "+p.stock+" available.");return}
 item.quantity=next;saveCart();
}
function removeItem(id){cart=cart.filter(x=>x.id!==id);saveCart();toast("Removed from bag")}
function cartSubtotal(){return cart.reduce((s,x)=>{const p=products.find(y=>y.id===x.id);return s+(p?.price||0)*x.quantity},0)}
function shipping(){return cartSubtotal()===0||cartSubtotal()>=50?0:4.99}
function renderCart(){
 const items=document.getElementById("cartItems"),count=document.getElementById("cartCount"),total=document.getElementById("cartTotal"),sub=document.getElementById("cartSubtotal"),ship=document.getElementById("cartShipping");
 if(!items)return;
 cart=cart.filter(x=>products.some(p=>p.id===x.id&&p.status!=="Draft"));
 const qty=cart.reduce((s,x)=>s+x.quantity,0); if(count){count.textContent=qty;count.classList.toggle("bump",qty>0)}
 const subtotal=cartSubtotal(),shipCost=shipping();
 if(sub)sub.textContent=money(subtotal);if(ship)ship.textContent=shipCost===0?"Free":money(shipCost);if(total)total.textContent=money(subtotal+shipCost);
 items.innerHTML=cart.length?cart.map(x=>{const p=products.find(y=>y.id===x.id);return '<div class="cart-item"><img src="'+p.image+'" alt="'+esc(p.name)+'"><div class="cart-item-main"><strong>'+esc(p.name)+'</strong><span>'+money(p.price)+'</span><div class="qty-control"><button data-minus="'+p.id+'">−</button><b>'+x.quantity+'</b><button data-plus="'+p.id+'">+</button></div><button class="remove-item" data-remove="'+p.id+'">Remove</button></div><strong>'+money(p.price*x.quantity)+'</strong></div>'}).join(""):'<div class="cart-empty"><strong>Your bag is empty.</strong><span>Add something useful.</span></div>';
 document.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.minus),-1));
 document.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.plus),1));
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>removeItem(Number(b.dataset.remove)));
 saveCartSilently();
}
function saveCartSilently(){localStorage.setItem(CART_KEY,JSON.stringify(cart))}
function openCart(){document.getElementById("cartDrawer")?.classList.add("open");document.getElementById("overlay")?.classList.add("open");document.body.classList.add("drawer-open")}
function closeCart(){document.getElementById("cartDrawer")?.classList.remove("open");document.getElementById("overlay")?.classList.remove("open");document.body.classList.remove("drawer-open")}
function toast(message){let t=document.getElementById("veloraToast");if(!t){t=document.createElement("div");t.id="veloraToast";t.className="velora-toast";document.body.appendChild(t)}t.textContent=message;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2200)}
function checkout(){if(!cart.length){toast("Your bag is empty.");return}let m=document.getElementById("paymentProviderModal");if(!m){m=document.createElement("div");m.id="paymentProviderModal";m.className="payment-modal";m.innerHTML='<div class="payment-modal-backdrop" data-close-pay></div><div class="payment-dialog"><button class="payment-close" data-close-pay>×</button><p class="payment-eyebrow">VELORA / CHECKOUT</p><h2>Checkout setup needed.</h2><p>Your cart is ready. Connect a payment provider before launch to accept live orders.</p><button class="button button-dark full" data-close-pay>Close</button></div>';document.body.appendChild(m);m.querySelectorAll("[data-close-pay]").forEach(x=>x.onclick=()=>m.classList.remove("open"))}m.classList.add("open")}
function setupGlobal(){
 document.getElementById("cartButton")?.addEventListener("click",openCart);
 document.getElementById("closeCart")?.addEventListener("click",closeCart);
 document.getElementById("overlay")?.addEventListener("click",closeCart);
 document.getElementById("checkoutButton")?.addEventListener("click",checkout);
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCart()});
 renderCart();
}
function setupCatalog(){
 const input=document.getElementById("productSearch"),tabs=document.querySelectorAll("[data-filter]");
 let filter="all";
 const categories=[...new Set(activeProducts().map(p=>p.category).filter(Boolean))];
 const wrap=document.getElementById("categoryFilters");
 if(wrap&&categories.length)wrap.innerHTML='<button class="filter active" data-filter="all">All</button>'+categories.map(c=>'<button class="filter" data-filter="'+esc(c)+'">'+esc(c)+'</button>').join("");
 function apply(){
  const q=(input?.value||"").trim().toLowerCase();
  let list=activeProducts();
  if(filter==="new")list=list.filter(p=>p.badge==="New"||p.isNew);
  else if(filter==="best")list=list.filter(p=>p.badge==="Best Seller"||p.bestSeller);
  else if(filter!=="all")list=list.filter(p=>p.category===filter);
  if(q)list=list.filter(p=>(p.name+" "+(p.description||"")+" "+(p.category||"")).toLowerCase().includes(q));
  renderProducts(list);
  const no=document.getElementById("noResults");if(no)no.classList.toggle("visible",list.length===0);
 }
 tabs.forEach(b=>b.onclick=()=>{tabs.forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;apply()});
 document.getElementById("categoryFilters")?.addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;document.querySelectorAll("#categoryFilters .filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;apply()});
 input?.addEventListener("input",apply);apply();
}
function setupProduct(){
 const root=document.getElementById("productDetail");if(!root)return;
 const id=Number(new URLSearchParams(location.search).get("id")),p=activeProducts().find(x=>x.id===id);
 if(!p){root.innerHTML='<div class="product-not-found"><p class="eyebrow">PRODUCT NOT FOUND</p><h1>That product has<br>moved on.</h1><a class="button button-dark" href="catalog.html">Back to shop</a></div>';return}
 document.title=p.name+" — Velora";
 const related=activeProducts().filter(x=>x.id!==p.id&&(x.category===p.category||x.badge==="Best Seller")).slice(0,4);
 root.innerHTML='<div class="product-gallery"><div class="gallery-main">'+badge(p)+'<img id="mainProductImage" src="'+p.image+'" alt="'+esc(p.name)+'"></div><div class="gallery-thumbs"><button class="gallery-thumb active"><img src="'+p.image+'" alt=""></button></div></div><div class="product-detail-copy"><a class="back-link" href="catalog.html">← Back to shop</a><p class="eyebrow">'+esc(p.category||"VELORA / COLLECTION")+'</p><h1>'+esc(p.name)+'</h1><div class="detail-price">'+money(p.price)+'</div><p class="stock-line">'+(p.stock===0?"Out of stock":p.stock!==undefined&&p.stock!==""?(p.stock+" in stock"):"Available now")+'</p><p class="detail-description">'+esc(p.description||"Designed to make everyday life a little easier.")+'</p><div class="detail-buy"><div class="detail-quantity"><button id="detailMinus">−</button><span id="detailQty">1</span><button id="detailPlus">+</button></div><button class="button button-dark" id="detailAdd">Add to cart</button><button class="button button-light" id="buyNow">Buy now</button></div><div class="detail-meta"><span>✓ Carefully selected</span><span>✓ Secure checkout</span><span>✓ Easy returns</span></div></div><section class="related-products"><div class="section-heading"><div><p class="eyebrow">YOU MAY ALSO LIKE</p><h2>Related products.</h2></div></div><div class="product-grid">'+related.map(card).join("")+'</div></section>';
 let q=1;const qEl=document.getElementById("detailQty");document.getElementById("detailMinus").onclick=()=>{q=Math.max(1,q-1);qEl.textContent=q};document.getElementById("detailPlus").onclick=()=>{const max=p.stock??9999;q=Math.min(max||1,q+1);qEl.textContent=q};document.getElementById("detailAdd").onclick=()=>add(p.id,q);document.getElementById("buyNow").onclick=()=>{add(p.id,q);openCart()};document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(Number(b.dataset.add)));
}
setupGlobal();setupCatalog();setupProduct();
