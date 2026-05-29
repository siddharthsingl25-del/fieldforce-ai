const viewTitles = {
  command: "Manager Command Center",
  field: "Mobile Field App",
  customers: "Customer Master",
  products: "Product Master",
  territories: "Area Master",
  beatPlans: "Beat Plans",
  tasks: "Tasks & Follow-ups",
  visits: "Visit Management",
  sales: "Sales & Order Management",
  reports: "Reports",
  targets: "Targets & Achievements",
  promotions: "Product Promotions",
  audit: "FMCG Retail Audit",
  comms: "Communication Center",
  schemes: "Scheme Management",
  incentives: "Incentive Engine",
  gamify: "Gamification System",
  ai: "AI Sales Copilot"
};

const contextActions = {
  command: { label: "Refresh Dashboard", action: renderCommandCenter },
  customers: { label: "Create Customer", target: "adminCustomerName" },
  products: { label: "Create Product", target: "adminProductName" },
  territories: { label: "Create Area", target: "territoryState" },
  beatPlans: { label: "Create Beat Plan", target: "beatTitle" },
  tasks: { label: "Create Task", target: "taskTitle" },
  schemes: { label: "Create Scheme", target: "schemeTitle" },
  visits: { label: "Refresh Visits", action: renderCloudVisits },
  sales: { label: "Refresh Sales", action: renderCloudSales },
  reports: { label: "Refresh Reports", action: renderReports },
  targets: { label: "Create Target", target: "targetUser" },
  promotions: { label: "Create Promotion", target: "promoTitle" },
  audit: { label: "Create Audit", target: "auditCustomer" },
  comms: { label: "Publish", target: "announceTitle" },
  field: { label: "Open Mobile", action: () => window.open("/mobile", "_blank") },
  incentives: { label: "Coming Next", action: () => adminToast("Incentive builder is next batch") },
  gamify: { label: "Coming Next", action: () => adminToast("Gamification rules are next batch") },
  ai: { label: "Ask AI", target: null }
};

const sampleCsv = {
  customers: [
    ["type", "name", "mobile", "state", "area", "customer_class", "specialty", "outstanding"],
    ["Doctor", "Dr. Mehta Clinic", "9876543210", "Rajasthan", "Jaipur East", "A-Class", "Cardiologist", "0"],
    ["Stockist", "City Pharma Stockist", "9876500000", "Rajasthan", "Jaipur East", "A-Class", "Pharma Distribution", "18500"]
  ],
  products: [
    ["name", "composition", "category", "pack", "mrp", "sale_rate", "scheme", "stock"],
    ["CardioMax 10mg", "Atorvastatin 10mg", "Cardiac", "10x10 tablets", "180", "148", "Buy 10 get 2 free", "120"]
  ],
  territories: [
    ["state", "city", "area", "territory", "assigned_manager"],
    ["Rajasthan", "Jaipur", "Jaipur East", "Jaipur East-01", "Amit ASM"]
  ],
  beatPlans: [
    ["title", "assigned_to", "area", "customer", "planned_date", "sequence_no"],
    ["Jaipur East Morning Beat", "Riya Sharma", "Jaipur East", "Dr. Mehta Clinic", "2026-05-29", "1"]
  ],
  tasks: [
    ["title", "assigned_to", "priority", "due_date"],
    ["Collect payment from Shiv Medicos", "Riya Sharma", "High", "2026-05-30"]
  ],
  schemes: [
    ["title", "scheme_type", "product", "customer_segment", "rule_text"],
    ["VitaPlus May Offer", "BOGO", "VitaPlus", "A-Class Retailers", "Buy 10 get 2 free"]
  ]
};

const storageKey = "fieldforce-mobile-demo";
const adminAuthStorageKey = "fieldforce-admin-auth";
const supabaseUrl = "https://uywrkixlytrcepuextiq.supabase.co";
const supabaseKey = "sb_publishable_Mu7SoauvKLHuka9L5ZamVQ_8SJHs_1y";
const cloudEnabled = Boolean(supabaseUrl && supabaseKey);

const visits = [
  ["Dr. Mehta Clinic", "Doctor", "Completed", "Productive", "Follow up in 7 days"],
  ["Shiv Medicos", "Retailer", "Completed", "Order booked", "Collect ₹18,500"],
  ["City Pharma Stockist", "Distributor", "Pending", "Stock review", "Visit by 4:30 PM"],
  ["Wellness Mart", "FMCG Outlet", "Missed", "No owner available", "Reschedule tomorrow"],
  ["Apex Hospital", "Institution", "Completed", "Campaign discussed", "Send product PDF"]
];

const products = [
  ["CardioMax", 82, "₹72L"],
  ["VitaPlus", 68, "₹54L"],
  ["GlucoSafe", 91, "₹88L"],
  ["FreshBite SKU Mix", 57, "₹39L"],
  ["ImmunoCare", 74, "₹61L"]
];

let cachedCustomers = [];
let cachedProducts = [];
let cachedTerritories = [];
let discountAssignments = [];
let adminAuthSession = loadAdminAuthSession();
let adminProfile = null;
let editingCustomerId = null;
let editingProductId = null;

const reportCatalog = [
  ["5324", "User Performance Dashboard", "Attendance, calls, productivity, outlet time, and KM by user"],
  ["13071", "BU Dashboard", "Business unit sales, zones, schemes, and growth"],
  ["15875", "Salesman Performance Dashboard", "Daily MR scorecard with calls, productive calls, orders, and route coverage"],
  ["16538", "Manager Dashboard", "ASM/RM team summary with exceptions and approvals"],
  ["274", "Target Vs Achievement Report", "Monthly target, achievement, gap, and ranking"],
  ["522", "Outlet wise Sale Report", "Outlet customer sales, order value, SKU mix, and last visit"],
  ["1137", "User wise Target and Achievement", "User level target slabs and achievement tracking"],
  ["1255", "New Outlet Activation Report", "New doctors, retailers, distributors, and outlet onboarding"],
  ["1642", "User Tracking", "GPS attendance, live status, route and outlet check-out tracking"],
  ["1895", "EOD Report", "End-of-day attendance, first call, last call, outlet time, and KM"],
  ["2101", "Product Performance Report", "SKU sales, MRP, sale rate, stock, schemes, and category mix"],
  ["2202", "Scheme Utilization Report", "Scheme assignment, eligible customers, and redemption impact"]
];

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewId);
  });

  document.getElementById("view-title").textContent = viewTitles[viewId];
  updateContextAction(viewId);

  if (viewId === "customers" || viewId === "products") {
    renderMasterData();
  }

  if (viewId === "visits") {
    renderCloudVisits();
  }

  if (viewId === "beatPlans") {
    renderBeatPlans();
  }

  if (viewId === "tasks") {
    renderTasks();
  }

  if (viewId === "territories") {
    renderTerritories();
  }

  if (viewId === "sales") {
    renderCloudSales();
  }

  if (viewId === "schemes") {
    renderSchemes();
  }

  if (viewId === "reports") {
    renderReports();
  }

  if (viewId === "targets") {
    renderTargets();
  }

  if (viewId === "promotions") {
    renderPromotions();
  }

  if (viewId === "audit") {
    renderAudits();
  }

  if (viewId === "comms") {
    renderAnnouncements();
  }

  if (viewId === "command") {
    renderCommandCenter();
  }
}

