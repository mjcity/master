const storageKey = "ope_creator_calendar_v2";
const state = {
  current: new Date(),
  selectedDateKey: null,
  data: JSON.parse(localStorage.getItem(storageKey) || "{}"),
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const el = {
  monthTitle: document.getElementById("monthTitle"),
  labels: document.getElementById("calendarLabels"),
  grid: document.getElementById("calendarGrid"),
  selectedDateTitle: document.getElementById("selectedDateTitle"),
  didPost: document.getElementById("didPost"),
  didFilm: document.getElementById("didFilm"),
  didReturn: document.getElementById("didReturn"),
  spendInput: document.getElementById("spendInput"),
  contentType: document.getElementById("contentType"),
  dayNotes: document.getElementById("dayNotes"),
  postsMonth: document.getElementById("postsMonth"),
  filmMonth: document.getElementById("filmMonth"),
  budgetUsed: document.getElementById("budgetUsed"),
  mediaList: document.getElementById("mediaList"),
  enableCamMic: document.getElementById("enableCamMic"),
  photoInput: document.getElementById("photoInput"),
  videoInput: document.getElementById("videoInput"),
  fileInput: document.getElementById("fileInput"),
  addPhoto: document.getElementById("addPhoto"),
  addVideo: document.getElementById("addVideo"),
  addFile: document.getElementById("addFile"),
  saveHook: document.getElementById("saveHook"),
  hookInput: document.getElementById("hookInput"),
  hookList: document.getElementById("hookList"),
};

function dateKey(y, m, d) { return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
function saveState() { localStorage.setItem(storageKey, JSON.stringify(state.data)); }
function getEntry(key) {
  return state.data[key] || {
    posted: false, filmed: false, returned: false, spend: 0, notes: "", contentType: "", media: [], hooks: []
  };
}

function renderLabels() {
  el.labels.innerHTML = "";
  dayNames.forEach((name) => {
    const d = document.createElement("div");
    d.textContent = name;
    el.labels.appendChild(d);
  });
}

function renderCalendar() {
  const year = state.current.getFullYear();
  const month = state.current.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  el.monthTitle.textContent = state.current.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  el.grid.innerHTML = "";

  const today = new Date();
  const cells = [];

  for (let i = 0; i < startDay; i++) {
    const dayNum = daysInPrev - startDay + i + 1;
    cells.push({ y: year, m: month - 1, d: dayNum, faded: true });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ y: year, m: month, d, faded: false });
  while (cells.length < 42) {
    const d = cells.length - (startDay + daysInMonth) + 1;
    cells.push({ y: year, m: month + 1, d, faded: true });
  }

  cells.forEach(({ y, m, d, faded }) => {
    const real = new Date(y, m, d);
    const key = dateKey(real.getFullYear(), real.getMonth(), real.getDate());
    const entry = getEntry(key);
    const cell = document.createElement("div");
    cell.className = `day${faded ? " faded" : ""}${state.selectedDateKey === key ? " active" : ""}`;
    if (
      real.getFullYear() === today.getFullYear() &&
      real.getMonth() === today.getMonth() &&
      real.getDate() === today.getDate()
    ) cell.classList.add("today");

    cell.innerHTML = `<div class="day-number">${real.getDate()}</div>
      <div class="dots">
        <span class="dot ${entry.posted ? "posted" : ""}" title="Posted"></span>
        <span class="dot ${entry.filmed ? "filmed" : ""}" title="Filmed"></span>
        <span class="dot ${entry.returned ? "returned" : ""}" title="Returned"></span>
      </div>`;

    cell.addEventListener("click", () => {
      state.selectedDateKey = key;
      renderCalendar();
      loadSelectedDay();
    });

    el.grid.appendChild(cell);
  });

  if (!state.selectedDateKey) {
    state.selectedDateKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  }
  refreshStats();
}

function loadSelectedDay() {
  if (!state.selectedDateKey) return;
  const entry = getEntry(state.selectedDateKey);
  el.selectedDateTitle.textContent = `Editing: ${state.selectedDateKey}`;
  el.didPost.checked = !!entry.posted;
  el.didFilm.checked = !!entry.filmed;
  el.didReturn.checked = !!entry.returned;
  el.spendInput.value = Number(entry.spend || 0) ? Number(entry.spend).toFixed(2) : "";
  el.dayNotes.value = entry.notes || "";
  el.contentType.value = entry.contentType || "";
  renderMediaList(entry.media || []);
  renderHooks(entry.hooks || []);
}

function saveSelectedDay() {
  if (!state.selectedDateKey) return;
  const old = getEntry(state.selectedDateKey);
  state.data[state.selectedDateKey] = {
    posted: el.didPost.checked,
    filmed: el.didFilm.checked,
    returned: el.didReturn.checked,
    spend: Number(el.spendInput.value || 0),
    notes: el.dayNotes.value.trim(),
    contentType: el.contentType.value,
    media: old.media || [],
    hooks: old.hooks || [],
  };
  saveState();
  renderCalendar();
  loadSelectedDay();
}

function renderMediaList(media = []) {
  if (!media.length) {
    el.mediaList.innerHTML = '<div class="muted-sm">No uploads for this day yet.</div>';
    return;
  }
  el.mediaList.innerHTML = "";
  media.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "media-item";

    const left = document.createElement("div");
    left.className = "media-left";

    let thumb;
    if ((item.type || "").startsWith("image/")) {
      thumb = document.createElement("img");
      thumb.src = item.data;
      thumb.className = "thumb";
    } else if ((item.type || "").startsWith("video/")) {
      thumb = document.createElement("video");
      thumb.src = item.data;
      thumb.className = "thumb";
      thumb.muted = true;
    } else {
      thumb = document.createElement("div");
      thumb.className = "thumb";
      thumb.style.display = "grid";
      thumb.style.placeItems = "center";
      thumb.textContent = "📎";
    }

    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.innerHTML = `<strong>${item.name}</strong><small>${item.type || "file"}</small>`;

    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      const entry = getEntry(state.selectedDateKey);
      entry.media = (entry.media || []).filter((_, idx) => idx !== i);
      state.data[state.selectedDateKey] = entry;
      saveState();
      renderMediaList(entry.media);
    });

    left.appendChild(thumb);
    left.appendChild(meta);
    row.appendChild(left);
    row.appendChild(remove);
    el.mediaList.appendChild(row);
  });
}

