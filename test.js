// Cargar preguntas desde JSON
let bancoCompleto = [];

async function cargarPreguntas() {
  try {
    const response = await fetch('preguntas.json');
    const data = await response.json();
    bancoCompleto = data.preguntas;
  } catch (error) {
    console.error('Error cargando preguntas:', error);
    document.getElementById('quizForm').innerHTML = 
      '<p>Error al cargar el banco de preguntas</p>';
  }
}

function filtrarPreguntas(filtros) {
  return bancoCompleto.filter(pregunta => {
    // Filtrado por tags
    const coincideCategoria = filtros.categoria === 'all' || 
                             pregunta.tags.includes(filtros.categoria);
    
    // Filtrado por tema/subtema
    const coincideTema = filtros.tema === 'all' || 
                        pregunta.tema === filtros.tema;
    
    const coincideSubtema = filtros.subtema === 'all' || 
                           pregunta.subtema === filtros.subtema;

    return coincideCategoria && coincideTema && coincideSubtema;
  });
}

// Función de inicialización modificada
async function iniciarAplicacion() {
  await cargarPreguntas();
  
  const urlParams = new URLSearchParams(window.location.search);
  const filtros = {
    categoria: urlParams.get('categoria') || 'all',
    tema: urlParams.get('tema') || 'all',
    subtema: urlParams.get('subtema') || 'all',
    num: parseInt(urlParams.get('num')) || 10
  };

  const preguntasFiltradas = filtrarPreguntas(filtros);
  mostrarPreguntas(preguntasFiltradas.slice(0, filtros.num));
}
