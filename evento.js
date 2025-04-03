document.addEventListener("DOMContentLoaded", () => {
  // Constantes para las disciplinas
  const DISTANCIA_CAMINATA = 10 // km
  const DISTANCIA_NATACION = 10 // km
  const DISTANCIA_CICLISMO = 30 // km

  const VELOCIDAD_MAX_CAMINATA = 7 // km/h
  const VELOCIDAD_MAX_NATACION = 1.72 * 3.6 // m/s convertido a km/h (6.192 km/h)
  const VELOCIDAD_MAX_CICLISMO = 45 // km/h

  // Umbral para descalificación (velocidad menor a 1 km/h)
  const UMBRAL_DESCALIFICACION = 1 // km/h

  // Factores de velocidad de simulación
  const VELOCIDAD_NORMAL = 1 // Factor de velocidad normal
  const VELOCIDAD_RAPIDA = 60 // Factor de velocidad rápida (60x más rápido)

  // Probabilidad de descalificación (por defecto 1%)
  let probabilidadDescalificacion = 0.01

  // Variables de estado
  let velocidadSimulacion = VELOCIDAD_RAPIDA // Velocidad inicial (cambiado de VELOCIDAD_NORMAL a VELOCIDAD_RAPIDA)
  let tiempoSimulacion = 0 // Contador para el tiempo de simulación en segundos
  let horaInicioEvento = "" // Almacenar la hora de inicio del evento

  // Referencias a elementos del DOM
  const currentTimeEl = document.getElementById("currentTime")
  const startTimeInput = document.getElementById("startTime")
  const useCurrentTimeBtn = document.getElementById("useCurrentTimeBtn")
  const startEventBtn = document.getElementById("startEventBtn")
  const participantsTable = document.getElementById("participantsTable")
  const noParticipantsMessage = document.getElementById("noParticipantsMessage")
  const participantsContent = document.getElementById("participantsContent")
  const timeError = document.getElementById("timeError")
  const eventStartTime = document.getElementById("eventStartTime")
  const toggleSimulationBtn = document.getElementById("toggleSimulationBtn")
  const resetEventBtn = document.getElementById("resetEventBtn")
  const monitoringTabBtn = document.getElementById("monitoringTabBtn")
  const resultsTabBtn = document.getElementById("resultsTabBtn")
  const monitoringContent = document.getElementById("monitoringContent")
  const resultsContent = document.getElementById("resultsContent")
  const generalProgressBar = document.getElementById("generalProgressBar")
  const generalProgressPercent = document.getElementById("generalProgressPercent")
  const totalParticipants = document.getElementById("totalParticipants")
  const inProgressCount = document.getElementById("inProgressCount")
  const completedCount = document.getElementById("completedCount")
  const disqualifiedCount = document.getElementById("disqualifiedCount")
  const notifications = document.getElementById("notifications")
  const caminataCount = document.getElementById("caminataCount")
  const natacionCount = document.getElementById("natacionCount")
  const ciclismoCount = document.getElementById("ciclismoCount")
  const caminataProgress = document.getElementById("caminataProgress")
  const natacionProgress = document.getElementById("natacionProgress")
  const ciclismoProgress = document.getElementById("ciclismoProgress")
  const eventParticipantsTable = document.getElementById("eventParticipantsTable")
  const resultsTable = document.getElementById("resultsTable")
  const todosCount = document.getElementById("todosCount")
  const completadosCount = document.getElementById("completadosCount")
  const enProgresoCount = document.getElementById("enProgresoCount")
  const descalificadosCount = document.getElementById("descalificadosCount")

  // Variables de estado
  let participants = []
  let currentTime = ""
  let eventStarted = false
  let simulationRunning = true
  let simulationInterval = null
  const activeTab = "preparacion"
  let activeDiscipline = "caminata"
  let activeResultsFilter = "todos"
  let lastDisqualified = null
  let lastCompleted = null
  let simulationSeconds = 0 // Contador para el tiempo de simulación

  // Crear botón para cambiar velocidad de simulación
  const createSpeedToggleButton = () => {
    // Verificar si ya existe el botón
    if (document.getElementById("toggleSpeedBtn")) return

    const toggleSimulationBtnParent = toggleSimulationBtn.parentElement

    const toggleSpeedBtn = document.createElement("button")
    toggleSpeedBtn.id = "toggleSpeedBtn"
    toggleSpeedBtn.className = "btn btn-danger ms-2" // Cambiado de btn-warning a btn-danger
    toggleSpeedBtn.textContent = "Velocidad: Rápida" // Cambiado de "Normal" a "Rápida"
    toggleSpeedBtn.addEventListener("click", toggleSimulationSpeed)

    toggleSimulationBtnParent.appendChild(toggleSpeedBtn)
  }

  // Función para inicializar el control deslizante de probabilidad de descalificación
  function initDescalificationSlider() {
    const slider = document.getElementById("descalificationProbability")
    if (slider) {
      // Establecer el valor inicial (1%)
      slider.value = 1
      document.getElementById("descalificationValue").textContent = "1%"
    }
  }

  // Función para cambiar la velocidad de simulación
  function toggleSimulationSpeed() {
    const toggleSpeedBtn = document.getElementById("toggleSpeedBtn")

    if (velocidadSimulacion === VELOCIDAD_NORMAL) {
      velocidadSimulacion = VELOCIDAD_RAPIDA
      toggleSpeedBtn.textContent = "Velocidad: Rápida"
      toggleSpeedBtn.classList.remove("btn-warning")
      toggleSpeedBtn.classList.add("btn-danger")
    } else {
      velocidadSimulacion = VELOCIDAD_NORMAL
      toggleSpeedBtn.textContent = "Velocidad: Normal"
      toggleSpeedBtn.classList.remove("btn-danger")
      toggleSpeedBtn.classList.add("btn-warning")
    }

    // Reiniciar la simulación con la nueva velocidad
    if (simulationRunning) {
      clearInterval(simulationInterval)
      startSimulation()
    }
  }

  // Funciones auxiliares
  function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")
    return `${hours}:${minutes}:${seconds}`
  }

  function validateTimeFormat(time) {
    return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time)
  }

  function calculateTotalTime(startTime, endTime) {
    const [startHours, startMinutes, startSeconds] = startTime.split(":").map(Number)
    const [endHours, endMinutes, endSeconds] = endTime.split(":").map(Number)

    const start = new Date()
    start.setHours(startHours, startMinutes, startSeconds)

    const end = new Date()
    end.setHours(endHours, endMinutes, endSeconds)

    let diff = end.getTime() - start.getTime()

    let hours = Math.floor(diff / (1000 * 60 * 60))
    diff -= hours * (1000 * 60 * 60)
    let minutes = Math.floor(diff / (1000 * 60))
    diff -= minutes * (1000 * 60)
    let seconds = Math.floor(diff / 1000)

    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes
    seconds = seconds < 10 ? "0" + seconds : seconds

    return hours + ":" + minutes + ":" + seconds
  }

  // Cargar participantes del localStorage
  const savedParticipants = localStorage.getItem("triathlonParticipants")
  if (savedParticipants) {
    const parsedParticipants = JSON.parse(savedParticipants)
    // Inicializar el estado de los participantes para el evento
    participants = parsedParticipants.map((p) => ({
      ...p,
      presente: false,
      descalificado: false,
      tiempoDescalificacion: null, // Añadir tiempo de descalificación
      distanciaCaminata: 0,
      distanciaNatacion: 0,
      distanciaCiclismo: 0,
      inicioCaminata: null,
      finCaminata: null,
      inicioNatacion: null,
      finNatacion: null,
      inicioCiclismo: null,
      finCiclismo: null,
      tiempoTotal: null,
      distanciaTotal: 0,
      tiempoTranscurrido: 0,
      velocidadPromedio: 0,
      // Nuevas propiedades para velocidades
      velocidadCaminata: 0,
      velocidadNatacion: 0,
      velocidadCiclismo: 0,
      // Factor de progresión para cada participante (entre 0.5 y 1.5)
      factorProgresion: 0.5 + Math.random(),
    }))

    updateParticipantsTable()
  } else {
    noParticipantsMessage.classList.remove("d-none")
    participantsContent.classList.add("d-none")
  }

  // Actualizar reloj
  function updateClock() {
    const now = new Date()
    currentTime = formatTime(now)
    currentTimeEl.textContent = currentTime
  }

  // Iniciar reloj
  updateClock()

  // Añadir event listener para el control deslizante de probabilidad de descalificación
  document.getElementById("descalificationProbability").addEventListener("input", function () {
    const value = this.value
    probabilidadDescalificacion = value / 100 / 20 // Dividir entre 20 para reducir la probabilidad real
    document.getElementById("descalificationValue").textContent = value + "%"
  })

  setInterval(updateClock, 1000)

  // Event Listeners
  useCurrentTimeBtn.addEventListener("click", () => {
    startTimeInput.value = currentTime
    startTimeInput.classList.remove("is-invalid")
    timeError.textContent = ""
  })

  // Cambiar entre pestañas de monitoreo y resultados
  monitoringTabBtn.addEventListener("click", () => {
    monitoringTabBtn.classList.add("active")
    resultsTabBtn.classList.remove("active")
    monitoringContent.classList.remove("d-none")
    resultsContent.classList.add("d-none")
  })

  resultsTabBtn.addEventListener("click", () => {
    resultsTabBtn.classList.add("active")
    monitoringTabBtn.classList.remove("active")
    resultsContent.classList.remove("d-none")
    monitoringContent.classList.add("d-none")
    updateResultsTable()
  })

  // Cambiar entre disciplinas
  document.querySelectorAll("#disciplineTabs .nav-link").forEach((tab) => {
    tab.addEventListener("click", function () {
      const discipline = this.getAttribute("data-discipline")
      activeDiscipline = discipline

      // Actualizar UI
      document.querySelectorAll("#disciplineTabs .nav-link").forEach((t) => {
        t.classList.remove("active")
      })
      this.classList.add("active")

      document.querySelectorAll(".discipline-content").forEach((content) => {
        content.classList.add("d-none")
      })
      document.getElementById(`${discipline}Content`).classList.remove("d-none")

      // Actualizar el progreso de la disciplina seleccionada
      updateDisciplineProgress()
    })
  })

  // Cambiar entre filtros de resultados
  document.querySelectorAll("#resultsTabs .nav-link").forEach((tab) => {
    tab.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter")
      activeResultsFilter = filter

      // Actualizar UI
      document.querySelectorAll("#resultsTabs .nav-link").forEach((t) => {
        t.classList.remove("active")
      })
      this.classList.add("active")

      updateResultsTable()
    })
  })

  // Iniciar evento
  startEventBtn.addEventListener("click", () => {
    // Verificar si hay participantes presentes
    const presentParticipants = participants.filter((p) => p.presente)
    if (presentParticipants.length === 0) {
      alert("No hay participantes presentes para iniciar el evento")
      return
    }

    // Validar el formato de la hora de inicio
    const startTime = startTimeInput.value
    if (!startTime) {
      startTimeInput.classList.add("is-invalid")
      timeError.textContent = "No puedes ingresar horas futuras"
      return
    }

    if (!validateTimeFormat(startTime)) {
      startTimeInput.classList.add("is-invalid")
      timeError.textContent = "El formato debe ser HH:MM:SS"
      return
    }

    startTimeInput.classList.remove("is-invalid")
    timeError.textContent = ""

    // Guardar la hora de inicio del evento
    horaInicioEvento = startTime

    // Inicializar el tiempo de inicio de la primera disciplina para todos los participantes presentes
    participants = participants.map((p) => (p.presente ? { ...p, inicioCaminata: startTime } : p))

    // Actualizar UI
    eventStartTime.textContent = startTime
    document.getElementById("evento-tab").disabled = false
    document.getElementById("preparacion-tab").disabled = true

    // Cambiar a la pestaña de evento
    const eventoTab = new bootstrap.Tab(document.getElementById("evento-tab"))
    eventoTab.show()

    // Crear botón de cambio de velocidad
    createSpeedToggleButton()

    // Añadir después de createSpeedToggleButton():
    initDescalificationSlider()

    // Añadir después de initDescalificationSlider():
    setupNotificationsToggle()

    // Iniciar simulación
    eventStarted = true
    simulationRunning = true
    simulationSeconds = 0
    tiempoSimulacion = 0
    startSimulation()

    // Actualizar contadores
    updateCounts()
    updateDisciplineProgress()
    updateEventParticipantsTable()

    // Mostrar automáticamente la pestaña de resultados
    resultsTabBtn.click()
  })

  // Pausar/reanudar simulación
  toggleSimulationBtn.addEventListener("click", () => {
    simulationRunning = !simulationRunning

    if (simulationRunning) {
      toggleSimulationBtn.textContent = "Pausar Simulación"
      toggleSimulationBtn.classList.remove("btn-success")
      toggleSimulationBtn.classList.add("btn-danger")
      startSimulation()
    } else {
      toggleSimulationBtn.textContent = "Reanudar Simulación"
      toggleSimulationBtn.classList.remove("btn-danger")
      toggleSimulationBtn.classList.add("btn-success")
      clearInterval(simulationInterval)
    }
  })

  // Reiniciar evento
  resetEventBtn.addEventListener("click", () => {
    if (confirm("¿Está seguro que desea reiniciar el evento? Se perderán todos los datos actuales.")) {
      // Detener simulación
      clearInterval(simulationInterval)

      // Reiniciar estado de participantes
      participants = participants.map((p) => ({
        ...p,
        presente: false,
        descalificado: false,
        tiempoDescalificacion: null, // Reiniciar tiempo de descalificación
        distanciaCaminata: 0,
        distanciaNatacion: 0,
        distanciaCiclismo: 0,
        inicioCaminata: null,
        finCaminata: null,
        inicioNatacion: null,
        finNatacion: null,
        inicioCiclismo: null,
        finCiclismo: null,
        tiempoTotal: null,
        distanciaTotal: 0,
        tiempoTranscurrido: 0,
        velocidadPromedio: 0,
        velocidadCaminata: 0,
        velocidadNatacion: 0,
        velocidadCiclismo: 0,
        factorProgresion: 0.5 + Math.random(),
      }))

      // Reiniciar UI
      startTimeInput.value = ""
      horaInicioEvento = "" // Reiniciar hora de inicio
      eventStarted = false
      simulationRunning = true
      simulationSeconds = 0
      tiempoSimulacion = 0
      velocidadSimulacion = VELOCIDAD_NORMAL

      // Eliminar botón de velocidad si existe
      const toggleSpeedBtn = document.getElementById("toggleSpeedBtn")
      if (toggleSpeedBtn) {
        toggleSpeedBtn.remove()
      }

      // Cambiar a la pestaña de preparación
      document.getElementById("evento-tab").disabled = true
      document.getElementById("preparacion-tab").disabled = false
      const preparacionTab = new bootstrap.Tab(document.getElementById("preparacion-tab"))
      preparacionTab.show()

      // Actualizar tablas
      updateParticipantsTable()

      // Limpiar notificaciones
      notifications.innerHTML = ""
    }
  })

  // Función para ordenar participantes según criterios específicos
  function sortParticipants(participantsList) {
    return [...participantsList].sort((a, b) => {
      // Primero, los descalificados van al final
      if (a.descalificado && !b.descalificado) return 1
      if (!a.descalificado && b.descalificado) return -1

      // Si ambos están descalificados, ordenar por nombre
      if (a.descalificado && b.descalificado) {
        return a.nombre.localeCompare(b.nombre)
      }

      // Si uno ha completado y el otro no, el que completó va primero
      if (a.finCiclismo && !b.finCiclismo) return -1
      if (!a.finCiclismo && b.finCiclismo) return 1

      // Si ambos han completado, ordenar por tiempo total (menor primero)
      if (a.finCiclismo && b.finCiclismo) {
        const tiempoA = calculateTimeInSeconds(a.inicioCaminata, a.finCiclismo)
        const tiempoB = calculateTimeInSeconds(b.inicioCaminata, b.finCiclismo)
        return tiempoA - tiempoB
      }

      // Si ninguno ha completado, ordenar por distancia total (mayor primero)
      const distanciaA = a.distanciaCaminata + a.distanciaNatacion + a.distanciaCiclismo
      const distanciaB = b.distanciaCaminata + b.distanciaNatacion + b.distanciaCiclismo

      if (distanciaA !== distanciaB) {
        return distanciaB - distanciaA
      }

      // Si tienen la misma distancia, ordenar por tiempo (menor primero)
      if (a.inicioCaminata && b.inicioCaminata) {
        const tiempoA = calculateTimeInSeconds(a.inicioCaminata, currentTime)
        const tiempoB = calculateTimeInSeconds(b.inicioCaminata, currentTime)
        return tiempoA - tiempoB
      }

      // Si todo lo demás es igual, ordenar por nombre
      return a.nombre.localeCompare(b.nombre)
    })
  }

  // Funciones de actualización de UI
  function updateParticipantsTable() {
    if (participants.length === 0) {
      noParticipantsMessage.classList.remove("d-none")
      participantsContent.classList.add("d-none")
      return
    }

    noParticipantsMessage.classList.add("d-none")
    participantsContent.classList.remove("d-none")

    participantsTable.innerHTML = ""
    participants.forEach((participant) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${participant.cedula}</td>
        <td>${participant.nombre}</td>
        <td>${participant.municipio}</td>
        <td>${participant.edad}</td>
        <td class="text-center">
          <input type="checkbox" class="form-check-input presence-checkbox" data-id="${participant.id}" ${
            participant.presente ? "checked" : ""
          }>
        </td>
      `
      participantsTable.appendChild(row)
    })

    // Añadir event listeners a los checkboxes
    document.querySelectorAll(".presence-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const id = this.getAttribute("data-id")
        togglePresence(id)
      })
    })
  }

  // Añadir event listener al checkbox "Seleccionar todos"
  document.getElementById("selectAllParticipants").addEventListener("change", function () {
    const isChecked = this.checked
    participants = participants.map((p) => ({ ...p, presente: isChecked }))
    updateParticipantsTable()
  })

  function togglePresence(id) {
    participants = participants.map((p) => (p.id === id ? { ...p, presente: !p.presente } : p))
  }

  function updateCounts() {
    const presentParticipants = participants.filter((p) => p.presente)
    const inProgress = presentParticipants.filter((p) => !p.descalificado && !p.finCiclismo)
    const completed = presentParticipants.filter((p) => p.finCiclismo && !p.descalificado)
    const disqualified = presentParticipants.filter((p) => p.descalificado)

    totalParticipants.textContent = presentParticipants.length
    inProgressCount.textContent = inProgress.length
    completedCount.textContent = completed.length
    disqualifiedCount.textContent = disqualified.length

    // Actualizar contadores de resultados
    todosCount.textContent = presentParticipants.length
    completadosCount.textContent = completed.length
    enProgresoCount.textContent = inProgress.length
    descalificadosCount.textContent = disqualified.length

    // Actualizar contadores de disciplinas
    const enCaminata = inProgress.filter((p) => !p.finCaminata).length
    const enNatacion = inProgress.filter((p) => p.finCaminata && !p.finNatacion).length
    const enCiclismo = inProgress.filter((p) => p.finNatacion && !p.finCiclismo).length

    caminataCount.textContent = enCaminata
    natacionCount.textContent = enNatacion
    ciclismoCount.textContent = enCiclismo

    // Actualizar progreso general
    const progresoGeneral = calcularProgresoGeneral()
    generalProgressBar.style.width = `${progresoGeneral}%`
    generalProgressPercent.textContent = `${Math.round(progresoGeneral)}%`
  }

  function calcularProgresoGeneral() {
    const participantesActivos = participants.filter((p) => p.presente && !p.descalificado)

    if (participantesActivos.length === 0) return 0

    const distanciaTotal = participantesActivos.reduce((total, p) => {
      return total + p.distanciaCaminata + p.distanciaNatacion + p.distanciaCiclismo
    }, 0)

    const distanciaMaximaPosible =
      participantesActivos.length * (DISTANCIA_CAMINATA + DISTANCIA_NATACION + DISTANCIA_CICLISMO)

    return (distanciaTotal / distanciaMaximaPosible) * 100
  }

  function updateDisciplineProgress() {
    // Actualizar progreso de caminata
    let participantesCaminata = participants.filter((p) => p.presente && !p.finCaminata)

    // Ordenar participantes para mostrar primero los no descalificados con mayor progreso
    participantesCaminata = sortParticipants(participantesCaminata)

    caminataProgress.innerHTML = ""

    if (participantesCaminata.length === 0) {
      caminataProgress.innerHTML = '<p class="text-center text-muted py-3">No hay participantes en esta disciplina</p>'
    } else {
      participantesCaminata.forEach((p) => {
        const porcentaje = (p.distanciaCaminata / DISTANCIA_CAMINATA) * 100
        const progressEl = document.createElement("div")
        progressEl.className = "participant-progress"

        // Añadir clase para participantes descalificados
        if (p.descalificado) {
          progressEl.classList.add("disqualified-participant")
        }

        progressEl.innerHTML = `
          <div class="d-flex justify-content-between small mb-1">
            <span>${p.nombre} ${p.descalificado ? '<span class="badge bg-danger">Descalificado</span>' : ""}</span>
            <span>${porcentaje.toFixed(1)}% - ${p.distanciaCaminata.toFixed(2)} km - Velocidad: ${p.velocidadCaminata.toFixed(2)} km/h</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar ${p.descalificado ? "bg-danger" : ""}" role="progressbar" style="width: ${porcentaje}%" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        `
        caminataProgress.appendChild(progressEl)
      })
    }

    // Actualizar progreso de natación
    let participantesNatacion = participants.filter((p) => p.presente && p.finCaminata && !p.finNatacion)

    // Ordenar participantes
    participantesNatacion = sortParticipants(participantesNatacion)

    natacionProgress.innerHTML = ""

    if (participantesNatacion.length === 0) {
      natacionProgress.innerHTML = '<p class="text-center text-muted py-3">No hay participantes en esta disciplina</p>'
    } else {
      participantesNatacion.forEach((p) => {
        const porcentaje = (p.distanciaNatacion / DISTANCIA_NATACION) * 100
        const progressEl = document.createElement("div")
        progressEl.className = "participant-progress"

        // Añadir clase para participantes descalificados
        if (p.descalificado) {
          progressEl.classList.add("disqualified-participant")
        }

        progressEl.innerHTML = `
          <div class="d-flex justify-content-between small mb-1">
            <span>${p.nombre} ${p.descalificado ? '<span class="badge bg-danger">Descalificado</span>' : ""}</span>
            <span>${porcentaje.toFixed(1)}% - ${p.distanciaNatacion.toFixed(2)} km - Velocidad: ${p.velocidadNatacion.toFixed(2)} km/h</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar ${p.descalificado ? "bg-danger" : ""}" role="progressbar" style="width: ${porcentaje}%" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        `
        natacionProgress.appendChild(progressEl)
      })
    }

    // Actualizar progreso de ciclismo
    let participantesCiclismo = participants.filter((p) => p.presente && p.finNatacion && !p.finCiclismo)

    // Ordenar participantes
    participantesCiclismo = sortParticipants(participantesCiclismo)

    ciclismoProgress.innerHTML = ""

    if (participantesCiclismo.length === 0) {
      ciclismoProgress.innerHTML = '<p class="text-center text-muted py-3">No hay participantes en esta disciplina</p>'
    } else {
      participantesCiclismo.forEach((p) => {
        const porcentaje = (p.distanciaCiclismo / DISTANCIA_CICLISMO) * 100
        const progressEl = document.createElement("div")
        progressEl.className = "participant-progress"

        // Añadir clase para participantes descalificados
        if (p.descalificado) {
          progressEl.classList.add("disqualified-participant")
        }

        progressEl.innerHTML = `
          <div class="d-flex justify-content-between small mb-1">
            <span>${p.nombre} ${p.descalificado ? '<span class="badge bg-danger">Descalificado</span>' : ""}</span>
            <span>${porcentaje.toFixed(1)}% - ${p.distanciaCiclismo.toFixed(2)} km - Velocidad: ${p.velocidadCiclismo.toFixed(2)} km/h</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar ${p.descalificado ? "bg-danger" : ""}" role="progressbar" style="width: ${porcentaje}%" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        `
        ciclismoProgress.appendChild(progressEl)
      })
    }
  }

  function updateEventParticipantsTable() {
    const presentParticipants = participants.filter((p) => p.presente)
    eventParticipantsTable.innerHTML = ""

    if (presentParticipants.length === 0) {
      eventParticipantsTable.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted py-3">No hay participantes presentes</td></tr>'
      return
    }

    // Ordenar participantes: primero los no descalificados, luego los descalificados
    const sortedParticipants = sortParticipants(presentParticipants)

    sortedParticipants.forEach((p) => {
      const row = document.createElement("tr")

      // Añadir clase para participantes descalificados
      if (p.descalificado) {
        row.classList.add("bg-danger-subtle")
      } else if (p.finCiclismo) {
        row.classList.add("bg-success-subtle")
      }

      // Determinar la disciplina actual y velocidad a mostrar
      let disciplinaActual = "N/A"
      let velocidadActual = "N/A"

      if (!p.finCaminata) {
        disciplinaActual = "Caminata"
        velocidadActual = `${p.velocidadCaminata.toFixed(2)} km/h`
      } else if (!p.finNatacion) {
        disciplinaActual = "Natación"
        velocidadActual = `${p.velocidadNatacion.toFixed(2)} km/h`
      } else if (!p.finCiclismo) {
        disciplinaActual = "Ciclismo"
        velocidadActual = `${p.velocidadCiclismo.toFixed(2)} km/h`
      }

      row.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.cedula}</td>
        <td>${p.municipio}</td>
        <td>${p.edad}</td>
        <td>
          ${
            p.descalificado
              ? '<span class="text-danger">Descalificado</span>'
              : p.finCiclismo
                ? '<span class="text-success">Completado</span>'
                : `<span class="text-primary">${disciplinaActual} (${velocidadActual})</span>`
          }
        </td>
      `
      eventParticipantsTable.appendChild(row)
    })
  }

  function updateResultsTable() {
    // Filtrar participantes según el filtro activo
    let filteredParticipants = participants.filter((p) => p.presente)

    switch (activeResultsFilter) {
      case "completados":
        filteredParticipants = filteredParticipants.filter((p) => p.finCiclismo && !p.descalificado)
        break
      case "en-progreso":
        filteredParticipants = filteredParticipants.filter((p) => !p.finCiclismo && !p.descalificado)
        break
      case "descalificados":
        filteredParticipants = filteredParticipants.filter((p) => p.descalificado)
        break
    }

    // Calcular distancia total y tiempo transcurrido para cada participante
    filteredParticipants = filteredParticipants.map((p) => {
      // Calcular distancia total recorrida
      const distanciaTotal = p.distanciaCaminata + p.distanciaNatacion + p.distanciaCiclismo

      // Calcular tiempo transcurrido
      let tiempoTranscurrido = 0
      if (p.inicioCaminata) {
        const inicio = p.inicioCaminata
        const fin =
          p.finCiclismo ||
          p.finNatacion ||
          p.finCaminata ||
          (p.descalificado ? p.tiempoDescalificacion : calcularTiempoSimulado(horaInicioEvento, tiempoSimulacion))
        tiempoTranscurrido = calculateTimeInSeconds(inicio, fin)
      }

      // Calcular velocidad promedio (km/h)
      const velocidadPromedio = tiempoTranscurrido > 0 ? distanciaTotal / (tiempoTranscurrido / 3600) : 0

      return {
        ...p,
        distanciaTotal,
        tiempoTranscurrido,
        velocidadPromedio,
      }
    })

    // Ordenar participantes usando la función de ordenación general
    const sortedParticipants = sortParticipants(filteredParticipants)

    // Actualizar tabla
    resultsTable.innerHTML = ""

    if (sortedParticipants.length === 0) {
      resultsTable.innerHTML =
        '<tr><td colspan="9" class="text-center text-muted py-3">No hay participantes en esta categoría</td></tr>'
      return
    }

    // Generar filas de la tabla
    sortedParticipants.forEach((p, index) => {
      const isCompletedParticipant = p.finCiclismo && !p.descalificado
      const isDisqualifiedParticipant = p.descalificado

      const row = document.createElement("tr")
      row.className = isDisqualifiedParticipant ? "bg-danger-subtle" : isCompletedParticipant ? "bg-success-subtle" : ""

      // Formatear el tiempo de inicio y fin
      const formatTimeRange = (start, end, tiempoDisciplina, isDisqualified) => {
        if (!start) return "-"

        // Si el participante está descalificado, mostrar la hora exacta de descalificación en rojo
        if (isDisqualified) {
          const tiempoDesc = p.tiempoDescalificacion || calcularTiempoSimulado(horaInicioEvento, tiempoSimulacion)
          return `${start} - <span class="text-danger">${tiempoDesc}</span>`
        }

        if (!end) return `${start} - En progreso`
        return `${start} - ${end}<br><small class="text-muted">(Tiempo: ${tiempoDisciplina || calculateTotalTime(start, end)})</small>`
      }

      // Calcular tiempo transcurrido en formato HH:MM:SS
      const tiempoFormateado = p.tiempoTotal || formatSecondsToTime(p.tiempoTranscurrido)

      // Determinar velocidades a mostrar
      const velocidadCaminata = p.velocidadCaminata.toFixed(2)
      const velocidadNatacion = p.velocidadNatacion.toFixed(2)
      const velocidadCiclismo = p.velocidadCiclismo.toFixed(2)

      // Calcular la distancia total para participantes descalificados
      const distanciaTotalDescalificado = p.distanciaTotal.toFixed(2)

      row.innerHTML = `
        <td>${isDisqualifiedParticipant ? '<span class="text-danger">-</span>' : index + 1}</td>
        <td>${p.nombre}</td>
        <td>${p.cedula}</td>
        <td>${p.municipio}</td>
        <td>${p.edad}</td>
        <td>
          ${
            isDisqualifiedParticipant
              ? `${formatTimeRange(p.inicioCaminata, p.finCaminata, null, true)}
                  <br><small class="text-danger">(${
                    p.velocidadDescalificacion ? p.velocidadDescalificacion.toFixed(2) : "0.00"
                  } km/h)</small>`
              : `${formatTimeRange(p.inicioCaminata, p.finCaminata, p.tiempoCaminata, false)}
                  ${p.inicioCaminata ? `<br><small class="text-muted">${velocidadCaminata} km/h</small>` : ""}`
          }
        </td>
        <td>
          ${
            isDisqualifiedParticipant
              ? `${formatTimeRange(p.inicioNatacion, p.finNatacion, null, true)}`
              : `${formatTimeRange(p.inicioNatacion, p.finNatacion, p.tiempoNatacion, false)}
                  ${p.inicioNatacion ? `<br><small class="text-muted">${velocidadNatacion} km/h</small>` : ""}`
          }
        </td>
        <td>
          ${
            isDisqualifiedParticipant
              ? `${formatTimeRange(p.inicioCiclismo, p.finCiclismo, null, true)}`
              : `${formatTimeRange(p.inicioCiclismo, p.finCiclismo, p.tiempoCiclismo, false)}
                  ${p.inicioCiclismo ? `<br><small class="text-muted">${velocidadCiclismo} km/h</small>` : ""}`
          }
        </td>
        <td>
          ${
            isDisqualifiedParticipant
              ? `<div class="d-flex flex-column">
        <div class="d-flex align-items-center"><i class="bi bi-exclamation-triangle text-danger me-1"></i><span class="text-danger fw-medium">Descalificado</span></div>
        <small class="text-danger">(${distanciaTotalDescalificado} km)</small>
        <small class="text-danger">Tiempo: ${tiempoFormateado}</small>
      </div>`
              : isCompletedParticipant
                ? `<div class="d-flex flex-column">
            <div class="d-flex align-items-center"><i class="bi bi-trophy text-success me-1"></i><span class="text-success fw-medium">Completado</span></div>
            <small class="text-success">Tiempo: ${tiempoFormateado}</small>
          </div>`
                : `<div class="d-flex flex-column">
            <div class="d-flex align-items-center"><i class="bi bi-clock text-primary me-1"></i><span class="text-primary">En progreso</span></div>
            <small class="text-primary">Tiempo: ${tiempoFormateado}</small>
          </div>`
          }
        </td>
      `

      resultsTable.appendChild(row)
    })
  }

  // Función para calcular tiempo en segundos entre dos horas en formato HH:MM:SS
  function calculateTimeInSeconds(startTime, endTime) {
    const [startHours, startMinutes, startSeconds] = startTime.split(":").map(Number)
    const [endHours, endMinutes, endSeconds] = endTime.split(":").map(Number)

    const startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds
    let endTotalSeconds = endHours * 3600 + endMinutes * 60 + endSeconds

    // Si el tiempo final es menor que el inicial, significa que pasó a otro día
    if (endTotalSeconds < startTotalSeconds) {
      endTotalSeconds += 24 * 3600 // Añadir un día en segundos
    }

    return endTotalSeconds - startTotalSeconds
  }

  // Función para formatear segundos a formato HH:MM:SS
  function formatSecondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Función para calcular el tiempo simulado basado en la hora de inicio y el tiempo transcurrido
  function calcularTiempoSimulado(horaInicio, segundosTranscurridos) {
    // Convertir la hora de inicio a un objeto Date
    const [horasInicio, minutosInicio, segundosInicio] = horaInicio.split(":").map(Number)

    const fechaInicio = new Date()
    fechaInicio.setHours(horasInicio, minutosInicio, segundosInicio, 0)

    // Añadir los segundos transcurridos
    const fechaActual = new Date(fechaInicio.getTime() + segundosTranscurridos * 1000)

    // Formatear la hora resultante
    return formatTime(fechaActual)
  }

  // Simulación del evento
  function startSimulation() {
    if (simulationInterval) {
      clearInterval(simulationInterval)
    }

    simulationInterval = setInterval(() => {
      if (!simulationRunning) return

      // Incrementar el contador de segundos de simulación
      simulationSeconds++

      // Incrementar el tiempo de simulación según la velocidad
      tiempoSimulacion += velocidadSimulacion

      // Verificar si todos los participantes han terminado o están descalificados
      const allFinished = participants.filter((p) => p.presente).every((p) => p.finCiclismo || p.descalificado)

      if (allFinished) {
        simulationRunning = false
        clearInterval(simulationInterval)
        toggleSimulationBtn.textContent = "Simulación Finalizada"
        toggleSimulationBtn.disabled = true
        return
      }

      let newDisqualified = null
      let newCompleted = null

      // Añadir estas líneas después de "let newCompleted = null;" en la función startSimulation:
      const posicionesAnteriores = {}

      // Inicializar posiciones anteriores si no existen
      if (Object.keys(posicionesAnteriores).length === 0) {
        const participantesPresentes = participants.filter((p) => p.presente)
        const participantesOrdenados = sortParticipants(participantesPresentes)

        participantesOrdenados.forEach((p, index) => {
          if (!p.descalificado) {
            posicionesAnteriores[p.id] = index + 1
          }
        })
      }

      // Calcular el tiempo simulado actual
      const horaActual = calcularTiempoSimulado(horaInicioEvento, tiempoSimulacion)

      // Actualizar estado de cada participante
      participants = participants.map((participant) => {
        // Si el participante no está presente, no hacer nada
        if (!participant.presente) {
          return participant
        }

        // Si el participante está descalificado pero ya han terminado todos los no descalificados
        // en su disciplina actual, permitirle continuar
        const disciplinaActual = !participant.finCaminata
          ? "caminata"
          : !participant.finNatacion
            ? "natacion"
            : !participant.finCiclismo
              ? "ciclismo"
              : null

        if (participant.descalificado && disciplinaActual) {
          // Contar cuántos participantes no descalificados están en esta disciplina
          const participantesEnDisciplina = participants.filter(
            (p) =>
              p.presente &&
              !p.descalificado &&
              ((disciplinaActual === "caminata" && !p.finCaminata) ||
                (disciplinaActual === "natacion" && p.finCaminata && !p.finNatacion) ||
                (disciplinaActual === "ciclismo" && p.finNatacion && !p.finCiclismo)),
          ).length

          // Si no hay participantes no descalificados en esta disciplina, permitir continuar
          if (participantesEnDisciplina === 0) {
            // Restaurar el estado del participante para que pueda continuar
            const updatedParticipant = { ...participant, descalificado: false }

            // Añadir notificación de que el participante ha sido readmitido
            addNotification(participant.nombre, "readmitted", null)

            return updatedParticipant
          }

          return participant
        }

        // Si ya terminó todas las disciplinas, no hacer nada
        if (participant.finCiclismo) {
          return participant
        }

        // Determinar en qué disciplina está el participante
        let disciplina = "caminata"
        let distanciaActual = 0
        let distanciaMaxima = 0
        let velocidadActual = 0

        if (!participant.finCaminata) {
          disciplina = "caminata"
          distanciaActual = participant.distanciaCaminata
          distanciaMaxima = DISTANCIA_CAMINATA
          velocidadActual = participant.velocidadCaminata
        } else if (!participant.finNatacion) {
          disciplina = "natacion"
          distanciaActual = participant.distanciaNatacion
          distanciaMaxima = DISTANCIA_NATACION
          velocidadActual = participant.velocidadNatacion
        } else {
          disciplina = "ciclismo"
          distanciaActual = participant.distanciaCiclismo
          distanciaMaxima = DISTANCIA_CICLISMO
          velocidadActual = participant.velocidadCiclismo
        }

        // Calcular la velocidad y distancia recorrida en este segundo
        const { velocidad, distanciaPorSegundo, descalificado } = calcularVelocidadYDistancia(
          disciplina,
          participant.factorProgresion,
          tiempoSimulacion,
          participant.id,
        )

        // Verificar si el participante debe ser descalificado (velocidad menor a 1 km/h)
        if (descalificado || velocidad < UMBRAL_DESCALIFICACION) {
          newDisqualified = participant.nombre
          return {
            ...participant,
            descalificado: true,
            tiempoDescalificacion: horaActual, // Guardar la hora exacta de descalificación
            velocidadDescalificacion: velocidad, // Guardar la velocidad a la que fue descalificado
          }
        }

        // Actualizar la distancia recorrida y la velocidad
        const updatedParticipant = { ...participant }

        // Aplicar el factor de velocidad de simulación a la distancia recorrida
        const distanciaAjustada = distanciaPorSegundo * velocidadSimulacion

        switch (disciplina) {
          case "caminata":
            updatedParticipant.velocidadCaminata = velocidad
            updatedParticipant.distanciaCaminata += distanciaAjustada

            // Verificar si completó la disciplina
            if (updatedParticipant.distanciaCaminata >= DISTANCIA_CAMINATA) {
              updatedParticipant.distanciaCaminata = DISTANCIA_CAMINATA
              updatedParticipant.finCaminata = horaActual

              // Calcular tiempo real transcurrido en esta disciplina
              const tiempoCaminata = calculateTimeInSeconds(updatedParticipant.inicioCaminata, horaActual)
              updatedParticipant.tiempoCaminata = formatSecondsToTime(tiempoCaminata)

              // Iniciar la siguiente disciplina
              updatedParticipant.inicioNatacion = horaActual
            }
            break

          case "natacion":
            updatedParticipant.velocidadNatacion = velocidad
            updatedParticipant.distanciaNatacion += distanciaAjustada

            // Verificar si completó la disciplina
            if (updatedParticipant.distanciaNatacion >= DISTANCIA_NATACION) {
              updatedParticipant.distanciaNatacion = DISTANCIA_NATACION
              updatedParticipant.finNatacion = horaActual

              // Calcular tiempo real transcurrido en esta disciplina
              const tiempoNatacion = calculateTimeInSeconds(updatedParticipant.inicioNatacion, horaActual)
              updatedParticipant.tiempoNatacion = formatSecondsToTime(tiempoNatacion)

              // Iniciar la siguiente disciplina
              updatedParticipant.inicioCiclismo = horaActual
            }
            break

          case "ciclismo":
            updatedParticipant.velocidadCiclismo = velocidad
            updatedParticipant.distanciaCiclismo += distanciaAjustada

            // Verificar si completó la disciplina
            if (updatedParticipant.distanciaCiclismo >= DISTANCIA_CICLISMO) {
              updatedParticipant.distanciaCiclismo = DISTANCIA_CICLISMO
              updatedParticipant.finCiclismo = horaActual
              newCompleted = participant.nombre

              // Calcular tiempo real transcurrido en esta disciplina
              const tiempoCiclismo = calculateTimeInSeconds(updatedParticipant.inicioCiclismo, horaActual)
              updatedParticipant.tiempoCiclismo = formatSecondsToTime(tiempoCiclismo)

              // Calcular tiempo total desde el inicio hasta el fin
              if (updatedParticipant.inicioCaminata && updatedParticipant.finCiclismo) {
                const tiempoTotal = calculateTimeInSeconds(
                  updatedParticipant.inicioCaminata,
                  updatedParticipant.finCiclismo,
                )
                updatedParticipant.tiempoTotal = formatSecondsToTime(tiempoTotal)
              }
            }
            break
        }

        return updatedParticipant
      })

      // Actualizar notificaciones
      if (newDisqualified) {
        const participanteDescalificado = participants.find((p) => p.nombre === newDisqualified)
        addNotification(newDisqualified, "disqualified", participanteDescalificado?.velocidadDescalificacion)
        lastDisqualified = newDisqualified
      }

      if (newCompleted) {
        addNotification(newCompleted, "completed")
        lastCompleted = newCompleted
      }

      // Añadir este código justo antes de actualizar la UI al final de la función startSimulation:

      // Verificar cambios de posición
      const participantesPresentes = participants.filter((p) => p.presente && !p.descalificado)
      const participantesOrdenados = sortParticipants(participantesPresentes)

      // Detectar cambios significativos de posición
      participantesOrdenados.forEach((p, index) => {
        const posicionActual = index + 1
        const posicionAnterior = posicionesAnteriores[p.id]

        // Si hay un cambio de posición significativo (2 o más posiciones)
        if (posicionAnterior && Math.abs(posicionActual - posicionAnterior) >= 2) {
          addPositionChangeNotification(p.nombre, posicionAnterior, posicionActual)
          // Actualizar la posición anterior
          posicionesAnteriores[p.id] = posicionActual
        }
      })

      // Actualizar todas las posiciones anteriores
      participantesOrdenados.forEach((p, index) => {
        posicionesAnteriores[p.id] = index + 1
      })

      // Actualizar UI
      updateCounts()
      updateDisciplineProgress()
      updateEventParticipantsTable()
      updateResultsTable() // Actualizar la tabla de resultados cada segundo
    }, 1000) // El intervalo siempre es 1 segundo, pero la velocidad de simulación se ajusta internamente
  }

  // Reemplazar la función calcularVelocidadYDistancia con esta versión mejorada:

  function calcularVelocidadYDistancia(disciplina, factorProgresion, segundosTranscurridos, participantId) {
    // Generar un número aleatorio entre 0 y 10
    const randomValue = Math.random() * 10

    // Si el valor aleatorio es menor a 1, descalificar al participante
    if (randomValue < probabilidadDescalificacion) {
      // Generar una velocidad aleatoria entre 0.1 y 0.9 km/h para la descalificación
      const velocidadDescalificacion = 0.1 + Math.random() * 0.8
      return {
        velocidad: velocidadDescalificacion,
        distanciaPorSegundo: velocidadDescalificacion / 3600,
        descalificado: true,
      }
    }

    // Velocidades máximas para cada disciplina
    let velocidadMaxima = 0

    switch (disciplina) {
      case "caminata":
        // Velocidad de caminata: de 0 a 7 km/h
        velocidadMaxima = VELOCIDAD_MAX_CAMINATA
        break
      case "natacion":
        // Velocidad de natación: de 0 a 1.72 m/s (convertido a km/h)
        velocidadMaxima = VELOCIDAD_MAX_NATACION
        break
      case "ciclismo":
        // Velocidad de ciclismo: de 0 a 45 km/h
        velocidadMaxima = VELOCIDAD_MAX_CICLISMO
        break
    }

    // Calcular velocidad base (entre 20% y 90% de la velocidad máxima)
    const velocidadBase = velocidadMaxima * (0.2 + 0.7 * Math.random())

    // Aplicar factores de progresión y tiempo
    let velocidad = velocidadBase * factorProgresion * (0.8 + 0.2 * Math.sin(segundosTranscurridos / 60))

    // Obtener todos los participantes activos en la misma disciplina
    const participantesActivos = participants.filter((p) => {
      if (!p.presente || p.descalificado) return false

      if (disciplina === "caminata" && !p.finCaminata) return true
      if (disciplina === "natacion" && p.finCaminata && !p.finNatacion) return true
      if (disciplina === "ciclismo" && p.finNatacion && !p.finCiclismo) return true

      return false
    })

    // Si hay suficientes participantes para crear dinámicas interesantes
    if (participantesActivos.length >= 2) {
      // Ordenar participantes por distancia en la disciplina actual
      const participantesOrdenados = [...participantesActivos].sort((a, b) => {
        let distanciaA = 0
        let distanciaB = 0

        if (disciplina === "caminata") {
          distanciaA = a.distanciaCaminata
          distanciaB = b.distanciaCaminata
        } else if (disciplina === "natacion") {
          distanciaA = a.distanciaNatacion
          distanciaB = b.distanciaNatacion
        } else {
          distanciaA = a.distanciaCiclismo
          distanciaB = b.distanciaCiclismo
        }

        return distanciaB - distanciaA
      })

      // Encontrar la posición del participante actual
      const posicionActual = participantesOrdenados.findIndex((p) => p.id === participantId)

      // Crear dinámicas basadas en la posición
      if (posicionActual !== -1) {
        // Dinámica 1: El líder puede tener caídas de rendimiento
        if (posicionActual === 0 && Math.random() < 0.15) {
          // 15% de probabilidad de que el líder tenga una caída de rendimiento
          velocidad *= 0.85
        }

        // Dinámica 2: Participantes en posiciones intermedias pueden tener "arranques"
        if (posicionActual > 0 && posicionActual < participantesOrdenados.length - 1 && Math.random() < 0.2) {
          // 20% de probabilidad de un arranque para posiciones intermedias
          velocidad *= 1.25
        }

        // Dinámica 3: Participantes rezagados pueden tener "remontadas"
        if (posicionActual >= participantesOrdenados.length / 2 && Math.random() < 0.25) {
          // 25% de probabilidad de remontada para la segunda mitad
          velocidad *= 1.3
        }

        // Dinámica 4: Duelos entre participantes cercanos
        if (posicionActual < participantesOrdenados.length - 1) {
          const participanteActual = participantesOrdenados[posicionActual]
          const siguienteParticipante = participantesOrdenados[posicionActual + 1]

          let distanciaActual = 0
          let distanciaSiguiente = 0

          if (disciplina === "caminata") {
            distanciaActual = participanteActual.distanciaCaminata
            distanciaSiguiente = siguienteParticipante.distanciaCaminata
          } else if (disciplina === "natacion") {
            distanciaActual = participanteActual.distanciaNatacion
            distanciaSiguiente = siguienteParticipante.distanciaNatacion
          } else {
            distanciaActual = participanteActual.distanciaCiclismo
            distanciaSiguiente = siguienteParticipante.distanciaCiclismo
          }

          // Si están muy cerca (menos de 0.5 km de diferencia)
          const diferencia = distanciaActual - distanciaSiguiente
          if (diferencia < 0.5 && diferencia > 0) {
            // Crear un duelo: el de atrás acelera, el de adelante puede desacelerar
            if (participantId === siguienteParticipante.id) {
              // El que va detrás acelera
              velocidad *= 1.2
            } else if (participantId === participanteActual.id && Math.random() < 0.4) {
              // El que va adelante puede desacelerar (40% de probabilidad)
              velocidad *= 0.9
            }
          }
        }

        // Dinámica 5: Efecto "acordeón" - los participantes tienden a agruparse
        if (posicionActual > 0) {
          const lider = participantesOrdenados[0]
          const participanteActual = participantesOrdenados[posicionActual]

          let distanciaLider = 0
          let distanciaActual = 0

          if (disciplina === "caminata") {
            distanciaLider = lider.distanciaCaminata
            distanciaActual = participanteActual.distanciaCaminata
          } else if (disciplina === "natacion") {
            distanciaLider = lider.distanciaNatacion
            distanciaActual = participanteActual.distanciaNatacion
          } else {
            distanciaLider = lider.distanciaCiclismo
            distanciaActual = participanteActual.distanciaCiclismo
          }

          // Si está muy lejos del líder, aumentar velocidad
          const diferencia = distanciaLider - distanciaActual
          if (diferencia > 2) {
            // A mayor diferencia, mayor aumento de velocidad
            const factorAcordeon = 1 + Math.min(diferencia, 5) / 10
            velocidad *= factorAcordeon
          }
        }
      }
    }

    // Añadir factor de emoción: identificar al líder y al segundo lugar en la competencia general
    const participantesActivosGeneral = participants.filter((p) => p.presente && !p.descalificado)

    // Ordenar por distancia total para identificar posiciones
    const participantesOrdenadosGeneral = [...participantesActivosGeneral].sort((a, b) => {
      const distanciaTotalA = a.distanciaCaminata + a.distanciaNatacion + a.distanciaCiclismo
      const distanciaTotalB = b.distanciaCaminata + b.distanciaNatacion + b.distanciaCiclismo
      return distanciaTotalB - distanciaTotalA
    })

    // Si hay al menos 2 participantes activos
    if (participantesOrdenadosGeneral.length >= 2) {
      const lider = participantesOrdenadosGeneral[0]
      const segundo = participantesOrdenadosGeneral[1]

      // Calcular la distancia entre el líder y el segundo
      const distanciaLider = lider.distanciaCaminata + lider.distanciaNatacion + lider.distanciaCiclismo
      const distanciaSegundo = segundo.distanciaCaminata + segundo.distanciaNatacion + segundo.distanciaCiclismo
      const diferencia = distanciaLider - distanciaSegundo

      // Si la diferencia es pequeña (menos de 5 km) y el participante actual es el líder o el segundo
      if (diferencia < 5 && diferencia > 0) {
        // Si este participante es el líder, reducir su velocidad ligeramente
        if (participantId === lider.id) {
          velocidad *= 0.92 // Reducir velocidad del líder en un 8%
        }
        // Si este participante es el segundo, aumentar su velocidad ligeramente
        else if (participantId === segundo.id) {
          velocidad *= 1.08 // Aumentar velocidad del segundo en un 8%
        }
      }
    }

    // Añadir un factor de aleatoriedad adicional para crear más dinamismo
    // Este factor puede hacer que un participante tenga un "momento de gloria" o un "bajón"
    const factorAleatorio = 0.9 + Math.random() * 0.2 // Entre 0.9 y 1.1
    velocidad *= factorAleatorio

    // Asegurar que la velocidad no sea menor que el umbral de descalificación
    velocidad = Math.max(velocidad, UMBRAL_DESCALIFICACION + 0.1)

    // Calcular distancia por segundo (km/h a km/s)
    const distanciaPorSegundo = velocidad / 3600

    return { velocidad, distanciaPorSegundo, descalificado: false }
  }

  // Añadir una función para mostrar cambios de posición en las notificaciones
  // Añadir después de la función addNotification:

  // Configurar el botón para mostrar/ocultar notificaciones
  function setupNotificationsToggle() {
    const toggleBtn = document.getElementById("toggleNotificationsBtn")
    const notificationsContainer = document.getElementById("notificationsContainer")

    if (toggleBtn && notificationsContainer) {
      toggleBtn.addEventListener("click", () => {
        const isCollapsed = notificationsContainer.classList.contains("notifications-collapsed")

        if (isCollapsed) {
          notificationsContainer.classList.remove("notifications-collapsed")
          toggleBtn.innerHTML = '<i class="bi bi-chevron-up me-1"></i><span>Ocultar</span>'
        } else {
          notificationsContainer.classList.add("notifications-collapsed")
          toggleBtn.innerHTML = '<i class="bi bi-chevron-down me-1"></i><span>Mostrar todas</span>'
        }
      })
    }
  }

  // Modificar la función addNotification para usar el nuevo contenedor
  function addNotification(nombre, type, velocidad = null) {
    const notificationsContainer = document.getElementById("notificationsContainer")
    const notificationEl = document.createElement("div")
    notificationEl.className = `notification notification-${type} d-flex align-items-center`

    if (type === "disqualified") {
      notificationEl.innerHTML = `
        <i class="bi bi-exclamation-triangle text-danger me-2"></i>
        <span><strong>${nombre}</strong> ha sido descalificado${velocidad ? ` (${velocidad.toFixed(2)} km/h)` : ""}</span>
      `
    } else if (type === "readmitted") {
      notificationEl.innerHTML = `
        <i class="bi bi-arrow-return-left text-warning me-2"></i>
        <span><strong>${nombre}</strong> ha sido readmitido a la competencia</span>
      `
    } else {
      notificationEl.innerHTML = `
        <i class="bi bi-trophy text-success me-2"></i>
        <span><strong>${nombre}</strong> ha completado el triatlón</span>
      `
    }

    notificationsContainer.prepend(notificationEl)

    // Limitar a 10 notificaciones
    const notifications = notificationsContainer.querySelectorAll(".notification")
    if (notifications.length > 10) {
      // Desvanecer la última notificación antes de eliminarla
      const lastNotification = notifications[notifications.length - 1]
      lastNotification.style.opacity = "0"
      setTimeout(() => {
        if (lastNotification.parentNode === notificationsContainer) {
          lastNotification.remove()
        }
      }, 500)
    }

    // No eliminar automáticamente las notificaciones
    // Las notificaciones permanecerán hasta que sean desplazadas por nuevas
  }

  // Modificar la función addPositionChangeNotification para use el nuevo contenedor
  function addPositionChangeNotification(nombre, posicionAnterior, posicionNueva) {
    const notificationsContainer = document.getElementById("notificationsContainer")
    const notificationEl = document.createElement("div")
    notificationEl.className = "notification d-flex align-items-center"

    // Determinar si subió o bajó de posición
    const esMejora = posicionNueva < posicionAnterior

    if (esMejora) {
      notificationEl.classList.add("bg-info-subtle")
      notificationEl.innerHTML = `
        <i class="bi bi-arrow-up-circle text-info me-2"></i>
        <span><strong>${nombre}</strong> ha subido de la posición ${posicionAnterior} a la ${posicionNueva}</span>
      `
    } else {
      notificationEl.classList.add("bg-warning-subtle")
      notificationEl.innerHTML = `
        <i class="bi bi-arrow-down-circle text-warning me-2"></i>
        <span><strong>${nombre}</strong> ha bajado de la posición ${posicionAnterior} a la ${posicionNueva}</span>
      `
    }

    notificationsContainer.prepend(notificationEl)

    // Limitar a 10 notificaciones
    const notifications = notificationsContainer.querySelectorAll(".notification")
    if (notifications.length > 10) {
      // Desvanecer la última notificación antes de eliminarla
      const lastNotification = notifications[notifications.length - 1]
      lastNotification.style.opacity = "0"
      setTimeout(() => {
        if (lastNotification.parentNode === notificationsContainer) {
          lastNotification.remove()
        }
      }, 500)
    }

    // No eliminar automáticamente las notificaciones
    // Las notificaciones permanecerán hasta que sean desplazadas por nuevas
  }

  // Añadir estilo para las notificaciones de readmisión y participantes descalificados
  const styleElement = document.createElement("style")
  styleElement.textContent = `
    .notification-readmitted {
      background-color: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.2);
    }

    .disqualified-participant {
      opacity: 0.8;
    }

    .notifications-collapsed {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }
  `
  document.head.appendChild(styleElement)

  // Función para mostrar notificaciones toast
  function showToast(message, type = "info") {
    // Crear elemento toast
    const toastEl = document.createElement("div")
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`
    toastEl.setAttribute("role", "alert")
    toastEl.setAttribute("aria-live", "assertive")
    toastEl.setAttribute("aria-atomic", "true")

    const toastContent = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `

    toastEl.innerHTML = toastContent

    // Añadir al contenedor de toasts o al body
    let toastContainer = document.querySelector(".toast-container")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3"
      document.body.appendChild(toastContainer)
    }

    toastContainer.appendChild(toastEl)

    // Inicializar y mostrar el toast
    const toast = new bootstrap.Toast(toastEl)
    toast.show()

    // Eliminar después de cerrar
    toastEl.addEventListener("hidden.bs.toast", () => {
      toastEl.remove()
    })
  }

  // Initialize Bootstrap's Tab component
  const bootstrap = window.bootstrap
})

