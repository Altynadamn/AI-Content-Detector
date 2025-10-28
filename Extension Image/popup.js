const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const previewImg = document.getElementById('previewImg');
const analyzeBtn = document.getElementById('analyzeBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultConfidence = document.getElementById('resultConfidence');
const resetBtn = document.getElementById('resetBtn');

let currentImageData = null;

// Click to upload
dropZone.addEventListener('click', () => {
  imageInput.click();
});

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    handleImageSelect(files[0]);
  }
});

// File input change
imageInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImageSelect(e.target.files[0]);
  }
});

// Handle image selection
function handleImageSelect(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    currentImageData = e.target.result;
    previewImg.src = currentImageData;
    dropZone.style.display = 'none';
    preview.style.display = 'block';
    result.style.display = 'none';
  };
  
  reader.readAsDataURL(file);
}

// Analyze button
analyzeBtn.addEventListener('click', async () => {
  if (!currentImageData) return;
  
  preview.style.display = 'none';
  loading.style.display = 'block';
  result.style.display = 'none';
  
  try {
    // Upload to a temporary location or use your existing backend
    // For now, we'll convert to blob and create object URL
    const base64Data = currentImageData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Open analysis window
    const analysisWindow = await chrome.windows.create({
      url: `http://localhost:3000?imageUrl=${encodeURIComponent(blobUrl)}`,
      type: 'popup',
      width: 800,
      height: 600
    });
    
    // Listen for result
    const messageListener = (event) => {
      if (event.data.type === 'AI_ANALYSIS_RESULT') {
        const { isAI, confidence } = event.data.data;
        
        loading.style.display = 'none';
        result.style.display = 'block';
        result.className = isAI ? 'ai' : 'real';
        resultIcon.textContent = isAI ? '🤖' : '📷';
        resultTitle.textContent = isAI ? 'AI Generated' : 'Real Image';
        resultConfidence.textContent = `Confidence: ${(confidence * 100).toFixed(1)}%`;
        
        window.removeEventListener('message', messageListener);
      } else if (event.data.type === 'AI_ANALYSIS_ERROR') {
        loading.style.display = 'none';
        result.style.display = 'block';
        result.className = 'error';
        resultIcon.textContent = '⚠️';
        resultTitle.textContent = 'Error';
        resultConfidence.textContent = event.data.data.error;
        
        window.removeEventListener('message', messageListener);
      }
    };
    
    window.addEventListener('message', messageListener);
    
  } catch (error) {
    loading.style.display = 'none';
    result.style.display = 'block';
    result.className = 'error';
    resultIcon.textContent = '⚠️';
    resultTitle.textContent = 'Error';
    resultConfidence.textContent = error.message || 'Make sure your app is running on localhost:3000';
  }
});

// Reset button
resetBtn.addEventListener('click', () => {
  dropZone.style.display = 'block';
  preview.style.display = 'none';
  result.style.display = 'none';
  loading.style.display = 'none';
  imageInput.value = '';
  currentImageData = null;
});

// Listen for messages from background (for context menu results)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showResultInPopup") {
    loading.style.display = 'none';
    result.style.display = 'block';
    dropZone.style.display = 'none';
    preview.style.display = 'none';
    
    if (request.status === "success") {
      const isAI = request.result.isAI || request.result.is_ai || false;
      const confidence = request.result.confidence || request.result.score || 0;
      
      result.className = isAI ? 'ai' : 'real';
      resultIcon.textContent = isAI ? '🤖' : '📷';
      resultTitle.textContent = isAI ? 'AI Generated' : 'Real Image';
      resultConfidence.textContent = `Confidence: ${(confidence * 100).toFixed(1)}%`;
    } else {
      result.className = 'error';
      resultIcon.textContent = '⚠️';
      resultTitle.textContent = 'Error';
      resultConfidence.textContent = request.error || 'Failed to analyze image';
    }
  }
});