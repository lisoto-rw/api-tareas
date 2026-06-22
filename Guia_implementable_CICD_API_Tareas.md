# Guía implementable: pruebas unitarias, Docker y pipeline CI/CD para API Tareas

## 1. Propósito de la guía

Esta guía describe, paso a paso, cómo transformar una API Node.js sencilla en un proyecto con integración continua básica. El objetivo es que cada cambio enviado al repositorio active automáticamente un flujo de construcción, pruebas y publicación de una imagen Docker que luego pueda descargarse y ejecutarse en una instancia de testing.

El flujo buscado es el siguiente:

```text
Desarrollador
   ↓
Push a GitHub
   ↓
GitHub Actions
   ↓
Instalación de dependencias
   ↓
Ejecución de pruebas
   ↓
Construcción de imagen Docker
   ↓
Publicación en GHCR
   ↓
Instancia de testing con Docker Compose
```

## 2. Requisitos previos

### En el equipo de desarrollo

- Git instalado.
- Node.js instalado.
- npm instalado.
- Docker instalado.
- Docker Compose disponible mediante `docker compose`.
- Acceso al repositorio GitHub.

### En la instancia de testing

- Docker instalado.
- Docker Compose instalado.
- Conectividad a Internet para descargar la imagen desde GHCR.

## 3. Punto de partida

Se parte del repositorio:

```text
https://github.com/calidadygestion2026-edu/api-tareas
```

La API expone endpoints relacionados con tareas. Para poder automatizar pruebas, conviene realizar una pequeña reorganización: separar la definición de la aplicación Express del archivo que inicia el servidor.

## 4. Paso 1: clonar el repositorio

```bash
git clone https://github.com/calidadygestion2026-edu/api-tareas.git
cd api-tareas
```

Instalar dependencias:

```bash
npm install
```

Ejecutar la API para verificar el estado inicial:

```bash
npm start
```

Probar:

```bash
curl http://localhost:3000/tareas
```

## 5. Paso 2: separar aplicación y servidor

### Motivo

Cuando `app.js` levanta directamente el servidor con `app.listen`, resulta menos cómodo testear la aplicación desde Jest y Supertest. La práctica recomendada consiste en exportar la aplicación Express desde `app.js` y dejar el inicio del servidor en `server.js`.

### Nuevo `app.js`

```js
const express = require('express');
const app = express();

app.use(express.json());

const tareasRoutes = require('./routes/tareas.routes');
app.use('/tareas', tareasRoutes);

module.exports = app;
```

### Nuevo `server.js`

```js
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
```

### Ajuste en `package.json`

El script de inicio debe apuntar a `server.js`:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

## 6. Paso 3: instalar herramientas de testing

Instalar Jest y Supertest como dependencias de desarrollo:

```bash
npm install --save-dev jest supertest
```

Jest permite ejecutar pruebas automatizadas en proyectos JavaScript, mientras que Supertest permite realizar solicitudes HTTP simuladas contra una aplicación Express sin levantar manualmente el servidor.

Modificar `package.json` para incorporar el script de test:

```json
{
  "scripts": {
    "start": "node server.js",
    "test": "jest"
  }
}
```

## 7. Paso 4: crear pruebas automatizadas

Crear la carpeta de pruebas:

```bash
mkdir __tests__
```

Crear el archivo:

```bash
nano __tests__/tareas.test.js
```

Contenido sugerido:

```js
const request = require('supertest');
const app = require('../app');

describe('API de tareas', () => {
  test('GET /tareas debe devolver una lista de tareas', async () => {
    const response = await request(app).get('/tareas');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /tareas/1 debe devolver la tarea con id 1', async () => {
    const response = await request(app).get('/tareas/1');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('titulo');
  });

  test('GET /tareas/999 debe devolver error 404', async () => {
    const response = await request(app).get('/tareas/999');

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('mensaje', 'Tarea no encontrada');
  });

  test('POST /tareas debe crear una nueva tarea', async () => {
    const response = await request(app)
      .post('/tareas')
      .send({ titulo: 'Aprender CI/CD' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('titulo', 'Aprender CI/CD');
  });
});
```

