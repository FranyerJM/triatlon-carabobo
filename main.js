// Funciones compartidas entre todas las páginas

// Importar Bootstrap (asumiendo que se usa un bundler como webpack o parcel)
// Si no se usa un bundler, incluir Bootstrap en el HTML con tags <script>
// import * as bootstrap from 'bootstrap';

// Si se incluye Bootstrap directamente en el HTML, se puede declarar la variable así:
// const bootstrap = window.bootstrap;

// Formatear tiempo en formato HH:MM:SS
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

// Calcular la diferencia de tiempo entre dos horas en formato HH:MM:SS
function calculateTotalTime(startTime, endTime) {
  // Convertir las horas a segundos
  const [startHours, startMinutes, startSeconds] = startTime.split(":").map(Number)
  const [endHours, endMinutes, endSeconds] = endTime.split(":").map(Number)

  const startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds
  let endTotalSeconds = endHours * 3600 + endMinutes * 60 + endSeconds

  // Si el tiempo final es menor que el inicial, significa que pasó a otro día
  if (endTotalSeconds < startTotalSeconds) {
    endTotalSeconds += 24 * 3600 // Añadir un día en segundos
  }

  // Calcular la diferencia en segundos
  const diffSeconds = endTotalSeconds - startTotalSeconds

  // Convertir la diferencia a formato HH:MM:SS
  const hours = Math.floor(diffSeconds / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

// Validar formato de hora HH:MM:SS
function validateTimeFormat(time) {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/
  return timeRegex.test(time)
}

// Mostrar notificación toast
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

