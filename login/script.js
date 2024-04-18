document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("loginForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Evitar el comportamiento por defecto del formulario

        // Mostrar el spinner mentre es carrega la pàgina següent
        showSpinner();

        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        // Crear un objeto con los datos del usuario
        var userData = {
            nom: username,
            contrasenya: password
        };

        // Realizar una solicitud HTTP POST al endpoint de inicio de sesión en tu backend
        fetch('http://127.0.0.1:8000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }
            return response.json();
        })
        .then(data => {
            // Guardar el token JWT en el almacenamiento local del navegador
            localStorage.setItem('token', data.token);

            // Guardar el código del usuario (codienquestador) en el almacenamiento local si se envió desde el backend
            if (data.user && data.user.codienquestador) {
                localStorage.setItem('userId', data.user.codienquestador);
            }
            
            // Redirigir al usuario a otra página, por ejemplo, la página de inicio
            // window.location.href = 'http://10.2.246.94:8081/frontend/'; // Server
            window.location.href = 'http://127.0.0.1:5500'; // Localhost
        })
        .catch(error => {
            console.error('Error:', error.message);
            // Aquí puedes mostrar un mensaje de error al usuario, por ejemplo, en un elemento HTML
            // document.getElementById("errorMessage").textContent = error.message;
        })
        .finally(() => {
            // Amagar el spinner quan s'ha completat la redirecció
            hideSpinner();
        });
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