Ejecutar:

```bash
npm test
```

Resultado esperado:

```text
PASS __tests__/tareas.test.js
```

## 8. Paso 5: preparar el proyecto para Docker

Crear el archivo `Dockerfile` en la raíz del proyecto:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Explicación del Dockerfile

| Línea | Función |
|---|---|
| `FROM node:22-alpine` | Usa una imagen liviana de Node.js |
| `WORKDIR /app` | Define el directorio de trabajo dentro del contenedor |
| `COPY package*.json ./` | Copia los archivos de dependencias |
| `RUN npm ci --omit=dev` | Instala solo dependencias necesarias para producción |
| `COPY . .` | Copia el código fuente al contenedor |
| `EXPOSE 3000` | Documenta el puerto usado por la API |
| `CMD ["npm", "start"]` | Define el comando de inicio |

Crear `.dockerignore`:

```text
node_modules
npm-debug.log
.git
.github
__tests__
```

## 9. Paso 6: probar Docker localmente

Construir imagen:

```bash
docker build -t api-tareas .
```

Ejecutar contenedor:

```bash
docker run -d --name api-tareas-local -p 3000:3000 api-tareas
```

Probar:

```bash
curl http://localhost:3000/tareas
```

Ver logs:

```bash
docker logs api-tareas-local
```

Detener y eliminar:

```bash
docker stop api-tareas-local
docker rm api-tareas-local
```

## 10. Paso 7: crear workflow de GitHub Actions

Crear la estructura:

```bash
mkdir -p .github/workflows
```

Crear el archivo:

```bash
nano .github/workflows/build-test-deploy.yml
```

Contenido:

```yaml
name: Build Test Deploy

on:
  push:
    branches:
      - main

permissions:
  contents: read
  packages: write

jobs:
  build-test:
    name: Build y test Node.js
    runs-on: ubuntu-latest

    steps:
      - name: Descargar código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Instalar dependencias
        run: npm ci

      - name: Ejecutar tests
        run: npm test

  docker-build-push:
    name: Build y publicación Docker
    runs-on: ubuntu-latest
    needs: build-test

    steps:
      - name: Descargar código
        uses: actions/checkout@v4

      - name: Login en GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Construir y publicar imagen Docker
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/api-tareas:latest
            ghcr.io/${{ github.repository_owner }}/api-tareas:${{ github.sha }}
```

## 11. Paso 8: explicar el workflow

### Nombre del workflow

```yaml
name: Build Test Deploy
```

Es el nombre que aparecerá en la pestaña Actions del repositorio.

### Evento disparador

```yaml
on:
  push:
    branches:
      - main
```

El workflow se ejecuta automáticamente con cada push a `main`.

### Permisos

```yaml
permissions:
  contents: read
  packages: write
```

Permite leer el repositorio y publicar paquetes o imágenes Docker en GitHub Container Registry.

### Job `build-test`

Este job realiza la integración continua básica:

1. Descarga el código.
2. Configura Node.js.
3. Instala dependencias.
4. Ejecuta tests.

Si las pruebas fallan, el workflow se detiene.

### Job `docker-build-push`

Este job construye y publica la imagen Docker.

La línea:

```yaml
needs: build-test
```

garantiza que Docker solo se ejecute si las pruebas fueron exitosas.

## 12. Paso 9: subir cambios al repositorio

```bash
git add .
git commit -m "Agrega tests, Dockerfile y pipeline CI/CD"
git push origin main
```

Luego ingresar a GitHub:

```text
Repositorio → Actions
```

Verificar que el workflow finalice correctamente.

## 13. Paso 10: verificar imagen publicada

La imagen quedará publicada como:

```text
ghcr.io/calidadygestion2026-edu/api-tareas:latest
```

También existirá una etiqueta con el SHA del commit:

```text
ghcr.io/calidadygestion2026-edu/api-tareas:<SHA_DEL_COMMIT>
```

Probar descarga:

```bash
docker pull ghcr.io/calidadygestion2026-edu/api-tareas:latest
```

