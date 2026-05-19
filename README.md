# RealtimeTrivia

Proyecto para la materia de desarrollo Web de una plataforma de trivia multijugador en tiempo real. La idea es: crear una sala, compartir el código con tus amigos, elegir una categoría y ver quién sabe más sobre videojuegos o películas.

---

## ¿Qué tecnologías se usaron?

**Backend:**
- Node.js con Express para el servidor
- Socket.io para todo lo de tiempo real (WebSockets)
- SQLite con better-sqlite3 para la base de datos (elegí SQLite porque no necesita instalar nada aparte, todo queda en un archivo)
- JWT para la autenticación
- bcrypt para hashear contraseñas

**Frontend:**
- Next.js 14 con el App Router
- TypeScript
- Tailwind CSS para los estilos
- socket.io-client para conectarse al servidor

---

## Cómo correrlo

Necesitas tener **Node.js** instalado (versión 18 o superior).

### 1. Clonar / descargar el proyecto

Si lo descargaste como ZIP, extráelo. Si lo clonaste con git:

```bash
git clone <https://github.com/sofimq167/RealtimeTrivia>
cd RealtimeTrivia
```

### 2. Arrancar el backend

Abre una terminal y entra a la carpeta del backend:

```bash
cd backend
npm install
npm run dev
```

El servidor queda corriendo en `http://localhost:3001`. La primera vez que corre crea automáticamente el archivo de base de datos `trivia.db` con todas las tablas.

### 3. Arrancar el frontend

Abre **otra terminal** (deja la del backend corriendo) y entra a la carpeta del frontend:

```bash
cd frontend
npm install
npm run dev
```

El frontend queda en `http://localhost:3000`. Abre esa URL en el navegador y ya puedes usar la app.

> Necesitas las dos terminales corriendo al mismo tiempo.

---

## Cómo jugar

1. Entra a `localhost:3000` y créate una cuenta (o inicia sesión si ya tienes una)
2. En la pantalla principal, dale a **"Crear sala nueva"**
3. Comparte el código de 6 letras que aparece con tus amigos
4. Tus amigos entran a la misma URL, eligen "Unirse" y meten el código
5. El que creó la sala elige la categoría (Videojuegos o Películas) y le da a **"Iniciar partida"**
6. Responde las preguntas antes de que se acabe el tiempo — entre más rápido respondas, más puntos ganas
7. Al final se muestra el podio con los puntajes

---

## Funcionalidades que implementé

### Sistema de salas
Cuando alguien crea una sala, el servidor genera un código único de 6 caracteres (por ejemplo `KLB4MK`). Los demás jugadores lo ingresan para unirse. Solo el que creó la sala puede iniciar la partida.

### Juego en tiempo real
Todo el estado del juego lo controla el servidor. Esto es importante porque significa que ningún jugador puede hacer trampa manipulando el tiempo o saltándose preguntas desde el cliente. El flujo es:

```
Lobby → Cuenta regresiva (3-2-1) → Pregunta (20 seg) → Ver respuesta correcta → Scoreboard → siguiente pregunta... → Podio final
```

### Preguntas
Son 15 preguntas de **Videojuegos** y 15 de **Películas** guardadas en un JSON. Cada partida mezcla las preguntas aleatoriamente y escoge 10, así no siempre salen las mismas.

### Autenticación con JWT
El registro y login guardan la contraseña hasheada con bcrypt. Al iniciar sesión el servidor genera un token JWT que dura 7 días y se guarda en una cookie. Ese token también se usa para autenticar la conexión WebSocket.

### Base de datos e historial
Uso SQLite para guardar usuarios, partidas y resultados. Cada jugador tiene una página de historial donde puede ver sus últimas 20 partidas con estadísticas (victorias, mejor puntaje, puntos totales).

### Chat
Hay un chat en la sala de espera y también durante la partida. Los mensajes del sistema (como "Fulano se desconectó") aparecen centrados en gris para distinguirlos.

### Power-ups
Cada jugador tiene dos power-ups por partida:
-  **Doble puntos**: la próxima respuesta correcta vale el doble
-  **50/50**: elimina dos respuestas incorrectas de la pantalla

Los power-ups los maneja el servidor para que no haya trampa.

### Sonidos
Se generaron los sonidos con la Web Audio API directamente en código, sin archivos de audio. Hay sonido al acertar, al fallar, cuando se acaba el tiempo, ticks del timer en los últimos 5 segundos, al usar un power-up, y una fanfarria para el ganador.

### Diseño
Tipografía Poppins con una paleta de colores cálidos (beige, café, ámbar). Animaciones CSS para las transiciones entre fases del juego.

---

## Estructura del proyecto

```
RealtimeTrivia/
├── backend/
│   └── src/
│       ├── config/           configuración de la base de datos SQLite
│       ├── middleware/       verificación de JWT
│       ├── routes/           rutas REST (auth, historial)
│       ├── socket/           lógica del juego en tiempo real
│       │   ├── roomManager   manejo de salas en memoria
│       │   ├── gameManager   máquina de estados del juego
│       │   └── socketHandler router de eventos WebSocket
│       ├── data/             preguntas en JSON
│       └── index.js          punto de entrada del servidor
│
└── frontend/
    └── src/
        ├── app/              páginas (Next.js App Router)
        │   ├── login/
        │   ├── register/
        │   ├── lobby/[roomCode]/
        │   ├── game/[roomCode]/
        │   └── history/
        ├── components/       componentes reutilizables
        │   ├── game/         pregunta, timer, scoreboard, power-ups, pantalla final
        │   ├── lobby/        lista de jugadores, chat, configuración
        │   └── ui/           botón e input genéricos
        ├── context/          estado global (auth y socket)
        ├── hooks/            useSound
        └── lib/              helper para peticiones al backend
```

---

## Notas

- Si el servidor se cae mientras hay una partida activa, la sala se pierde (No tiene sentido intentar recuperar una partida a medias)
- El máximo de jugadores por sala es 8
- Se pueden usar para probar con solo 1 jugador
- La base de datos se crea automáticamente en `backend/trivia.db` la primera vez que corre el servidor

---
