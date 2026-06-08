import {
  enrichOpportunities,
  filterByOwner,
  summarizeForecastCategories,
  summarizeOwnerRisk,
  summarizeOwners,
  summarizePipeline
} from "./crm.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const RISK_BANDS = [
  { label: "Low", range: "0-19", start: 0, end: 20 },
  { label: "Medium", range: "20-44", start: 20, end: 45 },
  { label: "High", range: "45-69", start: 45, end: 70 },
  { label: "Critical", range: "70-100", start: 70, end: 100 }
];

const state = {
  crm: null,
  owner: "all",
  view: "pipeline",
  selectedOpportunityId: null
};

const elements = {
  ownerFilter: document.querySelector("#owner-filter"),
  viewTabs: [...document.querySelectorAll(".view-tab")],
  viewSections: [...document.querySelectorAll("[data-view-panel]")],
  opportunityList: document.querySelector("#opportunity-list"),
  resultCount: document.querySelector("#result-count"),
  accountList: document.querySelector("#account-list"),
  metricOpen: document.querySelector("#metric-open"),
  metricWeighted: document.querySelector("#metric-weighted"),
  metricCritical: document.querySelector("#metric-critical"),
  metricOverdue: document.querySelector("#metric-overdue"),
  riskLegend: document.querySelector("#risk-legend"),
  riskMatrix: document.querySelector("#risk-matrix"),
  riskDetail: document.querySelector("#risk-detail"),
  riskResultCount: document.querySelector("#risk-result-count"),
  riskDealList: document.querySelector("#risk-deal-list"),
  forecastBreakdown: document.querySelector("#forecast-breakdown"),
  ownerSummaryTitle: document.querySelector("#owner-summary-title"),
  ownerRiskSummary: document.querySelector("#owner-risk-summary")
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
    elements.ownerFilter.append(createElement("option", { value: owner, text: owner }));
  }
}

function render() {
  const opportunities = filterByOwner(enrichOpportunities(state.crm), state.owner);
  ensureSelectedOpportunity(opportunities);
  const selectedOpportunity = opportunities.find((opportunity) => opportunity.id === state.selectedOpportunityId);
  const metrics = summarizePipeline(state.crm, state.owner);

  elements.metricOpen.textContent = `$${formatCompact(metrics.openPipeline)}`;
  elements.metricWeighted.textContent = `$${formatCompact(metrics.weightedPipeline)}`;
  elements.metricCritical.textContent = metrics.criticalDeals;
  elements.metricOverdue.textContent = metrics.overdueTasks;
  elements.resultCount.textContent = `${opportunities.length} deal${opportunities.length === 1 ? "" : "s"}`;
  elements.riskResultCount.textContent = `${opportunities.length} deal${opportunities.length === 1 ? "" : "s"}`;

  updateViewTabs();
  renderAccounts(state.crm.accounts, state.owner);
  renderOpportunities(opportunities);
  renderRiskDashboard(opportunities, selectedOpportunity);
}

function updateViewTabs() {
  for (const tab of elements.viewTabs) {
    const isActive = tab.dataset.view === state.view;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  }

  for (const section of elements.viewSections) {
    section.hidden = section.dataset.viewPanel !== state.view;
  }
}

function renderAccounts(accounts, owner) {
  const visibleAccounts = owner === "all" ? accounts : accounts.filter((account) => account.owner === owner);

  elements.accountList.replaceChildren(
    ...visibleAccounts.map((account) => {
      const row = createElement("article", { className: "account-row" });
      const body = createElement("div");
      body.append(
        createElement("strong", { text: account.name }),
        createElement("span", { text: account.owner })
      );
      row.append(body, createElement("p", { className: `health health-${healthCssToken(account.health)}`, text: account.health }));
      return row;
    })
  );
}

function renderOpportunities(opportunities) {
  elements.opportunityList.replaceChildren(
    ...opportunities.map((opportunity) => {
      const card = createElement("article", { className: "opportunity-card" });
      const topline = createElement("div", { className: "card-topline" });
      topline.append(
        createElement("span", {
          className: `risk risk-${riskCssToken(opportunity.riskLabel)}`,
          text: `${opportunity.riskLabel} risk`
        }),
        createElement("span", { className: "score", text: opportunity.riskScore })
      );

      card.append(
        topline,
        createElement("h3", { text: opportunity.name }),
        createElement("p", { className: "message", text: opportunity.nextStep || "No next step captured." }),
        definitionList([
          ["Account", opportunity.account.name],
          ["Stage", opportunity.stage],
          ["Amount", `$${formatCompact(opportunity.amount)}`],
          ["Weighted", `$${formatCompact(opportunity.weightedAmount)}`]
        ]),
        tagList([
          opportunity.forecastCategory,
          `${opportunity.probability}% probability`,
          `${opportunity.lastActivityDays} days since activity`,
          `${opportunity.contactCoverage} contacts`
        ])
      );
      return card;
    })
  );
}

