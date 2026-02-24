// script.js

// ====== Config ======
const GOAL = 50;

const TEAM_LABELS = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables",
};

const STORAGE_KEY = "intel_summit_checkin_v1";

// ====== DOM ======
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");

const greetingEl = document.getElementById("greeting");
const attendeeCountEl = document.getElementById("attendeeCount");
const progressBarEl = document.getElementById("progressBar");

const teamCountEls = {
  water: document.getElementById("waterCount"),
  zero: document.getElementById("zeroCount"),
  power: document.getElementById("powerCount"),
};

// ====== State ======
let totalCount = 0;
let teamCounts = { water: 0, zero: 0, power: 0 };
let attendees = []; // for LevelUp attendee list

// ====== Optional attendee list (auto-create container) ======
let attendeeListEl = document.getElementById("attendeeList");
if (!attendeeListEl) {
  attendeeListEl = document.createElement("div");
  attendeeListEl.id = "attendeeList";
  attendeeListEl.style.textAlign = "left";
  attendeeListEl.style.marginTop = "18px";
  attendeeListEl.style.paddingTop = "18px";
  attendeeListEl.style.borderTop = "2px solid #f1f5f9";

  const title = document.createElement("h3");
  title.textContent = "Attendees";
  title.style.color = "#64748b";
  title.style.fontSize = "16px";
  title.style.marginBottom = "12px";

  const list = document.createElement("ul");
  list.id = "attendeeListItems";
  list.style.listStyle = "none";
  list.style.padding = "0";
  list.style.margin = "0";
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "8px";

  attendeeListEl.appendChild(title);
  attendeeListEl.appendChild(list);

  // Put it under the team stats (inside .container)
  const container = document.querySelector(".container");
  container.appendChild(attendeeListEl);
}
const attendeeListItemsEl = document.getElementById("attendeeListItems");

// ====== Persistence ======
function saveState() {
  const payload = { totalCount, teamCounts, attendees };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);

    // Minimal safety checks
    totalCount = Number(parsed.totalCount) || 0;
    teamCounts = parsed.teamCounts || { water: 0, zero: 0, power: 0 };
    attendees = Array.isArray(parsed.attendees) ? parsed.attendees : [];
  } catch {
    // If storage is corrupted, ignore it
  }
}

// ====== UI ======
function showGreeting(message, isSuccess = true) {
  greetingEl.textContent = message;
  greetingEl.style.display = "block";

  // apply your success style
  if (isSuccess) greetingEl.classList.add("success-message");
  else greetingEl.classList.remove("success-message");
}

function updateCountsUI() {
  attendeeCountEl.textContent = totalCount;

  teamCountEls.water.textContent = teamCounts.water;
  teamCountEls.zero.textContent = teamCounts.zero;
  teamCountEls.power.textContent = teamCounts.power;
}

function updateProgressUI() {
  const percent = Math.min(100, (totalCount / GOAL) * 100);
  progressBarEl.style.width = `${percent}%`;
}

function renderAttendeeList() {
  // Rebuild list (simple + reliable)
  attendeeListItemsEl.innerHTML = "";

  attendees.forEach((a) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.padding = "10px 12px";
    li.style.border = "1px solid rgba(0,0,0,0.06)";
    li.style.borderRadius = "12px";
    li.style.background = "#ffffff";

    const left = document.createElement("span");
    left.textContent = a.name;
    left.style.fontWeight = "600";
    left.style.color = "#2c3e50";

    const right = document.createElement("span");
    right.textContent = a.teamLabel;
    right.style.color = "#64748b";
    right.style.fontWeight = "500";

    li.appendChild(left);
    li.appendChild(right);
    attendeeListItemsEl.appendChild(li);
  });
}

function getWinningTeamLabel() {
  const entries = Object.entries(teamCounts); // [ [key, count], ... ]
  let max = -Infinity;
  for (const [, count] of entries) max = Math.max(max, count);

  const winners = entries
    .filter(([, count]) => count === max)
    .map(([key]) => key);

  if (winners.length === 1) return TEAM_LABELS[winners[0]];

  // tie case
  return `Tie: ${winners.map((k) => TEAM_LABELS[k]).join(" & ")}`;
}

function checkGoalCelebration() {
  if (totalCount < GOAL) return;

  const winnerLabel = getWinningTeamLabel();
  showGreeting(`Goal reached! Winning team: ${winnerLabel}.`, true);
}

// One place to refresh everything
function syncUI() {
  updateCountsUI();
  updateProgressUI();
  renderAttendeeList();
}

// ====== App start ======
loadState();
syncUI();

// ====== Form handler ======
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const teamValue = teamSelect.value;

  if (!name) {
    showGreeting("Please enter a name.", false);
    return;
  }
  if (!TEAM_LABELS[teamValue]) {
    showGreeting("Please select a team.", false);
    return;
  }

  // Update state
  totalCount += 1;
  teamCounts[teamValue] += 1;

  const teamLabel = TEAM_LABELS[teamValue];
  attendees.push({ name, teamValue, teamLabel });

  // Update UI + storage
  showGreeting(`Welcome, ${name}! Checked in with ${teamLabel}.`, true);
  syncUI();
  saveState();

  // Celebration if goal reached
  checkGoalCelebration();

  // Reset for next attendee
  form.reset();
  nameInput.focus();
});
