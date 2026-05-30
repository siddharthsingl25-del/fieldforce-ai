const storageKey = "fieldforce-mobile-demo";
const authStorageKey = "fieldforce-mobile-auth";
const supabaseUrl = "https://uywrkixlytrcepuextiq.supabase.co";
const supabaseKey = "sb_publishable_Mu7SoauvKLHuka9L5ZamVQ_8SJHs_1y";
const cloudEnabled = Boolean(supabaseUrl && supabaseKey);

const mobileTitles = {
  "m-home": "Today",
  "m-beat": "Beat Plan",
  "m-outlet-detail": "Outlet Info",
  "m-visit": "Visit",
  "m-customers": "Customers",
  "m-products": "Products",
  "m-order": "Order",
  "m-rewards": "Rewards",
  "m-ai": "AI Assistant"
};

const defaultState = {
  loggedIn: false,
  name: "Riya Sharma",
  role: "MR",
  checkedIn: false,
  visits: [],
  orders: [],
  customers: [],
  products: [],
  outletSessions: [],
  beatPlans: [],
  promotions: [],
  announcements: []
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadAuthSession() {
  const saved = localStorage.getItem(authStorageKey);
  return saved ? JSON.parse(saved) : null;
}

function saveAuthSession(session) {
  localStorage.setItem(authStorageKey, JSON.stringify(session));
}

let state = loadState();
let authSession = loadAuthSession();
let orderSearch = "";
let orderCartItems = [];
let activeOutletSession = null;
let outletTimer = null;
let selectedVisitPhotos = [];
let outletFilter = "pending";
let selectedOutletCustomer = null;

function cloudHeaders(extra = {}) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${authSession?.access_token || supabaseKey}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function signInWithPassword(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

async function loadProfile(userId) {
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: cloudHeaders()
  });

  if (!response.ok) throw new Error("Profile not found");
  const profiles = await response.json();
  if (!profiles.length) throw new Error("Profile not found");
  return profiles[0];
}

async function cloudSelect(table) {
  if (!cloudEnabled) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=created_at.desc`, {
    headers: cloudHeaders()
  });

  if (!response.ok) throw new Error(`Cloud select failed: ${table}`);
  return response.json();
}

async function optionalCloudSelect(table) {
  try {
    return (await cloudSelect(table)) || [];
  } catch {
    return [];
  }
}

async function cloudInsert(table, payload) {
  if (!cloudEnabled) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: cloudHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Cloud insert failed: ${table}`);
  return response.json();
}

async function cloudUpdate(table, id, payload) {
  if (!cloudEnabled) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: cloudHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Cloud update failed: ${table}`);
  return response.json();
}

async function uploadVisitPhoto(file, visitId, index) {
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${authSession.user.id}/${visitId}/${Date.now()}-${index}.${safeExtension}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/visit-photos/${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${authSession?.access_token || supabaseKey}`,
      "Content-Type": file.type || "image/jpeg",
      "x-upsert": "true"
    },
    body: file
  });

  if (!response.ok) throw new Error("Photo upload failed");
  return {
    storage_path: path,
    photo_url: `${supabaseUrl}/storage/v1/object/authenticated/visit-photos/${path}`
  };
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function currentTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatLocation(location) {
  return `${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}`;
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location permission is required to check in"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => reject(new Error("Location permission is required to check in")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function minutesBetween(start, end = new Date()) {
  return Math.max(0, Math.round((end.getTime() - new Date(start).getTime()) / 60000));
}

function showMobileView(viewId) {
  document.querySelectorAll(".mobile-view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  document.querySelectorAll(".bottom-nav button, .drawer-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mobileView === viewId);
  });

  document.getElementById("mobileTitle").textContent = mobileTitles[viewId] || "FieldForce AI";
  closeDrawer();
}

function renderUser() {
  document.body.classList.toggle("locked", !authSession || !state.loggedIn);
  document.getElementById("welcomeName").textContent = `Good morning, ${state.name.split(" ")[0] || "User"}`;
  document.getElementById("userRoleLabel").textContent = `${state.role} | FieldForce AI`;
  document.getElementById("drawerUserName").textContent = state.name || "Field User";
  document.getElementById("drawerUserRole").textContent = `${state.role || "MR"} | SPC Healthcare`;
}

function openDrawer() {
  document.body.classList.add("drawer-open");
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
}

function logoutMobileUser() {
  authSession = null;
  state.loggedIn = false;
  saveState();
  localStorage.removeItem(authStorageKey);
  closeDrawer();
  renderUser();
}

function renderCheckIn() {
  const button = document.getElementById("checkButton");
  button.classList.toggle("checked", state.checkedIn);
  button.textContent = state.checkedIn ? "Checked In - Tracking On" : "GPS Check In";
}

