const storageKey = "fieldforce-mobile-demo";

const mobileTitles = {
  "m-home": "Today",
  "m-beat": "Beat Plan",
  "m-visit": "Visit",
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
  orders: []
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
  }).format(value);
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

document.querySelectorAll(".bottom-nav button").forEach((button) => {
  button.addEventListener("click", () => showMobileView(button.dataset.mobileView));
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
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  });
  saveState();
  renderHistory();
  toast("Visit report saved");
});

document.getElementById("bookOrderButton").addEventListener("click", () => {
  state.orders.push({
    customer: "Shiv Medicos",
    total: calculateOrderTotal(),
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  });
  saveState();
  renderHistory();
  toast("Order booked locally");
});

document.querySelectorAll(".qty-input").forEach((input) => {
  input.addEventListener("input", renderOrderTotal);
});

renderUser();
renderCheckIn();
renderHistory();
renderOrderTotal();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The app still works online if service worker registration is unavailable.
    });
  });
}
