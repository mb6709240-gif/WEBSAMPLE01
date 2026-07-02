(function () {
  "use strict";

  /* ---------- Date in header ---------- */
  const todayEl = document.getElementById("todayDate");
  todayEl.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  /* ---------- Elements ---------- */
  const form = document.getElementById("attendanceForm");
  const resetBtn = document.getElementById("resetBtn");
  const reportBody = document.getElementById("reportBody");
  const emptyState = document.getElementById("emptyState");
  const table = document.getElementById("reportTable");

  const fields = {
    empId: document.getElementById("empId"),
    empName: document.getElementById("empName"),
    department: document.getElementById("department"),
    workingDays: document.getElementById("workingDays"),
    presentDays: document.getElementById("presentDays"),
    leaveDays: document.getElementById("leaveDays"),
  };

  const records = []; // in-memory ledger

  /* ---------- Validation ---------- */
  function setError(key, message) {
    const errEl = document.getElementById("err-" + key);
    const inputEl = fields[key];
    if (message) {
      errEl.textContent = message;
      inputEl.classList.add("invalid");
    } else {
      errEl.textContent = "";
      inputEl.classList.remove("invalid");
    }
  }

  function validate() {
    let valid = true;

    const empId = fields.empId.value.trim();
    const empName = fields.empName.value.trim();
    const department = fields.department.value;
    const workingDays = fields.workingDays.value.trim();
    const presentDays = fields.presentDays.value.trim();
    const leaveDays = fields.leaveDays.value.trim();

    // Mandatory checks
    if (!empId) { setError("empId", "Employee ID is required."); valid = false; }
    else { setError("empId", ""); }

    if (!empName) { setError("empName", "Employee name is required."); valid = false; }
    else { setError("empName", ""); }

    if (!department) { setError("department", "Please select a department."); valid = false; }
    else { setError("department", ""); }

    if (workingDays === "") { setError("workingDays", "Working days is required."); valid = false; }
    else if (isNaN(workingDays) || Number(workingDays) <= 0) { setError("workingDays", "Enter a valid number."); valid = false; }
    else { setError("workingDays", ""); }

    if (presentDays === "") { setError("presentDays", "Present days is required."); valid = false; }
    else if (isNaN(presentDays) || Number(presentDays) < 0) { setError("presentDays", "Enter a valid number."); valid = false; }
    else { setError("presentDays", ""); }

    if (leaveDays === "") { setError("leaveDays", "Leave days is required."); valid = false; }
    else if (isNaN(leaveDays) || Number(leaveDays) < 0) { setError("leaveDays", "Enter a valid number."); valid = false; }
    else { setError("leaveDays", ""); }

    // Cross-field checks only if base numbers are valid so far
    if (valid) {
      const wd = Number(workingDays);
      const pd = Number(presentDays);
      const ld = Number(leaveDays);

      if (pd > wd) {
        setError("presentDays", "Present days cannot exceed working days.");
        valid = false;
      }
      if (ld > wd) {
        setError("leaveDays", "Leave days cannot exceed working days.");
        valid = false;
      }
      if (valid && (pd + ld) > wd) {
        setError("presentDays", "Present + Leave days cannot exceed working days.");
        valid = false;
      }
    }

    // Duplicate ID check
    if (valid && records.some(r => r.empId === empId)) {
      setError("empId", "This Employee ID is already logged.");
      valid = false;
    }

    return valid;
  }

  /* ---------- Calculation ---------- */
  function calcStatus(pct) {
    if (pct >= 90) return { label: "Excellent", cls: "excellent" };
    if (pct >= 75) return { label: "Good", cls: "good" };
    if (pct >= 50) return { label: "Average", cls: "average" };
    return { label: "Poor", cls: "poor" };
  }

  /* ---------- Render ---------- */
  function renderRow(record) {
    const tr = document.createElement("tr");
    tr.dataset.id = record.empId;

    const pctRounded = Math.round(record.pct * 10) / 10;
    const status = calcStatus(record.pct);

    tr.innerHTML = `
      <td class="cell-id">${escapeHtml(record.empId)}</td>
      <td class="cell-name">${escapeHtml(record.empName)}</td>
      <td>${escapeHtml(record.department)}</td>
      <td>${record.workingDays}</td>
      <td>${record.presentDays}</td>
      <td>${record.leaveDays}</td>
      <td>
        <div class="pct-cell">
          <span class="pct-cell__num">${pctRounded}%</span>
          <span class="pct-bar"><span class="pct-bar__fill" style="width:${Math.min(pctRounded,100)}%; background:var(--${status.cls})"></span></span>
        </div>
      </td>
      <td><span class="badge badge--${status.cls}">${status.label}</span></td>
      <td><button type="button" class="row-delete" title="Remove record" aria-label="Remove record for ${escapeHtml(record.empName)}">&times;</button></td>
    `;

    tr.querySelector(".row-delete").addEventListener("click", () => {
      const idx = records.findIndex(r => r.empId === record.empId);
      if (idx > -1) records.splice(idx, 1);
      tr.remove();
      updateStats();
      toggleEmptyState();
    });

    reportBody.appendChild(tr);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function toggleEmptyState() {
    const hasRows = records.length > 0;
    emptyState.style.display = hasRows ? "none" : "flex";
    table.style.display = hasRows ? "table" : "none";
  }

  function updateStats() {
    const count = records.length;
    document.getElementById("statCount").textContent = count;

    if (count === 0) {
      document.getElementById("statAvg").textContent = "0%";
      document.getElementById("statExcellent").textContent = "0";
      document.getElementById("statPoor").textContent = "0";
      return;
    }

    const avg = records.reduce((sum, r) => sum + r.pct, 0) / count;
    document.getElementById("statAvg").textContent = (Math.round(avg * 10) / 10) + "%";

    const excellentCount = records.filter(r => r.pct >= 90).length;
    const poorCount = records.filter(r => r.pct < 50).length;
    document.getElementById("statExcellent").textContent = excellentCount;
    document.getElementById("statPoor").textContent = poorCount;
  }

  /* ---------- Form submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validate()) return;

    const workingDays = Number(fields.workingDays.value);
    const presentDays = Number(fields.presentDays.value);
    const leaveDays = Number(fields.leaveDays.value);
    const pct = (presentDays / workingDays) * 100;

    const record = {
      empId: fields.empId.value.trim(),
      empName: fields.empName.value.trim(),
      department: fields.department.value,
      workingDays,
      presentDays,
      leaveDays,
      pct
    };

    records.push(record);
    renderRow(record);
    updateStats();
    toggleEmptyState();

    form.reset();
    fields.empId.focus();
  });

  resetBtn.addEventListener("click", function () {
    Object.keys(fields).forEach(setError.bind(null));
    Object.keys(fields).forEach(key => setError(key, ""));
  });

  /* ---------- Seed with example data from the brief ---------- */
  function seed() {
    const seedRows = [
      { empId: "101", empName: "Rahul", department: "Production", workingDays: 25, presentDays: 23, leaveDays: 2 },
      { empId: "102", empName: "Priya", department: "Quality Assurance", workingDays: 25, presentDays: 19, leaveDays: 6 },
    ];
    seedRows.forEach(r => {
      const pct = (r.presentDays / r.workingDays) * 100;
      const record = { ...r, pct };
      records.push(record);
      renderRow(record);
    });
    updateStats();
    toggleEmptyState();
  }

  seed();
})();