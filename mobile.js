const storageKey = "fieldforce-mobile-demo";
const supabaseUrl = "https://uywrkixlytrcepuextiq.supabase.co";
const supabaseKey = "sb_publishable_Mu7SoauvKLHuka9L5ZamVQ_8SJHs_1y";
const cloudEnabled = Boolean(supabaseUrl && supabaseKey);

const mobileTitles = {
  "m-home": "Today",
  "m-beat": "Beat Plan",
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
  outletSessions: []
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

let state = loadState();
let orderSearch = "";
let activeOutletSession = null;
let outletTimer = null;

function cloudHeaders(extra = {}) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    ...extra
  };
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

function minutesBetween(start, end = new Date()) {
  return Math.max(0, Math.round((end.getTime() - new Date(start).getTime()) / 60000));
}

function showMobileView(viewId) {
  document.querySelectorAll(".mobile-view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mobileView === viewId);
  });

  document.getElementById("mobileTitle").textContent = mobileTitles[viewId];
}

function renderUser() {
  document.body.classList.toggle("locked", !state.loggedIn);
  document.getElementById("welcomeName").textContent = `Good morning, ${state.name.split(" ")[0] || "User"}`;
  document.getElementById("userRoleLabel").textContent = `${state.role} | FieldForce AI`;
  document.getElementById("roleSelect").value = state.role;
  document.getElementById("userNameInput").value = state.name;
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
  const customers = query
    ? state.customers.filter((customer) => [customer.name, customer.type, customer.area, customer.customerClass, customer.customer_class, customer.specialty, customer.mobile].join(" ").toLowerCase().includes(query))
    : state.customers;
  document.getElementById("customerCount").textContent = `${state.customers.length} saved`;

  customerList.innerHTML = customers.length
    ? customers
        .slice()
        .reverse()
        .map((customer) => {
          return `
            <div class="master-item">
              <strong>${customer.name}</strong>
              <span>${customer.type} | ${customer.customerClass || customer.customer_class || "-"} | ${customer.area || "No area"}</span>
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
  const options = state.customers.length
    ? state.customers.map((customer) => `<option value="${customer.name}">${customer.name} - ${customer.type || "Customer"}</option>`).join("")
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
          return `
            <div class="sku-row">
              <div><strong>${product.name}</strong><span>${product.composition || "No composition"} | Rate ${money(price)} | ${product.scheme || "No scheme"}</span></div>
              <input class="qty-input" type="number" value="0" min="0" data-price="${price}" data-product="${product.name}" />
            </div>
          `;
        })
        .join("")
    : `<div class="master-item"><strong>No product found</strong><span>Ask admin to add this product in Product Master.</span></div>`;

  document.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("input", renderOrderTotal);
  });
  renderOrderTotal();
}

function renderBeatPlans(plans = []) {
  const list = document.getElementById("cloudBeatList");
  const count = document.getElementById("beatPlanCount");
  const summary = document.getElementById("beatSummary");
  if (!list || !count) return;

  count.textContent = `${plans.length} cloud`;
  summary.textContent = plans.length
    ? `${plans.length} planned stops | ${new Set(plans.map((plan) => plan.area).filter(Boolean)).size} areas`
    : "Cloud beat plans will appear here after admin setup.";

  list.innerHTML = plans.length
    ? `<div class="route-line"></div>${plans
        .slice()
        .reverse()
        .map((plan, index) => {
          return `<div class="route-stop ${index === 0 ? "active" : ""}"><strong>${plan.sequence_no || index + 1}</strong><span>${plan.customer || plan.title} | ${plan.area || "No area"}</span></div>`;
        })
        .join("")}`
    : `<div class="master-item"><strong>No cloud beat plan yet</strong><span>Admin can add beat plans in Supabase for testing.</span></div>`;
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

function calculateOrderTotal() {
  return [...document.querySelectorAll(".qty-input")].reduce((sum, input) => {
    return sum + Number(input.value || 0) * Number(input.dataset.price || 0);
  }, 0);
}

function renderOrderTotal() {
  document.getElementById("orderTotal").textContent = money(calculateOrderTotal());
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
    const [beatPlans, tasks, schemes] = await Promise.all([
      cloudSelect("beat_plans"),
      cloudSelect("tasks"),
      cloudSelect("schemes")
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
      time: visit.visit_time || new Date(visit.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
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

    saveState();
    renderHistory();
    renderOutletStats();
    renderCustomers();
    renderProducts();
    renderCustomerDropdowns();
    renderOrderProducts();
    renderBeatPlans(beatPlans || []);
    renderTasks(tasks || []);
    renderSchemes(schemes || []);
  } catch (error) {
    toast("Cloud setup pending. Using local save.");
  }
}

document.querySelectorAll(".bottom-nav button").forEach((button) => {
  button.addEventListener("click", () => showMobileView(button.dataset.mobileView));
});

document.querySelectorAll("[data-jump-view]").forEach((button) => {
  button.addEventListener("click", () => showMobileView(button.dataset.jumpView));
});

document.getElementById("loginButton").addEventListener("click", () => {
  state.loggedIn = true;
  state.name = document.getElementById("userNameInput").value.trim() || "Riya Sharma";
  state.role = document.getElementById("roleSelect").value;
  saveState();
  renderUser();
  toast("Login saved");
});

document.getElementById("checkButton").addEventListener("click", () => {
  state.checkedIn = !state.checkedIn;
  saveState();
  renderCheckIn();
  const status = state.checkedIn ? "Checked In" : "Checked Out";

  cloudInsert("attendance", {
    user_name: state.name,
    role: state.role,
    status,
    attendance_time: currentTime()
  })
    .then(() => toast(`${status} saved to cloud`))
    .catch(() => toast(state.checkedIn ? "Attendance checked in" : "Checked out"));
});

document.getElementById("startOutletButton")?.addEventListener("click", () => {
  if (!state.checkedIn) {
    toast("Pehle GPS attendance check-in karo");
    return;
  }

  const customerName = document.getElementById("visitCustomerSelect")?.value || "Shiv Medicos";
  const customer = state.customers.find((item) => item.name === customerName);
  activeOutletSession = {
    customer: customerName,
    area: customer?.area || "",
    startedAt: new Date().toISOString(),
    checkInTime: currentTime()
  };

  if (outletTimer) clearInterval(outletTimer);
  outletTimer = setInterval(renderOutletStats, 30000);
  renderOutletStats();
  toast("Outlet check-in started");
});

document.getElementById("checkoutOutletButton")?.addEventListener("click", async () => {
  if (!activeOutletSession) {
    toast("Pehle outlet check-in start karo");
    return;
  }

  const durationMinutes = minutesBetween(activeOutletSession.startedAt);
  const kmTravelled = Number(document.getElementById("outletKmInput")?.value || 0);
  const session = {
    customer: activeOutletSession.customer,
    area: activeOutletSession.area,
    checkInTime: activeOutletSession.checkInTime,
    checkOutTime: currentTime(),
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

  try {
    await cloudInsert("outlet_sessions", {
      user_name: state.name,
      role: state.role,
      customer: session.customer,
      area: session.area,
      check_in_time: session.checkInTime,
      check_out_time: session.checkOutTime,
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
  const visit = {
    customer: document.getElementById("visitCustomerSelect")?.value || "Shiv Medicos",
    outcome: document.getElementById("visitOutcome").value,
    notes: document.getElementById("visitNotes").value.trim(),
    time: currentTime()
  };

  state.visits.push(visit);
  saveState();
  renderHistory();

  try {
    await cloudInsert("visits", {
      customer: visit.customer,
      outcome: visit.outcome,
      notes: visit.notes,
      user_name: state.name,
      role: state.role,
      visit_time: visit.time
    });
    toast("Visit saved to cloud");
  } catch {
    toast("Visit saved locally");
  }
});

document.getElementById("bookOrderButton").addEventListener("click", async () => {
  const order = {
    customer: document.getElementById("orderCustomerSelect")?.value || "Shiv Medicos",
    total: calculateOrderTotal(),
    time: currentTime()
  };

  state.orders.push(order);
  saveState();
  renderHistory();

  try {
    await cloudInsert("orders", {
      customer: order.customer,
      total: order.total,
      user_name: state.name,
      role: state.role,
      order_time: order.time
    });
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

document.querySelectorAll(".qty-input").forEach((input) => {
  input.addEventListener("input", renderOrderTotal);
});

document.getElementById("mobileCustomerSearch")?.addEventListener("input", renderCustomers);
document.getElementById("mobileProductSearch")?.addEventListener("input", renderProducts);
document.getElementById("visitCustomerSelect")?.addEventListener("change", updateSelectedVisitCustomer);
document.getElementById("orderProductSearch")?.addEventListener("input", (event) => {
  orderSearch = event.target.value;
  renderOrderProducts();
});

renderUser();
renderCheckIn();
renderHistory();
renderOutletStats();
renderCustomers();
renderProducts();
renderCustomerDropdowns();
renderOrderProducts();
renderBeatPlans();
renderTasks();
renderSchemes();
renderOrderTotal();
syncFromCloud();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The app still works online if service worker registration is unavailable.
    });
  });
}