function renderRiskDashboard(opportunities, selectedOpportunity) {
  renderRiskLegend();
  renderRiskMatrix(opportunities, selectedOpportunity);
  renderRiskDetails(selectedOpportunity);
  renderForecastBreakdown();
  renderOwnerRiskSummary();
  renderRiskDealList(opportunities);
}

function renderRiskLegend() {
  const riskItems = RISK_BANDS.map((band) => {
    const item = createElement("span", { className: "legend-item" });
    item.append(
      createElement("span", { className: `legend-swatch risk-bg-${riskCssToken(band.label)}` }),
      document.createTextNode(`${band.label} ${band.range}`)
    );
    return item;
  });

  const sizeItem = createElement("span", { className: "legend-item" });
  sizeItem.append(createElement("span", { className: "legend-bubble" }), document.createTextNode("Bubble size = weighted amount"));

  elements.riskLegend.replaceChildren(...riskItems, sizeItem);
}

function renderRiskMatrix(opportunities, selectedOpportunity) {
  if (opportunities.length === 0) {
    elements.riskMatrix.replaceChildren(emptyState("No deals match this owner filter."));
    return;
  }

  const width = 760;
  const height = 430;
  const margin = { top: 26, right: 28, bottom: 62, left: 76 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxAmount = roundedMax(Math.max(...opportunities.map((opportunity) => opportunity.amount)));
  const maxWeighted = Math.max(...opportunities.map((opportunity) => opportunity.weightedAmount), 1);

  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": "Deal risk matrix with risk score on the x-axis and deal amount on the y-axis"
  });

  for (const band of RISK_BANDS) {
    const x = scaleRisk(band.start, margin.left, plotWidth);
    const bandWidth = scaleRisk(band.end, margin.left, plotWidth) - x;
    svg.append(
      createSvgElement("rect", {
        class: `risk-band risk-band-${riskCssToken(band.label)}`,
        x,
        y: margin.top,
        width: bandWidth,
        height: plotHeight
      }),
      createSvgText(`${band.label} ${band.range}`, x + 8, margin.top + 18, "matrix-band-label")
    );
  }

  for (const value of [0, Math.round(maxAmount / 2), maxAmount]) {
    const y = scaleAmount(value, maxAmount, margin.top, plotHeight);
    svg.append(
      createSvgElement("line", { class: "matrix-gridline", x1: margin.left, x2: width - margin.right, y1: y, y2: y }),
      createSvgText(`$${formatCompact(value)}`, margin.left - 12, y + 4, "matrix-y-label", "end")
    );
  }

  for (const value of [0, 20, 45, 70, 100]) {
    const x = scaleRisk(value, margin.left, plotWidth);
    svg.append(
      createSvgElement("line", { class: "matrix-axis-tick", x1: x, x2: x, y1: height - margin.bottom, y2: height - margin.bottom + 6 }),
      createSvgText(String(value), x, height - margin.bottom + 24, "matrix-x-label", "middle")
    );
  }

  const yAxisTitle = createSvgText("Deal amount", 18, margin.top + plotHeight / 2, "matrix-axis-title", "middle");
  yAxisTitle.setAttribute("transform", `rotate(-90 18 ${margin.top + plotHeight / 2})`);

  svg.append(
    createSvgElement("line", {
      class: "matrix-axis",
      x1: margin.left,
      x2: width - margin.right,
      y1: height - margin.bottom,
      y2: height - margin.bottom
    }),
    createSvgElement("line", {
      class: "matrix-axis",
      x1: margin.left,
      x2: margin.left,
      y1: margin.top,
      y2: height - margin.bottom
    }),
    createSvgText("Risk score", margin.left + plotWidth / 2, height - 10, "matrix-axis-title", "middle"),
    yAxisTitle
  );

  for (const opportunity of opportunities) {
    const x = scaleRisk(opportunity.riskScore, margin.left, plotWidth);
    const y = scaleAmount(opportunity.amount, maxAmount, margin.top, plotHeight);
    const radius = bubbleRadius(opportunity.weightedAmount, maxWeighted);
    const isSelected = opportunity.id === selectedOpportunity?.id;
    const point = createSvgElement("g", {
      class: `risk-point ${isSelected ? "is-selected" : ""}`,
      role: "button",
      tabindex: "0",
      "aria-pressed": String(isSelected),
      "aria-label": `${opportunity.name}, ${opportunity.riskLabel} risk, score ${opportunity.riskScore}, amount $${formatCompact(opportunity.amount)}`
    });
    point.append(
      createSvgElement("circle", {
        class: `risk-bubble risk-bubble-${riskCssToken(opportunity.riskLabel)}`,
        cx: x,
        cy: y,
        r: radius
      }),
      createSvgText(String(opportunity.riskScore), x, y + 4, "risk-bubble-label", "middle")
    );
    point.addEventListener("click", () => selectOpportunity(opportunity.id));
    point.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectOpportunity(opportunity.id);
      }
    });
    svg.append(point);
  }

  elements.riskMatrix.replaceChildren(svg);
}

