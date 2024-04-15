document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("loginForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Evitar el comportament per defecte del formulari

        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        // // Encriptar la contrasenya amb SHA-256
        // var hashedPassword = CryptoJS.SHA256(password).toString();
        // console.log("Contrasenya encriptada:", hashedPassword);

        // console.log("Usuari:", username);
        // // Aquí normalment enviaries la contrasenya encriptada al servidor per a la validació
       
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
            // Aquí puedes manejar la respuesta del backend, por ejemplo, redireccionar a otra página
            console.log(data);
            // window.location.href = 'http://10.2.246.94:8081/frontend/enquestes/';
            window.location.href = 'http://127.0.0.1:5500';
        })
        .catch(error => {
            console.error('Error:', error.message);
            // Aquí puedes mostrar un mensaje de error al usuario, por ejemplo, en un elemento HTML
            // document.getElementById("errorMessage").textContent = error.message;
        });
    });
});


