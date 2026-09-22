(function(){
  const cfg=window.VELORA_CONFIG||{};
  let client=null;
  function configured(){return !!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase)}
  async function ensure(){
    if(client||!configured())return client;
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }
  async function products(){
    const sb=await ensure(); if(!sb)return null;
    const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
    if(error)throw error;
    return (data||[]).map(p=>({...p,image:(p.images&&p.images[0])||"",images:p.images||[]}));
  }
  async function saveProduct(product){
    const sb=await ensure(); if(!sb)throw new Error("Backend is not configured.");
    const row={name:product.name,price:Number(product.price),description:product.description||"",category:product.category||"Collection",stock:Math.max(0,Number(product.stock)||0),status:product.status||"Active",badge:product.badge||"None",featured:!!product.featured,images:product.images||[]};
    const normalize=p=>p?({...p,image:(p.images&&p.images[0])||"",images:Array.isArray(p.images)?p.images:[]}):p;
    if(product.id){
      const {data,error}=await sb.from("products").update(row).eq("id",product.id).select("*").single();
      if(error)throw error; return normalize(data);
    }
    const {data,error}=await sb.from("products").insert(row).select("*").single();
    if(error)throw error; return normalize(data);
  }
  async function deleteProduct(id){
    const sb=await ensure(); if(!sb)throw new Error("Backend is not configured.");
    const {error}=await sb.from("products").delete().eq("id",id); if(error)throw error;
  }
  async function uploadImage(file){
    const sb=await ensure(); if(!sb)throw new Error("Backend is not configured.");
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
    const path="products/"+crypto.randomUUID()+"."+ext;
    const {error}=await sb.storage.from("product-images").upload(path,file,{contentType:file.type||"image/jpeg",cacheControl:"31536000",upsert:false});
    if(error)throw error;
    const {data}=sb.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }
  async function login(email,password){
    const sb=await ensure(); if(!sb)throw new Error("Backend is not configured.");
    const {data,error}=await sb.auth.signInWithPassword({email,password}); if(error)throw error; return data;
  }
  async function logout(){if(client)await client.auth.signOut()}
  async function session(){const sb=await ensure();if(!sb)return null;const {data}=await sb.auth.getSession();return data.session}
  async function orders(){
    const sb=await ensure(); if(!sb)return null;
    const {data,error}=await sb.from("orders").select("id,customer_email,subtotal,shipping,total,status,created_at,order_items(*)").order("created_at",{ascending:false}).limit(50);
    if(error)throw error;
    return data||[];
  }
  async function checkout(items){
    const sb=await ensure();if(!sb)throw new Error("Backend is not configured.");
    const {data,error}=await sb.functions.invoke(cfg.checkoutFunction||"create-checkout",{body:{items,origin:location.origin}});
    if(error)throw error;
    if(!data?.url)throw new Error(data?.error||"Checkout could not be started.");
    location.href=data.url;
  }
  window.VeloraBackend={configured,products,saveProduct,deleteProduct,uploadImage,login,logout,session,orders,checkout};
})();