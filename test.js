document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  cargarTest(
    params.get('categoria'),  // Nuevo parámetro añadido
    params.get('tema'),
     params.get('subtema'),
    parseInt(params.get('num')) // Convertir a número
  );
});

function cargarTest(categoria, tema, subtema, num) {
   try {
    if (!window.bancoPreguntas) throw new Error('No se cargaron las preguntas');
  // Normalizar nombres
  const normalizar = (str) => str.toLowerCase()
                                 .replace(/ /g, '_')
                                 .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  let preguntas = [];
  const temaNorm = normalizar(tema);
  const subtemaNorm = normalizar(subtema);

  
  // 1. Filtrar preguntas
  if (tema === 'all') {
    // Todos los temas de la categoría
    Object.values(bancoPreguntas).forEach(temaObj => {
      Object.values(temaObj).forEach(subtemaArray => {
        preguntas = preguntas.concat(subtemaArray);
      });
    });
  } else {
    const temaKey = tema.replace(/_/g, ' ');
    if (subtema === 'all') {
      // Todos los subtemas del tema
      Object.values(bancoPreguntas[temaKey]).forEach(subtemaArray => {
        preguntas = preguntas.concat(subtemaArray);
      });
    } else {
      // Subtema específico
      const subtemaKey = subtema.replace(/_/g, ' ');
      preguntas = bancoPreguntas[temaKey][subtemaKey] || [];
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
if (preguntas.length === 0) {
      quizForm.innerHTML = '<p>No se encontraron preguntas con los filtros seleccionados</p>';
      return;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('quizForm').innerHTML = 
      `<p>Error al cargar el test: ${error.message}</p>`;
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function corregir() {
  // Lógica de corrección similar a la original pero mostrando explicaciones
  document.querySelectorAll('.explicacion').forEach(e => e.classList.add('show'));
  // ... (resto de lógica de corrección similar al original)
}