function renderHistory() {
  const history = [
    ...state.visits.map((visit) => ({
      title: visit.outcome,
      text: `${visit.customer} | ${visit.time}`
    })),
    ...(state.outletSessions || []).map((session) => ({
      title: `Outlet ${session.durationMinutes || session.duration_minutes || 0} min`,
      text: `${session.customer} | ${session.kmTravelled || session.km_travelled || 0} km`
    })),
    ...state.orders.map((order) => ({
      title: `Order booked ${money(order.total)}`,
      text: `${order.customer} | ${order.time}`
    }))
  ].slice(-5).reverse();

  document.getElementById("historyCount").textContent = `${history.length} saved`;
  document.getElementById("historyList").innerHTML = history.length
    ? history.map((item) => `<div class="history-item"><strong>${item.title}</strong><span>${item.text}</span></div>`).join("")
    : `<div class="history-item"><strong>No activity saved yet</strong><span>Submit a visit or book an order.</span></div>`;
}

function renderFollowUps() {
  const list = document.getElementById("mobileFollowUpList");
  const count = document.getElementById("followUpCount");
  if (!list || !count) return;

  const today = new Date().toISOString().slice(0, 10);
  const dueItems = (state.visits || [])
    .filter((visit) => visit.followUpDate && visit.followUpDate <= today)
    .slice()
    .reverse();

  count.textContent = `${dueItems.length} due`;
  list.innerHTML = dueItems.length
    ? dueItems
        .map((visit) => `<div class="master-item"><strong>${visit.customer}</strong><span>${visit.followUpDate} | ${visit.notes || visit.outcome}</span></div>`)
        .join("")
    : `<div class="master-item"><strong>No follow-ups due</strong><span>Pending follow-up visits will appear here.</span></div>`;
}

