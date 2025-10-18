# YouTube Video Likes Before Click

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Muestra el contador de "me gusta" y una puntuación de calidad para los videos de YouTube directamente en las miniaturas, antes de que necesites hacer clic.

![Ejemplo de cómo se ve el script](./assets/screenshot.png)

## ✨ Características

-   **Likes Visibles:** Muestra el número de "me gusta" (❤️) en la información del video.
-   **Puntuación de Calidad:** Analiza los me gusta, las vistas y la antigüedad del video para asignar una etiqueta de calidad.
-   **Soporte Dinámico:** Funciona con los videos que se cargan al hacer scroll en la página principal, tendencias y suscripciones.
-   **Eficiente:** Realiza solicitudes a la API de YouTube en lotes para un rendimiento óptimo.

### Leyenda de Puntuación de Calidad

| Etiqueta        | Color                               | Significado                               |
| --------------- | ----------------------------------- | ----------------------------------------- |
| 🚀 **VIRAL**    | <span style="color:#FF1493">■</span> | Crecimiento explosivo y altísimo engagement. |
| 🔥 **EN LLAMAS**  | <span style="color:#FF4500">■</span> | Muy popular, con gran momentum.           |
| ⭐ **TRENDING**  | <span style="color:#FFD700">■</span> | En tendencia, ganando popularidad.        |
| 📈 **CRECIENDO**  | <span style="color:#32CD32">■</span> | Buen crecimiento y actividad constante.   |
| 👍 **ACTIVO**     | <span style="color:#FFA500">■</span> | Actividad moderada y saludable.           |
| 😐 **LENTO**      | <span style="color:#808080">■</span> | Poca actividad reciente.                  |
| 💤 **ESTANCADO**  | <span style="color:#DC143C">■</span> | Actividad casi nula.                      |

## ⚙️ Instalación y Configuración

1.  Asegúrate de tener instalada la extensión [Tampermonkey](https://www.tampermonkey.net/) en tu navegador.
2.  Una vez que el script esté en GitHub, podrás instalarlo directamente desde un enlace que pondremos aquí.
3.  La primera vez que uses el script en YouTube, te pedirá que introduzcas tu **Clave de API de YouTube v3**. Puedes obtener una siguiendo [estas instrucciones](https://developers.google.com/youtube/v3/getting-started). El script guardará la clave de forma segura para futuras sesiones.

## 📜 Licencia

Este proyecto está bajo la Licencia MIT.
