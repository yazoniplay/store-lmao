const DEFAULT_PRODUCTS=[];
let products=[];
try{products=JSON.parse(localStorage.getItem("nova-products")||"[]");if(!Array.isArray(products))products=[];}catch(e){products=[];}
let cart=[];try{cart=JSON.parse(localStorage.getItem("nova-cart")||"[]");if(!Array.isArray(cart))cart=[];}catch(e){cart=[];}
const grid=document.getElementById("productGrid"),drawer=document.getElementById("cartDrawer"),items=document.getElementById("cartItems"),count=document.getElementById("cartCount"),total=document.getElementById("cartTotal"),money=v=>"€"+Number(v).toFixed(2);
function save(){localStorage.setItem("nova-cart",JSON.stringify(cart));renderCart()}
function renderProducts(){
 if(!grid)return;
 grid.innerHTML=products.map((p,i)=>'<article class="product-card" data-id="'+p.id+'" style="animation-delay:'+Math.min(i,8)*.05+'s"><div class="product-image"><img src="'+p.image+'" alt="'+String(p.name).replace(/"/g,"&quot;")+'" loading="lazy"></div><div class="product-info"><p class="product-name">'+p.name+'</p><span class="product-price">'+money(p.price)+'</span><button class="add-button" data-id="'+p.id+'" type="button">Add to bag</button></div></article>').join("");
 document.querySelectorAll(".product-card").forEach(card=>card.addEventListener("click",e=>{if(e.target.closest(".add-button"))return;location.href="product.html?id="+encodeURIComponent(card.dataset.id)}));
 document.querySelectorAll(".add-button").forEach(b=>b.addEventListener("click",()=>add(Number(b.dataset.id))));
 const homeEmpty=document.getElementById("emptyHome"),catalogEmpty=document.getElementById("catalogEmpty"),catalogCount=document.getElementById("catalogCount");
 if(homeEmpty)homeEmpty.classList.toggle("visible",products.length===0);
 if(catalogEmpty)catalogEmpty.classList.toggle("visible",products.length===0);
 if(catalogCount)catalogCount.textContent=products.length+(products.length===1?" PRODUCT":" PRODUCTS");
}
function add(id){const p=products.find(x=>x.id===id);if(!p)return;const e=cart.find(x=>x.id===id);e?e.quantity++:cart.push({...p,quantity:1});save();open()}
function renderCart(){
 if(!count||!items||!total)return;
 count.textContent=cart.reduce((s,x)=>s+x.quantity,0);
 total.textContent=money(cart.reduce((s,x)=>s+x.price*x.quantity,0));
 items.innerHTML=cart.length?cart.map(x=>'<div class="cart-item"><img src="'+x.image+'" alt=""><div><p class="cart-item-name">'+x.name+'</p><span class="cart-item-meta">'+x.quantity+" × "+money(x.price)+'</span><br><button class="remove-item" data-id="'+x.id+'">Remove</button></div><strong>'+money(x.price*x.quantity)+'</strong></div>').join(""):'<p class="cart-empty">Your bag is empty.</p>';
 document.querySelectorAll(".remove-item").forEach(b=>b.onclick=()=>{cart=cart.filter(x=>x.id!==Number(b.dataset.id));save()});
}
function open(){drawer?.classList.add("open");document.getElementById("overlay")?.classList.add("open")}
function close(){drawer?.classList.remove("open");document.getElementById("overlay")?.classList.remove("open")}
document.getElementById("cartButton")?.addEventListener("click",open);document.getElementById("closeCart")?.addEventListener("click",close);document.getElementById("overlay")?.addEventListener("click",close);
function showPaymentModal(){let m=document.getElementById("paymentProviderModal");if(!m){m=document.createElement("div");m.id="paymentProviderModal";m.className="payment-modal";m.innerHTML='<div class="payment-modal-backdrop" data-close-payment></div><div class="payment-dialog" role="dialog" aria-modal="true"><button class="payment-close" type="button" data-close-payment>×</button><p class="payment-eyebrow">CHECKOUT</p><div class="payment-icon">+</div><h2>Checkout isn't connected yet.</h2><p>Connect a payment provider before launch to start accepting orders.</p><div class="payment-actions"><button type="button" class="button button-dark payment-ok" data-close-payment>Got it</button></div></div>';document.body.appendChild(m);m.querySelectorAll("[data-close-payment]").forEach(x=>x.addEventListener("click",closePaymentModal))}requestAnimationFrame(()=>m.classList.add("open"))}
function closePaymentModal(){document.getElementById("paymentProviderModal")?.classList.remove("open")}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closePaymentModal();close()}});
document.getElementById("checkoutButton")?.addEventListener("click",showPaymentModal);
renderProducts();renderCart();