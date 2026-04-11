// share-target.js
// This script is imported by the Workbox service worker to handle Web Share Target POST requests.

const scope = new URL(self.registration.scope).pathname

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (event.request.method === 'POST' && url.pathname === scope) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData()
        const file = formData.get('file')

        if (file) {
          // Store the file in IndexedDB
          await saveSharedFileToIndexedDB(file)
        }

        // Redirect to the app with a query parameter
        return Response.redirect(scope + '?shared=true', 303)
      } catch (error) {
        console.error('Error handling share target POST', error)
        return Response.redirect(scope, 303)
      }
    })())
  }
})

function saveSharedFileToIndexedDB(file) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('abr-image-tools-share', 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('shared-files')) {
        db.createObjectStore('shared-files')
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['shared-files'], 'readwrite')
      const store = transaction.objectStore('shared-files')

      const putRequest = store.put(file, 'latest-shared-file')

      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)

      transaction.oncomplete = () => db.close()
    }

    request.onerror = () => reject(request.error)
  })
}