function renderVisitPhotoPreview() {
  const preview = document.getElementById("visitPhotoPreview");
  const status = document.getElementById("visitPhotoStatus");
  if (!preview || !status) return;

  preview.innerHTML = selectedVisitPhotos.map((file) => `<img src="${URL.createObjectURL(file)}" alt="Visit photo preview" />`).join("");
  status.textContent = selectedVisitPhotos.length ? `${selectedVisitPhotos.length} photo(s) attached` : "No photos attached";
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function markPlannedVisitDone(customerName) {
  const plan = (state.beatPlans || []).find((item) => {
    return item.customer === customerName && (item.planned_date || todayDate()) === todayDate() && item.status !== "Visited";
  });
  if (!plan?.id) return;

  await cloudUpdate("beat_plans", plan.id, {
    status: "Visited",
    notes: `Visited by ${state.name} at ${currentTime()}`
  });

  state.beatPlans = state.beatPlans.map((item) => (item.id === plan.id ? { ...item, status: "Visited" } : item));
  saveState();
  renderBeatPlans(state.beatPlans);
}

function renderOutletStats() {
  const status = document.getElementById("outletSessionStatus");
  const minutes = document.getElementById("outletMinutes");
  const kmTotal = document.getElementById("outletKmTotal");
  if (!status || !minutes || !kmTotal) return;

  const sessions = state.outletSessions || [];
  const totalKm = sessions.reduce((sum, item) => sum + Number(item.kmTravelled || item.km_travelled || 0), 0);
  kmTotal.textContent = `${totalKm.toFixed(1)} km`;

  if (!activeOutletSession) {
    status.textContent = "No active outlet";
    minutes.textContent = "0 min";
    return;
  }

  const elapsed = minutesBetween(activeOutletSession.startedAt);
  status.textContent = `${activeOutletSession.customer} active`;
  minutes.textContent = `${elapsed} min`;
}

function renderCustomers() {
  const customerList = document.getElementById("customerList");
  const query = document.getElementById("mobileCustomerSearch")?.value?.toLowerCase() || "";
  const assignedNames = new Set((state.beatPlans || []).map((plan) => plan.customer).filter(Boolean));
  const baseCustomers = assignedNames.size
    ? [
        ...state.customers.filter((customer) => assignedNames.has(customer.name)),
        ...state.customers.filter((customer) => !assignedNames.has(customer.name))
      ]
    : state.customers;
  const customers = query
    ? baseCustomers.filter((customer) => [customer.name, customer.type, customer.area, customer.customerClass, customer.customer_class, customer.specialty, customer.mobile].join(" ").toLowerCase().includes(query))
    : baseCustomers;
  document.getElementById("customerCount").textContent = `${state.customers.length} saved`;

  customerList.innerHTML = customers.length
    ? customers
        .slice()
        .reverse()
        .map((customer) => {
          return `
            <div class="master-item">
              <strong>${customer.name}</strong>
              <span>${assignedNames.has(customer.name) ? "Today's beat | " : ""}${customer.type} | ${customer.customerClass || customer.customer_class || "-"} | ${customer.area || "No area"}</span>
              <span>${customer.specialty || "No specialty"} | Mobile: ${customer.mobile || "-"}</span>
              <span>Outstanding: ${money(customer.outstanding)}</span>
            </div>
          `;
        })
        .join("")
    : `<div class="master-item"><strong>No customers added</strong><span>Add doctors, retailers, distributors, stockists, or FMCG outlets.</span></div>`;
}

function renderProducts() {
  const productList = document.getElementById("productList");
  const query = document.getElementById("mobileProductSearch")?.value?.toLowerCase() || "";
  const products = query
    ? state.products.filter((product) => [product.name, product.composition, product.category, product.pack, product.scheme, product.mrp, product.saleRate, product.sale_rate].join(" ").toLowerCase().includes(query))
    : state.products;
  const stockTotal = state.products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const schemeTotal = state.products.filter((product) => product.scheme).length;
  document.getElementById("productCount").textContent = `${state.products.length} products`;
  document.getElementById("mobileProductStock").textContent = stockTotal;
  document.getElementById("mobileProductSchemes").textContent = schemeTotal;

  productList.innerHTML = products.length
    ? products
        .slice()
        .reverse()
        .map((product) => {
          return `
            <div class="master-item">
              <strong>${product.name}</strong>
              <span>${product.composition || "No composition"} | ${product.category || "No category"}</span>
              <span>MRP: ${money(product.mrp)} | Sale: ${money(product.saleRate || product.sale_rate)} | Stock: ${product.stock}</span>
              <span>Scheme: ${product.scheme || "No scheme"}</span>
            </div>
          `;
        })
        .join("")
    : `<div class="master-item"><strong>No products synced yet</strong><span>Admin can create products from the web panel. Then refresh mobile.</span></div>`;
}

function renderCustomerDropdowns() {
  const assignedNames = new Set((state.beatPlans || []).map((plan) => plan.customer).filter(Boolean));
  const customers = assignedNames.size
    ? state.customers.filter((customer) => assignedNames.has(customer.name))
    : state.customers;
  const options = customers.length
    ? customers.map((customer) => `<option value="${customer.name}">${customer.name} - ${customer.type || "Customer"}</option>`).join("")
    : `<option value="Shiv Medicos">Shiv Medicos - Demo Retailer</option>`;

  const visitSelect = document.getElementById("visitCustomerSelect");
  const orderSelect = document.getElementById("orderCustomerSelect");
  if (visitSelect) visitSelect.innerHTML = options;
  if (orderSelect) orderSelect.innerHTML = options;
  updateSelectedVisitCustomer();
}

function updateSelectedVisitCustomer() {
  const selectedName = document.getElementById("visitCustomerSelect")?.value || "Shiv Medicos";
  const customer = state.customers.find((item) => item.name === selectedName);
  document.getElementById("selectedVisitCustomerName").textContent = selectedName;
  document.getElementById("selectedVisitCustomerMeta").textContent = customer
    ? `${customer.customerClass || customer.customer_class || "-"} | ${customer.type || "Customer"} | ${customer.area || "No area"}`
    : "Demo retailer | Add customers in Customer Master";
}

function renderOrderProducts() {
  const target = document.getElementById("orderProductRows");
  if (!target) return;
  const query = orderSearch.toLowerCase();
  const products = state.products.length
    ? state.products
    : [
        { name: "CardioMax", saleRate: 148, composition: "Demo composition", scheme: "Stock available" },
        { name: "VitaPlus", saleRate: 220, composition: "Demo composition", scheme: "Buy 10 get 2 free" },
        { name: "GlucoSafe", saleRate: 156, composition: "Demo composition", scheme: "AI suggested reorder" }
      ];
  const visibleProducts = query
    ? products.filter((product) => [product.name, product.composition, product.category, product.scheme].join(" ").toLowerCase().includes(query))
    : products;

  target.innerHTML = visibleProducts.length
    ? visibleProducts
        .map((product) => {
          const price = Number(product.saleRate || product.sale_rate || product.mrp || 0);
          const productId = product.id || "";
          return `
            <div class="sku-row">
              <div><strong>${product.name}</strong><span>${product.composition || "No composition"} | Rate ${money(price)} | ${product.scheme || "No scheme"}</span></div>
              <input class="qty-input" type="number" value="0" min="0" data-price="${price}" data-product="${product.name}" data-product-id="${productId}" />
              <button class="line-action add-order-item" data-product="${product.name}" data-product-id="${productId}" data-price="${price}">Add</button>
            </div>
          `;
        })
        .join("")
    : `<div class="master-item"><strong>No product found</strong><span>Ask admin to add this product in Product Master.</span></div>`;

  document.querySelectorAll(".add-order-item").forEach((button) => {
    button.addEventListener("click", () => addOrderItem(button));
  });
  renderOrderTotal();
}

function getBeatOutlets() {
  const planned = (state.beatPlans || []).map((plan, index) => {
    const customer = state.customers.find((item) => item.name === plan.customer) || {};
    return {
      id: plan.id || `${plan.customer}-${index}`,
      planId: plan.id,
      sequence: plan.sequence_no || index + 1,
      name: plan.customer || plan.title || "Outlet",
      type: customer.type || "Retailer",
      area: plan.area || customer.area || "",
      customerClass: customer.customerClass || customer.customer_class || "-",
      mobile: customer.mobile || "",
      outstanding: customer.outstanding || 0,
      lastVisited: customer.last_visited || plan.last_visited || plan.planned_date || "",
      status: plan.status || "Planned"
    };
  });

  if (planned.length) return planned.sort((a, b) => Number(a.sequence) - Number(b.sequence));

  return (state.customers || []).map((customer, index) => ({
    id: customer.id || customer.name || index,
    sequence: index + 1,
    name: customer.name,
    type: customer.type || "Retailer",
    area: customer.area || "",
    customerClass: customer.customerClass || customer.customer_class || "-",
    mobile: customer.mobile || "",
    outstanding: customer.outstanding || 0,
    lastVisited: customer.last_visited || "",
    status: "Planned"
  }));
}

function isOutletDone(outlet) {
  return ["visited", "done", "completed"].includes(String(outlet.status || "").toLowerCase());
}

function renderBeatPlans(plans = state.beatPlans || []) {
  const list = document.getElementById("cloudBeatList");
  const summary = document.getElementById("beatSummary");
  if (!list) return;

  state.beatPlans = plans || [];
  const outlets = getBeatOutlets();
  const pending = outlets.filter((outlet) => !isOutletDone(outlet));
  const completed = outlets.filter(isOutletDone);
  const visible = outletFilter === "completed" ? completed : outletFilter === "all" ? outlets : pending;

  document.getElementById("outletDateLabel").textContent = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  document.getElementById("outletUserLabel").textContent = state.name || "MR";
  document.getElementById("pendingOutletCount").textContent = `(${pending.length})`;
  document.getElementById("completedOutletCount").textContent = `(${completed.length})`;
  document.getElementById("allOutletCount").textContent = `(${outlets.length})`;
  if (summary) {
    summary.textContent = outlets.length
      ? `${pending.length} pending, ${completed.length} completed | ${new Set(outlets.map((outlet) => outlet.area).filter(Boolean)).size} areas`
      : "Admin se beat plan create karo. Yahan MR ke outlets start honge.";
  }

  list.innerHTML = visible.length
    ? visible
        .map((outlet) => `
          <article class="outlet-card">
            <div class="outlet-card-main">
              <div class="outlet-thumb">▦</div>
              <div>
                <span class="call-status">${isOutletDone(outlet) ? "Completed" : "Not Started"}</span>
                <strong>${outlet.name}</strong>
                <small>ID: ${outlet.sequence || "-"}</small>
                <p>Last Visited: ${outlet.lastVisited || "-"}</p>
              </div>
              <span class="pin-status ${isOutletDone(outlet) ? "done" : ""}">●</span>
              <button class="info-button" data-outlet-info="${outlet.name}" type="button">i</button>
            </div>
            <div class="outlet-card-actions">
              <button data-outlet-more="${outlet.name}" type="button">More Actions</button>
              <button data-outlet-start="${outlet.name}" type="button">Start Call</button>
            </div>
          </article>
        `)
        .join("")
    : `<div class="master-item"><strong>No outlets here</strong><span>${outletFilter === "pending" ? "Pending beat clear hai." : "No data in this tab."}</span></div>`;

  document.querySelectorAll("[data-outlet-more], [data-outlet-info]").forEach((button) => {
    button.addEventListener("click", () => openOutletDetail(button.dataset.outletMore || button.dataset.outletInfo));
  });
  document.querySelectorAll("[data-outlet-start]").forEach((button) => {
    button.addEventListener("click", () => startOutletCall(button.dataset.outletStart));
  });
}

function selectCustomerForWork(customerName) {
  const visitSelect = document.getElementById("visitCustomerSelect");
  const orderSelect = document.getElementById("orderCustomerSelect");
  if (visitSelect) visitSelect.value = customerName;
  if (orderSelect) orderSelect.value = customerName;
  updateSelectedVisitCustomer();
}

function openOutletDetail(customerName) {
  const outlet = getBeatOutlets().find((item) => item.name === customerName);
  const customer = state.customers.find((item) => item.name === customerName) || {};
  if (!outlet && !customer.name) return toast("Outlet not found");

  selectedOutletCustomer = outlet || customer;
  selectCustomerForWork(customerName);
  document.getElementById("outletDetailName").textContent = customerName;
  document.getElementById("outletDetailMeta").textContent = `Owner: ${customer.owner || "-"} | ${outlet?.area || customer.area || "No area"}`;
  document.getElementById("outletDetailType").textContent = (outlet?.type || customer.type || "Retailer").toUpperCase();
  document.getElementById("outletDetailOutstanding").textContent = money(outlet?.outstanding || customer.outstanding || 0);
  showMobileView("m-outlet-detail");
}

async function startOutletCall(customerName) {
  selectCustomerForWork(customerName);
  showMobileView("m-visit");
  document.getElementById("startOutletButton")?.click();
}

function renderTasks(tasks = []) {
  const list = document.getElementById("mobileTaskList");
  const count = document.getElementById("taskCount");
  if (!list || !count) return;

  count.textContent = `${tasks.filter((task) => task.status !== "Done").length} open`;
  list.innerHTML = tasks.length
    ? tasks
        .map((task) => `<div class="master-item"><strong>${task.title}</strong><span>${task.priority || "Normal"} | Due: ${task.due_date || "-"}</span><span>Status: ${task.status || "Open"}</span></div>`)
        .join("")
    : `<div class="master-item"><strong>No tasks assigned</strong><span>Follow-ups and announcements will appear here.</span></div>`;
}

function renderSchemes(schemes = []) {
  const list = document.getElementById("mobileSchemeList");
  const count = document.getElementById("mobileSchemeCount");
  if (!list || !count) return;

  count.textContent = `${schemes.length} active`;
  list.innerHTML = schemes.length
    ? schemes
        .map((scheme) => `<div class="master-item"><strong>${scheme.title}</strong><span>${scheme.scheme_type || "Scheme"} | ${scheme.product || "All products"}</span><span>${scheme.rule_text || "-"}</span></div>`)
        .join("")
    : `<div class="master-item"><strong>No active schemes</strong><span>Product schemes will appear here.</span></div>`;
}

function renderPromotions(promotions = state.promotions || []) {
  const list = document.getElementById("mobilePromotionList");
  const count = document.getElementById("promotionCount");
  if (!list || !count) return;

  count.textContent = `${promotions.length} active`;
  list.innerHTML = promotions.length
    ? promotions.map((item) => `<div class="master-item"><strong>${item.title}</strong><span>${item.campaign_type || "Campaign"} | ${item.product || "All products"}</span><span>${item.notes || item.content_url || "Open content from admin link"}</span></div>`).join("")
    : `<div class="master-item"><strong>No campaign yet</strong><span>Focus products, training, PDFs, and videos will appear here.</span></div>`;
}

function renderAnnouncements(announcements = state.announcements || []) {
  const list = document.getElementById("mobileAnnouncementList");
  const count = document.getElementById("announcementCount");
  if (!list || !count) return;

  count.textContent = `${announcements.length} new`;
  list.innerHTML = announcements.length
    ? announcements.slice(0, 4).map((item) => `<div class="master-item"><strong>${item.title}</strong><span>${item.priority || "Normal"} | ${item.audience || "All users"}</span><span>${item.message || "-"}</span></div>`).join("")
    : `<div class="master-item"><strong>No announcement</strong><span>Admin circulars and training messages will appear here.</span></div>`;
}

function calculateOrderTotal() {
  return orderCartItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
}

function renderOrderItems() {
  const list = document.getElementById("orderItemList");
  const count = document.getElementById("orderItemCount");
  if (!list || !count) return;

  count.textContent = `${orderCartItems.length} items`;
  list.innerHTML = orderCartItems.length
    ? orderCartItems
        .map((item, index) => `
          <div class="master-item">
            <strong>${item.productName}</strong>
            <span>Qty ${item.quantity} x ${money(item.rate)} = ${money(item.lineTotal)}</span>
            <button class="line-action remove" data-remove-order-item="${index}">Remove</button>
          </div>
        `)
        .join("")
    : `<div class="master-item"><strong>No products added</strong><span>Enter quantity and tap Add.</span></div>`;

  document.querySelectorAll("[data-remove-order-item]").forEach((button) => {
    button.addEventListener("click", () => {
      orderCartItems.splice(Number(button.dataset.removeOrderItem), 1);
      renderOrderItems();
      renderOrderTotal();
    });
  });
}

function renderOrderTotal() {
  document.getElementById("orderTotal").textContent = money(calculateOrderTotal());
  renderOrderItems();
}

function addOrderItem(button) {
  const row = button.closest(".sku-row");
  const input = row?.querySelector(".qty-input");
  const quantity = Number(input?.value || 0);
  const rate = Number(button.dataset.price || 0);

  if (!quantity) {
    toast("Enter quantity first");
    return;
  }

  orderCartItems.push({
    productId: button.dataset.productId || null,
    productName: button.dataset.product,
    quantity,
    rate,
    lineTotal: quantity * rate
  });

  if (input) input.value = "0";
  renderOrderItems();
  renderOrderTotal();
  toast("Product added to order");
}

function toast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  document.querySelector(".mobile-app").appendChild(item);

  setTimeout(() => item.remove(), 2200);
}

