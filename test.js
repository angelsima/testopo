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
        <div class="metadata">#${pregunta.tema} #${pregunta.subtema}</div>
      <p>      <span class="question-number-inline">${index + 1}.</span>
      <strong>${pregunta.texto}</strong></p>
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
  let noContestadas = 0;
  let incorrectas = 0;

  const totalPreguntas = document.querySelectorAll('.question').length;

  document.querySelectorAll('.question').forEach((questionDiv) => {
    const inputs = questionDiv.querySelectorAll('input');
    const explicacion = questionDiv.querySelector('.explicacion');
    const correcta = parseInt(explicacion.dataset.correcta);

    let respuestaSeleccionada = -1;

    inputs.forEach((input, i) => {
      if (input.checked) respuestaSeleccionada = i;
    });

    inputs.forEach((input, i) => {
      const label = input.parentElement;
      label.classList.remove('correct', 'incorrect');

      if (i === correcta) {
        label.classList.add('correct');
      } else if (i === respuestaSeleccionada && i !== correcta) {
        label.classList.add('incorrect');
      }
    });

    explicacion.style.display = 'block';

    if (respuestaSeleccionada === -1) {
      noContestadas++;
    } else if (respuestaSeleccionada === correcta) {
      correctas++;
    } else {
      incorrectas++;
    }
  });

  // Penalización por errores: 1 punto menos cada 3 incorrectas
  const penalizacion = Math.floor(incorrectas / 3);
  const correctasAjustadas = Math.max(correctas - penalizacion, 0);
  const porcentaje = ((correctasAjustadas / totalPreguntas) * 100).toFixed(1);

  // Texto extra para mostrar penalización junto a correctas
  let textoPenalizacion = penalizacion > 0
    ? ` -${penalizacion} = ${correctasAjustadas}/${totalPreguntas}`
    : "";

  document.getElementById('score').innerHTML = `
    <h3 style="text-align:center">Resultados:</h3>
    <p style="text-align:center">✅ Correctas: ${correctas}/${totalPreguntas}${textoPenalizacion}</p>
    <p style="text-align:center">❌ Incorrectas: ${incorrectas}/${totalPreguntas} (${incorrectas} errores = -${penalizacion})</p>
    <p style="text-align:center">⚪ No contestadas: ${noContestadas}/${totalPreguntas}</p>
    <p style="text-align:center">📊 Porcentaje: ${porcentaje}%</p>
  `;
}

window.corregir = corregir;

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
