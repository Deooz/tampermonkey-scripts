// ==UserScript==
// @name         YouTube Video Likes Before Click
// @namespace    https://github.com/Deooz
// @version      1.0.1
// @description  Muestra los "me gusta" y un puntaje de calidad en los videos de YouTube antes de hacer clic.
// @author       Deooz
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @license      MIT
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL  https://raw.githubusercontent.com/Deooz/tampermonkey-scripts/master/YouTube%20Video%20Likes%20Before%20Click/YouTube%20Video%20Likes%20Before%20Click.user.js
// @updateURL    https://raw.githubusercontent.com/Deooz/tampermonkey-scripts/master/YouTube%20Video%20Likes%20Before%20Click/YouTube%20Video%20Likes%20Before%20Click.user.js
// ==/UserScript==

(async function () {
    'use strict';

    // --- API Key Management ---
    /**
     * Retrieves the API key from storage, or prompts the user if it's not found.
     * @returns {Promise<string|null>} The API key or null if not provided.
     */
    async function getApiKey() {
        let apiKey = await GM_getValue('youtubeApiKey', null);
        if (!apiKey) {
            apiKey = prompt('Por favor, introduce tu clave de API de YouTube v3.\nNecesitas una para que el script "YouTube Video Likes Before Click" funcione.\nPuedes obtenerla siguiendo las instrucciones en la web de Google Developers.');
            if (apiKey && apiKey.trim() !== '') {
                await GM_setValue('youtubeApiKey', apiKey);
                alert('API Key guardada. El script ahora está activo.');
            } else {
                alert('No se proporcionó una API Key. El script no se ejecutará.');
                return null;
            }
        }
        return apiKey;
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
        console.log('🔴 YouTube Likes Counter: No se encontró API Key. El script se ha detenido.');
        return;
    }

    // --- Original Script Logic ---
    let apiRequests = 0;
    const processedVideos = new Set();

    function extractVideoId(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get('v');
        } catch (e) {
            const match = url.match(/[?&]v=([^&]+)/);
            return match ? match[1] : null;
        }
    }

    function calculateQualityScore(likes, views, publishedDays) {
        const days = Math.max(publishedDays, 1);
        const likesPerDay = likes / days;
        const viewsPerDay = views / days;
        let momentumScore = likesPerDay;
        const viewMomentum = Math.max(viewsPerDay, 1);
        const engagementDensity = likesPerDay / (viewMomentum / 100);
        const finalScore = momentumScore + (engagementDensity * 0.3);

        let quality, color;
        if (finalScore >= 500) {
            quality = '🚀 VIRAL';
            color = '#FF1493';
        } else if (finalScore >= 200) {
            quality = '🔥 EN LLAMAS';
            color = '#FF4500';
        } else if (finalScore >= 50) {
            quality = '⭐ TRENDING';
            color = '#FFD700';
        } else if (finalScore >= 20) {
            quality = '📈 CRECIENDO';
            color = '#32CD32';
        } else if (finalScore >= 5) {
            quality = '👍 ACTIVO';
            color = '#FFA500';
        } else if (finalScore >= 1) {
            quality = '😐 LENTO';
            color = '#808080';
        } else {
            quality = '💤 ESTANCADO';
            color = '#DC143C';
        }

        return {
            score: finalScore,
            quality: quality,
            color: color,
            likesPerDay: likesPerDay.toFixed(1),
            engagementDensity: engagementDensity.toFixed(2)
        };
    }

    function getDaysSincePublication(videoContainer) {
        const selectors = ['.inline-metadata-item', '.yt-content-metadata-view-model-wiz__metadata-text', '[class*="metadata-text"]', 'span[class*="metadata"]'];
        for (let selector of selectors) {
            const metadataItems = videoContainer.querySelectorAll(selector);
            for (let item of metadataItems) {
                const text = item.textContent.toLowerCase().trim();
                const match = text.match(/(\d+)/);
                if (text.includes('día')) return (match ? parseInt(match[1], 10) : 1) || 1;
                if (text.includes('semana')) return ((match ? parseInt(match[1], 10) : 1) || 1) * 7;
                if (text.includes('mes')) return ((match ? parseInt(match[1], 10) : 1) || 1) * 30;
                if (text.includes('año')) return ((match ? parseInt(match[1], 10) : 1) || 1) * 365;
                if (text.includes('hora') || text.includes('minuto')) return 1;
            }
        }
        return 30;
    }

    function getViewCount(videoContainer) {
        const selectors = ['.inline-metadata-item', '.yt-content-metadata-view-model-wiz__metadata-text', '[class*="metadata-text"]', 'span[class*="metadata"]'];
        for (let selector of selectors) {
            const metadataItems = videoContainer.querySelectorAll(selector);
            for (let item of metadataItems) {
                const text = item.textContent.toLowerCase().trim();
                if (text.includes('vista')) {
                    const cleanText = text.replace(/[^\d.,km]/gi, '');
                    if (cleanText.includes('k')) return parseFloat(cleanText.replace('k', '')) * 1000;
                    if (cleanText.includes('m')) return parseFloat(cleanText.replace('m', '')) * 1000000;
                    return parseInt(cleanText.replace(/[,.]/, '')) || 1000;
                }
            }
        }
        return 1000;
    }

    function getVideoInfo(videoId) {
        const containerSelectors = ['ytd-video-renderer', 'ytd-rich-item-renderer', 'ytd-compact-video-renderer', 'ytd-grid-video-renderer'];
        for (let containerSelector of containerSelectors) {
            const containers = document.querySelectorAll(containerSelector);
            for (let container of containers) {
                const videoLink = container.querySelector(`a[href*="${videoId}"]`);
                if (videoLink) {
                    let insertionPoint = container.querySelector('.yt-content-metadata-view-model__metadata-row, .yt-content-metadata-view-model-wiz__metadata-row, #metadata-line, [class*="metadata-row"], [class*="metadata"]');
                    if (insertionPoint) {
                        return { videoContainer: container, insertionPoint };
                    }
                }
            }
        }
        return null;
    }

    function applyCustomStyles(element, isQuality = false) {
        element.style.fontSize = '12px';
        element.style.fontWeight = isQuality ? 'bold' : 'normal';
        element.style.opacity = '0.9';
        element.style.letterSpacing = '0.025em';
        if (isQuality) {
            element.style.textShadow = '0 1px 2px rgba(0,0,0,0.1)';
            element.style.lineHeight = '1.2';
        }
    }

    function processVideoData(data) {
        apiRequests++;
        console.log(`✅ Solicitud API #${apiRequests} - Procesando ${data.items.length} videos`);
        data.items.forEach(item => {
            const videoInfo = getVideoInfo(item.id);
            if (videoInfo) {
                const { videoContainer, insertionPoint } = videoInfo;
                processedVideos.add(item.id);
                videoContainer.dataset.likesProcessed = 'true';

                const likes = parseInt(item.statistics.likeCount) || 0;
                const views = getViewCount(videoContainer);
                const publishedDays = getDaysSincePublication(videoContainer);
                const qualityData = calculateQualityScore(likes, views, publishedDays);

                const likeCountElement = document.createElement('span');
                likeCountElement.textContent = `❤️ ${likes.toLocaleString()}`;
                applyCustomStyles(likeCountElement);

                const qualityElement = document.createElement('span');
                qualityElement.textContent = qualityData.quality;
                qualityElement.style.color = qualityData.color;
                qualityElement.style.marginLeft = '4px';
                qualityElement.title = `Momentum: ${qualityData.likesPerDay} likes/día | Densidad: ${qualityData.engagementDensity} | Score: ${qualityData.score.toFixed(1)}`;
                applyCustomStyles(qualityElement, true);

                const existingSpan = insertionPoint.querySelector('span');
                if (existingSpan) {
                    likeCountElement.className = existingSpan.className;
                    qualityElement.className = existingSpan.className;
                } else {
                    likeCountElement.className = 'yt-core-attributed-string yt-content-metadata-view-model-wiz__metadata-text';
                    qualityElement.className = 'yt-core-attributed-string yt-content-metadata-view-model-wiz__metadata-text';
                }

                const delimiter = document.createElement('span');
                delimiter.className = 'yt-content-metadata-view-model-wiz__delimiter';
                delimiter.textContent = ' • ';

                insertionPoint.append(delimiter.cloneNode(true), likeCountElement, delimiter.cloneNode(true), qualityElement);
                console.log(`📊 Video procesado: ${item.snippet?.title || item.id} - ${likes} likes`);
            }
        });
    }

    function processNewVideos() {
        const videoSelectors = ['ytd-video-renderer', 'ytd-rich-item-renderer', 'ytd-compact-video-renderer', 'ytd-grid-video-renderer'];
        let videosToFetch = new Set();

        videoSelectors.forEach(selector => {
            document.querySelectorAll(`${selector}:not([data-likes-processed="true"])`).forEach(container => {
                const videoLink = container.querySelector('a[href*="/watch?v="]');
                if (videoLink) {
                    const videoId = extractVideoId(videoLink.href);
                    if (videoId && !processedVideos.has(videoId)) {
                        videosToFetch.add(videoId);
                    }
                }
            });
        });

        const videoIds = Array.from(videosToFetch);
        if (videoIds.length > 0) {
            console.log(`🔍 Encontrados ${videoIds.length} videos nuevos para procesar`);
            for (let i = 0; i < videoIds.length; i += 50) {
                const chunk = videoIds.slice(i, i + 50);
                const url = `https://www.googleapis.com/youtube/v3/videos?id=${chunk.join(',')}&key=${apiKey}&part=statistics,snippet`;

                fetch(url)
                    .then(response => {
                        if (!response.ok) { throw new Error(`API Error: ${response.status}`); }
                        return response.json();
                    })
                    .then(processVideoData)
                    .catch(error => {
                        console.error('❌ Error en solicitud API:', error);
                        chunk.forEach(id => processedVideos.delete(id));
                    });
            }
        }
    }

    // --- Initialization ---
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processNewVideos, 1000);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('🚀 YouTube Likes Counter iniciado');
    setTimeout(processNewVideos, 2000);

})();
