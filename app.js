// ============================================================
//  CONFIGURACIÓN DE API
// ============================================================
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000',
    REFRESH_INTERVAL_MS: 30000,
    USE_MOCK_DATA: false, // ← cambiar a false cuando la API esté lista
  };
  
  // ============================================================
  //  RANGOS ÓPTIMOS (acuicultura tropical)
  // ============================================================
  const RANGES = {
    temperatura: { min: 24,  max: 30,  absMin: 20, absMax: 35,  unit: '°C',   label: 'Temperatura' },
    ph:          { min: 6.5, max: 8.5, absMin: 0,  absMax: 14,  unit: 'pH',   label: 'pH' },
    oxigeno:     { min: 5,   max: 10,  absMin: 0,  absMax: 15,  unit: 'mg/L', label: 'Oxígeno Disuelto' },
  };
  
  // ============================================================
  //  STATE
  // ============================================================
  let historyChart = null;
  let statusChart  = null;
  let currentPond  = 'P1';
  let alertList    = [];
  let readingHistory = [];
  let currentTimeRange = '1H';
  let isLoading  = false;
  let lastValues = {};
  
  // ============================================================
  //  CLOCK
  // ============================================================
  function updateClock() {
    document.getElementById('clock').textContent =
      new Date().toLocaleTimeString('es-CO', { hour12: false });
  }
  setInterval(updateClock, 1000);
  updateClock();
  
  // ============================================================
  //  MOCK DATA
  // ============================================================
  function getMockLatest() {
    return {
      temperatura: +(25 + Math.random() * 5).toFixed(1),
      ph:          +(6.5 + Math.random() * 2).toFixed(2),
      oxigeno:     +(5 + Math.random() * 4).toFixed(1),
      uptime:      +(97.3 + Math.random() * 2).toFixed(1),
      timestamp:   new Date().toISOString(),
    };
  }
  
  function getMockHistory(hours = 1) {
    const points = Math.min(hours * 4, 60);
    const now = Date.now();
    const data = [];
    let t = 26, p = 7.2, o = 7.5;
    for (let i = points; i >= 0; i--) {
      t += (Math.random() - 0.48) * 0.4;
      p += (Math.random() - 0.48) * 0.08;
      o += (Math.random() - 0.48) * 0.3;
      t = Math.max(22, Math.min(34, t));
      p = Math.max(6,  Math.min(9,  p));
      o = Math.max(3,  Math.min(12, o));
      data.push({
        timestamp:   new Date(now - i * (hours * 3600000 / points)).toISOString(),
        temperatura: +t.toFixed(1),
        ph:          +p.toFixed(2),
        oxigeno:     +o.toFixed(1),
      });
    }
    return data;
  }
  
  function getMockAlerts() {
    return [
      { parametro: 'pH',        valor: 8.9,  mensaje: 'pH superior al umbral máximo (8.5)',    severidad: 'alta',  timestamp: new Date(Date.now() - 5*60000).toISOString() },
      { parametro: 'Temperatura', valor: 30.4, mensaje: 'Temperatura cerca del límite superior', severidad: 'media', timestamp: new Date(Date.now() - 23*60000).toISOString() },
      { parametro: 'Oxígeno',   valor: 4.8,  mensaje: 'Oxígeno disuelto bajo el mínimo (5 mg/L)', severidad: 'alta', timestamp: new Date(Date.now() - 61*60000).toISOString() },
    ];
  }
  
  // ============================================================
  //  API CALLS — conectados a tu Flask
  // ============================================================
  async function fetchLatest() {
    if (CONFIG.USE_MOCK_DATA) return getMockLatest();
  
    // Toma la última medición de /getDatos
    const response = await axios.get(`${CONFIG.API_BASE_URL}/getDatos`);
    const rows = response.data; // [[tipo_sensor, valor, fecha_hora], ...]
  
    // Construye el objeto esperado por el dashboard
    const latest = { uptime: 99.0, timestamp: new Date().toISOString() };
    rows.forEach(([tipo, valor, fecha]) => {
      if (tipo === 'temperatura') latest.temperatura = valor;
      if (tipo === 'ph')          latest.ph          = valor;
      if (tipo === 'oxigeno')     latest.oxigeno     = valor;
      if (!latest.timestamp || fecha > latest.timestamp) latest.timestamp = fecha;
    });
    return latest;
  }
  
  async function fetchHistory(hours = 1) {
    if (CONFIG.USE_MOCK_DATA) return getMockHistory(hours);
  
    const response = await axios.get(`${CONFIG.API_BASE_URL}/getDatos`);
    const rows = response.data;
  
    // Agrupa por timestamp y construye el array histórico
    const map = {};
    rows.forEach(([tipo, valor, fecha]) => {
      if (!map[fecha]) map[fecha] = { timestamp: fecha };
      if (tipo === 'temperatura') map[fecha].temperatura = valor;
      if (tipo === 'ph')          map[fecha].ph          = valor;
      if (tipo === 'oxigeno')     map[fecha].oxigeno     = valor;
    });
    return Object.values(map).reverse();
  }
  
  async function fetchAlerts() {
    if (CONFIG.USE_MOCK_DATA) return getMockAlerts();
  
    const response = await axios.get(`${CONFIG.API_BASE_URL}/getAlertas`);
    // getAlertas devuelve [[mensaje, fecha_hora], ...]
    return response.data.map(([mensaje, timestamp]) => ({
      parametro: 'Sistema',
      mensaje,
      severidad: 'alta',
      timestamp,
    }));
  }
  
  // ============================================================
  //  INICIAR MEDICIÓN — ← función única, sin duplicados
  // ============================================================
  function iniciarMedicion() {
    axios.get(`${CONFIG.API_BASE_URL}/iniciarMedicion`)
      .then(() => showToast('Medición iniciada correctamente', 'ok'))
      .catch(() => showToast('Error al iniciar medición', 'error'));
  }
  
  // ============================================================
  //  STATUS HELPERS
  // ============================================================
  function getStatus(param, value) {
    const r = RANGES[param];
    if (!r) return 'ok';
    if (value < r.absMin || value > r.absMax) return 'alert';
    if (value < r.min    || value > r.max)    return 'warn';
    return 'ok';
  }
  
  function statusLabel(s)      { return { ok: 'NORMAL', warn: 'ALERTA', alert: 'CRÍTICO' }[s]; }
  function statusBadgeClass(s) { return { ok: 'badge-ok', warn: 'badge-warn', alert: 'badge-alert' }[s]; }
  function statusCardClass(s)  { return { ok: 'status-ok', warn: 'status-warn', alert: 'status-alert' }[s]; }
  function statusGlowClass(s)  { return { ok: 'metric-ok-glow', warn: 'metric-warn-glow', alert: 'metric-alert-glow' }[s]; }
  function statusColor(s)      { return { ok: 'var(--green)', warn: 'var(--yellow)', alert: 'var(--red)' }[s]; }
  function statusFillClass(s)  { return { ok: 'fill-ok', warn: 'fill-warn', alert: 'fill-alert' }[s]; }
  
  // ============================================================
  //  UPDATE METRIC CARD
  // ============================================================
  function updateCard(id, param, value, range) {
    const status = getStatus(param, value);
    const clamp  = Math.max(5, Math.min(95, ((value - range.absMin) / (range.absMax - range.absMin)) * 100));
  
    const card = document.getElementById(`card-${id}`);
    card.className = `metric-card ${statusCardClass(status)} fade-in`;
    card.querySelector('.metric-glow').className = `metric-glow ${statusGlowClass(status)}`;
  
    const badge = document.getElementById(`badge-${id}`);
    badge.className  = `metric-status-badge ${statusBadgeClass(status)}`;
    badge.textContent = statusLabel(status);
  
    document.getElementById(`val-${id}`).textContent = value ?? '--';
  
    const bar = document.getElementById(`bar-${id}`);
    bar.style.width  = clamp + '%';
    bar.className    = `range-fill ${statusFillClass(status)}`;
    bar.querySelector('.range-dot').style.background = statusColor(status);
  
    const prev    = lastValues[param];
    const trendEl = document.getElementById(`trend-${id}`);
    if (prev !== undefined) {
      const diff = value - prev;
      if (Math.abs(diff) < 0.02) {
        trendEl.className   = 'metric-trend trend-flat';
        trendEl.textContent = '— Sin cambio significativo';
      } else if (diff > 0) {
        trendEl.className   = 'metric-trend trend-up';
        trendEl.textContent = `▲ +${Math.abs(diff).toFixed(2)} ${range.unit}`;
      } else {
        trendEl.className   = 'metric-trend trend-down';
        trendEl.textContent = `▼ −${Math.abs(diff).toFixed(2)} ${range.unit}`;
      }
    }
    lastValues[param] = value;
  }
  
  // ============================================================
  //  REFRESH DATA
  // ============================================================
  async function refreshData() {
    if (isLoading) return;
    isLoading = true;
    document.getElementById('refresh-icon').innerHTML = '<span class="spinner"></span>';
  
    try {
      const latest = await fetchLatest();
  
      updateCard('temp', 'temperatura', latest.temperatura, RANGES.temperatura);
      updateCard('ph',   'ph',          latest.ph,          RANGES.ph);
      updateCard('od',   'oxigeno',     latest.oxigeno,     RANGES.oxigeno);
  
      const uptime = +(latest.uptime || 97.3).toFixed(1);
      document.getElementById('val-uptime').textContent    = uptime;
      document.getElementById('bar-uptime').style.width   = uptime + '%';
  
      const ts = new Date(latest.timestamp);
      document.getElementById('last-update').innerHTML =
        `<span class="mini-dot"></span> Actualizado ${ts.toLocaleTimeString('es-CO', { hour12: false })}`;
  
      readingHistory.unshift({
        hora:   ts.toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        temp:   latest.temperatura,
        ph:     latest.ph,
        od:     latest.oxigeno,
        status: computeOverallStatus(latest),
      });
      if (readingHistory.length > 10) readingHistory.pop();
      renderReadingsTable();
  
      await refreshHistory();
  
      alertList = await fetchAlerts();
      renderAlerts();
  
      setConnectionStatus(true);
  
    } catch (err) {
      console.error('Error fetching data:', err);
      setConnectionStatus(false);
      showToast('⚠️ Sin conexión con la API. Usando datos simulados.', 'warn');
      CONFIG.USE_MOCK_DATA = false;
      await refreshData();
      return;
    } finally {
      isLoading = false;
      document.getElementById('refresh-icon').textContent = '↻';
    }
  }
  
  function computeOverallStatus(d) {
    const statuses = [
      getStatus('temperatura', d.temperatura),
      getStatus('ph',          d.ph),
      getStatus('oxigeno',     d.oxigeno),
    ];
    if (statuses.includes('alert')) return 'alert';
    if (statuses.includes('warn'))  return 'warn';
    return 'ok';
  }
  
  // ============================================================
  //  HISTORY CHART
  // ============================================================
  async function refreshHistory() {
    const hoursMap = { '1H': 1, '6H': 6, '24H': 24, '7D': 168 };
    const hours    = hoursMap[currentTimeRange] || 1;
    const data     = await fetchHistory(hours);
  
    const labels = data.map(d => {
      const ts = new Date(d.timestamp);
      return hours <= 6
        ? ts.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
        : ts.toLocaleDateString('es-CO',  { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    });
  
    if (historyChart) {
      historyChart.data.labels           = labels;
      historyChart.data.datasets[0].data = data.map(d => d.temperatura);
      historyChart.data.datasets[1].data = data.map(d => d.ph);
      historyChart.data.datasets[2].data = data.map(d => d.oxigeno);
      historyChart.update('none');
    }
  }
  
  function initHistoryChart() {
    const ctx = document.getElementById('chart-history').getContext('2d');
    historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'Temperatura (°C)', data: [], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.06)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.4, fill: true,  yAxisID: 'y'  },
          { label: 'pH',               data: [], borderColor: '#00e5a0', backgroundColor: 'rgba(0,229,160,0.06)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.4, fill: false, yAxisID: 'y1' },
          { label: 'O₂ (mg/L)',        data: [], borderColor: '#f5c842', backgroundColor: 'rgba(245,200,66,0.06)',borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.4, fill: false, yAxisID: 'y2' },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#7aa5c5', font: { family: 'Space Mono', size: 10 }, boxWidth: 10, padding: 14 } },
          tooltip: { backgroundColor: '#0e1d2d', borderColor: '#1a3148', borderWidth: 1, titleColor: '#d4e8f5', bodyColor: '#7aa5c5', titleFont: { family: 'Space Mono', size: 10 }, bodyFont: { family: 'Space Mono', size: 10 }, padding: 10 },
        },
        scales: {
          x:  { grid: { color: 'rgba(26,49,72,0.5)', drawTicks: false }, ticks: { color: '#3d6b8a', font: { family: 'Space Mono', size: 9 }, maxRotation: 0, maxTicksLimit: 8 }, border: { color: 'rgba(26,49,72,0.8)' } },
          y:  { position: 'left',  title: { display: true, text: '°C', color: '#00d4ff', font: { family: 'Space Mono', size: 9 } }, grid: { color: 'rgba(26,49,72,0.4)' }, ticks: { color: '#3d6b8a', font: { family: 'Space Mono', size: 9 }, maxTicksLimit: 5 }, border: { color: 'rgba(26,49,72,0.8)' } },
          y1: { position: 'right', title: { display: true, text: 'pH', color: '#00e5a0', font: { family: 'Space Mono', size: 9 } }, grid: { drawOnChartArea: false }, ticks: { color: '#3d6b8a', font: { family: 'Space Mono', size: 9 }, maxTicksLimit: 5 }, border: { color: 'rgba(26,49,72,0.8)' }, min: 0, max: 14 },
          y2: { display: false, min: 0, max: 15 },
        },
      },
    });
  }
  
  // ============================================================
  //  STATUS DONUT CHART
  // ============================================================
  function initStatusChart() {
    const ctx = document.getElementById('chart-status').getContext('2d');
    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Normal', 'Alerta', 'Crítico'],
        datasets: [{ data: [2, 1, 0], backgroundColor: ['rgba(0,229,160,0.8)', 'rgba(245,200,66,0.8)', 'rgba(255,77,106,0.8)'], borderColor: ['#00e5a0', '#f5c842', '#ff4d6a'], borderWidth: 1, hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0e1d2d', borderColor: '#1a3148', borderWidth: 1, titleColor: '#d4e8f5', bodyColor: '#7aa5c5', titleFont: { family: 'Space Mono', size: 10 }, bodyFont: { family: 'Space Mono', size: 10 } } },
      },
      plugins: [{
        id: 'center-text',
        afterDraw(chart) {
          const { ctx, chartArea: { width, height, top, left } } = chart;
          ctx.save();
          const cx = left + width / 2, cy = top + height / 2;
          ctx.font = 'bold 28px Space Mono'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('3', cx, cy - 8);
          ctx.font = '10px Space Mono'; ctx.fillStyle = '#3d6b8a';
          ctx.fillText('PISCINAS', cx, cy + 14);
          ctx.restore();
        }
      }],
    });
  }
  
  // ============================================================
  //  ALERTS RENDER
  // ============================================================
  function renderAlerts() {
    const el    = document.getElementById('alerts-list');
    const count = alertList.length;
    document.getElementById('alert-count').textContent  = count;
    document.getElementById('notif-count').textContent  = count;
  
    if (!count) { el.innerHTML = '<div class="empty-state">✅ Sin alertas activas</div>'; return; }
  
    el.innerHTML = alertList.map(a => {
      const ts       = new Date(a.timestamp);
      const timeDiff = Math.round((Date.now() - ts) / 60000);
      const timeStr  = timeDiff < 60 ? `hace ${timeDiff}min` : `hace ${Math.round(timeDiff/60)}h`;
      const sevClass = a.severidad === 'alta' ? 'sev-high' : a.severidad === 'media' ? 'sev-med' : 'sev-low';
      const dotColor = a.severidad === 'alta' ? 'var(--red)' : a.severidad === 'media' ? 'var(--yellow)' : 'var(--accent)';
      return `
        <div class="alert-item">
          <span class="alert-dot" style="background:${dotColor};box-shadow:0 0 6px ${dotColor}"></span>
          <span class="alert-msg"><span class="alert-param">${a.parametro}</span>: ${a.mensaje}</span>
          <span class="alert-time">${timeStr}</span>
          <span class="alert-sev ${sevClass}">${a.severidad.toUpperCase()}</span>
        </div>`;
    }).join('');
  }
  
  // ============================================================
  //  READINGS TABLE
  // ============================================================
  function renderReadingsTable() {
    const tbody = document.getElementById('readings-tbody');
    if (!readingHistory.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Sin datos</td></tr>'; return; }
    tbody.innerHTML = readingHistory.map(r => {
      const sc  = r.status === 'ok' ? 'var(--green)' : r.status === 'warn' ? 'var(--yellow)' : 'var(--red)';
      return `
        <tr>
          <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text3);">${r.hora}</td>
          <td class="td-value" style="color:var(--accent);">${r.temp}<span style="color:var(--text3);font-size:0.7rem;"> °C</span></td>
          <td class="td-value" style="color:var(--green);">${r.ph}<span style="color:var(--text3);font-size:0.7rem;"> pH</span></td>
          <td class="td-value" style="color:var(--yellow);">${r.od}<span style="color:var(--text3);font-size:0.7rem;"> mg/L</span></td>
          <td><span class="td-status" style="color:${sc};"><span style="width:6px;height:6px;border-radius:50%;background:${sc};display:inline-block;"></span> ${statusLabel(r.status)}</span></td>
        </tr>`;
    }).join('');
  }
  
  // ============================================================
  //  UI HELPERS
  // ============================================================
  function setConnectionStatus(ok) {
    document.getElementById('conn-dot').className  = 'mini-dot' + (ok ? '' : ' offline');
    document.getElementById('conn-text').textContent = ok ? 'Conectado' : 'Sin conexión';
  }
  
  function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-icon').textContent = type === 'warn' ? '⚠️' : type === 'error' ? '❌' : type === 'ok' ? '✅' : 'ℹ️';
    document.getElementById('toast-msg').textContent  = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }
  
  function setPage(page, event) {
  const titles = { dashboard: 'Dashboard de Monitoreo', historico: 'Historial de Lecturas', alertas: 'Gestión de Alertas', sensores: 'Configuración de Sensores', umbrales: 'Configuración de Umbrales', exportar: 'Exportar Datos' };
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if(event) event.currentTarget.classList.add('active');
  document.getElementById('page-title').textContent = titles[page] || page;
  if (page !== 'dashboard') showToast(`Módulo "${titles[page]}" en desarrollo`);
}

