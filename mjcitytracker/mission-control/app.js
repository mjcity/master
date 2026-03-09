const stages = ["Intake", "Planning", "Execution", "Validation", "Delivery"];
let currentRun = null;
let eventSource = null;

const els = {
  taskInput: document.getElementById("taskInput"),
  dispatchBtn: document.getElementById("dispatchBtn"),
  simulateBtn: document.getElementById("simulateBtn"),
  taskTitle: document.getElementById("taskTitle"),
  taskSummary: document.getElementById("taskSummary"),
  progressFill: document.getElementById("progressFill"),
  stageSteps: document.getElementById("stageSteps"),
  logStream: document.getElementById("logStream"),
  artifactList: document.getElementById("artifactList"),
  activeTaskId: document.getElementById("activeTaskId"),
  currentStage: document.getElementById("currentStage"),
  completionPct: document.getElementById("completionPct"),
  workspaceStatus: document.getElementById("workspaceStatus"),
  agentLink: document.getElementById("agentLink"),
  runtimeStatus: document.getElementById("runtimeStatus"),
  assistantStatus: document.getElementById("assistantStatus"),
  metricTokens: document.getElementById("metricTokens"),
  metricFiles: document.getElementById("metricFiles"),
  metricTools: document.getElementById("metricTools"),
  metricErrors: document.getElementById("metricErrors"),
  clearLogsBtn: document.getElementById("clearLogsBtn")
};

function createStageSteps(activeIndex = -1) {
  els.stageSteps.innerHTML = "";
  stages.forEach((stage, index) => {
    const step = document.createElement("div");
    step.className = "stage-step" + (index < activeIndex ? " done" : index === activeIndex ? " active" : "");
    step.textContent = stage;
    els.stageSteps.appendChild(step);
  });
}

function addLog(tag, msg) {
  const line = document.createElement("div");
  line.className = "log-line";
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  line.innerHTML = `<span class="log-time">${now}</span><span class="log-tag">${tag}</span><span class="log-msg">${msg}</span>`;
  els.logStream.prepend(line);
}

function addArtifact(title, text) {
  const card = document.createElement("div");
  card.className = "artifact-item";
  card.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  els.artifactList.prepend(card);
}

function updateMetrics(metrics = {}) {
  els.metricTokens.textContent = metrics.tokens ?? 0;
  els.metricFiles.textContent = metrics.files ?? 0;
  els.metricTools.textContent = metrics.tools ?? 0;
  els.metricErrors.textContent = metrics.errors ?? 0;
}

function updateRunView(payload) {
  const stageIndex = stages.indexOf(payload.stage || "Intake");
  const progress = payload.progress ?? 0;
  els.taskTitle.textContent = payload.title || "Untitled Task";
  els.taskSummary.textContent = payload.summary || "OpenClaw is processing the objective.";
  els.activeTaskId.textContent = payload.id || "—";
  els.currentStage.textContent = payload.stage || "Idle";
  els.completionPct.textContent = `${progress}%`;
  els.progressFill.style.width = `${progress}%`;
  els.runtimeStatus.textContent = payload.status || "Running";
  els.agentLink.textContent = payload.connected ? "Linked" : "Waiting";
  if (els.assistantStatus) {
    els.assistantStatus.textContent = payload.progress === 100 ? "Delivered" : `${payload.stage || 'Working'} • ${payload.progress || 0}%`;
  }
  createStageSteps(stageIndex);
  updateMetrics(payload.metrics);
}

