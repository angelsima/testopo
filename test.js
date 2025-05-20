// test.js

/**
 * Carga el test desde el banco de preguntas y lo pinta en el formulario.
 */
function cargarTest(categoria, tema, subtema, num) {
  const quizForm = document.getElementById('quizForm');
  quizForm.innerHTML = ''; // Limpiar cualquier contenido previo

  try {
    if (typeof bancoPreguntas === 'undefined') {
      throw new Error('No se cargaron las preguntas');
    }

    // Normaliza cadenas ("Título Preliminar" → "titulo_preliminar")
    const normalizar = str =>
      str
        .toLowerCase()
        .replace(/ /g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const temaNorm = normalizar(tema);
    const subtemaNorm = normalizar(subtema);

    let preguntas = [];

    // Filtrado de preguntas
    if (tema === 'all') {
      Object.values(bancoPreguntas).forEach(temaObj =>
        Object.values(temaObj).forEach(arr => (preguntas = preguntas.concat(arr)))
      );
    } else {
      const temaObj = bancoPreguntas[temaNorm] || {};
      if (subtema === 'all') {
        Object.values(temaObj).forEach(arr => (preguntas = preguntas.concat(arr)));
      } else {
        preguntas = temaObj[subtemaNorm] || [];
      }
    }

    if (preguntas.length === 0) {
      quizForm.innerHTML = '<p>No hay preguntas con esos filtros.</p>';
      return;
    }

    // Mezclar y recortar
    preguntas = shuffle(preguntas).slice(0, num);

    // Guardamos para la corrección
    window.currentPreguntas = preguntas;

    // Generar HTML de cada pregunta
    preguntas.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'question';
      div.innerHTML = `
        <p><strong>${p.texto}</strong></p>
        ${p.opciones
          .map(
            (opt, j) => `
          <div class="options">
            <label>
              <input type="radio" name="q${i}" value="${j}">
              ${opt}
            </label>
          </div>
        `
          )
          .join('')}
        <div class="explicacion">${p.explicacion}</div>
      `;
      quizForm.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    quizForm.innerHTML = `<p>Error al cargar el test: ${err.message}</p>`;
  }
}

/**
 * Fisher–Yates shuffle.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Corrige el test: colorea respuestas, muestra explicaciones y calcula la puntuación.
 */
function corregir() {
  const preguntas = window.currentPreguntas || [];
  const total = preguntas.length;
  let aciertos = 0;
  let errores = 0;
  let noContestadas = 0;

  const questionDivs = document.querySelectorAll('.question');

  preguntas.forEach((pregunta, i) => {
    const div = questionDivs[i];
    const labels = div.querySelectorAll('label');
    const inputs = div.querySelectorAll('input[type="radio"]');

    // Determinar selección del usuario
    let seleccionada = null;
    inputs.forEach(input => {
      if (input.checked) seleccionada = parseInt(input.value, 10);
    });

    // Mostrar explicación
    div.querySelector('.explicacion').classList.add('show');

    // Marcar y contar
    if (seleccionada === null) {
      noContestadas++;
      // opcional: podrías marcar el div con otra clase
    } else if (seleccionada === pregunta.correcta) {
      aciertos++;
      labels[seleccionada].classList.add('correct');
    } else {
      errores++;
      labels[seleccionada].classList.add('incorrect');
      // además marcamos la respuesta correcta en verde
      labels[pregunta.correcta].classList.add('correct');
    }
  });

  // Mostrar el resumen
  const scoreDiv = document.getElementById('score');
  scoreDiv.innerHTML = `
    <p><strong>Aciertos:</strong> ${aciertos}/${total}</p>
    <p><strong>Errores:</strong> ${errores}/${total}</p>
    <p><strong>No contestadas:</strong> ${noContestadas}/${total}</p>
  `;
}
