document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("loginForm").addEventListener("submit", function(event) {
        event.preventDefault(); // Evitar el comportament per defecte del formulari

        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        // Encriptar la contrasenya amb SHA-256
        var hashedPassword = CryptoJS.SHA256(password).toString();
        console.log("Contrasenya encriptada:", hashedPassword);

        console.log("Usuari:", username);
        // Aquí normalment enviaries la contrasenya encriptada al servidor per a la validació
    });
});


