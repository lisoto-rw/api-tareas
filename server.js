const app = require('./app'); // Traemos la app configurada del otro archivo
const PORT = 3000;

// Acá se pone al servidor a escuchar peticiones
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}...`);
});