const viewTitles = {
  command: "Manager Command Center",
  field: "Mobile Field App",
  visits: "Visit Management",
  sales: "Sales & Order Management",
  schemes: "Scheme Management",
  incentives: "Incentive Engine",
  gamify: "Gamification System",
  ai: "AI Sales Copilot"
};

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

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

renderVisits();
renderProducts();
