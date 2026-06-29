const express = require('express');// importacion de express el motor del servidor web
const app = express();// inicializacion de  la aplicacion de express
const tareasRoutes = require('./routes/routesTareas');//importacion de rutas para que el servidor sepa los caminos 


// permite al servidor entender los datos que vienen en json(como en el post cuando agrega tarea)
app.use(express.json());


// se define /api como prefijo global para todas las rutasss
app.use('/tareas', tareasRoutes);      


// Exportamos "app" para que lo usen el servidor y los tests
module.exports = app;
