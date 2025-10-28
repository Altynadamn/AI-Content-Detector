// This script runs on localhost:3000 to retrieve image data from chrome.storage
console.log('Extension content script loaded on localhost:3000');

// Listen for requests from the React app
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.origin !== 'http://localhost:3000') return;
  
  if (event.data.type === 'GET_IMAGE_DATA') {
    const imageId = event.data.imageId;
    console.log('Retrieving image data for ID:', imageId);
    
    try {
      // Get the image data from chrome.storage
      const result = await chrome.storage.local.get(imageId);
      const imageData = result[imageId];
      
      if (imageData) {
        console.log('Image data found, sending to React app');
        
        // Send the image data back to the React app
        window.postMessage({
          type: 'IMAGE_DATA_RESPONSE',
          imageId: imageId,
          imageData: imageData
        }, 'http://localhost:3000');
        
        // Clean up - remove from storage after use
        await chrome.storage.local.remove(imageId);
      } else {
        console.error('Image data not found for ID:', imageId);
        window.postMessage({
          type: 'IMAGE_DATA_ERROR',
          imageId: imageId,
          error: 'Image data not found'
        }, 'http://localhost:3000');
      }
    } catch (error) {
      console.error('Error retrieving image data:', error);
      window.postMessage({
        type: 'IMAGE_DATA_ERROR',
        imageId: imageId,
        error: error.message
      }, 'http://localhost:3000');
    }
  }
});