function clearCustomerForm() {
  document.getElementById("customerName").value = "";
  document.getElementById("customerMobile").value = "";
  document.getElementById("customerArea").value = "";
  document.getElementById("customerSpecialty").value = "";
  document.getElementById("customerOutstanding").value = "0";
  document.getElementById("customerAddress").value = "";
}

async function syncFromCloud() {
  if (!cloudEnabled) return;

  try {
    const [customers, products, visits, orders, outletSessions] = await Promise.all([
      cloudSelect("customers"),
      cloudSelect("products"),
      cloudSelect("visits"),
      cloudSelect("orders"),
      optionalCloudSelect("outlet_sessions")
    ]);
    const [beatPlans, tasks, schemes, promotions, announcements] = await Promise.all([
      cloudSelect("beat_plans"),
      cloudSelect("tasks"),
      cloudSelect("schemes"),
      optionalCloudSelect("promotions"),
      optionalCloudSelect("announcements")
    ]);

    state.customers = customers.map((customer) => ({
      ...customer,
      customerClass: customer.customer_class
    }));
    state.products = products.map((product) => ({
      ...product,
      saleRate: product.sale_rate
    }));
    state.visits = visits.map((visit) => ({
      customer: visit.customer,
      outcome: visit.outcome,
      notes: visit.notes,
      time: visit.visit_time || new Date(visit.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      followUpDate: visit.follow_up_date,
      photoUrls: visit.photo_urls || []
    }));
    state.orders = orders.map((order) => ({
      customer: order.customer,
      total: order.total,
      time: order.order_time || new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    }));
    state.outletSessions = outletSessions.map((session) => ({
      customer: session.customer,
      area: session.area,
      checkInTime: session.check_in_time,
      checkOutTime: session.check_out_time,
      durationMinutes: session.duration_minutes,
      kmTravelled: session.km_travelled,
      outcome: session.outcome,
      notes: session.notes
    }));

    const currentUser = (state.name || "").toLowerCase();
    state.promotions = promotions || [];
    state.announcements = announcements || [];
    state.beatPlans = (beatPlans || []).filter((plan) => !plan.assigned_to || (plan.assigned_to || "").toLowerCase() === currentUser);
    const assignedAreas = new Set(state.beatPlans.map((plan) => plan.area).filter(Boolean));
    const assignedCustomers = new Set(state.beatPlans.map((plan) => plan.customer).filter(Boolean));
    if (state.beatPlans.length) {
      state.customers = state.customers.filter((customer) => assignedCustomers.has(customer.name) || assignedAreas.has(customer.area));
    }
    const assignedTasks = (tasks || []).filter((task) => !task.assigned_to || (task.assigned_to || "").toLowerCase() === currentUser);
    saveState();
    renderHistory();
    renderFollowUps();
    renderOutletStats();
    renderCustomers();
    renderProducts();
    renderCustomerDropdowns();
    renderOrderProducts();
    renderBeatPlans(state.beatPlans);
    renderTasks(assignedTasks);
    renderSchemes(schemes || []);
    renderPromotions(state.promotions);
    renderAnnouncements(state.announcements);
  } catch (error) {
    toast("Cloud setup pending. Using local save.");
  }
}

document.querySelectorAll(".bottom-nav button").forEach((button) => {
  button.addEventListener("click", () => showMobileView(button.dataset.mobileView));
});

document.querySelectorAll(".drawer-nav button, .drawer-footer button[data-mobile-view]").forEach((button) => {
  button.addEventListener("click", () => showMobileView(button.dataset.mobileView));
});

document.getElementById("drawerOpenButton")?.addEventListener("click", openDrawer);
document.getElementById("drawerCloseButton")?.addEventListener("click", closeDrawer);
document.getElementById("drawerBackdrop")?.addEventListener("click", closeDrawer);
document.getElementById("mobileLogoutButton")?.addEventListener("click", logoutMobileUser);

document.querySelectorAll("[data-jump-view]").forEach((button) => {
  button.addEventListener("click", () => showMobileView(button.dataset.jumpView));
});

document.querySelectorAll("[data-outlet-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    outletFilter = button.dataset.outletFilter;
    document.querySelectorAll("[data-outlet-filter]").forEach((item) => item.classList.toggle("active", item.dataset.outletFilter === outletFilter));
    renderBeatPlans();
  });
});

