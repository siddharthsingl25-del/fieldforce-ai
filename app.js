const viewTitles = {
  command: "Manager Command Center",
  field: "Mobile Field App",
  customers: "Customer Master",
  products: "Product Master",
  visits: "Visit Management",
  sales: "Sales & Order Management",
  schemes: "Scheme Management",
  incentives: "Incentive Engine",
  gamify: "Gamification System",
  ai: "AI Sales Copilot"
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

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewId);
  });

  document.getElementById("view-title").textContent = viewTitles[viewId];

  if (viewId === "customers" || viewId === "products") {
    renderMasterData();
  }
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

  const doctorTotal = customers.filter((customer) => customer.type === "Doctor").length;
  const retailerTotal = customers.filter((customer) => customer.type === "Retailer").length;
  const outstandingTotal = customers.reduce((sum, customer) => sum + Number(customer.outstanding || 0), 0);

  document.getElementById("adminCustomerTotal").textContent = customers.length;
  document.getElementById("adminDoctorTotal").textContent = doctorTotal;
  document.getElementById("adminRetailerTotal").textContent = retailerTotal;
  document.getElementById("adminOutstandingTotal").textContent = money(outstandingTotal);

  rows.innerHTML = customers.length
    ? customers
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

  const stockTotal = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const avgMrp = products.length ? products.reduce((sum, product) => sum + Number(product.mrp || 0), 0) / products.length : 0;
  const schemeTotal = products.filter((product) => product.scheme).length;

  document.getElementById("adminProductTotal").textContent = products.length;
  document.getElementById("adminStockTotal").textContent = stockTotal;
  document.getElementById("adminAvgMrp").textContent = money(avgMrp);
  document.getElementById("adminSchemeTotal").textContent = schemeTotal;

  rows.innerHTML = products.length
    ? products
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

renderVisits();
renderProducts();
renderMasterData();
