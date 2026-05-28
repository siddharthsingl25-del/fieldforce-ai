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

function cloudHeaders() {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json"
  };
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

async function cloudInsert(table, payload) {
  if (!cloudEnabled) return null;

  return requestJson(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...cloudHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
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
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="7"><strong>No customer data yet.</strong> Add customers from the mobile app, then refresh this page.</td>
      </tr>
    `;
}

function renderAdminProducts(products) {
  const rows = document.getElementById("adminProductRows");
  if (!rows) return;
  cachedProducts = products;
  const query = valueOf("adminProductSearch").toLowerCase();
  const visibleProducts = query
    ? products.filter((product) => [product.name, product.composition, product.category, product.pack, product.scheme, product.mrp, product.saleRate, product.sale_rate].join(" ").toLowerCase().includes(query))
    : products;

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
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td colspan="8"><strong>No product data yet.</strong> Add products from the mobile app, then refresh this page.</td>
      </tr>
    `;
}

function renderCloudSales() {
  const rows = document.getElementById("adminOrderRows");
  if (!rows) return;

  Promise.all([cloudSelect("orders"), cloudSelect("products")])
    .then(([orders, productItems]) => {
      const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const average = orders.length ? total / orders.length : 0;

      document.getElementById("salesOrderCount").textContent = orders.length;
      document.getElementById("salesOrderTotal").textContent = money(total);
      document.getElementById("salesProductCount").textContent = productItems.length;
      document.getElementById("salesAvgOrder").textContent = money(average);

      rows.innerHTML = orders.length
        ? orders
            .map((order) => {
              return `
                <tr>
                  <td><strong>${order.customer || "-"}</strong></td>
                  <td>${order.user_name || "-"}</td>
                  <td>${order.role || "-"}</td>
                  <td>${money(order.total)}</td>
                  <td>${order.order_time || "-"}</td>
                </tr>
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

function renderReports() {
  const status = document.getElementById("reportSyncStatus");
  if (status) status.textContent = "Refreshing cloud reports...";

  Promise.all([
    cloudSelect("attendance"),
    cloudSelect("visits"),
    cloudSelect("orders"),
    cloudSelect("customers"),
    cloudSelect("products")
  ])
    .then(([attendance, visits, orders, customers, products]) => {
      const sales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      document.getElementById("reportAttendance").textContent = attendance.length;
      document.getElementById("reportVisits").textContent = visits.length;
      document.getElementById("reportOrders").textContent = orders.length;
      document.getElementById("reportSales").textContent = money(sales);
      renderGroup("reportCustomerMix", groupCount(customers, "type"));
      renderGroup("reportVisitMix", groupCount(visits, "outcome"));
      renderGroup("reportUserMix", groupCount([...visits, ...orders, ...attendance], "user_name"));
      if (status) status.textContent = `Cloud synced: ${customers.length} customers, ${products.length} products`;
    })
    .catch(() => {
      if (status) status.textContent = "Cloud reports failed to load.";
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

document.querySelectorAll("[data-refresh-master]").forEach((button) => {
  button.addEventListener("click", renderMasterData);
});

document.querySelectorAll("[data-refresh-ops]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.refreshOps === "beatPlans") renderBeatPlans();
    if (button.dataset.refreshOps === "tasks") renderTasks();
    if (button.dataset.refreshOps === "territories") renderTerritories();
    if (button.dataset.refreshOps === "reports") renderReports();
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

document.getElementById("adminCustomerSearch")?.addEventListener("input", () => renderAdminCustomers(cachedCustomers));
document.getElementById("adminProductSearch")?.addEventListener("input", () => renderAdminProducts(cachedProducts));

document.getElementById("adminSaveProduct")?.addEventListener("click", async () => {
  const name = valueOf("adminProductName");
  if (!name) return adminToast("Product name required");

  try {
    await cloudInsert("products", {
      name,
      composition: valueOf("adminProductComposition"),
      category: valueOf("adminProductCategory"),
      pack: valueOf("adminProductPack"),
      mrp: numberValue("adminProductMrp"),
      sale_rate: numberValue("adminProductSaleRate"),
      scheme: valueOf("adminProductScheme"),
      stock: numberValue("adminProductStock"),
      created_by: "Admin"
    });
    ["adminProductName", "adminProductComposition", "adminProductCategory", "adminProductPack", "adminProductScheme"].forEach((id) => setValue(id));
    ["adminProductMrp", "adminProductSaleRate", "adminProductStock"].forEach((id) => setValue(id, "0"));
    renderMasterData();
    adminToast("Product saved");
  } catch (error) {
    adminToast("Product save failed");
  }
});

document.getElementById("adminSaveCustomer")?.addEventListener("click", async () => {
  const name = valueOf("adminCustomerName");
  if (!name) return adminToast("Customer name required");

  try {
    await cloudInsert("customers", {
      type: valueOf("adminCustomerType"),
      name,
      mobile: valueOf("adminCustomerMobile"),
      area: valueOf("adminCustomerArea"),
      customer_class: valueOf("adminCustomerClass"),
      specialty: valueOf("adminCustomerSpecialty"),
      outstanding: numberValue("adminCustomerOutstanding"),
      address: valueOf("adminCustomerState"),
      created_by: "Admin"
    });
    ["adminCustomerName", "adminCustomerMobile", "adminCustomerState", "adminCustomerArea", "adminCustomerSpecialty"].forEach((id) => setValue(id));
    setValue("adminCustomerOutstanding", "0");
    renderMasterData();
    adminToast("Customer saved");
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
renderReports();