function renderRiskDetails(opportunity) {
  if (!opportunity) {
    elements.riskDetail.replaceChildren(emptyState("Select an owner with open deals to inspect risk details."));
    return;
  }

  const title = createElement("div", { className: "detail-title" });
  title.append(
    createElement("span", { className: `risk risk-${riskCssToken(opportunity.riskLabel)}`, text: `${opportunity.riskLabel} risk` }),
    createElement("span", { className: "score", text: opportunity.riskScore })
  );

  const factorList = createElement("div", { className: "factor-list" });
  if (opportunity.riskFactors.length === 0) {
    factorList.append(createElement("p", { className: "message", text: "No active risk drivers." }));
  } else {
    factorList.append(
      ...opportunity.riskFactors.map((factor) => {
        const row = createElement("article", { className: "factor-row" });
        row.append(
          createElement("strong", { text: factor.label }),
          createElement("span", { text: `+${factor.points}` }),
          createElement("p", { text: factor.description })
        );
        return row;
      })
    );
  }

  elements.riskDetail.replaceChildren(
    title,
    createElement("h2", { text: opportunity.name }),
    createElement("p", { className: "message", text: opportunity.nextStep || "No next step captured." }),
    definitionList([
      ["Account", opportunity.account.name],
      ["Owner", opportunity.account.owner],
      ["Stage", opportunity.stage],
      ["Forecast", opportunity.forecastCategory],
      ["Amount", `$${formatCompact(opportunity.amount)}`],
      ["Weighted", `$${formatCompact(opportunity.weightedAmount)}`],
      ["Close date", formatDate(opportunity.closeDate)],
      ["Probability", `${opportunity.probability}%`]
    ]),
    createElement("h3", { text: "Risk drivers" }),
    factorList
  );
}

function renderForecastBreakdown() {
  const categories = summarizeForecastCategories(state.crm, state.owner);
  const totalAmount = categories.reduce((sum, category) => sum + category.amount, 0);

  elements.forecastBreakdown.replaceChildren(
    ...categories.map((category) => {
      const row = createElement("article", { className: "forecast-row" });
      const top = createElement("div", { className: "summary-row-top" });
      top.append(
        createElement("strong", { text: category.category }),
        createElement("span", { text: `$${formatCompact(category.amount)}` })
      );

      const track = createElement("div", { className: "bar-track" });
      const fill = createElement("span", { className: `bar-fill forecast-${forecastCssToken(category.category)}` });
      fill.style.width = `${totalAmount === 0 ? 0 : Math.round((category.amount / totalAmount) * 100)}%`;
      track.append(fill);

      row.append(top, track, createElement("p", { text: `${category.count} deal${category.count === 1 ? "" : "s"}` }));
      return row;
    })
  );
}

function renderOwnerRiskSummary() {
  const summaries = summarizeOwnerRisk(state.crm, state.owner);
  elements.ownerSummaryTitle.textContent = state.owner === "all" ? "Owner Risk Summary" : "Owner Risk Focus";

  elements.ownerRiskSummary.replaceChildren(
    ...summaries.map((summary) => {
      const row = createElement("article", { className: "owner-summary-row" });
      row.append(
        createElement("strong", { text: summary.owner }),
        metricPair("Open", `$${formatCompact(summary.openPipeline)}`),
        metricPair("Weighted", `$${formatCompact(summary.weightedPipeline)}`),
        metricPair("High/Critical", summary.highRiskDeals),
        metricPair("Overdue", summary.overdueTasks)
      );
      return row;
    })
  );
}

