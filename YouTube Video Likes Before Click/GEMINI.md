# Contexto del Proyecto: YouTube Video Likes Before Click (Script de Tampermonkey)

## Resumen del Proyecto

Este proyecto consiste en un script de usuario de Tampermonkey diseñado para mejorar la experiencia de navegación en YouTube. Su función principal es mostrar el número de "me gusta" de los videos de YouTube directamente en las miniaturas y listados de videos *antes* de que el usuario haga clic en ellos. Además, calcula una "puntuación de calidad" para cada video basada en sus "me gusta", visualizaciones y fecha de publicación, presentando una etiqueta descriptiva (por ejemplo, "VIRAL", "EN TENDENCIA") y un color correspondiente. El script utiliza la API de Datos de YouTube (v3) para recuperar las estadísticas de los videos.

## Tecnologías Utilizadas

*   **JavaScript (ES6+):** El lenguaje principal para la lógica del script y la manipulación del DOM.
*   **API de Tampermonkey:** Proporciona el entorno y las funcionalidades necesarias para que el script de usuario se ejecute en el navegador.
*   **API de Datos de YouTube v3:** Se utiliza para obtener estadísticas detalladas (número de "me gusta", número de visualizaciones) de los videos de YouTube.

## Arquitectura y Flujo de Trabajo

El script opera dentro del contexto del navegador en cualquier página de `https://www.youtube.com/*`. Emplea un `MutationObserver` para monitorear continuamente el Modelo de Objeto de Documento (DOM) en busca de cambios, lo cual es crucial para el contenido cargado dinámicamente (por ejemplo, el desplazamiento infinito en YouTube).

Cuando se detectan nuevos elementos de video:
1.  El script extrae los IDs de los videos de sus respectivos enlaces.
2.  Luego realiza solicitudes por lotes a la API de Datos de YouTube (v3) para recuperar `statistics` (likeCount, viewCount) y `snippet` (title, publishedAt) para estos videos.
3.  Al recibir las respuestas de la API, calcula una "puntuación de calidad" personalizada utilizando la función `calculateQualityScore`, que considera los "me gusta", las visualizaciones y la antigüedad del video.
4.  Finalmente, inyecta el número de "me gusta" formateado y la etiqueta de calidad (con su color asociado y tooltip) en el elemento de visualización del video en la página.

## Funciones y Lógica Clave

*   `extractVideoId(url)`: Analiza una URL de YouTube para obtener el identificador único del video.
*   `calculateQualityScore(likes, views, publishedDays)`: Determina la calidad de un video basándose en un algoritmo propietario, asignando una etiqueta categórica y un color.
*   `getDaysSincePublication(videoContainer)`: Intenta analizar la fecha de publicación del video a partir de varios elementos de metadatos dentro de su contenedor.
*   `getViewCount(videoContainer)`: Extrae el número de visualizaciones de los metadatos del contenedor del video, manejando diferentes formatos (por ejemplo, "K", "M").
*   `getVideoInfo(videoId)`: Localiza el contenedor DOM específico para un ID de video dado e identifica el punto óptimo para inyectar nueva información.
*   `applyCustomStyles(element, isQuality)`: Aplica estilos CSS en línea para asegurar que los elementos inyectados sean visualmente consistentes y legibles.
*   `processVideoData(data)`: Itera a través de los datos de respuesta de la API, procesa cada video y activa las actualizaciones de la interfaz de usuario.
*   `processNewVideos()`: Orquesta la detección de nuevos videos, el procesamiento por lotes de solicitudes a la API y el manejo de errores. Utiliza un `Set` (`processedVideos`) para evitar reprocesar videos ya manejados y un mecanismo de "debouncing" con `setTimeout` para optimizar el rendimiento durante cambios rápidos en el DOM.

## Convenciones de Desarrollo

*   **Metadatos de Tampermonkey:** El script se adhiere al bloque estándar `// ==UserScript==` para la configuración de Tampermonkey.
*   **Modo Estricto:** Utiliza `'use strict';` para una mejor calidad de código y prevención de errores.
*   **Convenciones de Nomenclatura:** Sigue `camelCase` para variables y funciones.
*   **Comentarios:** Los comentarios están principalmente en español.
*   **Manejo de Claves API:** La clave de la API de Datos de YouTube está codificada directamente en el script. Para entornos de producción o compartidos, se recomienda encarecidamente implementar un método más seguro para la gestión de claves API (por ejemplo, entrada de usuario, variables de entorno o un almacenamiento de configuración seguro).
*   **Depuración:** Utiliza `console.log` para registrar el estado y la información de depuración.
*   **Optimización del Rendimiento:** Emplea un `Set` para rastrear los videos procesados y un mecanismo de "debouncing" con `setTimeout` para gestionar eficientemente la observación del DOM y las llamadas a la API.

## Construcción y Ejecución

Este es un script de usuario del lado del cliente y no requiere un proceso de construcción tradicional.

*   **Instalación:**
    1.  Asegúrese de tener instalado un gestor de scripts de usuario como [Tampermonkey](https://www.tampermonkey.net/) (para Chrome, Firefox, Edge, Opera) o [Greasemonkey](https://www.greasespot.net/) (para Firefox) en su navegador web.
    2.  Abra el archivo `YouTube Video Likes Before Click.user.js`. Su gestor de scripts de usuario debería detectarlo y pedirle que lo instale.
    3.  Confirme la instalación.

*   **Ejecución:**
    *   Una vez instalado, el script se activará y ejecutará automáticamente en cualquier página de YouTube (`https://www.youtube.com/*`).
    *   Comenzará a mostrar el número de "me gusta" y las puntuaciones de calidad en los listados de videos mientras navega por YouTube.