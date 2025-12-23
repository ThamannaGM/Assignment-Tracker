const palette = ["#B58463", "#845C66", "#6D4C41", "#8D6E63", "#3E2723", "#556B2F", "#8B4513", "#BC8F8F", "#607D8B", "#778899"];
const brownConfetti = ["#4e342e", "#5d4037", "#795548", "#8d6e63", "#a1887f"];

let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];

window.onload = () => {
  applyTheme();
  renderSubjects();
  renderTable();
};

const themeToggle = document.getElementById("themeToggle");
themeToggle.onclick = toggleTheme;

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function applyTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light Mode";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.shiftKey && e.key.toLowerCase() === "d") toggleTheme();
});

function renderSwatches() {
  const container = document.getElementById("swatchContainer");
  container.innerHTML = "";
  const usedColors = subjects.map(s => s.color.toUpperCase());

  palette.forEach(color => {
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.backgroundColor = color;
    if (usedColors.includes(color.toUpperCase())) {
      swatch.classList.add("disabled");
    } else {
      swatch.onclick = () => {
        document.querySelectorAll(".swatch").forEach(s => s.classList.remove("selected"));
        swatch.classList.add("selected");
        document.getElementById("newSubjectColor").value = color;
      };
    }
    container.appendChild(swatch);
  });
}

document.getElementById("addSubjectBtn").onclick = () => {
  const nameInput = document.getElementById("newSubject");
  const colorInput = document.getElementById("newSubjectColor");
  const name = nameInput.value.trim();
  const color = colorInput.value;
  if (!name || !color) return;
  subjects.push({ name, color });
  localStorage.setItem("subjects", JSON.stringify(subjects));
  nameInput.value = "";
  colorInput.value = "";
  renderSubjects();
};

function renderSubjects() {
  const list = document.getElementById("subjectList");
  const select = document.getElementById("subjectSelect");
  const filter = document.getElementById("filterSubject");
  list.innerHTML = "";
  select.innerHTML = '<option value="" disabled selected hidden>Select Subject</option>';
  filter.innerHTML = '<option value="">All Subjects</option>';

  subjects.forEach((s, idx) => {
    list.innerHTML += `<li style="background:${s.color}"><span>${s.name}</span><button class="delete-btn" style="color:white" onclick="deleteSubject(${idx})">×</button></li>`;
    select.innerHTML += `<option value="${s.name}">${s.name}</option>`;
    filter.innerHTML += `<option value="${s.name}">${s.name}</option>`;
  });
  renderSwatches();
}

function deleteSubject(idx) {
  subjects.splice(idx, 1);
  localStorage.setItem("subjects", JSON.stringify(subjects));
  renderSubjects();
}

document.getElementById("addBtn").onclick = () => {
  const subSelect = document.getElementById("subjectSelect");
  const nameInput = document.getElementById("assignment");
  const statusInput = document.getElementById("status");
  const dateInput = document.getElementById("dueDate");

  if (!subSelect.value || !nameInput.value || !dateInput.value) return;
  const color = subjects.find(s => s.name === subSelect.value).color;

  assignments.push({ 
    subject: subSelect.value, color, status: statusInput.value, 
    name: nameInput.value.trim(), dueDate: dateInput.value 
  });

  localStorage.setItem("assignments", JSON.stringify(assignments));
  
  if (statusInput.value === "Completed") {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: brownConfetti });
  }

  nameInput.value = "";
  dateInput.value = "";
  subSelect.selectedIndex = 0;
  statusInput.selectedIndex = 0;

  renderTable();
};

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";
  const filterSub = document.getElementById("filterSubject").value;
  const filterStat = document.getElementById("filterStatus").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  assignments.forEach((a, idx) => {
    if (filterSub && a.subject !== filterSub) return;
    if (filterStat && a.status !== filterStat) return;
    if (search && !a.name.toLowerCase().includes(search)) return;

    const days = Math.ceil((new Date(a.dueDate) - new Date()) / 86400000);
    const isSpecial = /\b(quiz|exam|midterm)\b/i.test(a.name);
    let dayHighlightClass = (days < 0) ? "overdue-highlight" : (days <= 3 ? "due-soon-highlight" : "");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Subject" class="edit-sub"><span style="background:${a.color}; color:white; padding:4px 10px; border-radius:20px; font-weight:bold; font-size:0.75rem;">${a.subject}</span></td>
      <td data-label="Status" class="edit-status">${a.status}</td>
      <td data-label="Assignment" class="edit-name"><span class="${isSpecial ? 'highlight-exam' : ''}">${a.name}</span></td>
      <td data-label="Days Left" class="${dayHighlightClass}">${days}</td>
      <td data-label="Due Date" class="edit-date">${a.dueDate}</td>
      <td><button class="delete-btn" onclick="deleteAssignment(${idx})">×</button></td>
    `;
    tableBody.appendChild(row);
    setupInlineEdits(row, a);
  });
}

function setupInlineEdits(row, assignment) {
    inlineEdit(row.querySelector(".edit-name"), assignment, "name");
    inlineEdit(row.querySelector(".edit-date"), assignment, "dueDate", "date");
    inlineEdit(row.querySelector(".edit-status"), assignment, "status", "select", ["Not Started", "Ongoing", "Completed"]);
    inlineEdit(row.querySelector(".edit-sub"), assignment, "subject", "select", subjects.map(s => s.name));
}

function inlineEdit(cell, assignment, key, type = "text", options = []) {
  cell.onclick = (e) => {
    e.stopPropagation();
    if (cell.querySelector("input") || cell.querySelector("select")) return;
    let input;
    if (type === "text" || type === "date") {
      input = document.createElement("input");
      input.type = type; input.value = assignment[key];
      cell.innerHTML = ""; cell.appendChild(input); input.focus();
      const save = () => { 
          assignment[key] = input.value || assignment[key]; 
          localStorage.setItem("assignments", JSON.stringify(assignments)); 
          renderTable(); 
      };
      input.onblur = save;
      input.onkeydown = (ev) => { if(ev.key === "Enter") save(); };
    } else if (type === "select") {
      input = document.createElement("select");
      options.forEach(o => { 
          const opt = document.createElement("option"); 
          opt.value = o; 
          opt.textContent = o; 
          if(o === assignment[key]) opt.selected = true; 
          input.appendChild(opt); 
      });
      cell.innerHTML = ""; cell.appendChild(input); input.focus();
      input.onchange = () => {
        assignment[key] = input.value;
        if (key === "subject") assignment.color = subjects.find(s => s.name === input.value).color;
        if (key === "status" && input.value === "Completed") confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: brownConfetti });
        localStorage.setItem("assignments", JSON.stringify(assignments));
        renderTable();
      };
    }
  };
}

function deleteAssignment(idx) {
  assignments.splice(idx, 1);
  localStorage.setItem("assignments", JSON.stringify(assignments));
  renderTable();
}

document.getElementById("clearAllBtn").onclick = () => {
  const confirmClear = confirm("Are you sure you want to delete ALL assignments? This cannot be undone.");
  
  if (confirmClear) {
    assignments = []; 
    localStorage.setItem("assignments", JSON.stringify(assignments));
    renderTable(); 
    
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.9 },
      colors: brownConfetti
    });
  }
};

document.getElementById("filterSubject").onchange = renderTable;
document.getElementById("filterStatus").onchange = renderTable;
document.getElementById("searchInput").oninput = renderTable;