function renderRiskDealList(opportunities) {
  if (opportunities.length === 0) {
    elements.riskDealList.replaceChildren(emptyState("No deals match this owner filter."));
    return;
  }

  elements.riskDealList.replaceChildren(
    ...opportunities.map((opportunity) => {
      const row = createElement("button", {
        className: `risk-deal-row ${opportunity.id === state.selectedOpportunityId ? "is-selected" : ""}`,
        type: "button"
      });
      row.setAttribute("aria-pressed", String(opportunity.id === state.selectedOpportunityId));
      row.addEventListener("click", () => selectOpportunity(opportunity.id));
      row.append(
        createElement("span", { className: `risk-dot risk-bg-${riskCssToken(opportunity.riskLabel)}` }),
        createElement("strong", { text: opportunity.name }),
        createElement("span", { text: opportunity.account.name }),
        createElement("span", { text: `$${formatCompact(opportunity.amount)}` }),
        createElement("span", { text: `${opportunity.riskScore} score` })
      );
      return row;
    })
  );
}

function selectOpportunity(opportunityId) {
  state.selectedOpportunityId = opportunityId;
  render();
}

function ensureSelectedOpportunity(opportunities) {
  if (opportunities.length === 0) {
    state.selectedOpportunityId = null;
    return;
  }

  if (opportunities.some((opportunity) => opportunity.id === state.selectedOpportunityId)) return;

  state.selectedOpportunityId = opportunities[0].id;
}

function definitionList(items) {
  const list = createElement("dl");
  for (const [term, description] of items) {
    const item = createElement("div");
    item.append(createElement("dt", { text: term }), createElement("dd", { text: description }));
    list.append(item);
  }
  return list;
}

function tagList(items) {
  const list = createElement("div", { className: "tags" });
  list.append(...items.map((item) => createElement("span", { text: item })));
  return list;
}

function metricPair(label, value) {
  const item = createElement("span", { className: "metric-pair" });
  item.append(createElement("small", { text: label }), createElement("strong", { text: value }));
  return item;
}

function emptyState(message) {
  return createElement("p", { className: "empty-state", text: message });
}

function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.type) element.type = options.type;
  if (options.value) element.value = options.value;
  return element;
}

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function createSvgText(text, x, y, className, anchor = "start") {
  const element = createSvgElement("text", { x, y, class: className, "text-anchor": anchor });
  element.textContent = text;
  return element;
}

function scaleRisk(score, left, width) {
  return left + (Math.max(0, Math.min(Number(score), 100)) / 100) * width;
}

function scaleAmount(amount, maxAmount, top, height) {
  return top + (1 - Math.max(0, Math.min(Number(amount), maxAmount)) / maxAmount) * height;
}

function roundedMax(value) {
  const step = value > 100000 ? 50000 : 25000;
  return Math.max(step, Math.ceil(value / step) * step);
}

function bubbleRadius(weightedAmount, maxWeighted) {
  const ratio = Math.max(0, Math.min(Number(weightedAmount) / maxWeighted, 1));
  return Math.round(8 + ratio * 14);
}

function formatCompact(value) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(value) {
  return Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function riskCssToken(value) {
  const tokens = {
    Low: "low",
    Medium: "medium",
    High: "high",
    Critical: "critical"
  };
  return tokens[value] ?? "low";
}

function healthCssToken(value) {
  const tokens = {
    Healthy: "healthy",
    Watch: "watch",
    "At Risk": "at-risk"
  };
  return tokens[value] ?? "watch";
}

function forecastCssToken(value) {
  const tokens = {
    Commit: "commit",
    "Best Case": "best-case",
    Pipeline: "pipeline",
    "At Risk": "at-risk"
  };
  return tokens[value] ?? "pipeline";
}

for (const tab of elements.viewTabs) {
  tab.addEventListener("click", () => {
    state.view = tab.dataset.view;
    render();
  });
}

elements.ownerFilter.addEventListener("change", (event) => {
  state.owner = event.target.value;
  render();
});

loadCrm();