function startSimulation(taskText) {
  const taskId = `OC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const script = [
    {
      delay: 200,
      stage: "Intake",
      progress: 8,
      status: "Queued",
      summary: "Task has entered the intake channel and is being translated into an execution graph.",
      log: ["SYSTEM", "Task received and normalized."],
      metrics: { tokens: 182, files: 0, tools: 1, errors: 0 }
    },
    {
      delay: 1300,
      stage: "Planning",
      progress: 26,
      status: "Planning",
      summary: "OpenClaw is decomposing the work into checkpoints, dependencies, and live-visible substeps.",
      log: ["PLANNER", "Drafted execution tree and confidence-ranked paths."],
      artifact: ["Execution Plan", "5-stage runbook generated with dependency map."],
      metrics: { tokens: 549, files: 2, tools: 3, errors: 0 }
    },
    {
      delay: 2600,
      stage: "Execution",
      progress: 58,
      status: "Running",
      summary: "The system is editing files, testing assumptions, and emitting live trace messages to the workspace.",
      log: ["EXECUTOR", "Applying file updates and validating intermediate state."],
      artifact: ["Live Diff", "Frontend shell, telemetry hooks, and trace emitter updated."],
      metrics: { tokens: 1242, files: 7, tools: 6, errors: 0 }
    },
    {
      delay: 3900,
      stage: "Validation",
      progress: 81,
      status: "Reviewing",
      summary: "OpenClaw is checking whether the output matches the requested product, polish, and runtime expectations.",
      log: ["VALIDATOR", "Health checks passed. Surface polish and stream integrity confirmed."],
      artifact: ["Validation Report", "Smoke test complete. No blocking issues detected."],
      metrics: { tokens: 1710, files: 8, tools: 8, errors: 0 }
    },
    {
      delay: 5100,
      stage: "Delivery",
      progress: 100,
      status: "Complete",
      summary: "The task is complete. Artifacts are bundled and ready for handoff, deployment, or the next command.",
      log: ["DELIVERY", "Bundle prepared and published to output channel."],
      artifact: ["Final Bundle", "Deployment-ready package created for GitHub hosting."],
      metrics: { tokens: 1928, files: 10, tools: 9, errors: 0 }
    }
  ];

  els.workspaceStatus.textContent = "Live";
  currentRun = { id: taskId, title: taskText };
  script.forEach((step) => {
    setTimeout(() => {
      updateRunView({
        id: taskId,
        title: taskText,
        stage: step.stage,
        progress: step.progress,
        status: step.status,
        summary: step.summary,
        connected: true,
        metrics: step.metrics
      });
      if (step.log) addLog(step.log[0], step.log[1]);
      if (step.artifact) addArtifact(step.artifact[0], step.artifact[1]);
    }, step.delay);
  });
}

async function dispatchToBackend(taskText) {
  const endpoint = window.OPENCLAW_API || "http://localhost:8787/api/task";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: taskText })
    });

    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const data = await res.json();
    addLog("API", `Task dispatched to backend as ${data.id}.`);
    connectStream(data.id);
  } catch (error) {
    addLog("WARN", `Backend unavailable. Falling back to simulation. ${error.message}`);
    startSimulation(taskText);
  }
}

function connectStream(taskId) {
  if (eventSource) eventSource.close();
  const streamUrl = (window.OPENCLAW_STREAM || "http://localhost:8787/api/stream") + `?taskId=${encodeURIComponent(taskId)}`;

  try {
    eventSource = new EventSource(streamUrl);
    els.agentLink.textContent = "Linked";

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      updateRunView(payload);
      if (payload.log) addLog(payload.log.tag, payload.log.message);
      if (payload.artifact) addArtifact(payload.artifact.title, payload.artifact.text);
      if (payload.progress === 100) eventSource.close();
    };

    eventSource.onerror = () => {
      addLog("STREAM", "Live stream disconnected.");
      eventSource.close();
    };
  } catch (error) {
    addLog("WARN", `Could not open stream: ${error.message}`);
  }
}

els.dispatchBtn.addEventListener("click", () => {
  const taskText = els.taskInput.value.trim();
  if (!taskText) return addLog("INPUT", "Enter a task before dispatching.");
  dispatchToBackend(taskText);
});

els.simulateBtn.addEventListener("click", () => {
  const taskText = els.taskInput.value.trim() || "Solve a gnarly bug in an isometric tactics game and show every visible step.";
  startSimulation(taskText);
});

els.clearLogsBtn.addEventListener("click", () => {
  els.logStream.innerHTML = "";
  els.artifactList.innerHTML = "";
});

createStageSteps();
addLog("SYSTEM", "Mission Control initialized.");
addArtifact("Workspace", "Front-end shell loaded and awaiting OpenClaw connection.");
if (els.assistantStatus) els.assistantStatus.textContent = "Ready for incoming tasks";
