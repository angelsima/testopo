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
      const pct = Math.round((pregunta.vecesAcertada / pregunta.vecesIntentada) * 100);
      porcentajeText = `Acierto: ${pct}%`;
      if (pct < 50) color = "red";
      else if (pct < 85) color = "orange";
      else color = "green";
    }

    const div = document.createElement('div');
    div.className = 'question';
    div.dataset.id = pregunta.id;
    div.innerHTML = `
      <div class="metadata">
        <span class="acierto" style="color: ${color};">${porcentajeText}</span>
        <span class="tema">#${pregunta.tema} #${pregunta.subtema}</span>
      </div>
      <p>
        <span class="question-number-inline">${index + 1}.</span>
        <strong>${pregunta.texto}</strong>
      </p>
      ${pregunta.opciones.map((op, i) => `
        <div class="options">
          <label>
            <input type="radio" name="q${index}" value="${i}">
            <strong>${letras[i]})</strong> ${op}
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

function mostrarRespuestasCorrectas() {
  const questionDivs = document.querySelectorAll('.question');
  const letras = ['a', 'b', 'c', 'd'];
  const lista = document.getElementById('listaRespuestas');
  lista.innerHTML = '';
  questionDivs.forEach((div, idx) => {
    const correcta = parseInt(div.querySelector('.explicacion').dataset.correcta);
    const li = document.createElement('li');
    li.textContent = `${letras[correcta]}`;
    lista.appendChild(li);
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
  let correctas = 0, noContestadas = 0, incorrectas = 0;
  const questionDivs = document.querySelectorAll('.question');

  for (let idx = 0; idx < questionDivs.length; idx++) {
    const div = questionDivs[idx];
    const correcta = parseInt(div.querySelector('.explicacion').dataset.correcta);
    let sel = -1;
    div.querySelectorAll('input').forEach((inp, i) => {
      if (inp.checked) sel = i;
    });

    // Marcar colores
    div.querySelectorAll('input').forEach((inp, i) => {
      const lab = inp.parentElement;
      lab.classList.remove('correct','incorrect');
      if (i === correcta) lab.classList.add('correct');
      else if (i === sel && i !== correcta) lab.classList.add('incorrect');
    });
    div.querySelector('.explicacion').style.display = 'block';

    // Actualizar Firestore
    if (sel !== -1) {
      try {
        await window.db
          .collection("preguntas")
          .doc(div.dataset.id)
          .update({
            vecesIntentada: firebase.firestore.FieldValue.increment(1),
            vecesAcertada: sel === correcta
              ? firebase.firestore.FieldValue.increment(1)
              : firebase.firestore.FieldValue.increment(0),
            ultimaRespuesta: new Date()
          });
      } catch (e) {
        console.error('Error actualizando:', e);
      }
    }

    if (sel === -1) noContestadas++;
    else if (sel === correcta) correctas++;
    else incorrectas++;
  }

  // Penalización
  const penal = Math.floor(incorrectas / 3);
  const corrA = Math.max(correctas - penal, 0);
  const total = questionDivs.length;
  const pct = ((corrA / total) * 100).toFixed(1);

  document.getElementById('score').innerHTML = `
    <h3 style="text-align:center">Resultados:</h3>
    <p style="text-align:center">✅ ${correctas}/${total}</p>
    <p style="text-align:center">❌ ${incorrectas}/${total} (${incorrectas} errores = <span style="color:red">-${penal}</span>)</p>
    <p style="text-align:center">⚪ ${noContestadas}/${total}</p>
    <div style="border:2px solid #ccc; border-radius:8px; padding:10px; background:#f0f8ff; max-width:400px; margin:10px auto;">
      <p style="text-align:center; font-weight:bold;">
        NOTA FINAL: <span style="color:green">${corrA}</span>/${total} - ${pct}%
      </p>
    </div>
  `;
}

window.corregir = corregir;

// Inicialización + nuevos filtros
document.addEventListener('DOMContentLoaded', async () => {
  await cargarPreguntas();

 const p = new URLSearchParams(window.location.search);
  const tema    = p.get('tema')    || 'all';
  const subtema = p.get('subtema') || 'all';
  const num     = parseInt(p.get('num'))     || 10;
  const tasaMin = parseInt(p.get('tasaMin')) || 0;
  const tasaMax = parseInt(p.get('tasaMax')) || 100;
  const antiguo = p.get('antiguo') === '1';

  // 1) filtro tema/subtema
  let fil = filtrarPreguntas(tema, subtema);

  // 2) filtro tasa
  fil = fil.filter(q => {
    const pct = q.vecesIntentada>0
      ? Math.round((q.vecesAcertada/q.vecesIntentada)*100)
      : 0;
    return pct >= tasaMin && pct <= tasaMax;
  });

   // 3) ordenar si antiguo
  if (antiguo) {
    fil.sort((a,b) => {
      const da = a.ultimaRespuesta?.toDate() || 0;
      const db = b.ultimaRespuesta?.toDate() || 0;
      return da - db; // ascendente: más antiguo primero
    });
  }

 // 4) mezclar solo si NO es antiguo, y recortar
  let seleccion;
  if (antiguo) seleccion = fil.slice(0, num);
  else            seleccion = shuffle([...fil]).slice(0, num);

  mostrarPreguntas(seleccion);
});

// Imprimir con soluciones
document.getElementById('btnImprimir').addEventListener('click', () => {
  mostrarRespuestasCorrectas();
  setTimeout(() => {
    document.getElementById('respuestasPrint').style.display = 'block';
    window.print();
    document.getElementById('respuestasPrint').style.display = 'none';
  }, 100);
});
