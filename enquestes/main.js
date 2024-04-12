// Port PostgreSQL 16 en local: 5433

// Funció per obtenir una llista dels arxius d'una carpeta
async function obtenirArxius(carpeta) {
    const resposta = await fetch(carpeta);
    const text = await resposta.text();
    const parser = new DOMParser();
    const documentHTML = parser.parseFromString(text, 'text/html');
    const enllacos = documentHTML.querySelectorAll('a');
    return Array.from(enllacos)
        .map(enllac => enllac.getAttribute('href'))
        .filter(enllac => enllac.endsWith('.json'));
}

// Funció per carregar la llista d'enquestes disponibles
async function carregarLlistaEnquestes() {
    const carpetaPreguntes = './preguntes/JSON';

    // Obté una llista dels arxius JSON de la carpeta "preguntes/JSON"
    const arxius = await obtenirArxius(carpetaPreguntes);

    const llistaEnquestes = document.getElementById('llista-enquestes');

    // Itera sobre cada arxiu JSON
    arxius.forEach(arxiu => {
        // Obtenir el nom de l'arxiu sense l'extensió .json
        const nomEnquesta = arxiu.split('/').pop().replace('.json', '').replace(/-/g, ' ').charAt(0).toUpperCase() + arxiu.split('/').pop().replace('.json', '').replace(/-/g, ' ').slice(1);

        // Crea un element d'enllaç per cada arxiu JSON
        const enllaç = document.createElement('a');
        enllaç.textContent = nomEnquesta;
        enllaç.href = `preguntes/index.html?arxiu=${arxiu}&nomEnquesta=${encodeURIComponent(nomEnquesta)}`; // Passa el nom de l'arxiu com a paràmetre a través de la URL
        enllaç.classList.add('enllaç-enquesta');
        
        // Crea un element d'element de llista per mostrar l'enllaç
        const elementLlista = document.createElement('li');
        elementLlista.appendChild(enllaç);
        
        // Afegeix l'element de llista a la llista d'enquestes
        llistaEnquestes.appendChild(elementLlista);
    });
}

// Carrega la llista d'enquestes quan la pàgina s'ha carregat completament
document.addEventListener('DOMContentLoaded', carregarLlistaEnquestes);


// Per el formulari de les preguntes de l'enquesta
async function llegirDades(rutaArxiu) {
    try {
        const response = await fetch(rutaArxiu);
        const dadesJSON = await response.json();
        return dadesJSON.preguntes; // Accedim a l'array de preguntes
    } catch (error) {
        console.error('Error en llegir les dades:', error);
        return null; // Retorna null en cas d'error per tractar-lo més endavant
    }
}

// Declaración de variables globales
let preguntas; // Almacenará todas las preguntas
let preguntaActual = 0; // Variable para seguir la pregunta actual

// Función para cargar las preguntas y mostrar la primera pregunta
async function cargarPreguntas() {
    const rutaArxiu = obtenerParametroUrl('arxiu');
    const nomEnquesta = obtenerParametroUrl('nomEnquesta');
    const titolEnquesta = document.createElement('h2');
    const title = document.getElementById('title');

    preguntas = await llegirDades(rutaArxiu);

    if (!preguntas || preguntas.length === 0) {
        console.error('No se pudieron cargar las preguntas.');
        return;
    }

    titolEnquesta.textContent = nomEnquesta;
    titolEnquesta.classList.add('titol-enquesta');
    title.appendChild(titolEnquesta);

    mostrarPregunta();
}

