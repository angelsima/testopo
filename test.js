// Función para capitalizar strings
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Función para cargar scripts dinámicamente
async function cargarScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Error al cargar: ${src}`));
    document.head.appendChild(script);
  });
}

// Función principal de la aplicación
async function iniciarAplicacion() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    
    // Cargar los bancos de preguntas necesarios
    if (categoria === 'all') {
      await Promise.all([
        cargarScript('preguntas_servicios.js'),
        cargarScript('preguntas_auxiliar.js'),
        cargarScript('preguntas_administrativo.js')
      ]);
      window.bancoCompleto = {
        ...bancoServicios,
        ...bancoAuxiliar,
        ...bancoAdministrativo
      };
    } else {
      await cargarScript(`preguntas_${categoria}.js`);
      window.bancoCompleto = window[`banco${capitalize(categoria)}`];
    }

    // Ejecutar la carga del test
    cargarTest(
      categoria,
      urlParams.get('tema'),
      urlParams.get('subtema'),
      parseInt(urlParams.get('num'))
    );
    
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('quizForm').innerHTML = `
      <div class="error">
        <p>🚨 Error crítico:</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Función principal para cargar el test
function cargarTest(categoria, tema, subtema, num) {
  try {
    const normalizar = (str) => {
      return str.toLowerCase()
        .replace(/ /g, '_')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };

    let preguntas = [];
    const temaNorm = normalizar(tema);
    const subtemaNorm = normalizar(subtema);

    // Filtrar preguntas
    if (tema === 'all') {
      // Todos los temas
      Object.values(window.bancoCompleto).forEach(temaObj => {
        Object.values(temaObj).forEach(subtemaArray => {
          preguntas = preguntas.concat(subtemaArray);
        });
      });
    } else {
      // Tema específico
      const temaKey = Object.keys(window.bancoCompleto).find(
        key => normalizar(key) === temaNorm
      );
      
      if (temaKey) {
        if (subtema === 'all') {
          // Todos los subtemas
          Object.values(window.bancoCompleto[temaKey]).forEach(subtemaArray => {
            preguntas = preguntas.concat(subtemaArray);
          });
        } else {
          // Subtema específico
          const subtemaKey = Object.keys(window.bancoCompleto[temaKey]).find(
            key => normalizar(key) === subtemaNorm
          );
          
          if (subtemaKey) {
            preguntas = window.bancoCompleto[temaKey][subtemaKey] || [];
          }
        }
      }
    }

    // Manejar caso sin preguntas
    if (preguntas.length === 0) {
      const mensaje = `<p>No se encontraron preguntas para:<br>
                      - Categoría: ${categoria}<br>
                      - Tema: ${tema}<br>
                      - Subtema: ${subtema}</p>`;
      document.getElementById('quizForm').innerHTML = mensaje;
      return;
    }

    // Mezclar y limitar preguntas
    preguntas = shuffle(preguntas).slice(0, num);

    // Generar HTML
    const quizForm = document.getElementById('quizForm');
    quizForm.innerHTML = '';
    
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
        <div class="explicacion" data-correcta="${pregunta.correcta}">
          ${pregunta.explicacion}
        </div>
      `;
      quizForm.appendChild(div);
    });

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('quizForm').innerHTML = `
      <div class="error">
        <p>Error al cargar el test:</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Función para mezclar preguntas
function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Función de corrección
function corregir() {
  let correctas = 0;
  const totalPreguntas = document.querySelectorAll('.question').length;

  document.querySelectorAll('.question').forEach((questionDiv, index) => {
    const inputs = questionDiv.querySelectorAll('input');
    const explicacion = questionDiv.querySelector('.explicacion');
    const correcta = parseInt(explicacion.dataset.correcta);

    let respuestaSeleccionada = -1;
    inputs.forEach((input, i) => {
      if (input.checked) respuestaSeleccionada = i;
    });

    // Mostrar explicación
    explicacion.style.display = 'block';

    // Resaltar respuestas
    inputs.forEach((input, i) => {
      const label = input.parentElement;
      label.style.backgroundColor = i === correcta ? '#e8f5e9' : 
                                  (i === respuestaSeleccionada ? '#ffebee' : '');
    });

    if (respuestaSeleccionada === correcta) correctas++;
  });

  // Mostrar resultados
  const porcentaje = ((correctas / totalPreguntas) * 100).toFixed(1);
  document.getElementById('score').innerHTML = `
    <h3>Resultados:</h3>
    <p>✅ Correctas: ${correctas}</p>
    <p>❌ Incorrectas: ${totalPreguntas - correctas}</p>
    <p>📊 Porcentaje: ${porcentaje}%</p>
  `;
}



// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', iniciarAplicacion);