document.getElementById("backToOutletList")?.addEventListener("click", () => showMobileView("m-beat"));
document.getElementById("detailStartCallButton")?.addEventListener("click", () => {
  const name = selectedOutletCustomer?.name || document.getElementById("outletDetailName")?.textContent;
  if (name) startOutletCall(name);
});
document.getElementById("orderOnPhoneButton")?.addEventListener("click", () => {
  const name = selectedOutletCustomer?.name || document.getElementById("outletDetailName")?.textContent;
  if (name) selectCustomerForWork(name);
  showMobileView("m-order");
});
document.getElementById("outletTransactionsButton")?.addEventListener("click", () => showMobileView("m-order"));
document.getElementById("outletSchemesButton")?.addEventListener("click", () => showMobileView("m-order"));

document.getElementById("loginButton").addEventListener("click", async () => {
  const status = document.getElementById("loginStatus");
  const email = document.getElementById("loginEmailInput").value.trim();
  const password = document.getElementById("loginPasswordInput").value;

  try {
    if (status) status.textContent = "Logging in...";
    authSession = await signInWithPassword(email, password);
    saveAuthSession(authSession);
    const profile = await loadProfile(authSession.user.id);
    if (profile.status === "inactive") throw new Error("Inactive account");
    state.loggedIn = true;
    state.name = profile.full_name;
    state.role = profile.role;
    saveState();
    renderUser();
    await syncFromCloud();
    toast("Login successful");
  } catch (error) {
    authSession = null;
    localStorage.removeItem(authStorageKey);
    if (status) status.textContent = error.message === "Inactive account" ? "Account inactive. Contact admin." : "Login failed. Check email/password or profile.";
  }
});

