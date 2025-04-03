document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const registroForm = document.getElementById("registroForm")
  const participantsList = document.getElementById("participantsList")
  const participantesCount = document.getElementById("participantesCount")
  const emptyMessage = document.getElementById("emptyMessage")

  // Cargar participantes del localStorage
  let participants = []
  const savedParticipants = localStorage.getItem("triathlonParticipants")
  if (savedParticipants) {
    participants = JSON.parse(savedParticipants)
    updateParticipantsList()
  }

  // Function to show toast notifications
  function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toast-container")
    if (!toastContainer) {
      const container = document.createElement("div")
      container.id = "toast-container"
      container.style.position = "fixed"
      container.style.top = "20px"
      container.style.right = "20px"
      container.style.zIndex = "1000"
      document.body.appendChild(container)
    }

    const toast = document.createElement("div")
    toast.className = `toast bg-${type} text-white`
    toast.setAttribute("role", "alert")
    toast.setAttribute("aria-live", "assertive")
    toast.setAttribute("aria-atomic", "true")
    toast.style.marginBottom = "0.5rem"

    toast.innerHTML = `
      <div class="toast-body">${message}</div>
    `

    document.getElementById("toast-container").appendChild(toast)

    const bsToast = new bootstrap.Toast(toast)
    bsToast.show()

    toast.addEventListener("hidden.bs.toast", () => {
      toast.remove()
      if (document.getElementById("toast-container").children.length === 0) {
        document.getElementById("toast-container").remove()
      }
    })
  }

  // Manejar envío del formulario
  registroForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Obtener valores del formulario
    const cedula = document.getElementById("cedula").value.trim()
    const nombre = document.getElementById("nombre").value.trim()
    const municipio = document.getElementById("municipio").value.trim()
    const edad = document.getElementById("edad").value.trim()

    // Validaciones
    if (!cedula || !nombre || !municipio || !edad) {
      showToast("Todos los campos son obligatorios", "danger")
      return
    }

    if (isNaN(Number(edad)) || Number(edad) <= 0) {
      showToast("La edad debe ser un número positivo", "danger")
      return
    }

    if (Number(edad) <= 18) {
      showToast("Debe ser mayor de edad", "danger")
      return
    }

    if (Number(edad) >= 80) {
      showToast("Debe ser menor de 80", "danger")
      return
    }

    // Verificar si ya existe un participante con la misma cédula
    if (participants.some((p) => p.cedula === cedula)) {
      showToast("Ya existe un participante con esta cédula", "danger")
      return
    }

    // Crear nuevo participante
    const newParticipant = {
      id: Date.now().toString(),
      cedula,
      nombre,
      municipio,
      edad,
    }

    // Añadir a la lista y guardar
    participants.push(newParticipant)
    localStorage.setItem("triathlonParticipants", JSON.stringify(participants))

    // Actualizar UI
    updateParticipantsList()

    // Limpiar formulario
    registroForm.reset()

    // Mostrar notificación
    showToast(`${nombre} ha sido registrado exitosamente`, "success")
  })

  // Función para actualizar la lista de participantes en la UI
  function updateParticipantsList() {
    // Actualizar contador
    participantesCount.textContent = `Total: ${participants.length} participante${participants.length !== 1 ? "s" : ""}`

    // Mostrar/ocultar mensaje de vacío
    if (participants.length === 0) {
      emptyMessage.classList.remove("d-none")
      participantsList.innerHTML = ""
      return
    }

    emptyMessage.classList.add("d-none")

    // Generar HTML para cada participante
    participantsList.innerHTML = ""
    participants.forEach((participant) => {
      const participantEl = document.createElement("div")
      participantEl.className = "p-3 border rounded d-flex justify-content-between align-items-center"

      participantEl.innerHTML = `
        <div>
          <p class="fw-medium mb-1">${participant.nombre}</p>
          <p class="text-muted small mb-1">Cédula: ${participant.cedula}</p>
          <p class="text-muted small mb-0">${participant.municipio}, ${participant.edad} años</p>
        </div>
        <button class="btn btn-danger btn-sm delete-btn" data-id="${participant.id}">
          Eliminar
        </button>
      `

      participantsList.appendChild(participantEl)
    })

    // Añadir event listeners a los botones de eliminar
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.getAttribute("data-id")
        deleteParticipant(id)
      })
    })
  }

  // Función para eliminar un participante
  function deleteParticipant(id) {
    const participantIndex = participants.findIndex((p) => p.id === id)
    if (participantIndex !== -1) {
      const deletedName = participants[participantIndex].nombre
      participants.splice(participantIndex, 1)
      localStorage.setItem("triathlonParticipants", JSON.stringify(participants))
      updateParticipantsList()
      showToast(`${deletedName} ha sido eliminado`, "info")
    }
  }

  // Procesar archivo CSV
  const csvFileInput = document.getElementById("csvFile")
  const processCSVBtn = document.getElementById("processCSVBtn")

  processCSVBtn.addEventListener("click", () => {
    const file = csvFileInput.files[0]
    if (!file) {
      showToast("Por favor seleccione un archivo CSV", "danger")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      const lines = content.split("\n")

      // Contador para registros exitosos y fallidos
      let successCount = 0
      let failCount = 0
      let duplicateCount = 0

      // Validar y procesar cada línea
      lines.forEach((line, index) => {
        if (!line.trim()) return // Ignorar líneas vacías

        const values = line.split(",")

        // Verificar que tenga 4 columnas
        if (values.length !== 4) {
          failCount++
          return
        }

        const cedula = values[0].trim()
        const nombre = values[1].trim()
        const municipio = values[2].trim()
        const edad = values[3].trim()

        // Validaciones básicas
        if (!cedula || !nombre || !municipio || !edad) {
          failCount++
          return
        }

        if (isNaN(Number(edad)) || Number(edad) <= 0) {
          failCount++
          return
        }

        if (isNaN(Number(edad)) || Number(edad) <= 0) {
          failCount++
          return
        }


        // Verificar si ya existe un participante con la misma cédula
        if (participants.some((p) => p.cedula === cedula)) {
          duplicateCount++
          return
        }

        // Crear nuevo participante
        const newParticipant = {
          id: Date.now().toString() + index, // Añadir índice para evitar colisiones
          cedula,
          nombre,
          municipio,
          edad: Number(edad),
        }

        // Añadir a la lista
        participants.push(newParticipant)
        successCount++
      })

      // Guardar en localStorage
      localStorage.setItem("triathlonParticipants", JSON.stringify(participants))

      // Actualizar UI
      updateParticipantsList()

      // Mostrar resultados
      let message = `Procesado: ${successCount} registros exitosos`
      if (failCount > 0) message += `, ${failCount} fallidos`
      if (duplicateCount > 0) message += `, ${duplicateCount} duplicados`

      showToast(message, successCount > 0 ? "success" : "warning")

      // Cerrar modal
      const csvModalElement = document.getElementById("csvModal")
      const csvModal = bootstrap.Modal.getInstance(csvModalElement)

      if (csvModal) {
        csvModal.hide()
      }

      // Limpiar input
      csvFileInput.value = ""
    }

    reader.readAsText(file)
  })
})

