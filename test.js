document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  cargarTest(params.get('tema'), params.get('subtema'), params.get('num'));
});

function cargarTest(tema, subtema, num) {
  let preguntas = [];
  
  // Filtrar preguntas según selección
  if (subtema === 'all') {
    Object.values(bancoPreguntas[tema]).forEach(subtema => {
      preguntas = preguntas.concat(subtema);
    });
  } else {
    preguntas = bancoPreguntas[tema][subtema];
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
