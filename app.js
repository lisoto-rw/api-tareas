const express = require('express');// importacion de express el motor del servidor web
const app = express();// inicializacion de  la aplicacion de express
const tareasRoutes = require('./routes/routesTareas');//importacion de rutas para que el servidor sepa los caminos 


// permite al servidor entender los datos que vienen en json(como en el post cuando agrega tarea)
app.use(express.json());


// se define /api como prefijo global para todas las rutas
app.use('/tareas', tareasRoutes);      

// constante con el numero del puerto
const PORT = 3000;

// se pone al  servidor a escuchar peticiones en PORT 
// y cuando arranca muestra el mensaje en consola
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}...`);
});