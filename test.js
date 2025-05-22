let preguntas = [];

function normalizar(str) {
  return str.toLowerCase()
    .replace(/ /g, '_')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function cargarPreguntas() {
  try {
    const snapshot = await window.db.collection("preguntas").get();
    preguntas = snapshot.docs.map(doc => ({
     id: doc.id,     
     ...doc.data()
   }));    
    if (preguntas.length === 0) {
      throw new Error('No se encontraron preguntas en Firestore');
    }
  } catch (error) {
    console.error('Error cargando preguntas desde Firestore:', error);
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

   const letras = ['a', 'b', 'c', 'd'];
  
  preguntasMostrar.forEach((pregunta, index) => {
    // Calcular porcentaje acierto
    let porcentajeText = "Acierto: —";
    let color = "black";

    if (pregunta.vecesIntentada > 0) {
      const porcentaje = Math.round((pregunta.vecesAcertada / pregunta.vecesIntentada) * 100);
      porcentajeText = `Acierto: ${porcentaje}%`;

      if (porcentaje < 50) {
        color = "red";
      } else if (porcentaje < 85) {
        color = "orange";
      } else {
        color = "green";
      }
    }
    const div = document.createElement('div');
    div.className = 'question';
    div.setAttribute('data-id', pregunta.id);
    div.innerHTML = `
        <div class="metadata"> <p style="font-size: 0.7em; color: ${color}; margin-top: -8px; margin-bottom: 8px;">
        ${porcentajeText}
      </p> #${pregunta.tema} #${pregunta.subtema}</div>
      <p>      <span class="question-number-inline">${index + 1}.</span>
      <strong>${pregunta.texto}</strong></p>
      ${pregunta.opciones.map((opcion, i) => `
        <div class="options">
          <label>
            <input type="radio" name="q${index}" value="${i}">
            <strong>${letras[i]})</strong> ${opcion}
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

async function corregir() {
  let correctas = 0;
  let noContestadas = 0;
  let incorrectas = 0;

const questionDivs = document.querySelectorAll('.question');
  for (let idx = 0; idx < questionDivs.length; idx++) {
    const questionDiv = questionDivs[idx];
    const preguntaId = questionDiv.dataset.id;    
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
 // Aquí se actualiza en Firebase el intento
    if (respuestaSeleccionada !== -1) {
            const acertada = respuestaSeleccionada === correcta;
      try {
        await window.db
          .collection("preguntas")
          .doc(preguntaId)
          .update({
            vecesIntentada: firebase.firestore.FieldValue.increment(1),
            vecesAcertada: acertada
              ? firebase.firestore.FieldValue.increment(1)
              : firebase.firestore.FieldValue.increment(0),
            ultimaRespuesta: new Date()
          });
        console.log(`✅ Actualizado pregunta ${preguntaId}`);
      } catch (e) {
        console.error(`❌ Error actualizando pregunta ${preguntaId}:`, e);
      }
    }
    if (respuestaSeleccionada === -1) {
      noContestadas++;
    } else if (respuestaSeleccionada === correcta) {
      correctas++;
    } else {
      incorrectas++;
    }
   }

  // Penalización por errores: 1 punto menos cada 3 incorrectas
  const penalizacion = Math.floor(incorrectas / 3);
  const correctasAjustadas = Math.max(correctas - penalizacion, 0);
   const totalPreguntas = questionDivs.length;
  const porcentaje = ((correctasAjustadas / totalPreguntas) * 100).toFixed(1);

  // Texto extra para mostrar penalización junto a correctas
  let textoPenalizacion = penalizacion > 0
    ? ` <span style="color:red">-${penalizacion}</span> `
    : "";

  document.getElementById('score').innerHTML = `
    <h3 style="text-align:center">Resultados:</h3>
    <p style="text-align:center">✅ = ${correctas}/${totalPreguntas}</p>
    <p style="text-align:center">❌ = ${incorrectas}/${totalPreguntas} (${incorrectas} errores = <span style="color:red">-${penalizacion}</span>)</p>
    <p style="text-align:center">⚪ = ${noContestadas}/${totalPreguntas}</p>
    <div style="border: 2px solid #ccc; border-radius: 8px; padding: 10px; background-color: #f0f8ff; max-width: 400px; margin: 10px auto;">
    <p style="text-align:center; font-weight: bold;"">NOTA FINAL: <span style="color:green">${correctasAjustadas}</span>/${totalPreguntas} - ${porcentaje}%</p>
    </div>
  `;
  
document.getElementById('btnImprimir').addEventListener('click', async () => {
  // Genera la lista de respuestas de nuevo (por si han cambiado)
  const lista = document.getElementById('listaRespuestas');
  lista.innerHTML = '';
  const questionDivs = document.querySelectorAll('.question');
  const letras = ['a', 'b', 'c', 'd'];
  questionDivs.forEach((div, idx) => {
     const correcta = parseInt(div.querySelector('.explicacion').dataset.correcta);
    const explicacion = div.querySelector('.explicacion').textContent.trim();
    const li = document.createElement('li');
li.textContent = `Pregunta ${idx+1} (${letras[correcta]})): ${explicacion}`;
    lista.appendChild(li);
  });

  // Muestra las respuestas y lanza la impresión
  document.getElementById('respuestasPrint').style.display = 'block';
  window.print();
  document.getElementById('respuestasPrint').style.display = 'none';
});

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