document.getElementById("checkButton").addEventListener("click", async () => {
  let location;
  try {
    location = await getCurrentLocation();
  } catch {
    toast("Location permission is required to check in");
    return;
  }

  state.checkedIn = !state.checkedIn;
  saveState();
  renderCheckIn();
  const status = state.checkedIn ? "Checked In" : "Checked Out";
  const locationStatus = document.getElementById("attendanceLocationStatus");
  if (locationStatus) locationStatus.textContent = `location captured ✓ ${formatLocation(location)}`;

  cloudInsert("attendance", {
    user_name: state.name,
    role: state.role,
    status,
    attendance_time: currentTime(),
    latitude: location.latitude,
    longitude: location.longitude
  })
    .then(() => toast(`${status} saved to cloud`))
    .catch(() => toast(state.checkedIn ? "Attendance checked in" : "Checked out"));
});

document.getElementById("startOutletButton")?.addEventListener("click", async () => {
  if (!state.checkedIn) {
    toast("Pehle GPS attendance check-in karo");
    return;
  }

  let location;
  try {
    location = await getCurrentLocation();
  } catch {
    toast("Location permission is required to check in");
    return;
  }

  const customerName = document.getElementById("visitCustomerSelect")?.value || "Shiv Medicos";
  const customer = state.customers.find((item) => item.name === customerName);
  activeOutletSession = {
    customer: customerName,
    area: customer?.area || "",
    startedAt: new Date().toISOString(),
    checkInTime: currentTime(),
    checkInLatitude: location.latitude,
    checkInLongitude: location.longitude
  };

  if (outletTimer) clearInterval(outletTimer);
  outletTimer = setInterval(renderOutletStats, 30000);
  renderOutletStats();
  const outletLocationStatus = document.getElementById("outletLocationStatus");
  if (outletLocationStatus) outletLocationStatus.textContent = `check-in location captured ✓ ${formatLocation(location)}`;
  toast("Outlet check-in started");
});