// Función para mostrar la pregunta actual
function mostrarPregunta() {
    const formulariDiv = document.getElementById('formulari');
    formulariDiv.innerHTML = ''; // Limpiar el formulario antes de mostrar la nueva pregunta

    const pregunta = preguntas[preguntaActual];
    const label = document.createElement('label');
    label.textContent = pregunta.pregunta;

    const input = document.createElement('input');
    input.id = pregunta.id;
    input.type = pregunta.tipus;
    input.placeholder = pregunta.placeholder || '';

    input.addEventListener('keydown', function(event) {
        // Comprova si la tecla premuda és la tecla "Enter"
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita l'enviament del formulari
            if (preguntaActual < preguntas.length - 1) {
                siguientePregunta(); // Passa a la següent pregunta
            } else {
                enviarFormulari(); // Envia el formulari
            }
        }
    });

    if (pregunta.opcions) { // Si es un campo select
        const select = document.createElement('select');
        pregunta.opcions.forEach(opcion => {
            const option = document.createElement('option');
            option.value = opcion;
            option.textContent = opcion;
            select.appendChild(option);
        });
        formulariDiv.appendChild(label);
        formulariDiv.appendChild(select);
    } else { // Si no es un campo select
        formulariDiv.appendChild(label);
        formulariDiv.appendChild(input);
    }

    // Crear el botón de "Siguiente" o "Enviar"
    const botonSiguiente = document.createElement('button');
    if (preguntaActual < preguntas.length - 1) {
        botonSiguiente.textContent = 'Siguiente';
        botonSiguiente.addEventListener('click', siguientePregunta);
        botonSiguiente.classList.add('form-buttons');
    } else {
        botonSiguiente.textContent = 'Enviar';
        botonSiguiente.addEventListener('click', enviarFormulari);
        botonSiguiente.classList.add('submit-button');
    }
    
    const botoDiv = document.createElement('div');

    // Crear el botón de "Anterior" si no es la primera pregunta
    if (preguntaActual > 0) {
        const botonAnterior = document.createElement('button');
        botonAnterior.textContent = 'Anterior';
        botonAnterior.addEventListener('click', anteriorPregunta);
        botonAnterior.classList.add('form-buttons');
        botoDiv.classList.remove('right-div');
        botoDiv.appendChild(botonAnterior);
        botoDiv.classList.add('space-div');
        formulariDiv.appendChild(botoDiv);
    }

    // Afegir el botó de "Siguiente" o "Enviar"
    botoDiv.appendChild(botonSiguiente);
    botoDiv.classList.add('space-div');

    // Afegir botoDiv al formulari
    formulariDiv.appendChild(botoDiv);
}


// Función para pasar a la siguiente pregunta
function siguientePregunta() {
    preguntaActual++;
    mostrarPregunta();
}

// Función para volver a la pregunta anterior
function anteriorPregunta() {
    preguntaActual--;
    mostrarPregunta();
}

// Funció per enviar el formulari (quan s'arriba a la última pregunta)
async function enviarFormulari() {
    try {
        // Obté les respostes del formulari
        const formulari = document.getElementById('formulari');
        if (!formulari || formulari.nodeName !== 'FORM') {
            console.error('L\'element del formulari no és vàlid');
            return;
        }
        
        const formData = new FormData(formulari);

        // Estructura de les dades per a l'enviament al servidor
        const dades = {
            answers: [] // Array per emmagatzemar les respostes
        };

        // Recorre totes les claus i valors del formulari per construir les respostes
        formData.forEach((valor, clau) => {
            // Afegir cada resposta al format d'objecte esperat pel backend
            const resposta = {
                question_id: clau, // ID de la pregunta corresponent
                answer: valor // Valor de la resposta
            };
            // Afegir la resposta a l'array de respostes
            dades.answers.push(resposta);
        });

        // Envia les dades al servidor mitjançant una crida POST
        const response = await fetch('http://10.2.246.94:8001/api/preguntes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dades)
        });

        if (response.ok) {
            console.log('Respostes enviades amb èxit al servidor.');
            // Aquí pots gestionar la resposta del servidor si és necessari
        } else {
            console.error('Error en enviar les respostes:', response.statusText);
        }
    } catch (error) {
        console.error('Error en enviar les respostes:', error);
    }
}

document.getElementById('formulari').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita que el formulari es recarregui la pàgina
    enviarFormulari();
});

// Función para obtener un parámetro de la URL por su nombre
function obtenerParametroUrl(nombre) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nombre);
}

// Crear el formulario al cargar la página
window.onload = cargarPreguntas;