function addFilesToDay(fileList) {
  if (!state.selectedDateKey || !fileList?.length) return;
  const entry = getEntry(state.selectedDateKey);
  entry.media = entry.media || [];
  [...fileList].forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      entry.media.push({ name: file.name, type: file.type, size: file.size, data: reader.result });
      state.data[state.selectedDateKey] = entry;
      saveState();
      renderMediaList(entry.media);
    };
    reader.readAsDataURL(file);
  });
}

function renderHooks(hooks = []) {
  if (!hooks.length) {
    el.hookList.innerHTML = '<div class="muted-sm">No hooks yet for this day.</div>';
    return;
  }
  el.hookList.innerHTML = "";
  hooks.forEach((hook, i) => {
    const item = document.createElement("div");
    item.className = "hook-item";
    item.innerHTML = `<span>${hook}</span>`;
    const del = document.createElement("button");
    del.className = "remove-btn";
    del.textContent = "Delete";
    del.onclick = () => {
      const entry = getEntry(state.selectedDateKey);
      entry.hooks = (entry.hooks || []).filter((_, idx) => idx !== i);
      state.data[state.selectedDateKey] = entry;
      saveState();
      renderHooks(entry.hooks || []);
    };
    item.appendChild(del);
    el.hookList.appendChild(item);
  });
}

function saveHook() {
  const v = el.hookInput.value.trim();
  if (!v || !state.selectedDateKey) return;
  const entry = getEntry(state.selectedDateKey);
  entry.hooks = entry.hooks || [];
  entry.hooks.unshift(v);
  state.data[state.selectedDateKey] = entry;
  saveState();
  el.hookInput.value = "";
  renderHooks(entry.hooks);
}

async function enableCameraMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => track.stop());
    alert("Camera + mic access granted for this browser.");
  } catch (err) {
    alert("Camera/mic access was blocked. You can allow it in browser settings.");
  }
}

function refreshStats() {
  const year = state.current.getFullYear(), month = state.current.getMonth();
  let posts = 0, films = 0, spend = 0;
  Object.entries(state.data).forEach(([k, v]) => {
    const [yy, mm] = k.split("-").map(Number);
    if (yy === year && mm === month + 1) {
      if (v.posted) posts += 1;
      if (v.filmed) films += 1;
      spend += Number(v.spend || 0);
    }
  });
  el.postsMonth.textContent = posts;
  el.filmMonth.textContent = films;
  el.budgetUsed.textContent = `$${spend.toFixed(2)}`;
  el.budgetUsed.style.color = spend > 60 ? "#d7263d" : "#111";
}

document.getElementById("prevMonth").addEventListener("click", () => {
  state.current = new Date(state.current.getFullYear(), state.current.getMonth() - 1, 1);
  renderCalendar();
  loadSelectedDay();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  state.current = new Date(state.current.getFullYear(), state.current.getMonth() + 1, 1);
  renderCalendar();
  loadSelectedDay();
});

document.getElementById("saveDay").addEventListener("click", saveSelectedDay);
el.enableCamMic.addEventListener("click", enableCameraMic);
el.addPhoto.addEventListener("click", () => el.photoInput.click());
el.addVideo.addEventListener("click", () => el.videoInput.click());
el.addFile.addEventListener("click", () => el.fileInput.click());
el.photoInput.addEventListener("change", (e) => addFilesToDay(e.target.files));
el.videoInput.addEventListener("change", (e) => addFilesToDay(e.target.files));
el.fileInput.addEventListener("change", (e) => addFilesToDay(e.target.files));
el.saveHook.addEventListener("click", saveHook);

renderLabels();
renderCalendar();
loadSelectedDay();