function updateContextAction(viewId) {
  const button = document.getElementById("contextCreateButton");
  if (!button) return;
  const config = contextActions[viewId] || { label: "Refresh", action: renderCommandCenter };
  button.textContent = config.label;
  button.dataset.contextView = viewId;
}

function loadMobileState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return { customers: [], products: [] };

  try {
    return JSON.parse(saved);
  } catch {
    return { customers: [], products: [] };
  }
}

function loadAdminAuthSession() {
  const saved = localStorage.getItem(adminAuthStorageKey);
  return saved ? JSON.parse(saved) : null;
}

function saveAdminAuthSession(session) {
  localStorage.setItem(adminAuthStorageKey, JSON.stringify(session));
}

function cloudHeaders() {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${adminAuthSession?.access_token || supabaseKey}`,
    "Content-Type": "application/json"
  };
}

async function signInWithPassword(email, password) {
  return requestJson(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
}

async function loadProfile(userId) {
  const profiles = await requestJson(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: cloudHeaders()
  });
  if (!profiles.length) throw new Error("Profile not found");
  return profiles[0];
}

function requestJson(url, options = {}) {
  if (typeof fetch === "function") {
    return fetch(url, options).then(async (response) => {
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || "GET", url);
    Object.entries(options.headers || {}).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
      } else {
        reject(new Error(xhr.responseText || `Request failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.send(options.body || null);
  });
}

async function cloudSelect(table) {
  if (!cloudEnabled) return null;

  return requestJson(`${supabaseUrl}/rest/v1/${table}?select=*&order=created_at.desc`, {
    headers: cloudHeaders()
  });
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

  return requestJson(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...cloudHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
}

async function cloudUpdate(table, id, payload) {
  if (!cloudEnabled) return null;

  return requestJson(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...cloudHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
}

async function cloudDelete(table, id) {
  if (!cloudEnabled) return null;

  return requestJson(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: { ...cloudHeaders(), Prefer: "return=representation" }
  });
}

function canManageMasterData() {
  return ["admin", "manager"].includes(adminProfile?.role);
}

async function unlockAdmin(session) {
  adminAuthSession = session;
  saveAdminAuthSession(session);
  adminProfile = await loadProfile(session.user.id);

  if (!["admin", "manager"].includes(adminProfile.role)) {
    throw new Error("Access denied");
  }

  document.body.classList.remove("admin-locked");
  adminToast(`Welcome ${adminProfile.full_name}`);
  initializeAdminApp();
}

async function initializeExistingAdminSession() {
  if (!adminAuthSession) return;

  try {
    await unlockAdmin(adminAuthSession);
  } catch {
    adminAuthSession = null;
    localStorage.removeItem(adminAuthStorageKey);
    document.body.classList.add("admin-locked");
  }
}

function setValue(id, value = "") {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

function valueOf(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function numberValue(id) {
  return Number(document.getElementById(id)?.value || 0);
}

function adminToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  document.body.appendChild(item);
  setTimeout(() => item.remove(), 2200);
}

function focusAdminField(fieldId) {
  const element = document.getElementById(fieldId);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => element.focus(), 350);
}

function downloadCsv(name, rows) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-sample.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    return headers.reduce((record, header, index) => {
      record[header] = row[index] || "";
      return record;
    }, {});
  });
}

const importConfig = {
  customers: {
    table: "customers",
    refresh: renderMasterData,
    map: (row) => ({
      type: row.type || "Retailer",
      name: row.name,
      mobile: row.mobile,
      area: row.area,
      customer_class: row.customer_class || row.class,
      specialty: row.specialty,
      outstanding: Number(row.outstanding || 0),
      address: row.state || row.address,
      created_by: "Admin CSV"
    }),
    required: "name"
  },
  products: {
    table: "products",
    refresh: renderMasterData,
    map: (row) => ({
      name: row.name,
      composition: row.composition,
      category: row.category,
      pack: row.pack,
      mrp: Number(row.mrp || 0),
      sale_rate: Number(row.sale_rate || row.sale || 0),
      scheme: row.scheme,
      stock: Number(row.stock || 0),
      created_by: "Admin CSV"
    }),
    required: "name"
  },
  territories: {
    table: "territories",
    refresh: renderTerritories,
    map: (row) => ({
      state: row.state,
      city: row.city,
      area: row.area,
      territory: row.territory,
      assigned_manager: row.assigned_manager || row.manager
    }),
    required: "area"
  },
  beatPlans: {
    table: "beat_plans",
    refresh: renderBeatPlans,
    map: (row) => ({
      title: row.title,
      assigned_to: row.assigned_to,
      area: row.area,
      customer: row.customer,
      planned_date: row.planned_date || new Date().toISOString().slice(0, 10),
      sequence_no: Number(row.sequence_no || 1),
      status: "Planned"
    }),
    required: "title"
  },
  tasks: {
    table: "tasks",
    refresh: renderTasks,
    map: (row) => ({
      title: row.title,
      assigned_to: row.assigned_to,
      priority: row.priority || "Normal",
      due_date: row.due_date || new Date().toISOString().slice(0, 10),
      status: "Open"
    }),
    required: "title"
  },
  schemes: {
    table: "schemes",
    refresh: renderSchemes,
    map: (row) => ({
      title: row.title,
      scheme_type: row.scheme_type,
      product: row.product,
      customer_segment: row.customer_segment,
      rule_text: row.rule_text,
      status: "Active"
    }),
    required: "title"
  }
};