document.getElementById("checkoutOutletButton")?.addEventListener("click", async () => {
  if (!activeOutletSession) {
    toast("Pehle outlet check-in start karo");
    return;
  }

  let location;
  try {
    location = await getCurrentLocation();
  } catch {
    toast("Location permission is required to check in");
    return;
  }

  const durationMinutes = minutesBetween(activeOutletSession.startedAt);
  const kmTravelled = Number(document.getElementById("outletKmInput")?.value || 0);
  const session = {
    customer: activeOutletSession.customer,
    area: activeOutletSession.area,
    checkInTime: activeOutletSession.checkInTime,
    checkOutTime: currentTime(),
    checkInLatitude: activeOutletSession.checkInLatitude,
    checkInLongitude: activeOutletSession.checkInLongitude,
    checkOutLatitude: location.latitude,
    checkOutLongitude: location.longitude,
    durationMinutes,
    kmTravelled,
    outcome: document.getElementById("visitOutcome").value,
    notes: document.getElementById("visitNotes").value.trim()
  };

  state.outletSessions = [...(state.outletSessions || []), session];
  activeOutletSession = null;
  if (outletTimer) clearInterval(outletTimer);
  saveState();
  renderOutletStats();
  renderHistory();
  const outletLocationStatus = document.getElementById("outletLocationStatus");
  if (outletLocationStatus) outletLocationStatus.textContent = `check-out location captured ✓ ${formatLocation(location)}`;

  try {
    await cloudInsert("outlet_sessions", {
      user_name: state.name,
      role: state.role,
      customer: session.customer,
      area: session.area,
      check_in_time: session.checkInTime,
      check_out_time: session.checkOutTime,
      check_in_latitude: session.checkInLatitude,
      check_in_longitude: session.checkInLongitude,
      check_out_latitude: session.checkOutLatitude,
      check_out_longitude: session.checkOutLongitude,
      duration_minutes: session.durationMinutes,
      km_travelled: session.kmTravelled,
      outcome: session.outcome,
      notes: session.notes
    });
    toast("Outlet checkout saved to cloud");
  } catch {
    toast("Outlet checkout saved locally");
  }
});

document.getElementById("submitVisitButton").addEventListener("click", async () => {
  const followUpDate = document.getElementById("visitFollowUpDate")?.value || null;
  const visit = {
    customer: document.getElementById("visitCustomerSelect")?.value || "Shiv Medicos",
    outcome: document.getElementById("visitOutcome").value,
    notes: document.getElementById("visitNotes").value.trim(),
    time: currentTime(),
    followUpDate,
    photoUrls: []
  };

  state.visits.push(visit);
  saveState();
  renderHistory();
  renderFollowUps();

  try {
    const savedVisits = await cloudInsert("visits", {
      customer: visit.customer,
      outcome: visit.outcome,
      notes: visit.notes,
      user_name: state.name,
      role: state.role,
      visit_time: visit.time,
      follow_up_date: visit.followUpDate
    });
    const savedVisit = savedVisits?.[0];
    const uploadedPhotos = [];

    if (savedVisit?.id && selectedVisitPhotos.length) {
      const status = document.getElementById("visitPhotoStatus");
      if (status) status.textContent = "Uploading photos...";

      for (const [index, file] of selectedVisitPhotos.entries()) {
        const uploaded = await uploadVisitPhoto(file, savedVisit.id, index + 1);
        uploadedPhotos.push(uploaded);
        await cloudInsert("visit_photos", {
          visit_id: savedVisit.id,
          storage_path: uploaded.storage_path,
          photo_url: uploaded.photo_url,
          uploaded_by: state.name
        });
      }

      await cloudUpdate(
        "visits",
        savedVisit.id,
        {
          photo_urls: uploadedPhotos.map((photo) => photo.photo_url)
        }
      );
      visit.photoUrls = uploadedPhotos.map((photo) => photo.photo_url);
      if (status) status.textContent = `${uploadedPhotos.length} photo(s) uploaded`;
    }

    await markPlannedVisitDone(visit.customer);
    selectedVisitPhotos = [];
    document.getElementById("visitPhotoInput").value = "";
    document.getElementById("visitFollowUpDate").value = "";
    renderVisitPhotoPreview();
    saveState();
    renderHistory();
    renderFollowUps();
    toast(uploadedPhotos.length ? "Visit and photos saved to cloud" : "Visit saved to cloud");
  } catch {
    toast("Visit saved locally");
  }
});

