let preguntas = [];

function normalizar(str) {
  return str.toLowerCase()
    .replace(/ /g, '_')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function cargarPreguntas() {
  try {
    // Aquí debes cargar tu archivo preguntas_servicios.js
    // que debe tener una variable: const preguntas = [...];
    preguntas = window.preguntasServicios || [];
    
    if (preguntas.length === 0) {
      throw new Error('No se encontraron preguntas');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('quizForm').innerHTML = 
      '<p>Error al cargar las preguntas</p>';
  }
}

function filtrarPreguntas(tema, subtema) {
  return preguntas.filter(pregunta => {
    const matchTema = tema === 'all' || normalizar(pregunta.tema) === normalizar(tema);
    const matchSubtema = subtema === 'all' || normalizar(pregunta.subtema) === normalizar(subtema);
    return matchTema && matchSubtema;
  });
}

function mostrarPreguntas(preguntasMostrar) {
  const quizForm = document.getElementById('quizForm');
  quizForm.innerHTML = '';
  
  preguntasMostrar.forEach((pregunta, index) => {
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
      <div class="explicacion" data-correcta="${pregunta.correcta}">
        ${pregunta.explicacion}
      </div>
    `;
    quizForm.appendChild(div);
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function corregir() {
  let correctas = 0;
  const totalPreguntas = document.querySelectorAll('.question').length;

  document.querySelectorAll('.question').forEach((questionDiv) => {
    const inputs = questionDiv.querySelectorAll('input');
    const explicacion = questionDiv.querySelector('.explicacion');
    const correcta = parseInt(explicacion.dataset.correcta);

    let respuestaSeleccionada = -1;
    inputs.forEach((input, i) => {
      if (input.checked) respuestaSeleccionada = i;
      const label = input.parentElement;
      label.classList.remove('correct', 'incorrect');
      
      if (i === correcta) {
        label.classList.add('correct');
      } else if (i === respuestaSeleccionada) {
        label.classList.add('incorrect');
      }
    });

    explicacion.style.display = 'block';
    if (respuestaSeleccionada === correcta) correctas++;
  });

  const porcentaje = ((correctas / totalPreguntas) * 100).toFixed(1);
  document.getElementById('score').innerHTML = `
    <h3>Resultados:</h3>
    <p>✅ Correctas: ${correctas}</p>
    <p>❌ Incorrectas: ${totalPreguntas - correctas}</p>
    <p>📊 Porcentaje: ${porcentaje}%</p>
  `;
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  await cargarPreguntas();
  
  const urlParams = new URLSearchParams(window.location.search);
  const tema = urlParams.get('tema') || 'all';
  const subtema = urlParams.get('subtema') || 'all';
  const num = parseInt(urlParams.get('num')) || 10;

  const preguntasFiltradas = filtrarPreguntas(tema, subtema);
  const preguntasMezcladas = shuffle([...preguntasFiltradas]).slice(0, num);
  
  mostrarPreguntas(preguntasMezcladas);
});
