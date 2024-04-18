document.addEventListener("DOMContentLoaded", async function() {
    // Declaració de variables globals
    let preguntes;
    let preguntaActual = 0; // Variable per seguir la pregunta actual
    // const userId = localStorage.getItem('userId');    
    const token = localStorage.getItem('token');
    // Obté el codienquesta de la URL
    const codienquesta = obtenirParametreUrl('codienquesta');

    // Verificar la autenticación al cargar la página
    await checkAuthentication();
    
    await carregarPreguntes();

    async function checkAuthentication() {
        try {
            if (!token) {
                // Si no hay un token en el almacenamiento local, redirigir al usuario a la página de inicio de sesión
                window.location.href = 'http://localhost:5500/login';
                return;
            }

            // Realizar la solicitud al backend para verificar la autenticación
            const response = await fetch('http://127.0.0.1:8000/api/verify-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                // Si la respuesta no es exitosa, verificar si el error es por token caducado
                const responseData = await response.json();
                if (responseData.error === 'TokenExpired') {
                    // Si el token ha caducado, manejar el error
                    handleTokenExpiredError();
                    return;
                } else {
                    // Si el error es diferente, redirigir al usuario a la página de inicio de sesión o mostrar un mensaje de error
                    console.error('Error en la verificación de la autenticación:', responseData.message);
                    // Redirigir al usuario a la página de inicio de sesión o mostrar un mensaje de error
                    return;
                }
            }

            // El token sigue siendo válido, el usuario está autenticado
        } catch (error) {
            console.error('Error en la verificación de la autenticación:', error);
        }
    }         

    // Manejar el error de token caducado
    function handleTokenExpiredError() {
        // Limpiar el token caducado del almacenamiento local
        localStorage.removeItem('token');
        
        // Mostrar un mensaje al usuario
        alert('Tu sesión ha caducado. Por favor, inicia sesión nuevamente.');
        
        // Redirigir al usuario a la página de inicio de sesión
        window.location.href = 'http://127.0.0.1:5500/login';
    }

    // Per el formulari de les preguntes de l'enquesta
    async function llegirDades(surveyId) {
        try {
            // Realitza una sol·licitud al servidor per obtenir preguntes de l'enquesta
            const response = await fetch(`http://127.0.0.1:8000/api/get-question-survey/${surveyId}`); 
            if (!response.ok) {
                throw new Error('No s\'ha pogut obtenir els detalls de l\'enquesta');
            }
            const data = await response.json();
            // Retorna les preguntes de l'enquesta
            return data;
        } catch (error) {
            console.error('Error en obtenir detalls de l\'enquesta:', error);
            return null;
        }
    }

    async function trobarEnquesta(surveyId) {
        try {
            // Realitza una sol·licitud al servidor per obtenir l'enquesta amb aquest ID
            const response = await fetch(`http://127.0.0.1:8000/api/get-survey/${surveyId}`); 
            if (!response.ok) {
                throw new Error('No s\'ha pogut obtenir els detalls de l\'enquesta');
            }
            const data = await response.json();
            // Retorna l'enquesta
            return data;
        } catch (error) {
            console.error('Error en obtenir detalls de l\'enquesta:', error);
            return null;
        }
    }

    // Funció per carregar les preguntes i mostrar la primera pregunta
    async function carregarPreguntes() {
        const titolEnquesta = document.createElement('h2');
        const title = document.getElementById('title');
        try {
            showSpinner(); // Mostrar el spinner
            
            const enquesta = await trobarEnquesta(codienquesta);
            const nomEnquesta = enquesta.descenquesta;
    
            preguntes = await llegirDades(codienquesta);
    
            if (!preguntes || preguntes.length === 0) {
                console.error('No es van poder carregar les preguntes.');
                return;
            }
    
            // Ocultar el spinner una vez se han cargado las preguntas
            hideSpinner();
    
            titolEnquesta.textContent = nomEnquesta;
            titolEnquesta.classList.add('titol-enquesta');
            title.appendChild(titolEnquesta);
    
            await mostrarPregunta(preguntes);
        } catch (error) {
            console.error('Error en carregar les preguntes:', error);
            hideSpinner(); // En caso de error, ocultar el spinner
            // Eliminar el mensaje "Estamos generando sus preguntas" en caso de error
            document.querySelector('.generating-message').remove();
        }
    }    

    // Funció per mostrar la pregunta actual
    async function mostrarPregunta(preguntes) {
        const formulariDiv = document.getElementById('formulari');
        formulariDiv.innerHTML = ''; // Netegem el formulari abans de mostrar la nova pregunta
    
        const pregunta = preguntes[preguntaActual];
        const label = document.createElement('label');
        label.textContent = pregunta.enunciat;
    
        if (pregunta.esopcio) {
            const select = document.createElement('select');
            const opcions = await obtenerOpcionesDeRespuesta(pregunta.codipregunta); // Obtener opciones de respuesta
                        
            // Verificar que opcions no sea nulo o indefinido antes de dividirlo
            if (opcions && opcions.length > 0) {
                // Afegir una opció desactivada com a marcador
                const placeholderOption = document.createElement('option');
                placeholderOption.disabled = true;
                placeholderOption.selected = true;
                placeholderOption.textContent = "Marca una opció";
                select.appendChild(placeholderOption);

                // Crear una opción para cada descripción de la base de datos
                opcions.forEach(descripcio => {
                    const option = document.createElement('option');
                    option.value = descripcio; // Utilitzar la descripció com a valor i text de l'opció
                    option.textContent = descripcio;
                    select.appendChild(option);
                });
                
                formulariDiv.appendChild(label);
                formulariDiv.appendChild(select);
            } else {
                // Manejar el caso donde no se obtienen opciones
                console.error('No se obtuvieron opciones de respuesta válidas.');
            }
        } else { // Si no és una pregunta d'opció
            const input = document.createElement('input');
            input.id = pregunta.codipregunta;
            input.placeholder = 'Escriu la teva resposta aquí';
            formulariDiv.appendChild(label);
            formulariDiv.appendChild(input);
        }                
    
        // Crear el botó de "Següent" o "Enviar"
        const botoSeguent = document.createElement('button');
        if (preguntaActual < preguntes.length - 1) {
            botoSeguent.textContent = 'Següent';
            botoSeguent.addEventListener('click', seguentPregunta);
            botoSeguent.classList.add('form-buttons');
        } else {
            botoSeguent.textContent = 'Enviar';
            botoSeguent.type = 'submit';
            // botoSeguent.addEventListener('click', enviarFormulari);
            botoSeguent.classList.add('submit-button');
        }
        
        const botoDiv = document.createElement('div');
    
        // Crear el botó de "Anterior" si no és la primera pregunta
        if (preguntaActual > 0) {
            const botoAnterior = document.createElement('button');
            botoAnterior.textContent = 'Anterior';
            botoAnterior.addEventListener('click', anteriorPregunta);
            botoAnterior.classList.add('form-buttons');
            botoDiv.classList.remove('right-div');
            botoDiv.appendChild(botoAnterior);
            botoDiv.classList.add('space-div');
            formulariDiv.appendChild(botoDiv);
        }
    
        // Afegir el botó de "Següent" o "Enviar"
        botoDiv.appendChild(botoSeguent);
        botoDiv.classList.add('space-div');
    
        // Afegir botoDiv al formulari
        formulariDiv.appendChild(botoDiv);
    }

    async function obtenerOpcionesDeRespuesta(idPregunta) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/questions/${idPregunta}/answer-options`);
            if (!response.ok) {
                throw new Error('No se pudieron obtener las opciones de respuesta.');
            }
            const data = await response.json();
            
            // Verificar si se recibieron datos válidos
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No se obtuvieron opciones de respuesta válidas.');
            }
    
            // Mapejar la resposta per obtenir només les descripcions de les opcions
            const opciones = data.map(opcion => opcion.descripcio);
            
            return opciones;
        } catch (error) {
            console.error('Error al obtener las opciones de respuesta:', error);
            return [];
        }
    }       
    
    // Funció per passar a la següent pregunta
    async function seguentPregunta() {
        preguntaActual++;
        await mostrarPregunta(preguntes);
    }

    // Funció per tornar a la pregunta anterior
    async function anteriorPregunta() {
        preguntaActual--;
        await mostrarPregunta(preguntes);
    }

    // Funció per enviar el formulari (quan s'arriba a l'última pregunta)
    async function enviarFormulari() {
        try {
            // Obtenir les respostes del formulari
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

            // Recórrer totes les claus i valors del formulari per construir les respostes
            formData.forEach((valor, clau) => {
                // Obtenir la data i hora actuals
                const dataResposta = new Date();

                // Formatejar la data i hora actuals en el format ISO 8601
                const dataRespostaISO = dataResposta.toISOString();

                // Afegir la data i hora actuals a l'objecte de resposta
                const resposta = {
                    codipregunta: clau, // ID de la pregunta corresponent
                    resposta: valor, // Valor de la resposta
                    dataresposta: dataRespostaISO // Data i hora actuals en format ISO 8601
                };
                // Afegir la resposta a l'array de respostes
                dades.answers.push(resposta);
                console.log(dades);
            });

            // Enviar les dades al servidor mitjançant una crida POST
            const response = await fetch('http://127.0.0.1:8000/api/create-response', {
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

    document.getElementById('formulari').addEventListener('submit', async function(event) {
        event.preventDefault(); // Evita que el formulari es recarregui la pàgina
        await enviarFormulari();
    });

    // Funció per obtenir un paràmetre de la URL pel seu nom
    function obtenirParametreUrl(nom) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(nom);
    }

    function showSpinner() {
        // Mostrar el contenedor del spinner
        const spinnerContainer = document.querySelector('.spinner-container');
        spinnerContainer.style.display = 'flex';
    
        // Crear el mensaje "Estamos generando sus preguntas"
        const generatingMessage = document.createElement('p');
        generatingMessage.textContent = 'Estamos generando sus preguntas...';
        generatingMessage.classList.add('generating-message'); // No se debe agregar el punto al nombre de la clase
    
        // Adjuntar el mensaje debajo del spinner
        spinnerContainer.appendChild(generatingMessage);
    }       

    function hideSpinner() {
        // Ocultar el contenedor del spinner
        document.getElementById('spinner-container').style.display = 'none';
    }
});
