document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  cargarTest(
    params.get('categoria'),  // Nuevo parámetro añadido
    params.get('tema'),
    parseInt(params.get('num')) // Convertir a número
  );
});

function cargarTest(categoria, tema, num) { // Recibir parámetros individuales
  let preguntas = [];
  
 // 1. Filtrar por tema
  if (tema === 'all') {
    // Recorrer todos los temas de la categoría
    Object.values(bancoPreguntas).forEach(tema => {
      Object.values(tema).forEach(subtema => {
        preguntas = preguntas.concat(subtema);
      });
    });
  } else {
    // Buscar preguntas del tema específico
    const temaSeleccionado = bancoPreguntas[tema.toLowerCase()];
    if (temaSeleccionado) {
      Object.values(temaSeleccionado).forEach(subtema => {
        preguntas = preguntas.concat(subtema);
      });
    }
  }
  
  // Mezclar y limitar preguntas
  preguntas = shuffle(preguntas).slice(0, num);
  
  // Generar HTML
  const quizForm = document.getElementById('quizForm');
  preguntas.forEach((pregunta, index) => {
    const div = document.createElement('div');
    div.className = 'question';
    div.innerHTML = `
      <p><strong>${pregunta.texto}</strong></p>
      ${pregunta.opciones.map((opcion, i) => `
        <div class="options">
          <label>
            <input type="radio" name="q${index}" value="${i}">
            ${opcion}
          </label>
        </div>
      `).join('')}
      <div class="explicacion">${pregunta.explicacion}</div>
    `;
    quizForm.appendChild(div);
  });
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function corregir() {
  // Lógica de corrección similar a la original pero mostrando explicaciones
  document.querySelectorAll('.explicacion').forEach(e => e.classList.add('show'));
  // ... (resto de lógica de corrección similar al original)
}
