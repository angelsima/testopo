// test.js

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

    // Filtrado
    if (tema === 'all') {
      // Todos los temas de la categoría
      Object.values(bancoPreguntas).forEach(temaObj =>
        Object.values(temaObj).forEach(arr => (preguntas = preguntas.concat(arr)))
      );
    } else {
      const temaObj = bancoPreguntas[temaNorm] || {};
      if (subtema === 'all') {
        // Todos los subtemas del tema
        Object.values(temaObj).forEach(arr => (preguntas = preguntas.concat(arr)));
      } else {
        // Subtema específico
        preguntas = temaObj[subtemaNorm] || [];
      }
    }

    if (preguntas.length === 0) {
      quizForm.innerHTML = '<p>No hay preguntas con esos filtros.</p>';
      return;
    }

    // Mezclar + recortar
    preguntas = shuffle(preguntas).slice(0, num);

    // Generar HTML
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

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function corregir() {
  document.querySelectorAll('.explicacion').forEach(el =>
    el.classList.add('show')
  );
}