function selectPond(pond, event) {
  currentPond = pond;
  document.querySelectorAll('.pond-btn').forEach(b => b.classList.remove('active'));
  if(event) event.currentTarget.classList.add('active');
  showToast(`Cambiando a ${pond}...`, 'info');
  readingHistory = []; lastValues = {};
  refreshData();
}
  
  function setTimeRange(range, el) {
    currentTimeRange = range;
    document.querySelectorAll('.time-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    refreshHistory();
  }
  
  function forceRefresh() { refreshData(); showToast('Actualizando datos...', 'info'); }
  
  function exportCSV() {
    if (!readingHistory.length) { showToast('Sin datos para exportar', 'warn'); return; }
    const rows = [['Hora', 'Temperatura (°C)', 'pH', 'Oxígeno Disuelto (mg/L)', 'Estado']];
    readingHistory.forEach(r => rows.push([r.hora, r.temp, r.ph, r.od, statusLabel(r.status)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `aquasense_lecturas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('CSV descargado correctamente', 'ok');
  }
  
  // ============================================================
  //  INIT
  // ============================================================
  window.addEventListener('DOMContentLoaded', () => {
    initHistoryChart();
    initStatusChart();
    refreshData();
    setInterval(refreshData, CONFIG.REFRESH_INTERVAL_MS);
    setTimeout(() => showToast('Sistema AquaSense inicializado correctamente', 'ok'), 800);
  });