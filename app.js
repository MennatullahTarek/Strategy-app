// === Load JSON data ===
let appData = {};
let currentCenter = '';
let currentSection = 'dashboard';
let chartInstances = {};

// === Load data from JSON and initialize app ===
document.addEventListener('DOMContentLoaded', async function () {
  try {
    const response = await fetch('dashboard_data.json');
    appData = await response.json();

    initializeRouter();
    initializeNavigation();
    initializeCenterSelector();
    initializeMobileMenu();
    initializeFeedbackModal();
    loadDashboard();
    updateKPIs();
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

function initializeRouter() {
  function handleRoute() {
    const hash = window.location.hash.substring(2);
    if (hash && hash !== currentSection) {
      switchSection(hash);
    }
  }
  window.addEventListener('hashchange', handleRoute);
  if (!window.location.hash) window.location.hash = '#/dashboard';
  handleRoute();
}

function initializeNavigation() {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const section = button.dataset.section;
      switchSection(section);
      window.location.hash = `#/${section}`;
      document
        .querySelectorAll('.nav-btn')
        .forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
}

function switchSection(sectionName) {
  document
    .querySelectorAll('section')
    .forEach((section) => section.classList.remove('active'));
  const target = document.getElementById(`${sectionName}-section`);
  if (target) {
    target.classList.add('active');
    currentSection = sectionName;
    switch (sectionName) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'okrs':
        renderOKRs();
        break;
      case 'projects':
        renderKPIs();
        break;
      case 'training':
        renderCurriculum();
        break;
      case 'analytics':
        renderRisks();
        break;
    }
  }
}

function initializeCenterSelector() {
  const selector = document.getElementById('centerSelector');
  if (!selector) return;

  const departments = [
    ...new Set(appData.okr_performance.map((okr) => okr.department)),
  ];
  departments.forEach((dep) => {
    const opt = document.createElement('option');
    opt.value = dep;
    opt.textContent = dep;
    selector.appendChild(opt);
  });

  selector.addEventListener('change', (e) => {
    currentCenter = e.target.value;
    updateKPIs();
    switchSection(currentSection);
  });
}

function getFilteredData() {
  if (!currentCenter || currentCenter === '') return appData;
  return {
    okr_performance: appData.okr_performance.filter(
      (o) => o.department === currentCenter || o.department === 'All'
    ),
    kpi_performance: appData.kpi_performance.filter(
      (k) => k.department === currentCenter
    ),
    curriculum_data: appData.curriculum_data.filter(
      (c) => c.department === currentCenter
    ),
    risk_data: appData.risk_data,
  };
}

function updateKPIs() {
  const data = getFilteredData();

  document.getElementById('activeOkrs').textContent =
    data.okr_performance.length;
  document.getElementById('totalKpis').textContent =
    data.kpi_performance.length;
  document.getElementById('approvedCurriculum').textContent =
    data.curriculum_data.filter((c) => c.approved === 'Y').length;
  document.getElementById('activeRisks').textContent = data.risk_data.filter(
    (r) => r.status === 'Active'
  ).length;

  const avgProgress =
    data.okr_performance.reduce((sum, o) => sum + o.progress_percentage, 0) /
      data.okr_performance.length || 0;
  document.getElementById('avgProgress').textContent = `${Math.round(
    avgProgress
  )}%`;
}

function loadDashboard() {
  updateKPIs();
  renderChart('okrProgressChart', getBarDataFromOKRs(), 'bar');
  renderChart('kpiPerformanceChart', getBarDataFromKPIs(), 'bar');
  renderChart('riskDistributionChart', getPieDataFromRisks(), 'pie');
}

function renderOKRs() {
  const tbody = document.getElementById('okrTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const data = getFilteredData().okr_performance;
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${row.level}</td>
            <td>${row.department}</td>
            <td>${row.objective_title}</td>
            <td>${row.key_result_description}</td>
            <td>${row.progress_percentage}%</td>
            <td>${row.status}</td>
            <td>${row.owner}</td>
            <td>${row.islamic_value}</td>
            <td>${row.quarter}</td>
            <td><button onclick="alert('Edit coming soon')">Edit</button></td>
        `;
    tbody.appendChild(tr);
  });
  renderChart('okrStatusChart', getPieDataFromOKRs(data), 'pie');
}

function renderKPIs() {
  const tbody = document.getElementById('kpiTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const data = getFilteredData().kpi_performance;
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${row.objective}</td>
            <td>${row.kpi}</td>
            <td>${row.target}</td>
            <td>${row.current}</td>
            <td>${row.progress}%</td>
            <td>${row.trend}</td>
            <td>${row.department}</td>
            <td><button>Edit</button></td>
        `;
    tbody.appendChild(tr);
  });
  renderChart('kpiDepartmentChart', getBarDataFromKPIs(), 'bar');
  renderChart('kpiTrendChart', getPieDataFromKPITrends(data), 'pie');
}

function renderCurriculum() {
  const tbody = document.getElementById('curriculumTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const data = getFilteredData().curriculum_data;
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${row.department}</td>
            <td>${row.curriculum_title}</td>
            <td>${row.submitted}</td>
            <td>${row.reviewed}</td>
            <td>${row.approved}</td>
            <td>${row.mentors_trained}</td>
            <td>${row.training_completion}%</td>
            <td>${row.implementation_status}</td>
            <td><button>Edit</button></td>
        `;
    tbody.appendChild(tr);
  });
  renderChart('curriculumStatusChart', getPieDataFromCurriculum(data), 'pie');
  renderChart('trainingChart', getBarDataFromTraining(data), 'bar');
  renderChart('mentorsChart', getBarDataFromMentors(data), 'bar');
}

function renderRisks() {
  const tbody = document.getElementById('riskTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const data = getFilteredData().risk_data;
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${row.risk_category}</td>
            <td>${row.risk_event}</td>
            <td>${row.probability}</td>
            <td>${row.impact}</td>
            <td>${row.risk_score}</td>
            <td>${row.status}</td>
            <td>${row.response_strategy}</td>
            <td>${row.owner}</td>
            <td>${row.due_date}</td>
            <td><button>Edit</button></td>
        `;
    tbody.appendChild(tr);
  });
  renderChart('riskScoreChart', getBarDataFromRiskScores(data), 'bar');
  renderChart('riskCategoryChart', getPieDataFromRiskCategories(data), 'pie');
  renderChart('riskResponseChart', getPieDataFromRiskResponses(data), 'pie');
}

