document.addEventListener("DOMContentLoaded", function() {
    const abortController = new AbortController();
    const signal = abortController.signal;
    const logoutButton = document.getElementById('logout-button');
    const allSurveys = document.getElementById('totesEnquestes');
    const userId = localStorage.getItem('userId');    
    const token = localStorage.getItem('token');
    const mevesEnquestes = document.getElementById('mevesEnquestes');
    const userStatsContainer = document.querySelector('.user-stats');
    const modal = document.getElementById('userListModal');
    const modalContent = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.close');

    // Verificar la autenticación al cargar la página
    checkAuthentication();

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
        mostrarToast('Tu sesión ha caducado. Por favor, inicia sesión nuevamente.');
        
        // Redirigir al usuario a la página de inicio de sesión
        window.location.href = 'http://127.0.0.1:5500/login';
    }

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
    
    async function getUser() {
        try {
            if (!token) {
                throw new Error('No se encontró el token');
            }
            
            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario del token');
            }
    
            // Realizar la solicitud para obtener los detalles del usuario
            const response = await fetch(`http://localhost:8000/api/get-user/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
    
            if (!response.ok) {
                throw new Error('No se pudo obtener el userId');
            }
    
            const userData = await response.json();

            await carregarLlistaEnquestesUsuari(userId);
            
            return userData.userId; // Suponiendo que el backend devuelve el userId en el formato esperado
        } catch (error) {
            console.error('Error al obtener el userId:', error);
            return null;
        }
    }
        
    async function carregarLlistaEnquestes(url, titol) {
        try {
            const response = await fetch(url);
            let surveys = await response.json();
            const llistaEnquestes = document.getElementById('llista-enquestes');
            llistaEnquestes.innerHTML = '';
    
            const titolLlista = document.getElementById('titolLlista');
            titolLlista.textContent = titol;
    
            // Ordenar las encuestas por fecha de validez de manera descendente (de la más reciente a la más antigua)
            surveys.sort((a, b) => new Date(b.datavalidesaenq) - new Date(a.datavalidesaenq));
    
            for (const enquesta of surveys) {
                const nomEnquesta = enquesta.descenquesta;
                const numPreguntes = await obtenirNumPreguntes(enquesta.codienquesta, signal);
                const numRespostes = await obtenirNumRespostes(enquesta.codienquesta, signal);
                const dataValidesa = new Date(enquesta.datavalidesaenq).toLocaleDateString();
    
                const elementLlista = document.createElement('div');
                elementLlista.id = `enquesta-${enquesta.codienquesta}`;
                elementLlista.classList.add('enquestes-div');
                elementLlista.addEventListener('click', (event) => {
                    // Comprovar si l'objecte que es va clicar és un botó d'editar o eliminar
                    if (event.target.classList.contains('boto-editar') || event.target.classList.contains('boto-eliminar')) {
                        // Si és un botó d'editar o eliminar, no fem res
                        return;
                    }
                
                    // Redirigir l'usuari al formulari de preguntes de l'enquesta corresponent
                    window.location.href = `/preguntes/formulari.html?codienquesta=${enquesta.codienquesta}`;
                });                
    
                const celEnquesta = document.createElement('div');
                celEnquesta.textContent = nomEnquesta;
                celEnquesta.classList.add('enquestes-cel');
    
                const celPreguntes = document.createElement('div');
                celPreguntes.textContent = `(${numPreguntes} preguntes)`;
                celPreguntes.classList.add('enquestes-cel');
    
                const celRespostes = document.createElement('div');
                celRespostes.textContent = `(${numRespostes} respostes)`;
                celRespostes.classList.add('enquestes-cel');
    
                const celDataValidesa = document.createElement('div');
                celDataValidesa.textContent = `Validesa: ${dataValidesa}`;
                celDataValidesa.classList.add('enquestes-cel');
    
                // Verificar si la fecha de validez ha pasado
                if (haPassatDataValidesa(enquesta.datavalidesaenq)) {
                    celDataValidesa.classList.add('data-validesa-passada');
                }
    
                const celAccions = document.createElement('div');
                celAccions.classList.add('enquestes-cel');
    
                const botoEditar = document.createElement('button');
                botoEditar.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                botoEditar.addEventListener('click', (event) => {
                    event.stopPropagation();
                    editarEnquesta(enquesta);
                });
                botoEditar.classList.add('boto-editar');
    
                const botoEliminar = document.createElement('button');
                botoEliminar.innerHTML = '<i class="fas fa-trash-alt"></i>';
                botoEliminar.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    await eliminarEnquesta(enquesta.codienquesta);
                });
                botoEliminar.classList.add('boto-eliminar');
    
                celAccions.appendChild(botoEditar);
                celAccions.appendChild(botoEliminar);
    
                elementLlista.appendChild(celEnquesta);
                elementLlista.appendChild(celPreguntes);
                elementLlista.appendChild(celRespostes);
                elementLlista.appendChild(celDataValidesa);
                elementLlista.appendChild(celAccions);
    
                llistaEnquestes.appendChild(elementLlista);
            }
        } catch (error) {
            console.error('Error carregant la llista d\'enquestes:', error);
        }
    }      
    
    async function carregarLlistaEnquestesUsuari(userId) {
        await carregarLlistaEnquestes(`http://localhost:8000/api/get-survey-user/${userId}`, "Les teves Enquestes");
    }
    
    async function carregarLlistaEnquestesTotals() {
        await carregarLlistaEnquestes('http://localhost:8000/api/surveys', "Totes les Enquestes");
    }   

    // Función para editar una enquesta
    async function editarEnquesta(enquesta) {
        try {
            const idEnquesta = enquesta.codienquesta;
            const response = await fetch(`http://localhost:8000/api/update-survey/${idEnquesta}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Aquí puedes enviar los datos de la enquesta que deseas actualizar
                body: JSON.stringify(/* Datos de la enquesta a actualizar */)
            });
            if (response.ok) {
                // Lógica de éxito (opcional)
                console.log('Enquesta actualizada exitosamente.');
            } else {
                console.error('Error al intentar actualizar la enquesta.');
            }
        } catch (error) {
            console.error('Error al intentar actualizar la enquesta:', error);
        }
    }

    // Función para eliminar una enquesta
    async function eliminarEnquesta(codienquesta) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/delete-survey/${codienquesta}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
    
            if (response.ok) {
                // Eliminar el elemento del DOM si la eliminación fue exitosa
                const enquestaElement = document.getElementById(`enquesta-${codienquesta}`);
                enquestaElement.remove();
    
                // Actualizar el contador de enquestes
                const numEnquestes = Number(document.getElementById('numEnquestes').textContent);
                document.getElementById('numEnquestes').textContent = numEnquestes - 1;
            } else {
                throw new Error('Error al eliminar enquesta');
            }
        } catch (error) {
            console.error('Error al eliminar enquesta:', error);
        }
    }

    // Función para crear una nueva enquesta
    function crearEnquesta() {
        // Aquí puedes implementar la lógica para crear una nueva enquesta,
        // como mostrar un formulario para ingresar los datos de la enquesta.
        // Luego, puedes enviar esos datos a través de una solicitud POST al endpoint '/create-survey'.
        // Te dejo un ejemplo básico:

        /*
        fetch('http://localhost:8000/api/create-survey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Aquí puedes enviar los datos de la nueva enquesta
            body: JSON.stringify( Datos de la nueva enquesta )
        })
        .then(response => {
            if (response.ok) {
                // Lógica de éxito (opcional)
                console.log('Enquesta creada exitosamente.');
            } else {
                console.error('Error al intentar crear la enquesta.');
            }
        })
        .catch(error => {
            console.error('Error al intentar crear la enquesta:', error);
        });*/
        
    }


    // Funció per crear un nou usuari
    function crearUsuari() {
        document.getElementById('crearUsuari');
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

    function haPassatDataValidesa(dataValidesa) {
        const avui = new Date();
        return new Date(dataValidesa) < avui;
    }

    async function obtenirNumPreguntes(surveyId, signal) {
        try {
            const response = await fetch(`http://localhost:8000/api/get-question-survey/${surveyId}`, { signal });
            const data = await response.json();
            return data.length; // Retornar la longitud del conjunt de dades, que és el nombre de preguntes
        } catch (error) {
            console.error('Error obtenint el nombre de preguntes:', error);
            return 0;
        }
    }

    // async function comprovarPreguntesEnquesta(codienquesta) {
    //     try {
    //         const response = await fetch(`http://127.0.0.1:8000/api/get-question-survey/${codienquesta}`);
    //         if (!response.ok) {
    //             throw new Error('No s\'han pogut obtenir les preguntes de l\'enquesta.');
    //         }
    //         const preguntes = await response.json();
    //         return preguntes.length > 0; // Retorna true si l'enquesta té preguntes, false si no en té
    //     } catch (error) {
    //         console.error('Error en comprovar les preguntes de l\'enquesta:', error);
    //         return false; // En cas d'error, assumeix que l'enquesta no té preguntes
    //     }
    // }    

    // Agregar evento de click al contenedor de estadísticas de usuarios
    userStatsContainer.addEventListener('click', async function() {
        try {
            const usuarios = await getUsuaris();
            
            // Mostrar el modal con la lista de usuarios
            mostrarUsuaris(usuarios);
            modal.style.display = 'block'; // Mostrar el modal
        } catch (error) {
            console.error('Error al obtener la lista de usuarios:', error);
        }
    });

    // Cerrar el modal al hacer click en la "X"
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none'; // Ocultar el modal
    });

    // Cerrar el modal al hacer click fuera del contenido
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none'; // Ocultar el modal
        }
    });

    function mostrarUsuaris(usuaris) {
        const userListContainer = document.getElementById('userList');
        userListContainer.innerHTML = '';
    
        // Mostrar la lista de usuarios
        usuaris.forEach(usuari => {
            const usuariElement = document.createElement('div');
            usuariElement.textContent = usuari.nom; // Suponiendo que cada usuario tiene un atributo 'name'
            usuariElement.classList.add('user-list-item'); // Afegir la classe .user-list-item
            
            const buttons = document.createElement('div');
            buttons.classList.add('user-list-buttons');

            // Crear el botón de editar usuario
            const editButton = document.createElement('button');
            editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            editButton.classList.add('boto-editar');
            editButton.addEventListener('click', () => {
                // Redirigir a la página de edición de usuario
                window.location.href = `http://127.0.0.1:8000/api/update-user/${usuari.codienquestador}`;
            });
            buttons.appendChild(editButton);
    
            // Crear el botón de eliminar usuario
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.classList.add('boto-eliminar');
            deleteButton.addEventListener('click', () => {
                // Confirmar antes de eliminar el usuario
                if (confirm(`Segur que desitges eliminar l'usuari ${usuari.nom}?`)) {
                    // Realizar la solicitud de eliminación
                    fetch(`http://127.0.0.1:8000/api/delete-user/${usuari.codienquestador}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            // Eliminar el elemento del DOM si la eliminación fue exitosa
                            usuariElement.remove();
                            // Actualizar el contador de usuarios
                            document.getElementById('numUsuaris').textContent = Number(document.getElementById('numUsuaris').textContent) - 1;
                        } else {
                            throw new Error('Error al eliminar usuario');
                        }
                    })
                    .catch(error => {
                        console.error('Error al eliminar usuario:', error);
                        alert('Hubo un error al eliminar el usuario. Por favor, inténtalo de nuevo más tarde.');
                    });
                }
            });
            buttons.appendChild(deleteButton);
            usuariElement.appendChild(buttons);
    
            userListContainer.appendChild(usuariElement);
        });
    
        // Mostrar el número de usuarios obtenidos
        document.getElementById('numUsuaris').textContent = usuaris.length;
    }        

    updateNumRespostes();
    updateNumEnquestes();
    updateNumUsuaris(); 
    getUser();

    allSurveys.addEventListener('click', async function(event) {
        event.preventDefault();
        await carregarLlistaEnquestesTotals();
    });
        
    mevesEnquestes.addEventListener('click', async function(event) {
        event.preventDefault();
        await carregarLlistaEnquestesUsuari(userId);
    });

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
                    'Authorization': 'Bearer ' + token // Incluir el token JWT en el encabezado de autorización
                },
                signal: signal
            });

            if (!response.ok) {
                // Extraer el mensaje de error del cuerpo de la respuesta
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Error al cerrar sesión';
                throw new Error(errorMessage);
            }
            
            // Abortar todas las solicitudes pendientes
            abortController.abort();

            // Eliminar el token JWT del almacenamiento local al cerrar sesión
            localStorage.removeItem('token');
            localStorage.removeItem('userId');

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

    function mostrarToast(missatge) {
        const toastContainer = document.getElementById('toast-container');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = missatge;
        toastContainer.classList.add('show'); // Afegir una classe per mostrar el toast
        setTimeout(() => {
            toastContainer.classList.remove('show'); // Eliminar la classe per ocultar el toast després de 3 segons
        }, 3000);
    }    
});