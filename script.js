const products=[
{id:1,name:"Everyday Carry Organizer",price:29.99,image:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82"},
{id:2,name:"Minimal Desk Lamp",price:39.99,image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82"},
{id:3,name:"Travel Essentials Bag",price:24.99,image:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82"},
{id:4,name:"Daily Water Bottle",price:22.99,image:"https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=82"},
{id:5,name:"Compact Tech Stand",price:19.99,image:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=82"},
{id:6,name:"Home Storage Tray",price:17.99,image:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=82"}];
let cart=JSON.parse(localStorage.getItem("nova-cart")||"[]");
const productGrid=document.getElementById("productGrid"),cartButton=document.getElementById("cartButton"),cartDrawer=document.getElementById("cartDrawer"),closeCart=document.getElementById("closeCart"),overlay=document.getElementById("overlay"),cartItems=document.getElementById("cartItems"),cartCount=document.getElementById("cartCount"),cartTotal=document.getElementById("cartTotal");
const money=value=>"€"+value.toFixed(2);
function renderProducts(){productGrid.innerHTML=products.map(p=>'<article class="product-card"><div class="product-image"><img src="'+p.image+'" alt="'+p.name+'" loading="lazy"></div><div class="product-info"><p class="product-name">'+p.name+'</p><span class="product-price">'+money(p.price)+'</span><button class="add-button" data-id="'+p.id+'">Add to cart</button></div></article>').join("");document.querySelectorAll(".add-button").forEach(b=>b.addEventListener("click",()=>addToCart(Number(b.dataset.id))))}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;const e=cart.find(x=>x.id===id);if(e)e.quantity++;else cart.push({...p,quantity:1});saveCart();openCart()}
function removeFromCart(id){cart=cart.filter(x=>x.id!==id);saveCart()}
function saveCart(){localStorage.setItem("nova-cart",JSON.stringify(cart));renderCart()}
function renderCart(){const count=cart.reduce((s,x)=>s+x.quantity,0),total=cart.reduce((s,x)=>s+x.price*x.quantity,0);cartCount.textContent=count;cartTotal.textContent=money(total);if(!cart.length){cartItems.innerHTML='<p class="cart-empty">Your cart is empty.</p>';return}cartItems.innerHTML=cart.map(x=>'<div class="cart-item"><img src="'+x.image+'" alt=""><div><p class="cart-item-name">'+x.name+'</p><span class="cart-item-meta">'+x.quantity+" × "+money(x.price)+'</span><br><button class="remove-item" data-id="'+x.id+'">Remove</button></div><strong>'+money(x.price*x.quantity)+'</strong></div>').join("");document.querySelectorAll(".remove-item").forEach(b=>b.addEventListener("click",()=>removeFromCart(Number(b.dataset.id))))}
function openCart(){cartDrawer.classList.add("open");overlay.classList.add("open");cartDrawer.setAttribute("aria-hidden","false")}
function closeCartDrawer(){cartDrawer.classList.remove("open");overlay.classList.remove("open");cartDrawer.setAttribute("aria-hidden","true")}
cartButton.addEventListener("click",openCart);closeCart.addEventListener("click",closeCartDrawer);overlay.addEventListener("click",closeCartDrawer);
document.getElementById("checkoutButton").addEventListener("click",()=>alert("Connect your payment provider here before launching."));
renderProducts();renderCart();