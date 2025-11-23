const CACHE_NAME = 'investsim-v1';
// Lista de todos os recursos que devem ser armazenados em cache para uso offline
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './service-worker.js',
    // ÍCONES CORRIGIDOS: Devem estar na raiz do projeto junto com este arquivo
    './icon-192x192.png', 
    './icon-512x512.png',
    './maskable_icon.png',
    // Dependências externas
    'https://cdn.tailwindcss.com', // Caching do Tailwind CSS CDN
    'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap' // Caching da fonte Inter
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto: Arquivos pré-armazenados em cache.');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Falha ao abrir o cache ou adicionar arquivos:', err);
            })
    );
    self.skipWaiting(); // Força a ativação imediata
});

// Interceptação de Requisições (Estratégia: Cache, depois Network)
self.addEventListener('fetch', event => {
    // Apenas manipula requisições http(s)
    if (event.request.url.startsWith('http')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Retorna o recurso do cache se existir
                    if (response) {
                        return response;
                    }
                    // Se não estiver no cache, busca na rede
                    return fetch(event.request).then(
                        networkResponse => {
                            // Verifica se recebeu uma resposta válida
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }

                            // Clona a resposta para cache (o original vai para o navegador)
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    // Adiciona apenas as requisições GET ao cache
                                    if (event.request.method === 'GET') {
                                         cache.put(event.request, responseToCache);
                                    }
                                });

                            return networkResponse;
                        }
                    );
                })
        );
    }
});

// Ativação e Limpeza de Caches Antigos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Exclui caches antigos
                        console.log('Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});