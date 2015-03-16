importScripts('serviceworker-cache-polyfill.js');

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('assets-v14').then(function(cache) {
      return cache.addAll([
        'style.css',
        'markdown-it.js'
      ]);
    })
  );
});


self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});


self.addEventListener('message', function(event) {
  self.clients.matchAll().then(function(client) {
    client[0].postMessage({
      command: 'logMessage',
      error: null,
      message: 'hi there message here!!'
    });
  });

  var result = event.data.mdContent;
  var swContext = self;


  // If we want to save the current version, add a new record
  // in our mdFileHistory database 
  if (event.data.command === 'saveToIndexedDB') {

    var dbReq = indexedDB.open('mdFileHistory');

    dbReq.onsuccess = function(event) {
      swContext.clients.matchAll().then(function(client) {
        client[0].postMessage({
          command: 'logMessage',
          error: null,
          message: 'db opened from service worker'
        });
      });
      var db = event.target.result;
      var transaction = db.transaction(['mdFiles'], 'readwrite');

      transaction.oncomplete = function() {
        console.log("Transaction completed!");
      }
      transaction.onerror = function() {
        console.log("Transaction error! ", transaction.error);
      }

      var objectStore = transaction.objectStore("mdFiles");
      var objectStoreReq = objectStore.add({ 
        fileName: 'YOWHATUP-' + Date.now(),
        authorName: 'brittany',
        htmlContent: result
      });

      objectStoreReq.onsuccess = function(event) {
        console.log("Object store item added!");
      }
    };

    dbReq.onerror = function(event) {
      swContext.clients.matchAll().then(function(client) {
        client[0].postMessage({
          command: 'logMessage',
          error: null,
          message: event
        });
      });
    };
  };
});