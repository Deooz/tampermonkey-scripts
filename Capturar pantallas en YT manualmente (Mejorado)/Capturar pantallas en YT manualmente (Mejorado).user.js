// ==UserScript==
// @name         Capturar pantallas en YT manualmente (Mejorado)
// @namespace    https://github.com/Deooz
// @version      2.1.0
// @description  Permite capturar múltiples pantallas de un video de YouTube, gestionarlas y descargarlas con nombres de archivo detallados.
// @author       Deooz
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @license      MIT
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @downloadURL  https://raw.githubusercontent.com/Deooz/tampermonkey-scripts/master/Capturar%20pantallas%20en%20YT%20manualmente%20(Mejorado)/Capturar%20pantallas%20en%20YT%20manualmente%20(Mejorado).user.js
// @updateURL    https://raw.githubusercontent.com/Deooz/tampermonkey-scripts/master/Capturar%20pantallas%20en%20YT%20manualmente%20(Mejorado)/Capturar%20pantallas%20en%20YT%20manualmente%20(Mejorado).user.js
// ==/UserScript==

(function() {
    'use strict';

    class YouTubeScreenshotter {
        constructor() {
            this.capturedImages = [];
            this.maxStoredImages = 5;
            this.defaultQuality = 0.9;
            this.init();
        }

        init() {
            this.addStyles();
            this.setupEventListeners();
            this.showWelcomeMessage();
        }

        addStyles() {
            const styles = `
                .yt-screenshot-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 15px 20px;
                    padding-right: 40px; /* Espacio para el botón X */
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 10000;
                    transition: opacity 0.3s ease;
                    white-space: pre-wrap; /* Para respetar los saltos de línea */
                    line-height: 1.5;
                }

                .yt-screenshot-fade-out {
                    opacity: 0;
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        showNotification(message, duration = 3000, closable = false) {
            const notification = document.createElement('div');
            notification.className = 'yt-screenshot-notification';
            notification.textContent = message;

            if (closable) {
                const closeButton = document.createElement('span');
                closeButton.textContent = 'X';
                closeButton.style.position = 'absolute';
                closeButton.style.top = '8px';
                closeButton.style.right = '12px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.fontSize = '18px';
                closeButton.style.fontWeight = 'bold';
                closeButton.style.color = '#ccc';
                closeButton.style.lineHeight = '1';

                closeButton.onmouseover = () => closeButton.style.color = '#fff';
                closeButton.onmouseout = () => closeButton.style.color = '#ccc';

                closeButton.onclick = () => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                };
                notification.appendChild(closeButton);
            } else {
                setTimeout(() => {
                    notification.classList.add('yt-screenshot-fade-out');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, duration);
            }

            document.body.appendChild(notification);
        }

        getVideoInfo() {
            const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.style-scope.ytd-watch-metadata');
            const chapterElement = document.querySelector('.ytp-chapter-title-content');
            const timeElement = document.querySelector('.ytp-time-current');

            const title = titleElement ? titleElement.textContent.trim() : 'Video_YouTube';
            const chapter = chapterElement ? chapterElement.textContent.trim() : '';
            const currentTime = timeElement ? timeElement.textContent.trim() : '';

            return { title, chapter, currentTime };
        }

        sanitizeFileName(fileName) {
            return fileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
        }

        generateFileName() {
            const { title, chapter, currentTime } = this.getVideoInfo();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');

            let fileName = title;
            if (chapter) {
                fileName += `_${chapter}`;
            }
            if (currentTime) {
                fileName += `_${currentTime}`;
            }
            fileName += `_${timestamp}`;

            return this.sanitizeFileName(fileName);
        }

        async takeScreenshot() {
            try {
                const videoElement = document.querySelector('video.video-stream.html5-main-video');

                if (!videoElement) {
                    throw new Error('No se encontró el elemento de video');
                }

                if (videoElement.paused) {
                    this.showNotification('⚠️ El video está pausado');
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Mantener la resolución original del video
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;

                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                const fileName = this.generateFileName();
                const imgURL = canvas.toDataURL('image/webp', this.defaultQuality);

                const capturedImage = {
                    url: imgURL,
                    fileName: fileName,
                    timestamp: new Date(),
                    videoInfo: this.getVideoInfo()
                };

                this.capturedImages.unshift(capturedImage);

                // Limitar el número de imágenes almacenadas
                if (this.capturedImages.length > this.maxStoredImages) {
                    this.capturedImages = this.capturedImages.slice(0, this.maxStoredImages);
                }

                this.showNotification(`📸 Captura realizada: ${fileName.substring(0, 30)}...`);
                console.log('Captura de pantalla realizada:', fileName);

            } catch (error) {
                this.showNotification(`❌ Error: ${error.message}`);
                console.error('Error al capturar pantalla:', error);
            }
        }

        downloadImage(index = 0) {
            if (!this.capturedImages.length) {
                this.showNotification('❌ No hay capturas disponibles');
                return;
            }

            if (index >= this.capturedImages.length) {
                this.showNotification('❌ Índice de captura no válido');
                return;
            }

            const image = this.capturedImages[index];
            let fileName = prompt(
                `Nombre del archivo (${index + 1}/${this.capturedImages.length}):\n\nOriginal: ${image.fileName}`,
                image.fileName
            );

            if (fileName === null) return; // Usuario canceló

            if (!fileName.trim()) {
                fileName = image.fileName;
            }

            fileName = this.sanitizeFileName(fileName);

            try {
                const link = document.createElement('a');
                link.href = image.url;
                link.download = `${fileName}.webp`;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                this.showNotification(`💾 Descargado: ${fileName.substring(0, 30)}...`);

            } catch (error) {
                this.showNotification(`❌ Error al descargar: ${error.message}`);
                console.error('Error al descargar:', error);
            }
        }

        showImageList() {
            if (!this.capturedImages.length) {
                this.showNotification('❌ No hay capturas disponibles');
                return;
            }

            let message = `Capturas disponibles (${this.capturedImages.length}/${this.maxStoredImages}):\n\n`;

            this.capturedImages.forEach((img, index) => {
                const timeAgo = Math.round((Date.now() - img.timestamp.getTime()) / 1000);
                message += `${index + 1}. ${img.fileName.substring(0, 40)}...\n`;
                message += `   Hace ${timeAgo}s - ${img.videoInfo.currentTime || 'Sin tiempo'}\n\n`;
            });

            message += 'Presiona Alt+G para descargar la más reciente\n';
            message += 'o Alt+Shift+G para elegir cual descargar';

            alert(message);
        }

        chooseImageToDownload() {
            if (!this.capturedImages.length) {
                this.showNotification('❌ No hay capturas disponibles');
                return;
            }

            let options = 'Selecciona qué captura descargar:\n\n';
            this.capturedImages.forEach((img, index) => {
                options += `${index + 1}. ${img.fileName.substring(0, 50)}...\n`;
            });

            const choice = prompt(options + '\nIngresa el número:');

            if (choice === null) return;

            const index = parseInt(choice) - 1;

            if (isNaN(index) || index < 0 || index >= this.capturedImages.length) {
                this.showNotification('❌ Selección no válida');
                return;
            }

            this.downloadImage(index);
        }

        setupEventListeners() {
            document.addEventListener('keydown', (event) => {
                // Alt + C: Capturar pantalla
                if (event.altKey && event.code === 'KeyC' && !event.shiftKey) {
                    event.preventDefault();
                    this.takeScreenshot();
                }
                // Alt + G: Descargar última captura
                else if (event.altKey && event.code === 'KeyG' && !event.shiftKey) {
                    event.preventDefault();
                    this.downloadImage(0);
                }
                // Alt + L: Listar capturas
                else if (event.altKey && event.code === 'KeyL') {
                    event.preventDefault();
                    this.showImageList();
                }
                // Alt + Shift + G: Elegir captura para descargar
                else if (event.altKey && event.shiftKey && event.code === 'KeyG') {
                    event.preventDefault();
                    this.chooseImageToDownload();
                }
            });
        }

        showWelcomeMessage() {
            setTimeout(() => {
                const welcomeText = `📸 Screenshotter Cargado\n\n` +
                                    `Alt+C: Capturar\n` +
                                    `Alt+G: Descargar última\n` +
                                    `Alt+L: Listar capturas\n` +
                                    `Alt+Shift+G: Elegir captura`;
                this.showNotification(welcomeText, null, true); // null duration, closable = true
            }, 2000);
        }
    }

    // Esperar a que la página esté completamente cargada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new YouTubeScreenshotter();
        });
    } else {
        new YouTubeScreenshotter();
    }

})();