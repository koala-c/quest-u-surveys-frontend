const abortController = new AbortController();
const signal = abortController.signal;

async function obtenirNumRespostes(surveyId, signal) {
    try {
        const response = await fetch(`http://localhost:8000/api/get-response-survey/${surveyId}`, { signal });
        const data = await response.json();
        return data.numResponses;
    } catch (error) {
        console.error('Error obtenint el nombre de respostes:', error);
        return 0;
    }
}

// Funció per carregar la llista d'enquestes disponibles
async function carregarLlistaEnquestes() {
    try {
        const response = await fetch('http://localhost:8000/api/surveys');
        const surveys = await response.json();

        const llistaEnquestes = document.getElementById('llista-enquestes');

        // Iterar sobre cada enquesta i crear els elements corresponents
        surveys.forEach(async (enquesta) => {
            // Crear elements per a cada enquesta (nom, nombre de respostes, botons d'editar i eliminar, etc.)
            const nomEnquesta = enquesta.descenquesta;
            const numRespostes = await obtenirNumRespostes(enquesta.codienquesta, signal);;

            // Crea els elements HTML per a cada enquesta
            const elementLlista = document.createElement('div');
            elementLlista.classList.add('enquestes-div');
            
            const celEnquesta = document.createElement('div');
            celEnquesta.textContent = nomEnquesta;
            celEnquesta.classList.add('enquestes-cel');

            const celRespostes = document.createElement('div');
            celRespostes.textContent = `(${numRespostes} respostes)`;
            celRespostes.classList.add('enquestes-cel');

            const celAccions = document.createElement('div');
            celAccions.classList.add('enquestes-cel');

            const botoEditar = document.createElement('button');
            botoEditar.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            botoEditar.addEventListener('click', () => editarEnquesta(enquesta));

            const botoEliminar = document.createElement('button');
            botoEliminar.innerHTML = '<i class="fas fa-trash-alt"></i>';
            botoEliminar.addEventListener('click', () => eliminarEnquesta(enquesta));

            celAccions.appendChild(botoEditar);
            celAccions.appendChild(botoEliminar);

            elementLlista.onclick = function() {
                // Defineix l'acció al fer clic a l'enquesta
                window.location.href = `/preguntes/formulari.html?codienquesta=${enquesta.codienquesta}&nomEnquesta=${encodeURIComponent(nomEnquesta)}`;
            };

            elementLlista.appendChild(celEnquesta);
            elementLlista.appendChild(celRespostes);
            elementLlista.appendChild(celAccions);

            llistaEnquestes.appendChild(elementLlista);
        });
    } catch (error) {
        console.error('Error carregant la llista d\'enquestes:', error);
    }
}

// Funció per editar una enquesta
function editarEnquesta(enquesta) {
    // Lògica per editar la enquesta
}

// Funció per eliminar una enquesta
function eliminarEnquesta(enquesta) {
    // Lògica per eliminar la enquesta
}

// Funció per crear una nova enquesta
function crearEnquesta() {
    // Aquí pots implementar la lògica per crear una nova enquesta.
}

// Funció per crear un nou usuari
function crearUsuari() {
    // Aquí pots implementar la lògica per crear un nou usuari.
}

async function getUsuaris() {
    try {
        const response = await fetch('http://localhost:8000/api/users', {
            method: 'GET',
            // credentials: 'include' // Si es descomenta surt l'error CORS
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const users = await response.json(); // Parse response JSON
        return users; // Return the length of the users array
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return 0; // Return 0 if there was an error
    }
}

async function updateNumUsuaris() {
    const numUsuarisElement = document.getElementById("numUsuaris");
    const users = await getUsuaris(); // Espera que se recuperen los usuarios
    const numUsuaris = users.length; // Obtiene la longitud de la matriz de usuarios
    numUsuarisElement.textContent = numUsuaris; // Actualiza el contenido de texto del elemento
}

async function getEnquestes() {
    try {
        const response = await fetch('http://localhost:8000/api/surveys', {
            method: 'GET',
            // credentials: 'include' // Si es descomenta surt l'error CORS
            signal: signal
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const enquestes = await response.json(); // Parse response JSON
        return enquestes; // Return the length of the users array
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return 0; // Return 0 if there was an error
    }
}

async function updateNumEnquestes() {
    const numEnquestesElement = document.getElementById("numEnquestes");
    const enquestes = await getEnquestes(); // Espera que se recuperen los usuarios
    const numEnquestes = enquestes.length; // Obtiene la longitud de la matriz de usuarios
    numEnquestesElement.textContent = numEnquestes; // Actualiza el contenido de texto del elemento
}

async function getRespostes() {
    try {
        const response = await fetch('http://localhost:8000/api/responses', {
            method: 'GET',
            // credentials: 'include' // Si es descomenta surt l'error CORS
            signal: signal
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const respostes = await response.json(); // Parse response JSON
        return respostes; // Return the length of the users array
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return 0; // Return 0 if there was an error
    }
}

async function updateNumRespostes() {
    const numRespostesElement = document.getElementById("numRespostes");
    const respostes = await getRespostes(); // Espera que se recuperen los usuarios
    const numRespostes = respostes.length; // Obtiene la longitud de la matriz de usuarios
    numRespostesElement.textContent = numRespostes; // Actualiza el contenido de texto del elemento
}

updateNumRespostes();
updateNumEnquestes();
updateNumUsuaris(); // Call the function to update the number of users when the page loads

// Carrega la llista d'enquestes quan la pàgina s'ha carregat completament
document.addEventListener('DOMContentLoaded', carregarLlistaEnquestes);

// Afegir event listener als botons d'accions
// document.getElementById('crearEnquesta').addEventListener('click', crearEnquesta);
// document.getElementById('crearUsuari').addEventListener('click', crearUsuari);

// Redirigir a la pàgina de login si l'usuari no està autenticat
document.addEventListener("DOMContentLoaded", function() {
    checkAuthentication();

    async function checkAuthentication() {
        try {
            const response = await fetch('http://localhost:8000/api/user', {
                method: 'GET',
                // credentials: 'include'
                signal: signal
            });
            if (!response.ok) {
                window.location.href = 'http://localhost:8000/login';
            }
        } catch (error) {
            console.error('Error en la verificació de l\'autenticació:', error);
        }
    }

    // Obtener el botón de cerrar sesión
    const logoutButton = document.getElementById('logout-button');

    // Agregar un evento de clic al botón de cerrar sesión
    logoutButton.addEventListener('click', async () => {
        try {
            // Mostrar el spinner mientras se procesa la solicitud
            showSpinner();

            // Enviar una solicitud POST a la ruta de logout
            const response = await fetch('http://127.0.0.1:8000/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Incluir el token JWT en el encabezado de autorización
                },
                signal: signal
            });

            if (!response.ok) {
                throw new Error('Error al cerrar sesión');
            }
            
            // Abortar todas las solicitudes pendientes
            abortController.abort();

            // Eliminar el token JWT del almacenamiento local al cerrar sesión
            localStorage.removeItem('token');

            // Redirigir al usuario a la página de inicio de sesión
            window.location.href = 'http://127.0.0.1:5500/login';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Manejar cualquier error que pueda ocurrir al cerrar sesión
        } finally {
            // Ocultar el spinner después de completar la solicitud, independientemente de si hubo un error o no
            hideSpinner();
        }
    });

    function showSpinner() {
        // Mostrar el contenedor del spinner
        document.querySelector('.spinner-container').style.display = 'flex';
    }

    function hideSpinner() {
        // Ocultar el contenedor del spinner
        document.getElementById('spinner-container').style.display = 'none';
    }
});