// === Utility chart renderers and data transformers go here ===
function renderChart(canvasId, chartData, type = 'bar') {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
  chartInstances[canvasId] = new Chart(ctx, {
    type,
    data: chartData.data,
    options: chartData.options || {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function getBarDataFromOKRs() {
  const data = getFilteredData().okr_performance;
  const grouped = {};
  data.forEach(
    (o) => (grouped[o.department] = (grouped[o.department] || []).concat(o))
  );
  const labels = Object.keys(grouped);
  const values = labels.map((dep) =>
    Math.round(
      grouped[dep].reduce((sum, o) => sum + o.progress_percentage, 0) /
        grouped[dep].length
    )
  );
  return {
    data: {
      labels,
      datasets: [
        { label: 'OKR Progress %', data: values, backgroundColor: '#1FB8CD' },
      ],
    },
  };
}

function getBarDataFromKPIs() {
  const data = getFilteredData().kpi_performance;
  const grouped = {};
  data.forEach(
    (k) => (grouped[k.department] = (grouped[k.department] || []).concat(k))
  );
  const labels = Object.keys(grouped);
  const values = labels.map((dep) =>
    Math.round(
      grouped[dep].reduce((sum, k) => sum + k.progress, 0) / grouped[dep].length
    )
  );
  return {
    data: {
      labels,
      datasets: [
        { label: 'KPI Progress %', data: values, backgroundColor: '#5D878F' },
      ],
    },
  };
}

function getPieDataFromRisks() {
  const data = getFilteredData().risk_data;
  const grouped = {};
  data.forEach((r) => (grouped[r.status] = (grouped[r.status] || 0) + 1));
  return {
    data: {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: ['#B4413C', '#D2BA4C', '#5D878F'],
        },
      ],
    },
  };
}

function getPieDataFromOKRs(data) {
  const grouped = {};
  data.forEach((o) => (grouped[o.status] = (grouped[o.status] || 0) + 1));
  return {
    data: {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: ['#1FB8CD', '#FFC185', '#DB4545'],
        },
      ],
    },
  };
}

function getPieDataFromKPITrends(data) {
  const grouped = {};
  data.forEach((k) => (grouped[k.trend] = (grouped[k.trend] || 0) + 1));
  return {
    data: {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: ['#1FB8CD', '#FFC185', '#DB4545'],
        },
      ],
    },
  };
}

function getPieDataFromCurriculum(data) {
  const grouped = {};
  data.forEach(
    (c) =>
      (grouped[c.implementation_status] =
        (grouped[c.implementation_status] || 0) + 1)
  );
  return {
    data: {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: ['#B4413C', '#5D878F', '#D2BA4C', '#1FB8CD'],
        },
      ],
    },
  };
}

function getBarDataFromTraining(data) {
  const departments = [...new Set(data.map((c) => c.department))];
  const values = departments.map((dep) => {
    const curriculums = data.filter((c) => c.department === dep);
    return Math.round(
      curriculums.reduce((sum, c) => sum + c.training_completion, 0) /
        curriculums.length
    );
  });
  return {
    data: {
      labels: departments,
      datasets: [
        {
          label: 'Training Completion %',
          data: values,
          backgroundColor: '#964325',
        },
      ],
    },
  };
}

function getBarDataFromMentors(data) {
  const departments = [...new Set(data.map((c) => c.department))];
  const values = departments.map((dep) => {
    const total = data
      .filter((c) => c.department === dep)
      .reduce((sum, c) => sum + c.mentors_trained, 0);
    return total;
  });
  return {
    data: {
      labels: departments,
      datasets: [
        { label: 'Mentors Trained', data: values, backgroundColor: '#944454' },
      ],
    },
  };
}

function getBarDataFromRiskScores(data) {
  const labels = data.map((r) => r.risk_event);
  const values = data.map((r) => r.risk_score);
  return {
    data: {
      labels,
      datasets: [
        { label: 'Risk Score', data: values, backgroundColor: '#DB4545' },
      ],
    },
  };
}

function getPieDataFromRiskCategories(data) {
  const grouped = {};
  data.forEach(
    (r) => (grouped[r.risk_category] = (grouped[r.risk_category] || 0) + 1)
  );
  return {
    data: {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: [
            '#1FB8CD',
            '#FFC185',
            '#DB4545',
            '#964325',
            '#D2BA4C',
          ],
        },
      ],
    },
  };
}

function getPieDataFromRiskResponses(data) {
  const grouped = {};
  data.forEach(
    (r) =>
      (grouped[r.response_strategy] = (grouped[r.response_strategy] || 0) + 1)
  );
  return {
    data: {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: ['#5D878F', '#B4413C', '#1FB8CD', '#D2BA4C'],
        },
      ],
    },
  };
}
