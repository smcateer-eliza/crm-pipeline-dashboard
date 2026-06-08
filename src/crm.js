const STAGE_ORDER = ["Qualified", "Discovery", "Proposal", "Negotiation", "Closed Won"];

const HEALTH_RISK = {
  Healthy: 0,
  Watch: 12,
  "At Risk": 24
};

export function enrichOpportunities(data) {
  return data.opportunities
    .map((opportunity) => {
      const account = findAccount(data, opportunity.accountId);
      const riskScore = scoreDealRisk(opportunity, account);
      const factors = riskFactors(opportunity, account);
      return {
        ...opportunity,
        account,
        weightedAmount: Math.round(opportunity.amount * (opportunity.probability / 100)),
        riskScore,
        riskLabel: riskLabel(riskScore),
        riskFactors: factors.filter((factor) => factor.active),
        forecastCategory: forecastCategory(opportunity, riskScore)
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore || b.amount - a.amount);
}

export function scoreDealRisk(opportunity, account) {
  const score = riskFactors(opportunity, account)
    .filter((factor) => factor.active)
    .reduce((sum, factor) => sum + factor.points, 0);
  return Math.min(score, 100);
}

export function riskFactors(opportunity, account) {
  const activityPoints = activityRiskPoints(opportunity.lastActivityDays);
  const healthPoints = HEALTH_RISK[account.health] ?? 0;

  return [
    {
      id: "stale-activity",
      label: "Stale activity",
      points: activityPoints,
      active: activityPoints > 0,
      description: activityDescription(opportunity.lastActivityDays)
    },
    {
      id: "missing-next-step",
      label: "Missing next step",
      points: 24,
      active: !opportunity.nextStep.trim(),
      description: "No next step is captured for the deal."
    },
    {
      id: "weak-contact-coverage",
      label: "Weak contact coverage",
      points: 16,
      active: opportunity.contactCoverage < 2,
      description: "Fewer than two contacts are attached to the opportunity."
    },
    {
      id: "close-date-pressure",
      label: "Close-date pressure",
      points: 12,
      active: daysUntil(opportunity.closeDate) <= 21 && opportunity.stage !== "Negotiation",
      description: "The close date is within 21 days but the deal is not in negotiation."
    },
    {
      id: "large-deal",
      label: "Large deal",
      points: 10,
      active: opportunity.amount >= 100000,
      description: "The opportunity is at least $100K."
    },
    {
      id: "account-health",
      label: "Account health",
      points: healthPoints,
      active: healthPoints > 0,
      description: `${account.name} is marked ${account.health}.`
    }
  ];
}

export function riskLabel(score) {
  if (score >= 70) return "Critical";
  if (score >= 45) return "High";
  if (score >= 20) return "Medium";
  return "Low";
}

export function forecastCategory(opportunity, riskScore) {
  if (riskScore >= 70) return "At Risk";
  if (opportunity.stage === "Negotiation" && opportunity.probability >= 65) return "Commit";
  if (opportunity.probability >= 45) return "Best Case";
  return "Pipeline";
}

export function summarizePipeline(data, owner = "all") {
  const opportunities = filterByOwner(enrichOpportunities(data), owner);
  const openTasks = filterTasksByOwner(data, owner).filter((task) => task.status === "open");

  return {
    openPipeline: opportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0),
    weightedPipeline: opportunities.reduce((sum, opportunity) => sum + opportunity.weightedAmount, 0),
    criticalDeals: opportunities.filter((opportunity) => opportunity.riskLabel === "Critical").length,
    overdueTasks: openTasks.filter((task) => isOverdue(task.dueDate)).length
  };
}

export function summarizeForecastCategories(data, owner = "all") {
  const opportunities = filterByOwner(enrichOpportunities(data), owner);
  const categories = ["Commit", "Best Case", "Pipeline", "At Risk"];

  return categories.map((category) => {
    const categoryOpportunities = opportunities.filter((opportunity) => opportunity.forecastCategory === category);
    return {
      category,
      amount: categoryOpportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0),
      count: categoryOpportunities.length
    };
  });
}

export function summarizeOwnerRisk(data, owner = "all") {
  const owners = owner === "all" ? summarizeOwners(data) : [owner];

  return owners.map((ownerName) => {
    const opportunities = filterByOwner(enrichOpportunities(data), ownerName);
    const openTasks = filterTasksByOwner(data, ownerName).filter((task) => task.status === "open");

    return {
      owner: ownerName,
      openPipeline: opportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0),
      weightedPipeline: opportunities.reduce((sum, opportunity) => sum + opportunity.weightedAmount, 0),
      highRiskDeals: opportunities.filter((opportunity) => ["High", "Critical"].includes(opportunity.riskLabel)).length,
      criticalDeals: opportunities.filter((opportunity) => opportunity.riskLabel === "Critical").length,
      overdueTasks: openTasks.filter((task) => isOverdue(task.dueDate)).length
    };
  });
}

export function summarizeOwners(data) {
  return [...new Set(data.accounts.map((account) => account.owner))].sort();
}

export function filterByOwner(opportunities, owner) {
  if (owner === "all") return opportunities;
  return opportunities.filter((opportunity) => opportunity.account.owner === owner);
}

export function accountSnapshot(data, accountId) {
  const account = findAccount(data, accountId);
  return {
    account,
    contacts: data.contacts.filter((contact) => contact.accountId === accountId),
    tasks: data.tasks.filter((task) => task.accountId === accountId),
    activities: data.activities.filter((activity) => activity.accountId === accountId)
  };
}

export function stageIndex(stage) {
  return STAGE_ORDER.indexOf(stage);
}

function findAccount(data, accountId) {
  return data.accounts.find((account) => account.id === accountId);
}

function filterTasksByOwner(data, owner) {
  if (owner === "all") return data.tasks;
  const accountIds = new Set(data.accounts.filter((account) => account.owner === owner).map((account) => account.id));
  return data.tasks.filter((task) => accountIds.has(task.accountId));
}

function activityRiskPoints(lastActivityDays) {
  if (lastActivityDays >= 21) return 30;
  if (lastActivityDays >= 14) return 18;
  if (lastActivityDays >= 7) return 8;
  return 0;
}

function activityDescription(lastActivityDays) {
  if (lastActivityDays >= 21) return "No activity has been logged for at least 21 days.";
  if (lastActivityDays >= 14) return "No activity has been logged for at least 14 days.";
  if (lastActivityDays >= 7) return "No activity has been logged for at least 7 days.";
  return "Recent activity is current.";
}

function daysUntil(dateString) {
  const today = new Date("2026-05-28T00:00:00");
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86_400_000);
}

function isOverdue(dateString) {
  return daysUntil(dateString) < 0;
}
