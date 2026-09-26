/**
 * LAGHOTECH - Dashboard Inteligente de Energia & Vídeomonitoramento
 * Lógica Completa de Controle, Automação, Velocímetro e Gerenciamento
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // ESTADO GLOBAL DO SISTEMA (COM PERSISTÊNCIA)
  // ==========================================
  const DEFAULT_STATE = {
    user: {
      name: "Daniel Santos",
      email: "daniel@email.com",
      password: "admin",
      isLoggedIn: true
    },
    theme: "green",
    baseIdleWatts: 140, // Consumo ocioso da residência (roteador, nobreak, etc.)
    lights: [
      { id: "light-1", name: "Lustre Central", room: "Sala de Estar", watts: 45, state: true },
      { id: "light-2", name: "Spots Teto", room: "Cozinha", watts: 30, state: true },
      { id: "light-3", name: "Pendente Mesa", room: "Cozinha", watts: 25, state: false },
      { id: "light-4", name: "Arandela Noturna", room: "Quarto Principal", watts: 15, state: true },
      { id: "light-5", name: "Refletor LED", room: "Varanda / Garagem", watts: 50, state: false }
    ],
    electronics: [
      { id: "elec-1", name: "Geladeira Duplex Inverter", category: "Eletrodoméstico", room: "Cozinha (T-01)", watts: 190, state: true, icon: "❄️" },
      { id: "elec-2", name: "Smart TV OLED 65\"", category: "Entretenimento", room: "Sala (T-03)", watts: 140, state: true, icon: "📺" },
      { id: "elec-3", name: "Ar Condicionado Inverter", category: "Climatização", room: "Quarto (T-08)", watts: 1100, state: true, icon: "💨" },
      { id: "elec-4", name: "Workstation & Monitores", category: "Informática", room: "Escritório (T-05)", watts: 320, state: true, icon: "💻" },
      { id: "elec-5", name: "Micro-ondas Digital", category: "Eletrodoméstico", room: "Cozinha (T-02)", watts: 950, state: false, icon: "🍲" },
      { id: "elec-6", name: "Cafeteira Espresso", category: "Cozinha", room: "Cozinha (T-04)", watts: 650, state: false, icon: "☕" },
      { id: "elec-7", name: "Máquina de Lavar Lava & Seca", category: "Eletrodoméstico", room: "Área de Serviço (T-09)", watts: 480, state: false, icon: "🧺" }
    ],
    cameras: [
      { id: "cam-1", name: "CAM 01 - Webcam Local (Seu Computador)", location: "Estação de Trabalho / Laptop", type: "Webcam Integrada / USB", active: true, isUserWebcam: true, colorTone: "#00e676" },
      { id: "cam-2", name: "CAM 02 - Garagem Externa", location: "Portão Veicular", type: "4K Panorâmica", active: true, colorTone: "#00b0ff" },
      { id: "cam-3", name: "CAM 03 - Jardim e Quintal", location: "Área de Lazer", type: "Grande Angular 1080p", active: true, colorTone: "#ff9900" }
    ],
    monthlyHistory: [
      { month: "Mai", kwh: 310, val: 263.50 },
      { month: "Jun", kwh: 295, val: 250.75 },
      { month: "Jul", kwh: 360, val: 306.00 },
      { month: "Ago", kwh: 373, val: 317.05 },
      { month: "Set", kwh: 342, val: 290.70 }
    ]
  };

  // Carregar do localStorage ou usar padrão
  let state = loadState();
  let currentActiveCameraId = state.cameras[0] ? state.cameras[0].id : null;
  let gaugeCurrentValue = 0; // valor animado atual
  let gaugeTargetValue = calculateTotalKw(); // valor alvo

  function loadState() {
    let loaded = null;
    try {
      const saved = localStorage.getItem('laghotech_state_v1');
      if (saved) {
        loaded = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Não foi possível carregar o estado:", e);
    }
    if (!loaded) {
      loaded = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    // Garantir que a primeira câmera seja a webcam local do usuário
    if (loaded.cameras && loaded.cameras.length > 0 && loaded.cameras[0].id === 'cam-1') {
      loaded.cameras[0].name = "CAM 01 - Webcam Local (Seu Computador)";
      loaded.cameras[0].location = "Estação de Trabalho / Laptop";
      loaded.cameras[0].type = "Webcam Integrada / USB";
      loaded.cameras[0].isUserWebcam = true;
    }
    return loaded;
  }

  function saveState() {
    try {
      localStorage.setItem('laghotech_state_v1', JSON.stringify(state));
    } catch (e) {
      console.warn("Falha ao salvar estado:", e);
    }
  }

  // ==========================================
  // ELEMENTOS DO DOM
  // ==========================================
  const appHeader = document.getElementById('app-header');
  const userTopbarName = document.getElementById('user-topbar-name');
  const userTopbarEmail = document.getElementById('user-topbar-email');
  const userMenuTrigger = document.getElementById('user-menu-trigger');
  const userBadgeWrapper = document.getElementById('user-badge-wrapper');
  
  // Sidebar Drawer
  const sidebarDrawer = document.getElementById('sidebar-drawer');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');

  // Containers de dados
  const lightsContainer = document.getElementById('lights-container');
  const lightsActiveCount = document.getElementById('lights-active-count');
  const lightsTotalWatts = document.getElementById('lights-total-watts');
  const electronicsContainer = document.getElementById('electronics-container');
  const plugsActiveCount = document.getElementById('plugs-active-count');
  const plugsTotalWatts = document.getElementById('plugs-total-watts');

  // Velocímetro Canvas e Readout
  const gaugeCanvas = document.getElementById('gaugeCanvas');
  const gaugeCtx = gaugeCanvas ? gaugeCanvas.getContext('2d') : null;
  const gaugeNumericValue = document.getElementById('gauge-numeric-value');
  const gaugeStatusBadge = document.getElementById('gauge-status-badge');
  const metricCostDay = document.getElementById('metric-cost-day');

  // Câmeras & Monitoramento
  const cameraFeedCanvas = document.getElementById('cameraFeedCanvas');
  const cameraFeedCtx = cameraFeedCanvas ? cameraFeedCanvas.getContext('2d') : null;
  const currentCameraName = document.getElementById('current-camera-name');
  const cameraLiveClock = document.getElementById('camera-live-clock');
  const cameraThumbnailsContainer = document.getElementById('camera-thumbnails-container');
  const cameraMainFeed = document.getElementById('camera-main-feed');
  const btnExpandCamera = document.getElementById('btn-expand-camera');
  const webcamLiveVideo = document.getElementById('webcamLiveVideo');
  const webcamPermissionPrompt = document.getElementById('webcam-permission-prompt');
  const btnRequestWebcam = document.getElementById('btn-request-webcam');
  const cameraBackdropOverlay = document.getElementById('camera-backdrop-overlay');
  const btnCloseCameraZoom = document.getElementById('btn-close-camera-zoom');

  // Modais
  const modalAuth = document.getElementById('modal-auth');
  const modalSettings = document.getElementById('modal-settings');
  const modalAddLight = document.getElementById('modal-add-light');
  const modalAddElectronic = document.getElementById('modal-add-electronic');
  const modalAddCamera = document.getElementById('modal-add-camera');
  const modalFullReport = document.getElementById('modal-full-report');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // ==========================================
  // TEMA NEON (6 OPÇÕES SUAVES)
  // ==========================================
  function applyTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    saveState();

    // Atualizar seletores visuais
    document.querySelectorAll('.theme-choice-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-theme-val') === themeName);
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.classList.toggle('active', dot.getAttribute('data-color') === themeName);
    });
  }

  function getActiveThemeColorHex() {
    const theme = state.theme || 'green';
    const map = {
      green: '#00e676',
      blue: '#00d4ff',
      red: '#ff3366',
      purple: '#b862ff',
      pink: '#ff5ebc',
      white: '#e2e8f0'
    };
    return map[theme] || '#00e676';
  }

  // ==========================================
  // CÁLCULO DE CONSUMO & VELOCÍMETRO
  // ==========================================
  function calculateTotalKw() {
    let watts = state.baseIdleWatts;

    state.lights.forEach(l => {
      if (l.state) watts += l.watts;
    });

    state.electronics.forEach(e => {
      if (e.state) watts += e.watts;
    });

    return watts / 1000; // Converte para kW
  }

  function updateConsumptionMetrics() {
    gaugeTargetValue = calculateTotalKw();

    // Custo estimado por dia (tarifa média R$ 0,85 por kWh)
    const costPerDay = (gaugeTargetValue * 24 * 0.85).toFixed(2).replace('.', ',');
    if (metricCostDay) {
      metricCostDay.textContent = `R$ ${costPerDay}`;
    }

    // Status da Carga
    if (gaugeStatusBadge) {
      if (gaugeTargetValue < 1.2) {
        gaugeStatusBadge.textContent = "Baixo Consumo • Econômico";
        gaugeStatusBadge.style.color = "var(--neon-main)";
        gaugeStatusBadge.style.borderColor = "var(--neon-border)";
      } else if (gaugeTargetValue < 3.0) {
        gaugeStatusBadge.textContent = "Consumo Moderado • Estável";
        gaugeStatusBadge.style.color = "var(--neon-main)";
        gaugeStatusBadge.style.borderColor = "var(--neon-border)";
      } else if (gaugeTargetValue < 5.0) {
        gaugeStatusBadge.textContent = "Carga Alta • Alerta";
        gaugeStatusBadge.style.color = "#ffaa00";
        gaugeStatusBadge.style.borderColor = "#ffaa00";
      } else {
        gaugeStatusBadge.textContent = "Pico Crítico • Atenção";
        gaugeStatusBadge.style.color = "#ff4444";
        gaugeStatusBadge.style.borderColor = "#ff4444";
      }
    }
  }

  // ==========================================
  // RENDER DO VELOCÍMETRO (SPEEDOMETER CANVAS)
  // ==========================================
  function drawSpeedometer() {
    if (!gaugeCtx) return;

    // Interpolação suave do valor (easing)
    gaugeCurrentValue += (gaugeTargetValue - gaugeCurrentValue) * 0.08;
    
    // Pequena micro-oscilação realista de corrente alternada
    const jitter = (Math.random() - 0.5) * 0.015;
    const displayVal = Math.max(0, gaugeCurrentValue + jitter);

    if (gaugeNumericValue) {
      gaugeNumericValue.textContent = displayVal.toFixed(2);
    }

    const width = gaugeCanvas.width;
    const height = gaugeCanvas.height;
    const centerX = width / 2;
    const centerY = height - 55;
    const radius = 170;

    gaugeCtx.clearRect(0, 0, width, height);

    // Ângulo de início e fim: de 140° a 400° (260 graus de amplitude)
    const startAngle = Math.PI * 0.78;
    const endAngle = Math.PI * 2.22;
    const totalArc = endAngle - startAngle;

    // 1. Arco de Fundo Cinza
    gaugeCtx.beginPath();
    gaugeCtx.arc(centerX, centerY, radius, startAngle, endAngle);
    gaugeCtx.lineWidth = 14;
    gaugeCtx.strokeStyle = "#1b2432";
    gaugeCtx.lineCap = "round";
    gaugeCtx.stroke();

    // 2. Arco Graduado Iluminado (Green/Theme -> Yellow -> Red)
    const themeColor = getActiveThemeColorHex();
    const maxScale = 8.0; // Escala máxima de 8 kW
    const normalizedVal = Math.min(displayVal / maxScale, 1);
    const currentValAngle = startAngle + (totalArc * normalizedVal);

    if (normalizedVal > 0.01) {
      const gradient = gaugeCtx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      gradient.addColorStop(0, themeColor);
      gradient.addColorStop(0.65, "#ffaa00");
      gradient.addColorStop(1, "#ff3333");

      gaugeCtx.beginPath();
      gaugeCtx.arc(centerX, centerY, radius, startAngle, currentValAngle);
      gaugeCtx.lineWidth = 14;
      gaugeCtx.strokeStyle = gradient;
      gaugeCtx.lineCap = "round";
      gaugeCtx.shadowColor = themeColor;
      gaugeCtx.shadowBlur = 12;
      gaugeCtx.stroke();
      gaugeCtx.shadowBlur = 0; // reset
    }

    // 3. Ticks e Marcações Numéricas (0, 1, 2, 3, 4, 5, 6, 7, 8 kW)
    const totalTicks = 8;
    for (let i = 0; i <= totalTicks; i++) {
      const angle = startAngle + (totalArc * (i / totalTicks));
      const tickInner = radius - 22;
      const tickOuter = radius - 10;

      const x1 = centerX + Math.cos(angle) * tickInner;
      const y1 = centerY + Math.sin(angle) * tickInner;
      const x2 = centerX + Math.cos(angle) * tickOuter;
      const y2 = centerY + Math.sin(angle) * tickOuter;

      gaugeCtx.beginPath();
      gaugeCtx.moveTo(x1, y1);
      gaugeCtx.lineTo(x2, y2);
      gaugeCtx.lineWidth = i % 2 === 0 ? 3 : 1.5;
      gaugeCtx.strokeStyle = i / totalTicks <= normalizedVal ? "#ffffff" : "#445267";
      gaugeCtx.stroke();

      // Rótulo numérico
      if (i % 2 === 0) {
        const textDist = radius - 36;
        const tx = centerX + Math.cos(angle) * textDist;
        const ty = centerY + Math.sin(angle) * textDist + 4;
        gaugeCtx.font = "600 11px 'JetBrains Mono', monospace";
        gaugeCtx.fillStyle = "#8b949e";
        gaugeCtx.textAlign = "center";
        gaugeCtx.fillText(`${i}`, tx, ty);
      }
    }

    // 4. Ponteiro / Agulha Futurista
    const needleAngle = currentValAngle;
    const needleLength = radius - 28;
    const nx = centerX + Math.cos(needleAngle) * needleLength;
    const ny = centerY + Math.sin(needleAngle) * needleLength;

    // Sombra da agulha
    gaugeCtx.beginPath();
    gaugeCtx.moveTo(centerX, centerY);
    gaugeCtx.lineTo(nx, ny);
    gaugeCtx.lineWidth = 3;
    gaugeCtx.strokeStyle = themeColor;
    gaugeCtx.shadowColor = themeColor;
    gaugeCtx.shadowBlur = 10;
    gaugeCtx.stroke();
    gaugeCtx.shadowBlur = 0;

    // 5. Hub / Centro da Agulha com Aro Neon
    gaugeCtx.beginPath();
    gaugeCtx.arc(centerX, centerY, 16, 0, Math.PI * 2);
    gaugeCtx.fillStyle = "#0d131c";
    gaugeCtx.fill();
    gaugeCtx.lineWidth = 2.5;
    gaugeCtx.strokeStyle = themeColor;
    gaugeCtx.stroke();

    gaugeCtx.beginPath();
    gaugeCtx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    gaugeCtx.fillStyle = "#ffffff";
    gaugeCtx.fill();

    requestAnimationFrame(drawSpeedometer);
  }

  // ==========================================
  // RENDER DAS LUZES (POSIÇÃO 1)
  // ==========================================
  function renderLights() {
    if (!lightsContainer) return;
    lightsContainer.innerHTML = '';

    let activeCount = 0;
    let totalWatts = 0;

    state.lights.forEach(light => {
      if (light.state) {
        activeCount++;
        totalWatts += light.watts;
      }

      const card = document.createElement('div');
      card.className = `light-switch-card ${light.state ? 'on' : ''}`;
      card.setAttribute('data-id', light.id);

      card.innerHTML = `
        <div class="switch-top">
          <span class="switch-bulb-icon">💡</span>
          <div class="switch-toggle-pill"></div>
        </div>
        <div class="switch-bottom">
          <div class="switch-name" title="${light.name}">${light.name}</div>
          <div class="switch-meta">
            <span class="switch-room">${light.room}</span>
            <span class="switch-watts">${light.watts}W</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => toggleLight(light.id));
      lightsContainer.appendChild(card);
    });

    if (lightsActiveCount) lightsActiveCount.textContent = `${activeCount}/${state.lights.length}`;
    if (lightsTotalWatts) lightsTotalWatts.textContent = `${totalWatts} W`;

    const sideBadgeLights = document.getElementById('side-badge-lights');
    if (sideBadgeLights) sideBadgeLights.textContent = `${activeCount}/${state.lights.length} On`;

    updateConsumptionMetrics();
  }

  function toggleLight(id) {
    const item = state.lights.find(l => l.id === id);
    if (item) {
      item.state = !item.state;
      saveState();
      renderLights();
      renderManageLists();
      showToast(`Luz "${item.name}" ${item.state ? 'LIGADA' : 'DESLIGADA'}.`);
    }
  }

  function toggleAllLights() {
    const anyOn = state.lights.some(l => l.state);
    state.lights.forEach(l => l.state = !anyOn);
    saveState();
    renderLights();
    renderManageLists();
    showToast(anyOn ? "Todas as luzes foram apagadas." : "Todas as luzes foram acesas.");
  }

  // ==========================================
  // RENDER ELETRÔNICOS E TOMADAS (POSIÇÃO 3)
  // ==========================================
  function renderElectronics() {
    if (!electronicsContainer) return;
    electronicsContainer.innerHTML = '';

    let activePlugs = 0;
    let totalWatts = 0;

    state.electronics.forEach(item => {
      if (item.state) {
        activePlugs++;
        totalWatts += item.watts;
      }

      const row = document.createElement('div');
      row.className = `electronic-item-card ${item.state ? 'active' : ''}`;
      row.innerHTML = `
        <div class="item-left">
          <div class="item-icon-circle">${item.icon || '🔌'}</div>
          <div class="item-info">
            <span class="item-name">${item.name}</span>
            <span class="item-category">${item.category} • ${item.room}</span>
          </div>
        </div>
        <div class="item-right">
          <span class="item-power-tag">${item.state ? item.watts + ' W' : '0 W'}</span>
          <input type="checkbox" class="toggle-switch-input" ${item.state ? 'checked' : ''} aria-label="Ligar ou desligar ${item.name}">
        </div>
      `;

      const input = row.querySelector('.toggle-switch-input');
      input.addEventListener('change', (e) => {
        item.state = e.target.checked;
        saveState();
        renderElectronics();
        renderManageLists();
        showToast(`Tomada "${item.name}" ${item.state ? 'ATIVADA' : 'DESATIVADA'}.`);
      });

      electronicsContainer.appendChild(row);
    });

    if (plugsActiveCount) plugsActiveCount.textContent = `${activePlugs}`;
    if (plugsTotalWatts) plugsTotalWatts.textContent = `${totalWatts.toLocaleString('pt-BR')} W`;

    const sideBadgePlugs = document.getElementById('side-badge-plugs');
    if (sideBadgePlugs) sideBadgePlugs.textContent = `${activePlugs} Conectadas`;

    updateConsumptionMetrics();
  }

  // ==========================================
  // STREAMING & ACESSO ÀS CÂMERAS (POSIÇÃO 2)
  // ==========================================
  let cameraAnimationPhase = 0;
  let isWebcamStreaming = false;
  let webcamStream = null;

  function initCameraStream() {
    renderCameraThumbnails();
    animateCameraFeed();
    setInterval(updateCameraClock, 1000);
    updateCameraClock();

    // Se a primeira câmera for a webcam do usuário, tentar iniciar o stream imediatamente
    const activeCam = state.cameras.find(c => c.id === currentActiveCameraId);
    if (activeCam && activeCam.isUserWebcam) {
      requestWebcamAccess();
    }
  }

  function requestWebcamAccess() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("API de webcam não suportada neste ambiente.");
      if (webcamPermissionPrompt) webcamPermissionPrompt.classList.remove('hidden');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      },
      audio: false
    })
    .then(stream => {
      webcamStream = stream;
      if (webcamLiveVideo) {
        webcamLiveVideo.srcObject = stream;
        webcamLiveVideo.style.display = 'block';
        webcamLiveVideo.onloadedmetadata = () => {
          webcamLiveVideo.play().catch(e => console.warn("Erro ao reproduzir vídeo:", e));
        };
      }
      isWebcamStreaming = true;
      if (webcamPermissionPrompt) webcamPermissionPrompt.classList.add('hidden');
      showToast("Webcam local do computador conectada ao Laghotech!");
    })
    .catch(err => {
      console.warn("Acesso à webcam recusado ou indisponível:", err);
      isWebcamStreaming = false;
      const activeCam = state.cameras.find(c => c.id === currentActiveCameraId);
      if (activeCam && activeCam.isUserWebcam && webcamPermissionPrompt) {
        webcamPermissionPrompt.classList.remove('hidden');
      }
    });
  }

  function updateCameraClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR');
    if (cameraLiveClock) cameraLiveClock.textContent = timeStr;
  }

  function renderCameraThumbnails() {
    if (!cameraThumbnailsContainer) return;
    cameraThumbnailsContainer.innerHTML = '';

    state.cameras.forEach(cam => {
      const btn = document.createElement('button');
      btn.className = `cam-thumb-btn ${cam.id === currentActiveCameraId ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${cam.isUserWebcam ? '📷' : '📹'}</span>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cam.isUserWebcam ? 'Sua Webcam' : cam.name.split(' - ')[0]}</span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCamera(cam.id);
      });
      cameraThumbnailsContainer.appendChild(btn);
    });

    const activeCam = state.cameras.find(c => c.id === currentActiveCameraId);
    if (activeCam && currentCameraName) {
      currentCameraName.textContent = activeCam.name;
    }
  }

  function selectCamera(id) {
    currentActiveCameraId = id;
    const activeCam = state.cameras.find(c => c.id === id);
    if (activeCam) {
      if (currentCameraName) currentCameraName.textContent = activeCam.name;

      if (activeCam.isUserWebcam) {
        if (webcamLiveVideo) webcamLiveVideo.style.display = 'block';
        if (!isWebcamStreaming) {
          requestWebcamAccess();
        } else if (webcamPermissionPrompt) {
          webcamPermissionPrompt.classList.add('hidden');
        }
      } else {
        if (webcamLiveVideo) webcamLiveVideo.style.display = 'none';
        if (webcamPermissionPrompt) webcamPermissionPrompt.classList.add('hidden');
      }

      renderCameraThumbnails();
      showToast(`Exibindo feed de: ${activeCam.name}`);
    }
  }

  // ================================================================
  // EXPANSÃO CENTRAL LIMPA: "SOMENTE ISSO, UM POUCO MAIOR NO MEIO"
  // ================================================================
  function expandCameraCenter() {
    if (!cameraMainFeed) return;
    cameraMainFeed.classList.add('is-expanded-center');
    if (cameraBackdropOverlay) cameraBackdropOverlay.classList.add('active');
  }

  function collapseCameraCenter() {
    if (!cameraMainFeed) return;
    cameraMainFeed.classList.remove('is-expanded-center');
    if (cameraBackdropOverlay) cameraBackdropOverlay.classList.remove('active');
  }

  // ==========================================
  // RENDERIZAÇÃO DO HUD / SCANLINES (CANVAS)
  // ==========================================
  function animateCameraFeed() {
    cameraAnimationPhase += 0.04;

    if (cameraFeedCtx && cameraFeedCanvas) {
      const w = cameraFeedCanvas.width;
      const h = cameraFeedCanvas.height;
      const activeCam = state.cameras.find(c => c.id === currentActiveCameraId);
      const themeColor = getActiveThemeColorHex();

      // 1. Caso seja a Webcam Local do Usuário
      if (activeCam && activeCam.isUserWebcam) {
        // O elemento <video id="webcamLiveVideo"> renderiza o vídeo da webcam nativamente atrás
        // Limpamos o canvas para mantê-lo transparente sobre o vídeo
        cameraFeedCtx.clearRect(0, 0, w, h);

        if (isWebcamStreaming) {
          // Filtro cibernético leve
          cameraFeedCtx.fillStyle = "rgba(0, 20, 10, 0.04)";
          cameraFeedCtx.fillRect(0, 0, w, h);

          // Linha de Scanline móvel (efeito CFTV suave)
          const scanlineY = (cameraAnimationPhase * 45) % h;
          cameraFeedCtx.fillStyle = "rgba(255, 255, 255, 0.035)";
          cameraFeedCtx.fillRect(0, scanlineY, w, 2);

          // Partículas sutis analógicas
          for (let i = 0; i < 15; i++) {
            const rx = Math.random() * w;
            const ry = Math.random() * h;
            cameraFeedCtx.fillStyle = "rgba(255,255,255,0.05)";
            cameraFeedCtx.fillRect(rx, ry, 2, 2);
          }
        } else {
          // Standby enquanto a permissão é concedida
          const bgGrad = cameraFeedCtx.createLinearGradient(0, 0, w, h);
          bgGrad.addColorStop(0, "#080c10");
          bgGrad.addColorStop(0.5, "#0b121a");
          bgGrad.addColorStop(1, "#05080c");
          cameraFeedCtx.fillStyle = bgGrad;
          cameraFeedCtx.fillRect(0, 0, w, h);

          // Linhas de radar standby
          const pulseRad = 35 + Math.sin(cameraAnimationPhase * 2) * 10;
          cameraFeedCtx.beginPath();
          cameraFeedCtx.arc(w / 2, h / 2, pulseRad, 0, Math.PI * 2);
          cameraFeedCtx.strokeStyle = themeColor;
          cameraFeedCtx.lineWidth = 1.5;
          cameraFeedCtx.stroke();
        }

      } else {
        // 2. Feed sintetizado de CFTV para as outras câmeras (Garagem, Jardim, etc.)
        const bgGrad = cameraFeedCtx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, "#080c10");
        bgGrad.addColorStop(0.5, "#0b121a");
        bgGrad.addColorStop(1, "#05080c");
        cameraFeedCtx.fillStyle = bgGrad;
        cameraFeedCtx.fillRect(0, 0, w, h);

        cameraFeedCtx.strokeStyle = "rgba(0, 230, 118, 0.18)";
        cameraFeedCtx.lineWidth = 1;

        cameraFeedCtx.beginPath();
        cameraFeedCtx.moveTo(w * 0.15, h);
        cameraFeedCtx.lineTo(w * 0.35, h * 0.45);
        cameraFeedCtx.lineTo(w * 0.65, h * 0.45);
        cameraFeedCtx.lineTo(w * 0.85, h);
        cameraFeedCtx.stroke();

        cameraFeedCtx.beginPath();
        cameraFeedCtx.moveTo(w * 0.35, h * 0.45);
        cameraFeedCtx.lineTo(w * 0.35, h * 0.1);
        cameraFeedCtx.lineTo(w * 0.65, h * 0.1);
        cameraFeedCtx.lineTo(w * 0.65, h * 0.45);
        cameraFeedCtx.stroke();

        const pulseRad = 25 + Math.sin(cameraAnimationPhase * 2) * 8;
        const pulseX = w * 0.5 + Math.cos(cameraAnimationPhase) * 30;
        const pulseY = h * 0.45;

        cameraFeedCtx.beginPath();
        cameraFeedCtx.arc(pulseX, pulseY, pulseRad, 0, Math.PI * 2);
        cameraFeedCtx.strokeStyle = themeColor;
        cameraFeedCtx.lineWidth = 1.2;
        cameraFeedCtx.stroke();

        const scanlineY = (cameraAnimationPhase * 40) % h;
        cameraFeedCtx.fillStyle = "rgba(255, 255, 255, 0.03)";
        cameraFeedCtx.fillRect(0, scanlineY, w, 2);

        for (let i = 0; i < 20; i++) {
          const rx = Math.random() * w;
          const ry = Math.random() * h;
          cameraFeedCtx.fillStyle = "rgba(255,255,255,0.06)";
          cameraFeedCtx.fillRect(rx, ry, 2, 2);
        }
      }
    }

    requestAnimationFrame(animateCameraFeed);
  }

  // Listeners de Expansão Direta da Câmera ("Somente isso, um pouco maior no meio")
  if (cameraMainFeed) {
    cameraMainFeed.addEventListener('click', (e) => {
      // Se clicou no botão de fechar ou no botão de autorizar câmera, não expande
      if (e.target.closest('#btn-close-camera-zoom') || e.target.closest('#btn-request-webcam')) {
        return;
      }
      if (!cameraMainFeed.classList.contains('is-expanded-center')) {
        expandCameraCenter();
      }
    });
  }

  if (btnExpandCamera) {
    btnExpandCamera.addEventListener('click', (e) => {
      e.stopPropagation();
      expandCameraCenter();
    });
  }

  if (btnCloseCameraZoom) {
    btnCloseCameraZoom.addEventListener('click', (e) => {
      e.stopPropagation();
      collapseCameraCenter();
    });
  }

  if (cameraBackdropOverlay) {
    cameraBackdropOverlay.addEventListener('click', collapseCameraCenter);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cameraMainFeed && cameraMainFeed.classList.contains('is-expanded-center')) {
      collapseCameraCenter();
    }
  });

  if (btnRequestWebcam) {
    btnRequestWebcam.addEventListener('click', (e) => {
      e.stopPropagation();
      requestWebcamAccess();
    });
  }

  // ==========================================
  // RELATÓRIO MENSAL (POSIÇÃO 4)
  // ==========================================
  function renderMiniChart() {
    const barsContainer = document.getElementById('mini-chart-bars');
    if (!barsContainer) return;
    barsContainer.innerHTML = '';

    const maxKwh = Math.max(...state.monthlyHistory.map(m => m.kwh));

    state.monthlyHistory.forEach((item, idx) => {
      const isLatest = idx === state.monthlyHistory.length - 1;
      const barHeightPct = (item.kwh / maxKwh) * 90;

      const bar = document.createElement('div');
      bar.className = `chart-bar-item ${isLatest ? 'active' : ''}`;
      bar.style.height = `${barHeightPct}%`;
      bar.title = `${item.month}: ${item.kwh} kWh (R$ ${item.val.toFixed(2)})`;
      barsContainer.appendChild(bar);
    });
  }

  // ==========================================
  // GERENCIAR & EXCLUIR ITENS (CONFIGURAÇÕES)
  // ==========================================
  function renderManageLists() {
    // 1. Gerenciar Luzes
    const manageLights = document.getElementById('manage-lights-list');
    if (manageLights) {
      manageLights.innerHTML = '';
      state.lights.forEach(l => {
        const row = document.createElement('div');
        row.className = 'manage-item-row';
        row.innerHTML = `
          <div class="manage-item-info">
            <span>💡</span>
            <div>
              <strong>${l.name}</strong>
              <span style="display:block; font-size: 0.72rem; color: var(--text-muted);">${l.room} • ${l.watts}W (${l.state ? 'Ligada' : 'Desligada'})</span>
            </div>
          </div>
          <button class="btn-delete-item" data-id="${l.id}">Excluir</button>
        `;
        row.querySelector('.btn-delete-item').addEventListener('click', () => {
          if (confirm(`Deseja excluir a luz "${l.name}"?`)) {
            state.lights = state.lights.filter(x => x.id !== l.id);
            saveState();
            renderLights();
            renderManageLists();
            showToast(`Luz "${l.name}" excluída.`);
          }
        });
        manageLights.appendChild(row);
      });
    }

    // 2. Gerenciar Eletrônicos
    const manageElec = document.getElementById('manage-electronics-list');
    if (manageElec) {
      manageElec.innerHTML = '';
      state.electronics.forEach(e => {
        const row = document.createElement('div');
        row.className = 'manage-item-row';
        row.innerHTML = `
          <div class="manage-item-info">
            <span>🔌</span>
            <div>
              <strong>${e.name}</strong>
              <span style="display:block; font-size: 0.72rem; color: var(--text-muted);">${e.category} • ${e.room} • ${e.watts}W</span>
            </div>
          </div>
          <button class="btn-delete-item" data-id="${e.id}">Excluir</button>
        `;
        row.querySelector('.btn-delete-item').addEventListener('click', () => {
          if (confirm(`Deseja remover o eletrônico "${e.name}"?`)) {
            state.electronics = state.electronics.filter(x => x.id !== e.id);
            saveState();
            renderElectronics();
            renderManageLists();
            showToast(`Eletrônico "${e.name}" removido.`);
          }
        });
        manageElec.appendChild(row);
      });
    }

    // 3. Gerenciar Câmeras
    const manageCam = document.getElementById('manage-cameras-list');
    if (manageCam) {
      manageCam.innerHTML = '';
      state.cameras.forEach(c => {
        const row = document.createElement('div');
        row.className = 'manage-item-row';
        row.innerHTML = `
          <div class="manage-item-info">
            <span>📹</span>
            <div>
              <strong>${c.name}</strong>
              <span style="display:block; font-size: 0.72rem; color: var(--text-muted);">${c.location} • ${c.type}</span>
            </div>
          </div>
          <button class="btn-delete-item" data-id="${c.id}">Excluir</button>
        `;
        row.querySelector('.btn-delete-item').addEventListener('click', () => {
          if (confirm(`Deseja excluir a câmera "${c.name}"?`)) {
            state.cameras = state.cameras.filter(x => x.id !== c.id);
            if (currentActiveCameraId === c.id && state.cameras.length > 0) {
              currentActiveCameraId = state.cameras[0].id;
            }
            saveState();
            renderCameraThumbnails();
            renderManageLists();
            showToast(`Câmera "${c.name}" excluída.`);
          }
        });
        manageCam.appendChild(row);
      });
    }
  }

  // ==========================================
  // CONTROLE DE MODAIS & EVENTOS
  // ==========================================
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('open');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('open');
  }

  // Fechar modais ao clicar no backdrop ou botão X
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });

  // Autenticação Modal (Login / Cadastro)
  const btnCloseAuth = document.getElementById('btn-close-auth');
  const tabAuthLogin = document.getElementById('tab-auth-login');
  const tabAuthRegister = document.getElementById('tab-auth-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const authTitleText = document.getElementById('auth-title-text');
  const authSubtitleText = document.getElementById('auth-subtitle-text');

  if (btnCloseAuth) btnCloseAuth.addEventListener('click', () => closeModal(modalAuth));

  if (tabAuthLogin && tabAuthRegister) {
    tabAuthLogin.addEventListener('click', () => {
      tabAuthLogin.classList.add('active');
      tabAuthRegister.classList.remove('active');
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
      authTitleText.textContent = "Entrar";
      authSubtitleText.textContent = "Acesse o sistema inteligente de energia e monitoramento da Laghotech";
    });

    tabAuthRegister.addEventListener('click', () => {
      tabAuthRegister.classList.add('active');
      tabAuthLogin.classList.remove('active');
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
      authTitleText.textContent = "Criar Conta";
      authSubtitleText.textContent = "Cadastre-se para ter controle total da sua residência ou empresa";
    });
  }

  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      state.user.email = email;
      state.user.isLoggedIn = true;
      saveState();
      updateUserUI();
      closeModal(modalAuth);
      showToast(`Bem-vindo de volta, ${state.user.name}!`);
    });
  }

  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const pwd = document.getElementById('reg-password').value;

      state.user.name = name;
      state.user.email = email;
      state.user.password = pwd;
      state.user.isLoggedIn = true;
      saveState();
      updateUserUI();
      closeModal(modalAuth);
      showToast(`Conta criada com sucesso! Olá, ${name}!`);
    });
  }

  // Configurações Modal
  const btnCloseSettings = document.getElementById('btn-close-settings');
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => closeModal(modalSettings));

  // Abas do modal de configurações
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.getAttribute('data-tab'));
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Seletor de Tema no modal
  document.querySelectorAll('.theme-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      const color = card.getAttribute('data-theme-val');
      applyTheme(color);
      showToast(`Tema alterado para: ${card.querySelector('strong').textContent}`);
    });
  });

  // Seletor de Tema na Sidebar (bolinhas coloridas)
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const color = dot.getAttribute('data-color');
      applyTheme(color);
      showToast(`Tema alterado para tom ${color}!`);
    });
  });

  // Atualizar perfil e senha no modal de configurações
  const formUpdateProfile = document.getElementById('form-update-profile');
  if (formUpdateProfile) {
    formUpdateProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('setting-user-name').value.trim();
      const newPwd = document.getElementById('setting-user-new-pwd').value;
      const confirmPwd = document.getElementById('setting-user-confirm-pwd').value;

      if (newName) state.user.name = newName;

      if (newPwd) {
        if (newPwd !== confirmPwd) {
          alert("As senhas não coincidem!");
          return;
        }
        state.user.password = newPwd;
        showToast("Senha redefinida com sucesso!");
      }

      saveState();
      updateUserUI();
      closeModal(modalSettings);
      showToast("Configurações do usuário atualizadas!");
    });
  }

  // Atualiza exibição do usuário
  function updateUserUI() {
    if (userTopbarName) userTopbarName.textContent = state.user.name;
    if (userTopbarEmail) userTopbarEmail.textContent = state.user.email;
    const settingName = document.getElementById('setting-user-name');
    const settingEmail = document.getElementById('setting-user-email');
    if (settingName) settingName.value = state.user.name;
    if (settingEmail) settingEmail.value = state.user.email;
  }

  // ==========================================
  // MENUS SELECT E BOTÕES DA SIDEBAR / HEADER
  // ==========================================
  
  // Dropdown do usuário (Topbar)
  if (userMenuTrigger) {
    userMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userBadgeWrapper.classList.toggle('open');
    });
  }

  document.addEventListener('click', () => {
    if (userBadgeWrapper) userBadgeWrapper.classList.remove('open');
    document.querySelectorAll('.custom-select-group').forEach(grp => grp.classList.remove('open'));
  });

  // Ações do menu do usuário
  const btnUserSettings = document.getElementById('btn-user-settings');
  if (btnUserSettings) {
    btnUserSettings.addEventListener('click', () => {
      openModal(modalSettings);
      renderManageLists();
    });
  }

  const btnUserResetPwd = document.getElementById('btn-user-reset-pwd');
  if (btnUserResetPwd) {
    btnUserResetPwd.addEventListener('click', () => {
      openModal(modalSettings);
      // Ativar aba de perfil
      const profileTabBtn = document.querySelector('[data-tab="tab-content-profile"]');
      if (profileTabBtn) profileTabBtn.click();
    });
  }

  const btnUserLogout = document.getElementById('btn-user-logout');
  if (btnUserLogout) {
    btnUserLogout.addEventListener('click', () => {
      openModal(modalAuth);
      showToast("Você saiu da sessão. Faça login para continuar.");
    });
  }

  // Selects do Header (Luzes, Eletrônicos, Câmeras)
  const selectLightsTrigger = document.getElementById('select-lights-trigger');
  const selectElectronicsTrigger = document.getElementById('select-electronics-trigger');
  const selectCamerasTrigger = document.getElementById('select-cameras-trigger');

  function setupSelectTrigger(trigger) {
    if (!trigger) return;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = trigger.parentElement;
      const isOpen = parent.classList.contains('open');
      document.querySelectorAll('.custom-select-group').forEach(g => g.classList.remove('open'));
      if (!isOpen) parent.classList.add('open');
    });
  }

  setupSelectTrigger(selectLightsTrigger);
  setupSelectTrigger(selectElectronicsTrigger);
  setupSelectTrigger(selectCamerasTrigger);

  // Ações dentro dos selects:
  document.getElementById('btn-nav-lights')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('section-lights')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-action-add-light')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(modalAddLight);
  });

  document.getElementById('btn-nav-electronics')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('section-electronics')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-action-add-electronic')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(modalAddElectronic);
  });

  document.getElementById('btn-nav-cameras')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('section-cameras')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-action-add-camera')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(modalAddCamera);
  });

  // Botões Normais: Relatório Mensal e Configurações
  document.getElementById('btn-header-report')?.addEventListener('click', () => openModal(modalFullReport));
  document.getElementById('side-btn-report')?.addEventListener('click', () => {
    closeSidebar();
    openModal(modalFullReport);
  });
  document.getElementById('btn-open-full-report')?.addEventListener('click', () => openModal(modalFullReport));
  document.getElementById('btn-close-full-report')?.addEventListener('click', () => closeModal(modalFullReport));
  document.getElementById('btn-close-report-action')?.addEventListener('click', () => closeModal(modalFullReport));

  document.getElementById('btn-header-settings')?.addEventListener('click', () => {
    openModal(modalSettings);
    renderManageLists();
  });
  document.getElementById('side-btn-settings')?.addEventListener('click', () => {
    closeSidebar();
    openModal(modalSettings);
    renderManageLists();
  });

  // Botões de Adicionar Rápidos
  document.getElementById('btn-quick-add-light')?.addEventListener('click', () => openModal(modalAddLight));
  document.getElementById('side-add-light')?.addEventListener('click', () => {
    closeSidebar();
    openModal(modalAddLight);
  });
  document.getElementById('btn-close-add-light')?.addEventListener('click', () => closeModal(modalAddLight));

  document.getElementById('btn-quick-add-electronic')?.addEventListener('click', () => openModal(modalAddElectronic));
  document.getElementById('side-add-electronic')?.addEventListener('click', () => {
    closeSidebar();
    openModal(modalAddElectronic);
  });
  document.getElementById('btn-close-add-electronic')?.addEventListener('click', () => closeModal(modalAddElectronic));

  document.getElementById('btn-quick-add-camera')?.addEventListener('click', () => openModal(modalAddCamera));
  document.getElementById('side-add-camera')?.addEventListener('click', () => {
    closeSidebar();
    openModal(modalAddCamera);
  });
  document.getElementById('btn-close-add-camera')?.addEventListener('click', () => closeModal(modalAddCamera));

  document.getElementById('btn-toggle-all-lights')?.addEventListener('click', toggleAllLights);

  // Form de Cadastrar Nova Luz
  const formAddLight = document.getElementById('form-add-light');
  if (formAddLight) {
    formAddLight.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('add-light-name').value.trim();
      const room = document.getElementById('add-light-room').value;
      const watts = parseInt(document.getElementById('add-light-watts').value, 10) || 20;

      const newLight = {
        id: `light-${Date.now()}`,
        name,
        room,
        watts,
        state: true
      };

      state.lights.push(newLight);
      saveState();
      renderLights();
      renderManageLists();
      closeModal(modalAddLight);
      formAddLight.reset();
      showToast(`Nova luz "${name}" cadastrada com sucesso!`);
    });
  }

  // Form de Registrar Novo Eletrônico
  const formAddElectronic = document.getElementById('form-add-electronic');
  if (formAddElectronic) {
    formAddElectronic.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('add-electronic-name').value.trim();
      const cat = document.getElementById('add-electronic-cat').value;
      const room = document.getElementById('add-electronic-room').value.trim();
      const watts = parseInt(document.getElementById('add-electronic-watts').value, 10) || 150;

      const iconMap = {
        "Eletrodoméstico": "🧊",
        "Climatização": "💨",
        "Entretenimento": "🎮",
        "Informática / Trabalho": "💻",
        "Cozinha / Aquecimento": "🔥"
      };

      const newElectronic = {
        id: `elec-${Date.now()}`,
        name,
        category: cat,
        room,
        watts,
        state: true,
        icon: iconMap[cat] || "🔌"
      };

      state.electronics.push(newElectronic);
      saveState();
      renderElectronics();
      renderManageLists();
      closeModal(modalAddElectronic);
      formAddElectronic.reset();
      showToast(`Eletrônico "${name}" registrado na tomada!`);
    });
  }

  // Form de Cadastrar Nova Câmera
  const formAddCamera = document.getElementById('form-add-camera');
  if (formAddCamera) {
    formAddCamera.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('add-camera-name').value.trim();
      const loc = document.getElementById('add-camera-location').value.trim();
      const type = document.getElementById('add-camera-type').value;

      const newCam = {
        id: `cam-${Date.now()}`,
        name,
        location: loc,
        type,
        active: true,
        colorTone: getActiveThemeColorHex()
      };

      state.cameras.push(newCam);
      currentActiveCameraId = newCam.id;
      saveState();
      renderCameraThumbnails();
      renderManageLists();
      closeModal(modalAddCamera);
      formAddCamera.reset();
      showToast(`Câmera "${name}" conectada e ativa!`);
    });
  }

  // Controle de abertura da Sidebar
  function openSidebar() {
    sidebarDrawer.classList.add('open');
    sidebarOverlay.classList.add('active');
  }

  function closeSidebar() {
    sidebarDrawer.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // Accordions da Sidebar
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      trigger.classList.toggle('active');
      const body = trigger.nextElementSibling;
      if (body) body.classList.toggle('active');
    });
  });

  // Helper de Toast Notifications
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="color: var(--neon-main); font-size: 1rem;">⚡</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================
  // INICIALIZAÇÃO GERAL DO SISTEMA
  // ==========================================
  applyTheme(state.theme || 'green');
  updateUserUI();
  renderLights();
  renderElectronics();
  initCameraStream();
  renderMiniChart();
  renderManageLists();
  drawSpeedometer();

  console.log("Laghotech Smart Energy & Surveillance inicializado com sucesso.");
});
