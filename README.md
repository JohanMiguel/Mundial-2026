# Quiniela Mundial 2026 🏆

**Quiniela Mundial 2026** es una aplicación web moderna, interactiva y totalmente responsive diseñada para competir entre amigos pronosticando los resultados de la Copa Mundial de la FIFA 2026™.

La plataforma está optimizada para dispositivos móviles, tabletas y computadoras de escritorio, con un diseño oscuro elegante inspirado en las plataformas deportivas más destacadas como FIFA, OneFootball y Sofascore.

## Tecnologías Principales
* **Frontend**: React + Vite + TypeScript
* **Estilos**: Tailwind CSS
* **Autenticación**: Firebase Authentication (Soporte para Registro de Correo, Contraseña y Google)
* **Base de Datos**: Cloud Firestore (Base de datos NoSQL en tiempo real)
* **Iconos**: Lucide React
* **Animaciones**: Motion

---

## Características Principales

1. **Dashboard (Panel Principal)**:
   * Bienvenida personalizada y resumen estadístico.
   * Visualización del top 3 de líderes con tarjetas de podio.
   * Tarjetas de próximos partidos con ingreso rápido de predicciones.
   * Tarjetas de últimos resultados.

2. **Mis Pronósticos**:
   * Listado agrupado por fase del torneo (Octavos, Cuartos, Semifinales, etc.).
   * Filtros dinámicos de partidos abiertos y completados.
   * Bloqueo automático de entradas una vez iniciados los partidos.

3. **Tabla de Posiciones (Ranking)**:
   * Visualización en vivo de todos los participantes ordenados por puntuación.
   * Desglose detallado por aciertos exactos (+5 pts) y aciertos de ganador/empate (+3 pts).
   * Resaltado automático del usuario logueado en la tabla de clasificación.

4. **Estadísticas Avanzadas**:
   * Visualización del promedio general de puntos acumulados.
   * Usuario con mayor número de aciertos.
   * Participante con la efectividad de predicción más alta (%).
   * Análisis del partido más acertado y el partido más difícil ("rompe-quinielas").

5. **Panel del Administrador**:
   * Sección protegida y disponible únicamente para administradores.
   * Permite programar nuevos partidos en la base de datos con banderas y fases del mundial.
   * Permite ingresar marcadores oficiales.
   * **Recálculo Automático**: Al finalizar un partido, la plataforma calcula automáticamente los puntos de cada predicción guardada y actualiza el perfil, puntos y rendimiento de todos los participantes.

---

## Instrucciones de Instalación y Ejecución Local

Para ejecutar este proyecto en tu entorno local, sigue los siguientes pasos:

### Prerrequisitos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior) y npm en tu máquina.

### Pasos

1. **Clonar o descargar el repositorio**:
   Descarga los archivos del proyecto y navega al directorio raíz del mismo.

2. **Instalar dependencias**:
   Ejecuta el siguiente comando para instalar todos los paquetes requeridos por el proyecto:
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno**:
   Duplica el archivo `.env.example` y cámbiale el nombre a `.env`:
   ```bash
   cp .env.example .env
   ```
   *Nota: En un entorno local, puedes rellenar las credenciales correspondientes a tu proyecto de Firebase.*

4. **Iniciar el servidor de desarrollo**:
   Lanza el entorno de desarrollo local con:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible para visualizar en tu navegador en [http://localhost:3000](http://localhost:3000).

5. **Compilar para producción**:
   Para generar un build optimizado listo para subir a producción (como Firebase Hosting):
   ```bash
   npm run build
   ```

---

## Estructura del Código

* `src/firebase.ts`: Inicialización de los servicios de autenticación y base de datos de Firebase.
* `src/types.ts`: Definición de tipos y esquemas de datos utilizados en toda la aplicación.
* `src/context/AuthContext.tsx`: Proveedor de autenticación que gestiona sesiones de usuario, creación de perfiles de Firestore y asignación de privilegios de administrador.
* `src/utils/seeds.ts`: Módulo de datos para pre-cargar partidos oficiales y usuarios simulados si la base de datos está vacía.
* `src/utils/points.ts`: Algoritmos de puntuación y recálculo masivo tras finalizar partidos.
* `src/components/`:
  * `Navbar.tsx`: Navegación responsive con barra superior para PC y menú interactivo de notificaciones.
  * `Login.tsx`: Pantalla de registro/inicio de sesión con accesos directos e inteligentes de prueba.
  * `Dashboard.tsx`: Panel principal de la quiniela.
  * `Predictions.tsx`: Gestión e ingreso de pronósticos.
  * `Ranking.tsx`: Tabla de líderes del torneo.
  * `Statistics.tsx`: Análisis de datos y métricas generales.
  * `Profile.tsx`: Historial personal y edición de perfil.
  * `AdminPanel.tsx`: Herramientas exclusivas para administración de partidos y resultados.
