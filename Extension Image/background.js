// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkAIImage",
    title: "Check if AI-generated",
    contexts: ["image"]
  });
  console.log('Extension installed, context menu created');
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "checkAIImage") {
    console.log('Context menu clicked, image URL:', info.srcUrl);
    
    try {
      // Fetch the image through the extension (bypasses CORS)
      const response = await fetch(info.srcUrl);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        // Generate a unique ID for this image
        const imageId = 'img_' + Date.now();
        
        // Store the image data in chrome.storage (no size limit in URL!)
        await chrome.storage.local.set({ [imageId]: base64data });
        console.log('Image stored with ID:', imageId);
        
        // Open the app with just the ID
        const appUrl = `http://localhost:3000/?imageId=${imageId}`;
        
        chrome.windows.create({
          url: appUrl,
          type: 'popup',
          width: 900,
          height: 700
        });
      };
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Failed to fetch image:', error);
      alert('Failed to load image. The website might be blocking access.');
    }
  }
});