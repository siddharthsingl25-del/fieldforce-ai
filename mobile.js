const storageKey = "fieldforce-mobile-demo";

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
  products: []
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

let state = loadState();

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

function renderCustomers() {
  const customerList = document.getElementById("customerList");
  document.getElementById("customerCount").textContent = `${state.customers.length} saved`;

  customerList.innerHTML = state.customers.length
    ? state.customers
        .slice()
        .reverse()
        .map((customer) => {
          return `
            <div class="master-item">
              <strong>${customer.name}</strong>
              <span>${customer.type} | ${customer.customerClass} | ${customer.area || "No area"}</span>
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
  document.getElementById("productCount").textContent = `${state.products.length} saved`;

  productList.innerHTML = state.products.length
    ? state.products
        .slice()
        .reverse()
        .map((product) => {
          return `
            <div class="master-item">
              <strong>${product.name}</strong>
              <span>${product.composition || "No composition"} | ${product.category || "No category"}</span>
              <span>MRP: ${money(product.mrp)} | Sale: ${money(product.saleRate)} | Stock: ${product.stock}</span>
              <span>Scheme: ${product.scheme || "No scheme"}</span>
            </div>
          `;
        })
        .join("")
    : `<div class="master-item"><strong>No products added</strong><span>Add product name, composition, MRP, sale rate, scheme, and stock.</span></div>`;
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

function clearProductForm() {
  document.getElementById("productName").value = "";
  document.getElementById("productComposition").value = "";
  document.getElementById("productCategory").value = "";
  document.getElementById("productPack").value = "";
  document.getElementById("productMrp").value = "0";
  document.getElementById("productSaleRate").value = "0";
  document.getElementById("productScheme").value = "";
  document.getElementById("productStock").value = "0";
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
  toast(state.checkedIn ? "Attendance checked in" : "Checked out");
});

document.getElementById("submitVisitButton").addEventListener("click", () => {
  state.visits.push({
    customer: "Shiv Medicos",
    outcome: document.getElementById("visitOutcome").value,
    notes: document.getElementById("visitNotes").value.trim(),
    time: currentTime()
  });
  saveState();
  renderHistory();
  toast("Visit report saved");
});

document.getElementById("bookOrderButton").addEventListener("click", () => {
  state.orders.push({
    customer: "Shiv Medicos",
    total: calculateOrderTotal(),
    time: currentTime()
  });
  saveState();
  renderHistory();
  toast("Order booked locally");
});

document.getElementById("saveCustomerButton").addEventListener("click", () => {
  const name = document.getElementById("customerName").value.trim();
  if (!name) {
    toast("Customer name required");
    return;
  }

  state.customers.push({
    type: document.getElementById("customerType").value,
    name,
    mobile: document.getElementById("customerMobile").value.trim(),
    area: document.getElementById("customerArea").value.trim(),
    customerClass: document.getElementById("customerClass").value,
    specialty: document.getElementById("customerSpecialty").value.trim(),
    outstanding: Number(document.getElementById("customerOutstanding").value || 0),
    address: document.getElementById("customerAddress").value.trim(),
    createdAt: currentTime()
  });

  saveState();
  renderCustomers();
  clearCustomerForm();
  toast("Customer saved");
});

document.getElementById("saveProductButton").addEventListener("click", () => {
  const name = document.getElementById("productName").value.trim();
  if (!name) {
    toast("Product name required");
    return;
  }

  state.products.push({
    name,
    composition: document.getElementById("productComposition").value.trim(),
    category: document.getElementById("productCategory").value.trim(),
    pack: document.getElementById("productPack").value.trim(),
    mrp: Number(document.getElementById("productMrp").value || 0),
    saleRate: Number(document.getElementById("productSaleRate").value || 0),
    scheme: document.getElementById("productScheme").value.trim(),
    stock: Number(document.getElementById("productStock").value || 0),
    createdAt: currentTime()
  });

  saveState();
  renderProducts();
  clearProductForm();
  toast("Product saved");
});

document.querySelectorAll(".qty-input").forEach((input) => {
  input.addEventListener("input", renderOrderTotal);
});

renderUser();
renderCheckIn();
renderHistory();
renderCustomers();
renderProducts();
renderOrderTotal();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The app still works online if service worker registration is unavailable.
    });
  });
}
