// importaciones:libreria express para usar sus funciones de servidor y
const express = require('express');
const router = express.Router();// objeto router para gestionar rutas 

// el controlador donde esta la logica (de las tareas)
const {
    listarTareas,
    obtenerTareaPorId,
    crearTarea,
} = require('../controllers/controllersTareas');


/* endpoints para el recurso tareas:
    listado de tareas (get), busqueda por id (get) 
   y crear nueva tarea (post)
*/
router.get('/', listarTareas);

router.get('/:id', obtenerTareaPorId);

router.post('/', crearTarea);

// exportacion de rutas para que  app.js las pueda usar
module.exports = router;