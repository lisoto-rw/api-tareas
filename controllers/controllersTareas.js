// importacion  de la base de datos de tareas desde models
const tareas = require('../models/modeloTareas');

const listarTareas = (req, res) => {
    try{
        if(tareas.length == 0){
            return res.status(200).json({
                mensaje: "No hay tareas registradas en el sistema",
                datos: []
            });
        }
        res.json(tareas);      
    } catch{
        res.status(500).json({
            mensaje: "Error al obtener las tareas",
            error: error.message
        });
    }
};

// busca una tarea  por su id (mediante parametros de url)
const obtenerTareaPorId = (req, res) => {
    // busca en tareas el objeto donde el id coincide con el de la url
    // parseInt convierte el texto de la URL a numerp y req.params.id obtiene el valor
    const id = parseInt(req.params.id);
    const tarea = tareas.find(t => t.id === id);

    // sino arroja resultado, lanza menasaje de error y devuelve el estado 404 de error
    if (!tarea) {
        return res.status(404).json({ 
            mensaje: 'Tarea no encontrada' 
        });
    }

    res.json(tarea);    
};

const crearTarea = (req, res) => {
    // se crea la tarea  q se quiere agregar a la lista
    const nueva = {
        id: tareas.length + 1,
        titulo: req.body.titulo,
        completado: false
    };
    
    tareas.push(nueva);

    res.status(200).json(nueva);
};

module.exports = {
    listarTareas,
    obtenerTareaPorId,
    crearTarea
};