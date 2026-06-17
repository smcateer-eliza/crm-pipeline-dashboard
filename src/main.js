import {
  enrichOpportunities,
  filterByOwner,
  summarizeOwners,
  summarizePipeline
} from "./crm.js";

const state = {
  crm: null,
  owner: "all"
};

const elements = {
  ownerFilter: document.querySelector("#owner-filter"),
  opportunityList: document.querySelector("#opportunity-list"),
  resultCount: document.querySelector("#result-count"),
  accountList: document.querySelector("#account-list"),
  metricOpen: document.querySelector("#metric-open"),
  metricWeighted: document.querySelector("#metric-weighted"),
  metricCritical: document.querySelector("#metric-critical"),
  metricOverdue: document.querySelector("#metric-overdue")
};

async function loadCrm() {
  const response = await fetchCrmData();
  state.crm = await response.json();
  populateOwnerFilter(state.crm);
  render();
}

async function fetchCrmData() {
  const response = await fetch("/api/crm");
  if (response.ok) return response;

  return fetch("data/crm.json");
}

function populateOwnerFilter(data) {
  const owners = summarizeOwners(data);

  for (const owner of owners) {
    const option = document.createElement("option");
    option.value = owner;
    option.textContent = owner;
    elements.ownerFilter.append(option);
  }
}

function render() {
  const opportunities = filterByOwner(enrichOpportunities(state.crm), state.owner);
  const metrics = summarizePipeline(state.crm, state.owner);

  elements.metricOpen.textContent = `$${formatCompact(metrics.openPipeline)}`;
  elements.metricWeighted.textContent = `$${formatCompact(metrics.weightedPipeline)}`;
  elements.metricCritical.textContent = metrics.criticalDeals;
  elements.metricOverdue.textContent = metrics.overdueTasks;
  elements.resultCount.textContent = `${opportunities.length} deal${opportunities.length === 1 ? "" : "s"}`;

  renderAccounts(state.crm.accounts, state.owner);
  renderOpportunities(opportunities);
}

function renderAccounts(accounts, owner) {
  const visibleAccounts = owner === "all" ? accounts : accounts.filter((account) => account.owner === owner);

  elements.accountList.replaceChildren(
    ...visibleAccounts.map((account) => {
      const row = document.createElement("article");
      row.className = "account-row";
      row.innerHTML = `
        <div>
          <strong>${account.name}</strong>
          <span>${account.owner}</span>
        </div>
        <p class="health health-${cssToken(account.health)}">${account.health}</p>
      `;
      return row;
    })
  );
}

function renderOpportunities(opportunities) {
  elements.opportunityList.replaceChildren(
    ...opportunities.map((opportunity) => {
      const card = document.createElement("article");
      card.className = "opportunity-card";
      card.innerHTML = `
        <div class="card-topline">
          <span class="risk risk-${opportunity.riskLabel.toLowerCase()}">${opportunity.riskLabel} risk</span>
          <span class="score">${opportunity.riskScore}</span>
        </div>
        <h3>${opportunity.name}</h3>
        <p class="message">${opportunity.nextStep || "No next step captured."}</p>
        <dl>
          <div><dt>Account</dt><dd>${opportunity.account.name}</dd></div>
          <div><dt>Stage</dt><dd>${opportunity.stage}</dd></div>
          <div><dt>Amount</dt><dd>$${formatCompact(opportunity.amount)}</dd></div>
          <div><dt>Weighted</dt><dd>$${formatCompact(opportunity.weightedAmount)}</dd></div>
        </dl>
        ${renderRiskReasons(opportunity)}
      `;
      return card;
    })
  );
}

function renderRiskReasons(opportunity) {
  if (opportunity.riskLabel === "Low") {
    return `<p class="risk-empty">No major risk drivers</p>`;
  }

  if (!opportunity.riskReasons.length) return "";

  return `
    <ul class="risk-reasons" aria-label="Risk drivers">
      ${opportunity.riskReasons.map((reason) => `<li>${reason.label}</li>`).join("")}
    </ul>
  `;
}

function formatCompact(value) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function cssToken(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

elements.ownerFilter.addEventListener("change", (event) => {
  state.owner = event.target.value;
  render();
});

loadCrm();
