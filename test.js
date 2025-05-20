// Verificar si bancoPreguntas existe y tiene datos
function verificarBancoPreguntas() {
  if (!window.bancoPreguntas || typeof window.bancoPreguntas !== 'object') {
    throw new Error('El banco de preguntas no se cargó correctamente');
  }
}

function cargarTest(categoria, tema, subtema, num) {
  try {
    verificarBancoPreguntas();
    
    // Normalizar nombres (manejar tildes, mayúsculas y espacios)
    const normalizar = (str) => {
      if (!str) return '';
      return str.toLowerCase()
                .replace(/ /g, '_')
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
    };

    let preguntas = [];
    const temaNorm = normalizar(tema);
    const subtemaNorm = normalizar(subtema);

    console.log('Filtros:', {categoria, tema, subtema, num});
    console.log('Banco de preguntas:', window.bancoPreguntas);

    // Filtrar preguntas según selección
    if (tema === 'all') {
      // Todos los temas de la categoría
      Object.values(window.bancoPreguntas).forEach(temaObj => {
        Object.values(temaObj).forEach(subtemaArray => {
          preguntas = preguntas.concat(subtemaArray);
        });
      });
    } else {
      // Buscar por tema específico
      const temaKey = Object.keys(window.bancoPreguntas).find(
        key => normalizar(key) === temaNorm
      );
      
      if (temaKey) {
        if (subtema === 'all') {
          // Todos los subtemas del tema
          Object.values(window.bancoPreguntas[temaKey]).forEach(subtemaArray => {
            preguntas = preguntas.concat(subtemaArray);
          });
        } else {
          // Subtema específico
          const subtemaKey = Object.keys(window.bancoPreguntas[temaKey]).find(
            key => normalizar(key) === subtemaNorm
          );
          
          if (subtemaKey) {
            preguntas = window.bancoPreguntas[temaKey][subtemaKey] || [];
          }
        }
      }
    }

    // Mostrar mensaje si no hay preguntas
    if (preguntas.length === 0) {
      document.getElementById('quizForm').innerHTML = `
        <p>No se encontraron preguntas para:</p>
        <ul>
          <li>Categoría: ${categoria}</li>
          <li>Tema: ${tema}</li>
          <li>Subtema: ${subtema}</li>
        </ul>
      `;
      return;
    }

    // Mezclar y limitar preguntas
    preguntas = shuffle(preguntas).slice(0, num);

    // Generar HTML de las preguntas
    const quizForm = document.getElementById('quizForm');
    quizForm.innerHTML = ''; // Limpiar formulario
    
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

  } catch (error) {
    console.error('Error en cargarTest:', error);
    document.getElementById('quizForm').innerHTML = `
      <p style="color: red;">Error al cargar el test: ${error.message}</p>
      <p>Verifica la consola para más detalles.</p>
    `;
  }
}

// Función shuffle mejorada
function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function corregir() {
  // Tu lógica de corrección actual
}