Si la imagen es pública o accesible, no será necesario ejecutar `docker login ghcr.io`.

## 14. Paso 11: preparar entorno de testing con Docker Compose

En la instancia de testing:

```bash
mkdir -p ~/api-tareas-testing
cd ~/api-tareas-testing
```

Crear `compose.yml`:

```yaml
services:
  api-tareas:
    image: ghcr.io/calidadygestion2026-edu/api-tareas:latest
    container_name: api-tareas-testing
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: testing
```

Descargar la imagen:

```bash
docker compose pull
```

Levantar el contenedor:

```bash
docker compose up -d
```

Verificar:

```bash
docker ps
curl http://localhost:3000/tareas
```

## 15. Paso 12: actualizar testing ante nuevos cambios

Cada vez que se publique una nueva imagen desde GitHub Actions:

```bash
cd ~/api-tareas-testing
docker compose pull
docker compose up -d
```

O en una sola línea:

```bash
docker compose pull && docker compose up -d
```

## 16. Variante con versionado semántico

Para trabajar Semantic Versioning, se pueden publicar etiquetas como:

```text
1.0.0
1.1.0
1.1.1
```

Ejemplo de imagen:

```text
ghcr.io/calidadygestion2026-edu/api-tareas:1.0.0
```

En `compose.yml`, se podría fijar una versión específica:

```yaml
services:
  api-tareas:
    image: ghcr.io/calidadygestion2026-edu/api-tareas:1.0.0
    container_name: api-tareas-testing
    restart: unless-stopped
    ports:
      - "3000:3000"
```

Esto permite diferenciar entre usar siempre `latest` y desplegar una versión controlada.

## 17. Evidencias solicitadas a estudiantes

Se recomienda solicitar:

1. Captura de `npm test` exitoso.
2. Captura del workflow en GitHub Actions.
3. Captura de la imagen publicada en GHCR.
4. Archivo `Dockerfile`.
5. Archivo `.dockerignore`.
6. Archivo `build-test-deploy.yml`.
7. Archivo `compose.yml` del entorno de testing.
8. Captura de `docker compose up -d`.
9. Captura de `curl http://localhost:3000/tareas`.
10. Breve reflexión sobre el flujo Build-Test-Deploy.

## 18. Problemas frecuentes

### Docker no está instalado

Mensaje posible:

```text
No se ha encontrado la orden «docker»
```

Solución: instalar Docker en el sistema operativo correspondiente.

### Falla `npm ci`

Puede ocurrir si no existe `package-lock.json` o si está desactualizado.

Solución:

```bash
npm install
git add package-lock.json
git commit -m "Actualiza package-lock"
git push
```

### Fallan los tests

El pipeline no debe continuar si fallan los tests. Este comportamiento es correcto desde el punto de vista de CI.

### Compose no descarga la imagen nueva

Ejecutar explícitamente:

```bash
docker compose pull
docker compose up -d
```

### Error de permisos al publicar en GHCR

Verificar que el workflow tenga:

```yaml
permissions:
  contents: read
  packages: write
```

## 19. Cierre conceptual

Esta actividad permite observar que la calidad del software no depende únicamente del código escrito, sino también del proceso mediante el cual ese código se integra, se verifica y se entrega. La automatización mediante CI/CD reduce errores manuales, mejora la trazabilidad y brinda retroalimentación temprana al equipo de desarrollo.

Desde el punto de vista de la Unidad Didáctica 3, el flujo implementado permite vincular:

- Integración continua.
- Automatización de pruebas.
- Pipeline Build-Test-Deploy.
- Uso de contenedores.
- Publicación de imágenes.
- Entorno de testing.
- Entrega continua conceptual.
- Introducción a prácticas DevOps.

## 20. Referencias de consulta

- GitHub Docs: Publishing Docker images.
- GitHub Docs: Working with the Container registry.
- Docker Docs: Docker Build GitHub Actions.
- Docker Docs: Docker Compose CLI.
- Docker Docs: docker compose pull.
- Docker Docs: docker compose up.
- Jest Documentation.
