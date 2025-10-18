// ==UserScript==
// @name         YouTube Transcript Extractor
// @namespace    https://github.com/Deooz
// @version      2.1.0
// @description  Extrae la transcripción de un video de YouTube y la muestra en un popup editable.
// @author       Deooz
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @downloadURL  https://raw.githubusercontent.com/Deooz/tampermonkey-scripts/master/YouTube%20Transcript%20Extractor/YouTube%20Transcript%20Extractor.user.js
// @updateURL    https://raw.githubusercontent.com/Deooz/tampermonkey-scripts/master/YouTube%20Transcript%20Extractor/YouTube%20Transcript%20Extractor.user.js
// ==/UserScript==

(function() {
    'use strict';

    let transcripcionExtraida = false;

    function extraerTranscripciones() {
        if (transcripcionExtraida) {
            return false;
        }
        // Desocultar la descripción completa
        let botonMostrarMas = document.querySelector('#expand');
        if(botonMostrarMas) {
            botonMostrarMas.click();
        }

        const capitulos = Array.from(document.querySelectorAll('ytd-transcript-section-header-renderer'));
        const segmentos = Array.from(document.querySelectorAll('ytd-transcript-segment-renderer'));
        let resultado = '';

        if (capitulos.length > 0) {
            for (const capitulo of capitulos) {
                const tituloCapitulo = capitulo.querySelector('h2 span.yt-core-attributed-string');
                resultado += `<h2>${tituloCapitulo.textContent}:</h2><p> </p>`;

                let siguienteElemento = capitulo.nextElementSibling;
                let parrafo = '';

                while (siguienteElemento && siguienteElemento.tagName === 'YTD-TRANSCRIPT-SEGMENT-RENDERER') {
                    const segmentoExtraido = siguienteElemento.querySelector('yt-formatted-string.segment-text.style-scope.ytd-transcript-segment-renderer');
                    parrafo += `${segmentoExtraido.textContent} `;

                    const siguienteSegmento = siguienteElemento.nextElementSibling;
                    if (!siguienteSegmento || siguienteSegmento.tagName !== 'YTD-TRANSCRIPT-SEGMENT-RENDERER') {
                        resultado += `<p>${parrafo.trim().replace(/([.!?])\s+(?=[A-Z])/g, "$1 ")}</p><p> </p>`;
                        parrafo = '';
                    }

                    siguienteElemento = siguienteSegmento;
                }
            }
        } else if (segmentos.length > 0) {
            let parrafo = '';

            for (const segmento of segmentos) {
                const segmentoExtraido = segmento.querySelector('yt-formatted-string.segment-text.style-scope.ytd-transcript-segment-renderer');
                parrafo += `${segmentoExtraido.textContent} `;

                const siguienteSegmento = segmento.nextElementSibling;
                if (!siguienteSegmento || siguienteSegmento.tagName !== 'YTD-TRANSCRIPT-SEGMENT-RENDERER') {
                    resultado += `<p>${parrafo.trim().replace(/([.!?])\s+(?=[A-Z])/g, "$1 ")}</p><p> </p>`;
                    parrafo = '';
                }
            }
        }

       if (resultado) {
    resultado += `<br><p><b>-------INICIO DESCRIPCIÓN-------</b></p>`; // Agregar separador antes de la descripción
    // Extraer la descripción
    let descripcionPart = document.querySelector('yt-attributed-string.style-scope.ytd-text-inline-expander > span');
    let descripcion = descripcionPart ? descripcionPart.outerHTML : '';
    // Asegúrate de manejar el caso en el que la descripción pueda ser nula
    if(descripcion) {
        // Reemplazar puntos, dos puntos, etc., con ellos mismos seguidos de un salto de línea
        descripcion = descripcion.replace(/([.!?;:-])\s/g, '$1<br>');
        // Añadir un salto de línea después de cada enlace
        descripcion = descripcion.replace(/<\/a>/g, '</a><br>');
        resultado += `<p>${descripcion}</p>`;
    }
    resultado += `<p><b>-------INICIO FUENTE-------</b></p>`; // Agregar separador antes de la fuente
    // Añadir la fuente al final del contenido extraído
    const videoUrl = document.querySelector('link[rel="shortlinkUrl"]').href;
    const videoTitle = document.querySelector('meta[property="og:title"]').content;
    resultado += `<p>Fuente: <a href="${videoUrl}" target="_blank">${videoTitle} - YouTube</a></p>`;

    mostrarPopup(resultado);
    transcripcionExtraida = true;
    return true;
}

        return false;
    }

    function mostrarTranscripcion() {
        const panelTranscripcion = document.querySelector('ytd-engagement-panel-section-list-renderer.style-scope.ytd-watch-flexy[target-id="engagement-panel-searchable-transcript"]');

        if (panelTranscripcion && panelTranscripcion.getAttribute('visibility') !== 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED') {
            panelTranscripcion.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED');
            return true;
        }
        return false;
    }

    // Crear una política de Trusted Types
    const myPolicy = trustedTypes.createPolicy('default', {
        createHTML: (string) => string,
    });

function mostrarPopup(contenido) {
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.left = '82.5%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.border = '1px solid black';
    popup.style.zIndex = '10000';
    popup.style.width = '30%';
    popup.style.height = '80%';
    popup.style.overflowY = 'scroll';

    const styleTag = document.createElement('style');
    styleTag.textContent = `
        .editable-content h2 {
            font-size: 24px;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
        }

        .editable-content p {
            font-size: 16px;
            line-height: 1.6;
            margin-top: 0.5em;
            margin-bottom: 0.5em;
        }

        @import url('https://fonts.googleapis.com/css2?family=Lato&display=swap');

        .editable-content {
            font-family: 'Lato', sans-serif;
        }
    `;
    document.head.appendChild(styleTag);

    const editableContent = document.createElement('div');
    editableContent.className = 'editable-content';
    editableContent.style.width = '80%';
    editableContent.style.padding = '40px 80px 40px 40px';
    editableContent.style.height = 'calc(100% - 40px)';
    editableContent.style.overflowY = 'scroll';
    editableContent.contentEditable = 'true';

    // Utilizar TrustedHTML para asignar el contenido
    const safeHTML = myPolicy.createHTML(contenido);
    editableContent.innerHTML = safeHTML;

    popup.appendChild(editableContent);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cerrar';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.backgroundColor = '#ff0000';
    closeButton.style.color = '#ffffff';
    closeButton.style.border = 'none';
    closeButton.style.padding = '8px 16px';
    closeButton.style.borderRadius = '4px';

    closeButton.addEventListener('mouseover', () => {
        closeButton.style.backgroundColor = '#ff3333';
    });

    closeButton.addEventListener('mouseout', () => {
        closeButton.style.backgroundColor = '#ff0000';
    });

    closeButton.onclick = () => {
        popup.style.display = 'none';

        const mostrarButton = document.createElement('button');
        mostrarButton.textContent = 'Mostrar Transcripción';
        mostrarButton.style.position = 'fixed';
        mostrarButton.style.bottom = '20px';
        mostrarButton.style.right = '20px';
        mostrarButton.style.cursor = 'pointer';
        mostrarButton.style.backgroundColor = 'rgba(0, 115, 230, 1)';
        mostrarButton.style.color = '#ffffff';
        mostrarButton.style.border = 'none';
        mostrarButton.style.padding = '8px 16px';
        mostrarButton.style.borderRadius = '4px';
        mostrarButton.style.zIndex = '10001';

        mostrarButton.addEventListener('mouseover', () => {
            mostrarButton.style.backgroundColor = 'rgba(0, 91, 181, 1)';
        });

        mostrarButton.addEventListener('mouseout', () => {
            mostrarButton.style.backgroundColor = 'rgba(0, 115, 230, 1)';
        });

        mostrarButton.onclick = () => {
            popup.style.display = 'block';
            document.body.removeChild(mostrarButton);
        };
        document.body.appendChild(mostrarButton);
    };

    popup.appendChild(closeButton);
    document.body.appendChild(popup);
}


    function sondeo() {
        // Verifica si el panel de transcripción está presente en la página
        const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer.style-scope.ytd-watch-flexy[target-id="engagement-panel-searchable-transcript"]');
        if (!transcriptPanel) {
            return;
        }

        const transcripcionVisible = mostrarTranscripcion();
        extraerTranscripciones();
    }

    const sondeoID = setInterval(sondeo, 1000);

})();