async function importCsvFile(key, file) {
  const config = importConfig[key];
  if (!config || !file) return;

  const rows = csvToObjects(await file.text())
    .map(config.map)
    .filter((row) => row[config.required]);

  if (!rows.length) {
    adminToast("No valid rows found. Use sample CSV columns.");
    return;
  }

  adminToast(`Importing ${rows.length} rows...`);
  for (const row of rows) {
    await cloudInsert(config.table, row);
  }
  config.refresh();
  adminToast(`${rows.length} rows imported`);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function renderVisits() {
  const target = document.getElementById("visitRows");
  target.innerHTML = visits
    .map(([customer, type, status, outcome, action]) => {
      const tagClass = status === "Missed" || status === "Pending" ? "tag warn" : "tag";
      return `
        <tr>
          <td><strong>${customer}</strong></td>
          <td>${type}</td>
          <td><span class="${tagClass}">${status}</span></td>
          <td>${outcome}</td>
          <td>${action}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCloudVisits() {
  const target = document.getElementById("visitRows");
  if (!target) return;

  cloudSelect("visits")
    .then((items) => {
      target.innerHTML = items.length
        ? items
            .map((visit) => {
              return `
                <tr>
                  <td><strong>${visit.customer || "-"}</strong></td>
                  <td>${visit.user_name || "-"}</td>
                  <td><span class="tag">${visit.role || "MR"}</span></td>
                  <td>${visit.outcome || "-"}</td>
                  <td>${visit.notes || "-"}</td>
                  <td>${visit.visit_time || "-"}</td>
                </tr>
              `;
            })
            .join("")
        : `
          <tr>
            <td colspan="6"><strong>No cloud visits yet.</strong> Submit a visit from mobile app.</td>
          </tr>
        `;
    })
    .catch(() => {
      renderVisits();
    });
}

function renderProducts() {
  const target = document.getElementById("productRows");
  target.innerHTML = products
    .map(([name, progress, value]) => {
      return `
        <div class="product-row">
          <strong>${name}</strong>
          <div class="progress" aria-label="${name} achievement ${progress}%">
            <span style="width: ${progress}%"></span>
          </div>
          <span>${value}</span>
        </div>
      `;
    })
    .join("");
}

function renderAdminCustomers(customers) {
  const rows = document.getElementById("adminCustomerRows");
  if (!rows) return;
  cachedCustomers = customers;
  const query = valueOf("adminCustomerSearch").toLowerCase();
  const visibleCustomers = query
    ? customers.filter((customer) => [customer.name, customer.type, customer.area, customer.customerClass, customer.customer_class, customer.specialty, customer.mobile].join(" ").toLowerCase().includes(query))
    : customers;

  const doctorTotal = visibleCustomers.filter((customer) => customer.type === "Doctor").length;
  const retailerTotal = visibleCustomers.filter((customer) => customer.type === "Retailer").length;
  const outstandingTotal = visibleCustomers.reduce((sum, customer) => sum + Number(customer.outstanding || 0), 0);

  document.getElementById("adminCustomerTotal").textContent = visibleCustomers.length;
  document.getElementById("adminDoctorTotal").textContent = doctorTotal;
  document.getElementById("adminRetailerTotal").textContent = retailerTotal;
  document.getElementById("adminOutstandingTotal").textContent = money(outstandingTotal);

  rows.innerHTML = visibleCustomers.length
    ? visibleCustomers
        .slice()
        .reverse()
        .map((customer) => {
          return `
            <tr>
              <td><strong>${customer.name || "-"}</strong></td>
              <td>${customer.type || "-"}</td>
              <td>${customer.area || "-"}</td>
              <td>${customer.customerClass || customer.customer_class || "-"}</td>
              <td>${customer.specialty || "-"}</td>
              <td>${customer.mobile || "-"}</td>
              <td>${money(customer.outstanding)}</td>
              <td>
                <button class="table-action" data-edit-customer="${customer.id}">Edit</button>
                <button class="table-action danger" data-delete-customer="${customer.id}">Delete</button>
              </td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="8"><strong>No customer data yet.</strong> Add customers from the mobile app, then refresh this page.</td>
      </tr>
    `;

  document.querySelectorAll("[data-edit-customer]").forEach((button) => {
    button.addEventListener("click", () => editCustomer(button.dataset.editCustomer));
  });
  document.querySelectorAll("[data-delete-customer]").forEach((button) => {
    button.addEventListener("click", () => deleteCustomer(button.dataset.deleteCustomer));
  });
}

function renderAdminProducts(products) {
  const rows = document.getElementById("adminProductRows");
  if (!rows) return;
  cachedProducts = products;
  const query = valueOf("adminProductSearch").toLowerCase();
  const category = valueOf("adminProductCategoryFilter");
  const activeOnly = document.getElementById("adminActiveSkuOnly")?.checked;
  populateProductCategoryFilter(products);
  const visibleProducts = products.filter((product) => {
    const matchesQuery = !query || [product.name, product.composition, product.category, product.pack, product.scheme, product.mrp, product.saleRate, product.sale_rate].join(" ").toLowerCase().includes(query);
    const matchesCategory = !category || product.category === category;
    const matchesActive = !activeOnly || Number(product.stock || 0) > 0;
    return matchesQuery && matchesCategory && matchesActive;
  });

  const stockTotal = visibleProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const avgMrp = visibleProducts.length ? visibleProducts.reduce((sum, product) => sum + Number(product.mrp || 0), 0) / visibleProducts.length : 0;
  const schemeTotal = visibleProducts.filter((product) => product.scheme).length;

  document.getElementById("adminProductTotal").textContent = visibleProducts.length;
  document.getElementById("adminStockTotal").textContent = stockTotal;
  document.getElementById("adminAvgMrp").textContent = money(avgMrp);
  document.getElementById("adminSchemeTotal").textContent = schemeTotal;

  rows.innerHTML = visibleProducts.length
    ? visibleProducts
        .slice()
        .reverse()
        .map((product) => {
          return `
            <tr>
              <td><strong>${product.name || "-"}</strong></td>
              <td>${product.composition || "-"}</td>
              <td>${product.category || "-"}</td>
              <td>${product.pack || "-"}</td>
              <td>${money(product.mrp)}</td>
              <td>${money(product.saleRate || product.sale_rate)}</td>
              <td>${product.scheme || "-"}</td>
              <td>${product.stock || 0}</td>
              <td>
                <button class="table-action" data-edit-product="${product.id}">Edit</button>
                <button class="table-action danger" data-delete-product="${product.id}">Delete</button>
              </td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="9"><strong>No product data yet.</strong> Add products from the mobile app, then refresh this page.</td>
      </tr>
    `;

  document.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", () => editProduct(button.dataset.editProduct));
  });
  document.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct));
  });
}

function resetAdminCustomerForm() {
  editingCustomerId = null;
  ["adminCustomerName", "adminCustomerMobile", "adminCustomerState", "adminCustomerArea", "adminCustomerSpecialty"].forEach((id) => setValue(id));
  setValue("adminCustomerType", "Retailer");
  setValue("adminCustomerClass", "A-Class");
  setValue("adminCustomerOutstanding", "0");
  const saveButton = document.getElementById("adminSaveCustomer");
  if (saveButton) saveButton.textContent = "Save Customer";
}

function resetAdminProductForm() {
  editingProductId = null;
  ["adminProductName", "adminProductComposition", "adminProductCategory", "adminProductPack", "adminProductScheme"].forEach((id) => setValue(id));
  ["adminProductMrp", "adminProductSaleRate", "adminProductStock"].forEach((id) => setValue(id, "0"));
  const saveButton = document.getElementById("adminSaveProduct");
  if (saveButton) saveButton.textContent = "Save Product";
}

function editCustomer(id) {
  if (!canManageMasterData()) return adminToast("Access denied");
  const customer = cachedCustomers.find((item) => String(item.id) === String(id));
  if (!customer) return adminToast("Customer not found");

  editingCustomerId = id;
  setValue("adminCustomerType", customer.type || "Retailer");
  setValue("adminCustomerName", customer.name || "");
  setValue("adminCustomerMobile", customer.mobile || "");
  setValue("adminCustomerState", customer.address || customer.state || "");
  setValue("adminCustomerArea", customer.area || "");
  setValue("adminCustomerClass", customer.customer_class || customer.customerClass || "A-Class");
  setValue("adminCustomerSpecialty", customer.specialty || "");
  setValue("adminCustomerOutstanding", customer.outstanding || "0");
  const saveButton = document.getElementById("adminSaveCustomer");
  if (saveButton) saveButton.textContent = "Update Customer";
  document.getElementById("adminCustomerName")?.focus();
  adminToast("Customer loaded for editing");
}

async function deleteCustomer(id) {
  if (!canManageMasterData()) return adminToast("Access denied");
  if (!confirm("Are you sure?")) return;

  try {
    await cloudDelete("customers", id);
    if (String(editingCustomerId) === String(id)) resetAdminCustomerForm();
    await renderMasterData();
    adminToast("Customer deleted");
  } catch {
    adminToast("Customer delete failed. Check RLS delete policy.");
  }
}

function editProduct(id) {
  if (!canManageMasterData()) return adminToast("Access denied");
  const product = cachedProducts.find((item) => String(item.id) === String(id));
  if (!product) return adminToast("Product not found");

  editingProductId = id;
  setValue("adminProductName", product.name || "");
  setValue("adminProductComposition", product.composition || "");
  setValue("adminProductCategory", product.category || "");
  setValue("adminProductPack", product.pack || "");
  setValue("adminProductMrp", product.mrp || "0");
  setValue("adminProductSaleRate", product.sale_rate || product.saleRate || "0");
  setValue("adminProductScheme", product.scheme || "");
  setValue("adminProductStock", product.stock || "0");
  const saveButton = document.getElementById("adminSaveProduct");
  if (saveButton) saveButton.textContent = "Update Product";
  document.getElementById("adminProductName")?.focus();
  adminToast("Product loaded for editing");
}

async function deleteProduct(id) {
  if (!canManageMasterData()) return adminToast("Access denied");
  if (!confirm("Are you sure?")) return;

  try {
    await cloudDelete("products", id);
    if (String(editingProductId) === String(id)) resetAdminProductForm();
    await renderMasterData();
    adminToast("Product deleted");
  } catch {
    adminToast("Product delete failed. Check RLS delete policy.");
  }
}

function populateProductCategoryFilter(products) {
  const select = document.getElementById("adminProductCategoryFilter");
  if (!select) return;
  const current = select.value;
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  select.innerHTML = `<option value="">All Categories</option>${categories.map((item) => `<option value="${item}">${item}</option>`).join("")}`;
  select.value = categories.includes(current) ? current : "";
}

function renderCloudSales() {
  const rows = document.getElementById("adminOrderRows");
  if (!rows) return;

  Promise.all([cloudSelect("orders"), cloudSelect("products"), optionalCloudSelect("order_items")])
    .then(([orders, productItems, orderItems]) => {
      const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const average = orders.length ? total / orders.length : 0;
      const itemsByOrder = orderItems.reduce((acc, item) => {
        if (!item.order_id) return acc;
        acc[item.order_id] = [...(acc[item.order_id] || []), item];
        return acc;
      }, {});

      document.getElementById("salesOrderCount").textContent = orders.length;
      document.getElementById("salesOrderTotal").textContent = money(total);
      document.getElementById("salesProductCount").textContent = productItems.length;
      document.getElementById("salesAvgOrder").textContent = money(average);

      rows.innerHTML = orders.length
        ? orders
            .map((order) => {
              const lines = itemsByOrder[order.id] || [];
              const lineRows = lines.length
                ? `
                  <tr>
                    <td colspan="5">
                      <div class="master-list">
                        ${lines.map((item) => `
                          <div class="master-item">
                            <strong>${item.product_name || "-"}</strong>
                            <span>Qty ${item.quantity || 0} x ${money(item.rate)} = ${money(item.line_total)}</span>
                          </div>
                        `).join("")}
                      </div>
                    </td>
                  </tr>
                `
                : "";
              return `
                <tr>
                  <td><strong>${order.customer || "-"}</strong></td>
                  <td>${order.user_name || "-"}</td>
                  <td>${order.role || "-"}</td>
                  <td>${money(order.total)}</td>
                  <td>${order.order_time || "-"}</td>
                </tr>
                ${lineRows}
              `;
            })
            .join("")
        : `
          <tr>
            <td colspan="5"><strong>No cloud orders yet.</strong> Book an order from mobile app.</td>
          </tr>
        `;
    })
    .catch(() => {
      rows.innerHTML = `<tr><td colspan="5">Cloud orders could not be loaded.</td></tr>`;
    });
}

function renderCommandCenter() {
  Promise.all([
    cloudSelect("attendance"),
    cloudSelect("visits"),
    cloudSelect("orders"),
    cloudSelect("customers")
  ])
    .then(([attendance, visitItems, orderItems, customerItems]) => {
      const orderTotal = orderItems.reduce((sum, order) => sum + Number(order.total || 0), 0);

      document.getElementById("commandAttendance").textContent = attendance.filter((item) => item.status === "Checked In").length;
      document.getElementById("commandVisits").textContent = visitItems.length;
      document.getElementById("commandOrders").textContent = money(orderTotal);
      document.getElementById("commandOrderCount").textContent = `${orderItems.length} cloud orders`;
      document.getElementById("commandCustomers").textContent = customerItems.length;
    })
    .catch(() => {
      document.getElementById("commandOrderCount").textContent = "Cloud sync pending";
    });
}

function renderTerritories() {
  const rows = document.getElementById("adminTerritoryRows");
  const status = document.getElementById("territorySyncStatus");
  if (!rows) return;
  if (status) status.textContent = "Refreshing cloud areas...";

  cloudSelect("territories")
    .then((items) => {
      cachedTerritories = items || [];
      populateTransferOptions(cachedTerritories);
      if (status) status.textContent = `Cloud synced: ${items.length} areas`;
      rows.innerHTML = items.length
        ? items.map((item) => `
          <tr>
            <td>${item.state || "-"}</td>
            <td>${item.city || "-"}</td>
            <td><strong>${item.area || "-"}</strong></td>
            <td>${item.territory || "-"}</td>
            <td>${item.assigned_manager || "-"}</td>
            <td><span class="tag">${item.status || "Active"}</span></td>
          </tr>
        `).join("")
        : `<tr><td colspan="6"><strong>No areas yet.</strong> Add state/area from the form above.</td></tr>`;
    })
    .catch(() => {
      if (status) status.textContent = "Cloud areas failed to load.";
      rows.innerHTML = `<tr><td colspan="6">Cloud areas could not be loaded.</td></tr>`;
    });
}

function populateTransferOptions(items) {
  const stateSelect = document.getElementById("transferFromState");
  const areaSelect = document.getElementById("transferFromArea");
  const managerInput = document.getElementById("transferFromManager");
  if (!stateSelect || !areaSelect) return;

  const states = [...new Set(items.map((item) => item.state).filter(Boolean))].sort();
  const selectedState = stateSelect.value || states[0] || "";
  stateSelect.innerHTML = states.length
    ? states.map((state) => `<option value="${state}">${state}</option>`).join("")
    : `<option value="">No areas</option>`;
  stateSelect.value = states.includes(selectedState) ? selectedState : states[0] || "";

  const areas = items.filter((item) => !stateSelect.value || item.state === stateSelect.value);
  const selectedArea = areaSelect.value || areas[0]?.area || "";
  areaSelect.innerHTML = areas.length
    ? areas.map((item) => `<option value="${item.area}">${item.area} - ${item.territory || item.city || "No territory"}</option>`).join("")
    : `<option value="">No area</option>`;
  areaSelect.value = areas.some((item) => item.area === selectedArea) ? selectedArea : areas[0]?.area || "";

  const selected = items.find((item) => item.state === stateSelect.value && item.area === areaSelect.value);
  if (managerInput) managerInput.value = selected?.assigned_manager || "";
}

function renderBeatPlans() {
  const rows = document.getElementById("adminBeatRows");
  const status = document.getElementById("beatPlanSyncStatus");
  if (!rows) return;
  if (status) status.textContent = "Refreshing cloud beat plans...";

  cloudSelect("beat_plans")
    .then((plans) => {
      if (status) status.textContent = `Cloud synced: ${plans.length} beat plans`;
      rows.innerHTML = plans.length
        ? plans
            .map((plan) => {
              return `
                <tr>
                  <td>${plan.sequence_no || "-"}</td>
                  <td><strong>${plan.title || "-"}</strong></td>
                  <td>${plan.assigned_to || "-"}</td>
                  <td>${plan.area || "-"}</td>
                  <td>${plan.customer || "-"}</td>
                  <td>${plan.planned_date || "-"}</td>
                  <td><span class="tag">${plan.status || "Planned"}</span></td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="7"><strong>No beat plans yet.</strong> Add rows in Supabase for testing.</td></tr>`;
    })
    .catch(() => {
      if (status) status.textContent = "Cloud beat plans failed to load.";
      rows.innerHTML = `<tr><td colspan="7">Cloud beat plans could not be loaded.</td></tr>`;
    });
}

function renderTasks() {
  const rows = document.getElementById("adminTaskRows");
  const status = document.getElementById("taskSyncStatus");
  if (!rows) return;
  if (status) status.textContent = "Refreshing cloud tasks...";

  cloudSelect("tasks")
    .then((tasks) => {
      if (status) status.textContent = `Cloud synced: ${tasks.length} tasks`;
      rows.innerHTML = tasks.length
        ? tasks
            .map((task) => {
              return `
                <tr>
                  <td><strong>${task.title || "-"}</strong></td>
                  <td>${task.assigned_to || "-"}</td>
                  <td>${task.priority || "-"}</td>
                  <td>${task.due_date || "-"}</td>
                  <td><span class="tag">${task.status || "Open"}</span></td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="5"><strong>No tasks yet.</strong> Add tasks in Supabase for testing.</td></tr>`;
    })
    .catch(() => {
      if (status) status.textContent = "Cloud tasks failed to load.";
      rows.innerHTML = `<tr><td colspan="5">Cloud tasks could not be loaded.</td></tr>`;
    });
}

function renderSchemes() {
  const list = document.getElementById("adminSchemeRows");
  if (!list) return;

  cloudSelect("schemes")
    .then((schemes) => {
      list.innerHTML = schemes.length
        ? schemes.map((scheme) => `
          <div class="master-item">
            <strong>${scheme.title || "-"}</strong>
            <span>${scheme.scheme_type || "Scheme"} | ${scheme.product || "All products"} | ${scheme.customer_segment || "All"}</span>
            <span>${scheme.rule_text || "-"}</span>
          </div>
        `).join("")
        : `<div class="master-item"><strong>No schemes yet</strong><span>Create a scheme from the builder.</span></div>`;
    })
    .catch(() => {
      list.innerHTML = `<div class="master-item"><strong>Cloud schemes failed to load</strong></div>`;
    });
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "Unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function renderGroup(targetId, groups) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const entries = Object.entries(groups);
  target.innerHTML = entries.length
    ? entries.map(([label, count]) => `<div class="master-item"><strong>${label}</strong><span>${count}</span></div>`).join("")
    : `<div class="master-item"><strong>No data yet</strong></div>`;
}

function renderReportDirectory() {
  const target = document.getElementById("adminReportDirectory");
  if (!target) return;
  const query = valueOf("adminReportSearch").toLowerCase();
  const reports = reportCatalog.filter(([id, title, detail]) => !query || [id, title, detail].join(" ").toLowerCase().includes(query));
  target.innerHTML = reports.length
    ? reports.map(([id, title, detail]) => `
      <div class="report-item" data-report-id="${id}">
        <strong>${id}. ${title}</strong>
        <span>${detail}</span>
      </div>
    `).join("")
    : `<div class="report-item"><strong>No report found</strong><span>Try performance, outlet, target, tracking, product, or scheme.</span></div>`;
}

function renderDiscountRows() {
  const target = document.getElementById("adminDiscountRows");
  if (!target) return;
  target.innerHTML = discountAssignments.length
    ? discountAssignments.map((item) => `
      <div class="master-item">
        <strong>${item.discount}% ${item.entity}</strong>
        <span>${item.fromLevel} to ${item.toLevel} | ${item.zone || "All zones"}</span>
      </div>
    `).join("")
    : `<div class="master-item"><strong>No discount assigned</strong><span>Assign scheme/discount level for testing.</span></div>`;
}

function renderTargets() {
  const list = document.getElementById("adminTargetRows");
  const status = document.getElementById("targetSyncStatus");
  if (!list) return;
  if (status) status.textContent = "Refreshing targets...";
  optionalCloudSelect("targets").then((items) => {
    if (status) status.textContent = `Cloud synced: ${items.length} targets`;
    list.innerHTML = items.length
      ? items.map((item) => {
          const target = Number(item.target_value || 0);
          const achieved = Number(item.achieved_value || 0);
          const percent = target ? Math.round((achieved / target) * 100) : 0;
          return `<div class="master-item"><strong>${item.user_name || "Team"} - ${percent}%</strong><span>${item.target_type || "Target"} | ${item.product || "All products"} | ${item.territory || "All territories"}</span><span>${money(achieved)} / ${money(target)} | ${item.period || "-"}</span></div>`;
        }).join("")
      : `<div class="master-item"><strong>No targets yet</strong><span>Create monthly, product-wise, territory, collection, or visit targets.</span></div>`;
  });
}

function renderPromotions() {
  const list = document.getElementById("adminPromotionRows");
  const status = document.getElementById("promotionSyncStatus");
  if (!list) return;
  if (status) status.textContent = "Refreshing promotions...";
  optionalCloudSelect("promotions").then((items) => {
    if (status) status.textContent = `Cloud synced: ${items.length} promotions`;
    list.innerHTML = items.length
      ? items.map((item) => `<div class="master-item"><strong>${item.title}</strong><span>${item.campaign_type || "Campaign"} | ${item.product || "All products"} | ${item.status || "Active"}</span><span>${item.notes || item.content_url || "-"}</span></div>`).join("")
      : `<div class="master-item"><strong>No promotion library yet</strong><span>Add focus products, new launches, visual aids, PDFs, or videos.</span></div>`;
  });
}

function renderAudits() {
  const list = document.getElementById("adminAuditRows");
  const status = document.getElementById("auditSyncStatus");
  if (!list) return;
  if (status) status.textContent = "Refreshing retail audits...";
  optionalCloudSelect("retail_audits").then((items) => {
    if (status) status.textContent = `Cloud synced: ${items.length} audit entries`;
    list.innerHTML = items.length
      ? items.map((item) => `<div class="master-item"><strong>${item.customer}</strong><span>${item.user_name || "-"} | Shelf share ${item.shelf_share || 0}% | ${item.stock_status || "-"}</span><span>Competitor: ${item.competitor || "-"} | ${item.merchandising_notes || "-"}</span></div>`).join("")
      : `<div class="master-item"><strong>No FMCG audits yet</strong><span>Capture shelf share, competitor, stockout, and merchandising notes.</span></div>`;
  });
}

function renderAnnouncements() {
  const list = document.getElementById("adminAnnouncementRows");
  const status = document.getElementById("commsSyncStatus");
  if (!list) return;
  if (status) status.textContent = "Refreshing communication...";
  optionalCloudSelect("announcements").then((items) => {
    if (status) status.textContent = `Cloud synced: ${items.length} announcements`;
    list.innerHTML = items.length
      ? items.map((item) => `<div class="master-item"><strong>${item.title}</strong><span>${item.audience || "All"} | ${item.priority || "Normal"} | ${item.status || "Published"}</span><span>${item.message || "-"}</span></div>`).join("")
      : `<div class="master-item"><strong>No announcements yet</strong><span>Publish circulars, training modules, team notices, and approvals.</span></div>`;
  });
}

function renderReports() {
  const status = document.getElementById("reportSyncStatus");
  if (status) status.textContent = "Refreshing cloud reports...";
  renderReportDirectory();

  Promise.all([
    cloudSelect("attendance"),
    cloudSelect("visits"),
    cloudSelect("orders"),
    cloudSelect("customers"),
    cloudSelect("products"),
    optionalCloudSelect("outlet_sessions")
  ])
    .then(([attendance, visits, orders, customers, products, outletSessions]) => {
      const sales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const outletMinutes = outletSessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0);
      const outletKm = outletSessions.reduce((sum, session) => sum + Number(session.km_travelled || 0), 0);
      const outletRows = document.getElementById("reportOutletRows");
      document.getElementById("reportAttendance").textContent = attendance.length;
      document.getElementById("reportVisits").textContent = visits.length;
      document.getElementById("reportOrders").textContent = orders.length;
      document.getElementById("reportSales").textContent = money(sales);
      document.getElementById("reportOutletTime").textContent = `${outletMinutes} min`;
      document.getElementById("reportKm").textContent = `${outletKm.toFixed(1)} km`;
      renderGroup("reportCustomerMix", groupCount(customers, "type"));
      renderGroup("reportVisitMix", groupCount(visits, "outcome"));
      renderGroup("reportUserMix", groupCount([...visits, ...orders, ...attendance, ...outletSessions], "user_name"));
      if (outletRows) {
        outletRows.innerHTML = outletSessions.length
          ? outletSessions
              .slice(0, 30)
              .map((session) => `
                <tr>
                  <td>${session.user_name || "-"}</td>
                  <td><strong>${session.customer || "-"}</strong><br><small>${session.area || "-"}</small></td>
                  <td>${session.check_in_time || "-"}</td>
                  <td>${session.check_out_time || "-"}</td>
                  <td>${session.duration_minutes || 0} min</td>
                  <td>${Number(session.km_travelled || 0).toFixed(1)}</td>
                  <td>${session.outcome || "-"}</td>
                </tr>
              `)
              .join("")
          : `<tr><td colspan="7"><strong>No outlet check-outs yet.</strong> Field user should Start Outlet Check-In and Check Out Outlet from mobile.</td></tr>`;
      }
      if (status) status.textContent = `Cloud synced: ${customers.length} customers, ${products.length} products, ${outletSessions.length} outlet sessions`;
    })
    .catch(() => {
      if (status) status.textContent = "Cloud reports failed to load.";
      const outletRows = document.getElementById("reportOutletRows");
      if (outletRows) outletRows.innerHTML = `<tr><td colspan="7">Cloud outlet report failed to load.</td></tr>`;
    });
}

async function renderMasterData() {
  const state = loadMobileState();
  const customerStatus = document.getElementById("customerSyncStatus");
  const productStatus = document.getElementById("productSyncStatus");

  if (customerStatus) customerStatus.textContent = "Refreshing cloud data...";
  if (productStatus) productStatus.textContent = "Refreshing cloud data...";

  try {
    const [customers, products] = await Promise.all([cloudSelect("customers"), cloudSelect("products")]);
    renderAdminCustomers(customers || []);
    renderAdminProducts(products || []);
    if (customerStatus) customerStatus.textContent = `Cloud synced: ${(customers || []).length} customers`;
    if (productStatus) productStatus.textContent = `Cloud synced: ${(products || []).length} products`;
  } catch {
    renderAdminCustomers(state.customers || []);
    renderAdminProducts(state.products || []);
    if (customerStatus) customerStatus.textContent = "Cloud refresh failed. Showing local browser data.";
    if (productStatus) productStatus.textContent = "Cloud refresh failed. Showing local browser data.";
  }
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.getElementById("adminLoginButton")?.addEventListener("click", async () => {
  const status = document.getElementById("adminLoginStatus");
  const email = valueOf("adminLoginEmail");
  const password = document.getElementById("adminLoginPassword")?.value || "";

  try {
    if (status) status.textContent = "Logging in...";
    const session = await signInWithPassword(email, password);
    await unlockAdmin(session);
    if (status) status.textContent = "";
  } catch (error) {
    adminAuthSession = null;
    localStorage.removeItem(adminAuthStorageKey);
    if (status) status.textContent = error.message === "Access denied" ? "Access denied" : "Login failed. Check email/password or profile.";
  }
});

document.querySelectorAll("[data-refresh-master]").forEach((button) => {
  button.addEventListener("click", renderMasterData);
});

document.querySelectorAll("[data-refresh-ops]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.refreshOps === "beatPlans") renderBeatPlans();
    if (button.dataset.refreshOps === "tasks") renderTasks();
    if (button.dataset.refreshOps === "territories") renderTerritories();
    if (button.dataset.refreshOps === "reports") renderReports();
    if (button.dataset.refreshOps === "targets") renderTargets();
    if (button.dataset.refreshOps === "promotions") renderPromotions();
    if (button.dataset.refreshOps === "audit") renderAudits();
    if (button.dataset.refreshOps === "comms") renderAnnouncements();
  });
});

document.getElementById("contextCreateButton")?.addEventListener("click", () => {
  const viewId = document.getElementById("contextCreateButton").dataset.contextView || "command";
  const config = contextActions[viewId];
  if (config?.target) focusAdminField(config.target);
  if (config?.action) config.action();
});

document.querySelectorAll("[data-download-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.downloadSample;
    if (!sampleCsv[key]) return;
    downloadCsv(key, sampleCsv[key]);
    adminToast("Sample CSV downloaded");
  });
});

document.querySelectorAll("[data-import-csv]").forEach((input) => {
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    const key = input.dataset.importCsv;
    try {
      await importCsvFile(key, file);
    } catch {
      adminToast("CSV import failed. Check columns or run latest SQL.");
    } finally {
      input.value = "";
    }
  });
});

document.getElementById("adminCustomerSearch")?.addEventListener("input", () => renderAdminCustomers(cachedCustomers));
document.getElementById("adminProductSearch")?.addEventListener("input", () => renderAdminProducts(cachedProducts));
document.getElementById("adminProductCategoryFilter")?.addEventListener("change", () => renderAdminProducts(cachedProducts));
document.getElementById("adminActiveSkuOnly")?.addEventListener("change", () => renderAdminProducts(cachedProducts));
document.getElementById("adminReportSearch")?.addEventListener("input", renderReportDirectory);
document.getElementById("transferFromState")?.addEventListener("change", () => populateTransferOptions(cachedTerritories));
document.getElementById("transferFromArea")?.addEventListener("change", () => populateTransferOptions(cachedTerritories));

document.getElementById("adminAssignDiscount")?.addEventListener("click", () => {
  discountAssignments.unshift({
    fromLevel: valueOf("discountFromLevel"),
    toLevel: valueOf("discountToLevel"),
    zone: valueOf("discountZone"),
    entity: valueOf("discountEntity"),
    discount: numberValue("discountPercent")
  });
  renderDiscountRows();
  adminToast("Discount assignment added");
});

document.getElementById("adminTransferArea")?.addEventListener("click", async () => {
  const selected = cachedTerritories.find((item) => item.state === valueOf("transferFromState") && item.area === valueOf("transferFromArea"));
  const toState = valueOf("transferToState");
  if (!selected || !toState) return adminToast("Select from area and to state");

  try {
    await cloudInsert("territories", {
      state: toState,
      city: valueOf("transferToCity") || selected.city,
      area: selected.area,
      territory: `${selected.area} transfer`,
      assigned_manager: valueOf("transferToManager") || selected.assigned_manager,
      status: "Transferred"
    });
    renderTerritories();
    adminToast("Area transfer saved");
  } catch {
    adminToast("Transfer failed. Run latest SQL if needed.");
  }
});

document.getElementById("adminSaveTarget")?.addEventListener("click", async () => {
  try {
    await cloudInsert("targets", {
      user_name: valueOf("targetUser"),
      role: "Field",
      target_type: valueOf("targetType"),
      product: valueOf("targetProduct"),
      territory: valueOf("targetTerritory"),
      target_value: numberValue("targetValue"),
      achieved_value: numberValue("targetAchieved"),
      period: valueOf("targetPeriod")
    });
    ["targetUser", "targetProduct", "targetTerritory", "targetPeriod"].forEach((id) => setValue(id));
    ["targetValue", "targetAchieved"].forEach((id) => setValue(id, "0"));
    renderTargets();
    adminToast("Target saved");
  } catch {
    adminToast("Target save failed. Run latest SQL.");
  }
});

document.getElementById("adminSavePromotion")?.addEventListener("click", async () => {
  const title = valueOf("promoTitle");
  if (!title) return adminToast("Promotion title required");

  try {
    await cloudInsert("promotions", {
      title,
      product: valueOf("promoProduct"),
      campaign_type: valueOf("promoType"),
      content_url: valueOf("promoUrl"),
      notes: valueOf("promoNotes"),
      status: "Active"
    });
    ["promoTitle", "promoProduct", "promoUrl", "promoNotes"].forEach((id) => setValue(id));
    renderPromotions();
    adminToast("Promotion saved");
  } catch {
    adminToast("Promotion save failed. Run latest SQL.");
  }
});

document.getElementById("adminSaveAudit")?.addEventListener("click", async () => {
  const customer = valueOf("auditCustomer");
  if (!customer) return adminToast("Outlet required");

  try {
    await cloudInsert("retail_audits", {
      user_name: valueOf("auditUser"),
      customer,
      shelf_share: numberValue("auditShelfShare"),
      competitor: valueOf("auditCompetitor"),
      stock_status: valueOf("auditStockStatus"),
      merchandising_notes: valueOf("auditNotes")
    });
    ["auditUser", "auditCustomer", "auditCompetitor", "auditNotes"].forEach((id) => setValue(id));
    setValue("auditShelfShare", "0");
    renderAudits();
    adminToast("Audit saved");
  } catch {
    adminToast("Audit save failed. Run latest SQL.");
  }
});

document.getElementById("adminSaveAnnouncement")?.addEventListener("click", async () => {
  const title = valueOf("announceTitle");
  if (!title) return adminToast("Announcement title required");

  try {
    await cloudInsert("announcements", {
      title,
      message: valueOf("announceMessage"),
      audience: valueOf("announceAudience"),
      priority: valueOf("announcePriority"),
      status: "Published"
    });
    ["announceTitle", "announceMessage"].forEach((id) => setValue(id));
    renderAnnouncements();
    adminToast("Announcement published");
  } catch {
    adminToast("Announcement failed. Run latest SQL.");
  }
});

document.getElementById("adminSaveProduct")?.addEventListener("click", async () => {
  const name = valueOf("adminProductName");
  if (!name) return adminToast("Product name required");
  if (!canManageMasterData()) return adminToast("Access denied");

  const payload = {
    name,
    composition: valueOf("adminProductComposition"),
    category: valueOf("adminProductCategory"),
    pack: valueOf("adminProductPack"),
    mrp: numberValue("adminProductMrp"),
    sale_rate: numberValue("adminProductSaleRate"),
    scheme: valueOf("adminProductScheme"),
    stock: numberValue("adminProductStock"),
    created_by: "Admin"
  };

  try {
    if (editingProductId) {
      await cloudUpdate("products", editingProductId, payload);
      adminToast("Product updated");
    } else {
      await cloudInsert("products", payload);
      adminToast("Product saved");
    }
    resetAdminProductForm();
    await renderMasterData();
  } catch (error) {
    adminToast("Product save failed");
  }
});

document.getElementById("adminSaveCustomer")?.addEventListener("click", async () => {
  const name = valueOf("adminCustomerName");
  if (!name) return adminToast("Customer name required");
  if (!canManageMasterData()) return adminToast("Access denied");

  const payload = {
    type: valueOf("adminCustomerType"),
    name,
    mobile: valueOf("adminCustomerMobile"),
    area: valueOf("adminCustomerArea"),
    customer_class: valueOf("adminCustomerClass"),
    specialty: valueOf("adminCustomerSpecialty"),
    outstanding: numberValue("adminCustomerOutstanding"),
    address: valueOf("adminCustomerState"),
    created_by: "Admin"
  };

  try {
    if (editingCustomerId) {
      await cloudUpdate("customers", editingCustomerId, payload);
      adminToast("Customer updated");
    } else {
      await cloudInsert("customers", payload);
      adminToast("Customer saved");
    }
    resetAdminCustomerForm();
    await renderMasterData();
  } catch (error) {
    adminToast("Customer save failed");
  }
});

document.getElementById("adminSaveTerritory")?.addEventListener("click", async () => {
  const state = valueOf("territoryState");
  const area = valueOf("territoryArea");
  if (!state || !area) return adminToast("State and area required");

  try {
    await cloudInsert("territories", {
      state,
      city: valueOf("territoryCity"),
      area,
      territory: valueOf("territoryName"),
      assigned_manager: valueOf("territoryManager")
    });
    ["territoryState", "territoryCity", "territoryArea", "territoryName", "territoryManager"].forEach((id) => setValue(id));
    renderTerritories();
    adminToast("Area saved");
  } catch (error) {
    adminToast("Area save failed. Run latest SQL.");
  }
});

document.getElementById("adminSaveBeat")?.addEventListener("click", async () => {
  const title = valueOf("beatTitle");
  if (!title) return adminToast("Beat title required");

  try {
    await cloudInsert("beat_plans", {
      title,
      assigned_to: valueOf("beatAssignedTo"),
      area: valueOf("beatArea"),
      customer: valueOf("beatCustomer"),
      planned_date: valueOf("beatDate") || new Date().toISOString().slice(0, 10),
      sequence_no: numberValue("beatSequence") || 1,
      status: "Planned"
    });
    ["beatTitle", "beatAssignedTo", "beatArea", "beatCustomer", "beatDate"].forEach((id) => setValue(id));
    setValue("beatSequence", "1");
    renderBeatPlans();
    adminToast("Beat plan saved");
  } catch (error) {
    adminToast("Beat plan save failed. Run latest SQL.");
  }
});

document.getElementById("adminSaveTask")?.addEventListener("click", async () => {
  const title = valueOf("taskTitle");
  if (!title) return adminToast("Task title required");

  try {
    await cloudInsert("tasks", {
      title,
      assigned_to: valueOf("taskAssignedTo"),
      priority: valueOf("taskPriority"),
      due_date: valueOf("taskDueDate") || new Date().toISOString().slice(0, 10),
      status: "Open"
    });
    ["taskTitle", "taskAssignedTo", "taskDueDate"].forEach((id) => setValue(id));
    renderTasks();
    adminToast("Task saved");
  } catch (error) {
    adminToast("Task save failed. Run latest SQL.");
  }
});

document.getElementById("adminSaveScheme")?.addEventListener("click", async () => {
  const title = valueOf("schemeTitle");
  if (!title) return adminToast("Scheme title required");

  try {
    await cloudInsert("schemes", {
      title,
      scheme_type: valueOf("schemeType"),
      product: valueOf("schemeProduct"),
      customer_segment: valueOf("schemeSegment"),
      rule_text: valueOf("schemeRule"),
      status: "Active"
    });
    ["schemeTitle", "schemeProduct"].forEach((id) => setValue(id));
    setValue("schemeRule", "Buy 10 units, get 2 free");
    renderSchemes();
    adminToast("Scheme saved");
  } catch (error) {
    adminToast("Scheme save failed. Run latest SQL.");
  }
});

function initializeAdminApp() {
  renderVisits();
  renderProducts();
  updateContextAction("command");
  renderMasterData();
  renderCommandCenter();
  renderCloudSales();
  renderBeatPlans();
  renderTasks();
  renderTerritories();
  renderSchemes();
  renderReportDirectory();
  renderDiscountRows();
  renderTargets();
  renderPromotions();
  renderAudits();
  renderAnnouncements();
  renderReports();
}

initializeExistingAdminSession();
