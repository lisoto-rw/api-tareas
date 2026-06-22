const request = require('supertest');
const app = require('../app');

describe('API de tareas', () => {
  
  //prueba que simula una petición de lectura al servidor para consultar el listado general de tareas
  test('GET /tareas debe devolver una lista de tareas', async () => {
    const response = await request(app).get('/tareas');//pide  a la API la lista completa de tareas

    expect(response.statusCode).toBe(200);// revisa  que la respuesta sea exitosa (Código 200)
    expect(Array.isArray(response.body)).toBe(true);// revisa que el resultado sea una lista/array de datos
  });

  //Busca una tarea en específico usando su número de ID (en este caso, la tarea número 1)
  test('GET /tareas/1 debe devolver la tarea con id 1', async () => {
    const response = await request(app).get('/tareas/1');// pide a la API la información de la tarea 1

    expect(response.statusCode).toBe(200);// revisa que la respuesta sea exitosa (Código 200)
    expect(response.body).toHaveProperty('id', 1); // revisa  que de verdad tenga el ID número 1
    expect(response.body).toHaveProperty('titulo'); // revisa que tenga la etiqueta "titulo" con texto adentro
  });

  // Intenta buscar un ID que no está cargado en el sistema para ver cómo reacciona
  test('GET /tareas/999 debe devolver error 404', async () => {
    const response = await request(app).get('/tareas/999');// pide a la API una tarea con un ID falso (999)

    expect(response.statusCode).toBe(404);// se fija que devuelva código 404 (Significa "No encontrado")
    expect(response.body).toHaveProperty('mensaje', 'Tarea no encontrada');// revisa que nos dé el mensaje correcto de error
  });

  // Simula que mandamos datos para crear una tarea 
  test('POST /tareas debe crear una nueva tarea', async () => {
    // envia a la API una nueva tarea con un título por el cuerpo del mensaje
    const response = await request(app)
      .post('/tareas')
      .send({ titulo: 'Aprender CI/CD' });

    expect(response.statusCode).toBe(201);// revisa que devuelva código 201 (Significa "Creado con éxito")
    expect(response.body).toHaveProperty('id'); // revisa que la API le haya asignado un número de ID automáticamente
    expect(response.body).toHaveProperty('titulo', 'Aprender CI/CD');// revisa que la tarea guardada conserve el título que le pusimos
  });
});
