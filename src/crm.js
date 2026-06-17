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
      return {
        ...opportunity,
        account,
        weightedAmount: Math.round(opportunity.amount * (opportunity.probability / 100)),
        riskScore,
        riskReasons: riskReasonsForOpportunity(opportunity, account),
        riskLabel: riskLabel(riskScore),
        forecastCategory: forecastCategory(opportunity, riskScore)
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore || b.amount - a.amount);
}

export function scoreDealRisk(opportunity, account) {
  const score = riskReasonsForOpportunity(opportunity, account).reduce(
    (total, reason) => total + reason.scoreImpact,
    0
  );
  return Math.min(score, 100);
}

export function riskReasonsForOpportunity(opportunity, account) {
  const reasons = [];

  if (opportunity.lastActivityDays >= 21) {
    reasons.push({
      label: "No activity in 21+ days",
      scoreImpact: 30,
      source: "activity"
    });
  } else if (opportunity.lastActivityDays >= 14) {
    reasons.push({
      label: "No activity in 14+ days",
      scoreImpact: 18,
      source: "activity"
    });
  } else if (opportunity.lastActivityDays >= 7) {
    reasons.push({
      label: "No activity in 7+ days",
      scoreImpact: 8,
      source: "activity"
    });
  }

  if (!opportunity.nextStep.trim()) {
    reasons.push({
      label: "Missing next step",
      scoreImpact: 24,
      source: "nextStep"
    });
  }

  if (opportunity.contactCoverage < 2) {
    reasons.push({
      label: "Low contact coverage",
      scoreImpact: 16,
      source: "contacts"
    });
  }

  if (daysUntil(opportunity.closeDate) <= 21 && opportunity.stage !== "Negotiation") {
    reasons.push({
      label: "Closing soon before Negotiation",
      scoreImpact: 12,
      source: "closeDate"
    });
  }

  if (opportunity.amount >= 100000) {
    reasons.push({
      label: "Large deal",
      scoreImpact: 10,
      source: "amount"
    });
  }

  const accountHealthImpact = HEALTH_RISK[account.health] ?? 0;
  if (accountHealthImpact > 0) {
    reasons.push({
      label: `Account health: ${account.health}`,
      scoreImpact: accountHealthImpact,
      source: "accountHealth"
    });
  }

  return reasons.sort((a, b) => b.scoreImpact - a.scoreImpact);
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

function daysUntil(dateString) {
  const today = new Date("2026-05-28T00:00:00");
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86_400_000);
}

function isOverdue(dateString) {
  return daysUntil(dateString) < 0;
}
