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

const calendarModal = document.getElementById("calendarModal");
const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");

let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

document.getElementById("calendarToggle").onclick = () => {
  calendarModal.classList.remove("hidden");
  renderCalendar();
};

document.getElementById("closeCalendar").onclick = () => {
  calendarModal.classList.add("hidden");
};

document.getElementById("prevMonth").onclick = () => {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
};

function renderCalendar() {
  calendarGrid.innerHTML = "";

  calendarTitle.textContent = new Date(calendarYear, calendarMonth)
    .toLocaleString("default", { month: "long", year: "numeric" });

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const todaysAssignments = assignments.filter(a => a.dueDate === dateStr);

    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.innerHTML = `<strong>${day}</strong>`;

    if (todaysAssignments.length) {
      cell.classList.add("has-task");

      todaysAssignments.forEach(a => {
        const isExam = /\b(exam|midterm|quiz)\b/i.test(a.name);
        if (isExam) cell.classList.add("exam-day");

        cell.innerHTML += `
          <div class="calendar-item">
            <span class="cal-subject" style="background:${a.color}">
              ${a.subject}
            </span>
            <span class="cal-name">${a.name}</span>
            <span class="cal-status">${a.status}</span>
          </div>
        `;
      });
    }

    calendarGrid.appendChild(cell);
  }
}

const monthViewBtn = document.getElementById("monthViewBtn");
const weekViewBtn = document.getElementById("weekViewBtn");

monthViewBtn.onclick = () => {
  monthViewBtn.classList.add("active");
  weekViewBtn.classList.remove("active");
  renderCalendar('month');
};

weekViewBtn.onclick = () => {
  weekViewBtn.classList.add("active");
  monthViewBtn.classList.remove("active");
  renderCalendar('week');
};

const todayBtn = document.getElementById("todayBtn");

document.getElementById("prevMonth").onclick = () => {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
};

todayBtn.onclick = () => {
  const now = new Date();
  calendarMonth = now.getMonth();
  calendarYear = now.getFullYear();
  renderCalendar();
};

function renderCalendar(viewType = 'month') {
  calendarGrid.innerHTML = "";

  calendarTitle.textContent = new Date(calendarYear, calendarMonth)
    .toLocaleString("default", { month: "long", year: "numeric" });

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  if (viewType === 'month') {
    // Fill empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "calendar-day empty";
      calendarGrid.appendChild(emptyDiv);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      addCalendarDay(day);
    }
  } else if (viewType === 'week') {
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - today.getDay()));
    for (let i = 0; i < 7; i++) addCalendarDay(start.getDate() + i, start.getMonth(), start.getFullYear());
  }
}

function addCalendarDay(day, month = calendarMonth, year = calendarYear) {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const todaysAssignments = assignments.filter(a => a.dueDate === dateStr);
  
  const now = new Date();
  const isToday = day === now.getDate() && 
                  month === now.getMonth() && 
                  year === now.getFullYear();

  const cell = document.createElement("div");
  cell.className = "calendar-day";
  if (isToday) cell.classList.add("today-highlight");

  cell.innerHTML = `<strong>${day}</strong>`;

  const dotContainer = document.createElement("div");
  dotContainer.className = "mobile-dots";

  if (todaysAssignments.length) {
    cell.classList.add("has-task");
    
    todaysAssignments.forEach(a => {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.backgroundColor = a.color;
      dotContainer.appendChild(dot);

      const isExam = /\b(exam|midterm|quiz)\b/i.test(a.name);
      if (isExam) cell.classList.add("exam-day");

      const item = document.createElement("div");
      item.className = "calendar-item";
      item.style.backgroundColor = a.color;
      item.innerHTML = `<span class="cal-text"><span class="cal-subject-name">${a.subject}:</span> ${a.name}</span>`;
      cell.appendChild(item);
    });
  }
  
  cell.appendChild(dotContainer);
  
  cell.onclick = () => {
    if (window.innerWidth <= 768 && todaysAssignments.length > 0) {
      showDayDetails(dateStr, todaysAssignments);
    }
  };

  calendarGrid.appendChild(cell);
}

function showDayDetails(date, tasks) {
  const overlay = document.createElement("div");
  overlay.className = "mobile-detail-overlay";
  
  const taskList = tasks.map(a => `
    <div class="detail-row" style="border-left: 5px solid ${a.color}">
      <p style="font-size: 0.7rem; text-transform: uppercase; color: #a1887f;">${a.subject}</p>
      <p style="font-weight: bold; margin: 2px 0;">${a.name}</p>
      <p style="font-size: 0.75rem; opacity: 0.8;">Status: ${a.status}</p>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="detail-content">
      <div class="detail-header">
        <h3>Tasks for ${new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h3>
        <button style="background:none; border:none; font-size: 1.2rem; cursor:pointer; color:inherit;" onclick="this.closest('.mobile-detail-overlay').remove()">✕</button>
      </div>
      ${taskList}
    </div>
  `;
  document.body.appendChild(overlay);
}