document.getElementById("submitRetailAuditButton")?.addEventListener("click", async () => {
  const customer = document.getElementById("visitCustomerSelect")?.value || "Shiv Medicos";
  const audit = {
    user_name: state.name,
    customer,
    shelf_share: Number(document.getElementById("retailShelfShare")?.value || 0),
    competitor: document.getElementById("retailCompetitor")?.value.trim() || "",
    stock_status: document.getElementById("retailStockStatus")?.value || "Available",
    merchandising_notes: document.getElementById("retailAuditNotes")?.value.trim() || ""
  };

  try {
    await cloudInsert("retail_audits", audit);
    document.getElementById("retailShelfShare").value = "0";
    document.getElementById("retailCompetitor").value = "";
    document.getElementById("retailAuditNotes").value = "";
    toast("Retail audit saved to cloud");
  } catch {
    toast("Retail audit saved locally");
  }
});

document.getElementById("bookOrderButton").addEventListener("click", async () => {
  if (!orderCartItems.length) {
    toast("Add at least one product");
    return;
  }

  const order = {
    customer: document.getElementById("orderCustomerSelect")?.value || "Shiv Medicos",
    total: calculateOrderTotal(),
    time: currentTime(),
    items: [...orderCartItems]
  };

  state.orders.push(order);
  saveState();
  renderHistory();

  try {
    const savedOrder = await cloudInsert("orders", {
      customer: order.customer,
      total: order.total,
      user_name: state.name,
      role: state.role,
      order_time: order.time
    });
    const orderId = savedOrder?.[0]?.id;
    if (orderId) {
      for (const item of order.items) {
        await cloudInsert("order_items", {
          order_id: orderId,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          rate: item.rate,
          line_total: item.lineTotal
        });
      }
    }
    orderCartItems = [];
    renderOrderItems();
    renderOrderTotal();
    toast("Order booked to cloud");
  } catch {
    toast("Order saved locally");
  }
});

document.getElementById("saveCustomerButton").addEventListener("click", async () => {
  const name = document.getElementById("customerName").value.trim();
  if (!name) {
    toast("Customer name required");
    return;
  }

  const customer = {
    type: document.getElementById("customerType").value,
    name,
    mobile: document.getElementById("customerMobile").value.trim(),
    area: document.getElementById("customerArea").value.trim(),
    customerClass: document.getElementById("customerClass").value,
    specialty: document.getElementById("customerSpecialty").value.trim(),
    outstanding: Number(document.getElementById("customerOutstanding").value || 0),
    address: document.getElementById("customerAddress").value.trim(),
    createdAt: currentTime()
  };

  state.customers.push(customer);
  saveState();
  renderCustomers();
  clearCustomerForm();

  try {
    await cloudInsert("customers", {
      type: customer.type,
      name: customer.name,
      mobile: customer.mobile,
      area: customer.area,
      customer_class: customer.customerClass,
      specialty: customer.specialty,
      outstanding: customer.outstanding,
      address: customer.address,
      created_by: state.name
    });
    await syncFromCloud();
    toast("Customer saved to cloud");
  } catch {
    toast("Customer saved locally");
  }
});

document.getElementById("mobileCustomerSearch")?.addEventListener("input", renderCustomers);
document.getElementById("mobileProductSearch")?.addEventListener("input", renderProducts);
document.getElementById("visitCustomerSelect")?.addEventListener("change", updateSelectedVisitCustomer);
document.getElementById("visitPhotoInput")?.addEventListener("change", (event) => {
  selectedVisitPhotos = Array.from(event.target.files || []);
  renderVisitPhotoPreview();
});
document.getElementById("orderProductSearch")?.addEventListener("input", (event) => {
  orderSearch = event.target.value;
  renderOrderProducts();
});

renderUser();
renderCheckIn();
renderHistory();
renderFollowUps();
renderOutletStats();
renderCustomers();
renderProducts();
renderCustomerDropdowns();
renderOrderProducts();
renderBeatPlans();
renderTasks();
renderSchemes();
renderPromotions();
renderAnnouncements();
renderOrderTotal();
async function initializeExistingMobileSession() {
  if (!authSession || !state.loggedIn) return;

  try {
    const profile = await loadProfile(authSession.user.id);
    if (profile.status === "inactive") throw new Error("Inactive account");
    state.name = profile.full_name;
    state.role = profile.role;
    saveState();
    renderUser();
    await syncFromCloud();
  } catch {
    authSession = null;
    state.loggedIn = false;
    saveState();
    localStorage.removeItem(authStorageKey);
    renderUser();
  }
}

initializeExistingMobileSession();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The app still works online if service worker registration is unavailable.
    });
  });
}
