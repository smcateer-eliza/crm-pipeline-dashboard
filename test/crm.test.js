import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  accountSnapshot,
  enrichOpportunities,
  filterByOwner,
  forecastCategory,
  riskReasonsForOpportunity,
  riskLabel,
  scoreDealRisk,
  summarizeOwners,
  summarizePipeline
} from "../src/crm.js";

const data = {
  accounts: [
    {
      id: "acct-a",
      name: "Enterprise Co",
      owner: "Maya Chen",
      health: "At Risk",
      arr: 400000
    },
    {
      id: "acct-b",
      name: "Healthy Co",
      owner: "Jordan Lee",
      health: "Healthy",
      arr: 90000
    }
  ],
  opportunities: [
    {
      id: "opp-a",
      accountId: "acct-a",
      name: "Expansion",
      stage: "Discovery",
      amount: 150000,
      probability: 40,
      closeDate: "2026-06-10",
      nextStep: "",
      lastActivityDays: 28,
      contactCoverage: 1
    },
    {
      id: "opp-b",
      accountId: "acct-b",
      name: "Automation",
      stage: "Negotiation",
      amount: 50000,
      probability: 70,
      closeDate: "2026-06-20",
      nextStep: "Send final pricing",
      lastActivityDays: 3,
      contactCoverage: 3
    }
  ],
  contacts: [
    {
      id: "contact-a",
      accountId: "acct-a",
      name: "Alex Buyer"
    }
  ],
  tasks: [
    {
      id: "task-a",
      accountId: "acct-a",
      dueDate: "2026-05-20",
      status: "open"
    },
    {
      id: "task-b",
      accountId: "acct-b",
      dueDate: "2026-06-01",
      status: "open"
    }
  ],
  activities: [
    {
      id: "activity-a",
      accountId: "acct-a",
      summary: "No sponsor confirmed."
    }
  ]
};

describe("scoreDealRisk", () => {
  it("scores stale, high-value deals with missing next steps as critical risk", () => {
    const score = scoreDealRisk(data.opportunities[0], data.accounts[0]);

    assert.equal(score, 100);
    assert.equal(riskLabel(score), "Critical");
  });

  it("keeps active negotiation deals low risk", () => {
    const score = scoreDealRisk(data.opportunities[1], data.accounts[1]);

    assert.equal(riskLabel(score), "Low");
  });
});

describe("riskReasonsForOpportunity", () => {
  it("returns sorted reason metadata with labels, score impacts, and sources", () => {
    const reasons = riskReasonsForOpportunity(data.opportunities[0], data.accounts[0]);

    assert.deepEqual(reasons, [
      {
        label: "No activity in 21+ days",
        scoreImpact: 30,
        source: "activity"
      },
      {
        label: "Missing next step",
        scoreImpact: 24,
        source: "nextStep"
      },
      {
        label: "Account health: At Risk",
        scoreImpact: 24,
        source: "accountHealth"
      },
      {
        label: "Low contact coverage",
        scoreImpact: 16,
        source: "contacts"
      },
      {
        label: "Closing soon before Negotiation",
        scoreImpact: 12,
        source: "closeDate"
      },
      {
        label: "Large deal",
        scoreImpact: 10,
        source: "amount"
      }
    ]);
  });

  it("treats whitespace-only next steps as missing", () => {
    const reasons = riskReasonsForOpportunity(
      {
        ...data.opportunities[1],
        nextStep: "   "
      },
      data.accounts[1]
    );

    assert.deepEqual(reasons, [
      {
        label: "Missing next step",
        scoreImpact: 24,
        source: "nextStep"
      }
    ]);
  });

  it("does not add close-date or unknown account-health reasons when they do not contribute", () => {
    const reasons = riskReasonsForOpportunity(
      {
        ...data.opportunities[1],
        closeDate: "2026-06-01"
      },
      {
        ...data.accounts[1],
        health: "Unknown"
      }
    );

    assert.deepEqual(reasons, []);
  });
});

describe("enrichOpportunities", () => {
  it("adds account, weighted amount, risk, and forecast details", () => {
    const opportunities = enrichOpportunities(data);

    assert.equal(opportunities[0].id, "opp-a");
    assert.equal(opportunities[0].account.name, "Enterprise Co");
    assert.equal(opportunities[0].weightedAmount, 60000);
    assert.equal(opportunities[0].forecastCategory, "At Risk");
  });

  it("adds sorted risk reasons to enriched opportunities", () => {
    const opportunities = enrichOpportunities(data);

    assert.deepEqual(
      opportunities[0].riskReasons.map((reason) => reason.source),
      ["activity", "nextStep", "accountHealth", "contacts", "closeDate", "amount"]
    );
    assert.deepEqual(opportunities[1].riskReasons, []);
  });
});

describe("forecastCategory", () => {
  it("classifies strong negotiation deals as commit", () => {
    assert.equal(forecastCategory(data.opportunities[1], 0), "Commit");
  });
});

describe("summarizePipeline", () => {
  it("summarizes pipeline and overdue tasks", () => {
    assert.deepEqual(summarizePipeline(data), {
      openPipeline: 200000,
      weightedPipeline: 95000,
      criticalDeals: 1,
      overdueTasks: 1
    });
  });

  it("can summarize one owner's book", () => {
    assert.deepEqual(summarizePipeline(data, "Jordan Lee"), {
      openPipeline: 50000,
      weightedPipeline: 35000,
      criticalDeals: 0,
      overdueTasks: 0
    });
  });
});

describe("owner and account helpers", () => {
  it("lists owners alphabetically", () => {
    assert.deepEqual(summarizeOwners(data), ["Jordan Lee", "Maya Chen"]);
  });

  it("filters enriched opportunities by owner", () => {
    const opportunities = enrichOpportunities(data);
    const mayaOpportunities = filterByOwner(opportunities, "Maya Chen");

    assert.deepEqual(
      mayaOpportunities.map((opportunity) => opportunity.id),
      ["opp-a"]
    );
    assert.equal(mayaOpportunities[0].riskReasons[0].label, "No activity in 21+ days");
  });

  it("returns account context for meeting prep style features", () => {
    const snapshot = accountSnapshot(data, "acct-a");

    assert.equal(snapshot.account.name, "Enterprise Co");
    assert.equal(snapshot.contacts.length, 1);
    assert.equal(snapshot.tasks.length, 1);
    assert.equal(snapshot.activities.length, 1);
  });
});
