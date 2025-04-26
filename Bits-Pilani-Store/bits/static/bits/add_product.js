document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('image-input');
  const uploadArea = document.getElementById('uploadArea');
  const imagePreview = document.getElementById('imagePreview');
  const noImagesMessage = document.getElementById('noImagesMessage');
  const imageOrderInput = document.getElementById('imageOrder');
  const existingImagesInput = document.getElementById('existingImages');
  const form = document.querySelector('.add-product-form');
  const submitButton = form.querySelector('button[type="submit"]');
  
  let uploadedFiles = [];
  let isSubmitting = false;
  
  const MAX_IMAGES = 5;
  const isEditMode = !!existingImagesInput;
  
  // Load existing images if we're in edit mode
  if (isEditMode && existingImagesInput.value) {
    try {
      const existingImages = JSON.parse(existingImagesInput.value);
      
      // Add existing images to uploadedFiles array
      existingImages.forEach(img => {
        uploadedFiles.push({
          url: img.url,
          id: img.id,
          isExisting: true
        });
      });
      
      renderPreviews();
      updateNoImagesMessage();
    } catch (e) {
      console.error('Error parsing existing images:', e);
    }
  }
  
  function updateNoImagesMessage() {
    noImagesMessage.style.display = uploadedFiles.length ? 'none' : 'block';
    imagePreview.style.display = uploadedFiles.length ? 'grid' : 'none';
  }
  
  function updateImageOrder() {
    // For add mode: simple array of indices
    if (!isEditMode) {
      imageOrderInput.value = JSON.stringify(uploadedFiles.map((_, idx) => idx));
    } 
    // For edit mode: separate arrays for new and existing images
    else {
      const newImages = uploadedFiles.filter(file => !file.isExisting);
      const existingImages = uploadedFiles.filter(file => file.isExisting);
      
      // Create a combined order array that represents the final order of all images
      const combinedOrder = [];
      
      // Loop through all images in their current order
      uploadedFiles.forEach(file => {
        if (file.isExisting) {
          combinedOrder.push(['existing', file.id]);
        } else {
          // For new images, find their index in the newImages array
          const newIndex = newImages.findIndex(f => f === file);
          if (newIndex !== -1) {
            combinedOrder.push(['new', newIndex]);
          }
        }
      });
      
      const orderData = {
        new: newImages.map((_, i) => i),
        existing: existingImages.map(file => file.id),
        combined_order: combinedOrder
      };
      
      imageOrderInput.value = JSON.stringify(orderData);
    }
    
    // Update order numbers in UI
    Array.from(imagePreview.children).forEach((child, idx) => {
      child.querySelector('.order-number').textContent = idx + 1;
      child.dataset.index = idx;
    });
  }
  
  // Convert any image to JPG format
  async function convertToJpg(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image on canvas with white background (for transparent images)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPG blob
          canvas.toBlob(
            (blob) => {
              // Create a new file with jpg extension
              const newFileName = file.name.split('.')[0] + '.jpg';
              const jpgFile = new File([blob], newFileName, { type: 'image/jpeg' });
              resolve(jpgFile);
            },
            'image/jpeg',
            0.9
          );
        };
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  async function resizeAndCompressImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height *= maxWidth / width;
              width = maxWidth;
            } else {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Fill with white background for transparent images
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg', // Always convert to JPEG
            quality || 0.8
          );
        };
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  function renderPreviews() {
    imagePreview.innerHTML = '';
    uploadedFiles.forEach((fileObj, idx) => {
      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'preview-image';
      previewWrapper.draggable = true;
      previewWrapper.dataset.index = idx;
      
      if (fileObj.isExisting) {
        previewWrapper.classList.add('existing-image');
        previewWrapper.dataset.imageId = fileObj.id;
      }
      
      const img = document.createElement('img');
      img.src = fileObj.url;
      img.alt = `Image ${idx + 1}`;
      
      const orderNumber = document.createElement('div');
      orderNumber.className = 'order-number';
      orderNumber.textContent = idx + 1;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.type = 'button'; // Prevent form submission
      removeBtn.onclick = (e) => {
        e.preventDefault();
        uploadedFiles.splice(idx, 1);
        renderPreviews();
        updateNoImagesMessage();
        updateImageOrder();
      };
      
      previewWrapper.appendChild(img);
      previewWrapper.appendChild(orderNumber);
      previewWrapper.appendChild(removeBtn);
      imagePreview.appendChild(previewWrapper);
    });
    updateImageOrder();
  }
  
  async function handleFiles(files) {
const remainingSlots = MAX_IMAGES - uploadedFiles.length;
if (files.length > remainingSlots) {
  alert(`You can only upload ${MAX_IMAGES} images total. You can add ${remainingSlots} more image(s).`);
  return;
}

// Show conversion message
const originalButtonText = submitButton.textContent;
submitButton.textContent = "Converting images...";

for (const file of files) {
  try {
    let processedFile = file;
    
    // Check if file is HEIC/HEIF format
    if (file.name.toLowerCase().endsWith('.heic') || 
        file.name.toLowerCase().endsWith('.heif') ||
        file.type === 'image/heic' || 
        file.type === 'image/heif') {
      
      // Convert HEIC to JPEG using heic2any
      const jpegBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8
      });
      
      // Create a new file with jpg extension
      processedFile = new File(
        [jpegBlob], 
        file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
        { type: 'image/jpeg' }
      );
    }
    
    // Continue with your existing conversion for other formats
    if (!processedFile.type.startsWith('image/')) continue;
    
    const resizedBlob = processedFile.size > 2 * 1024 * 1024 
      ? await resizeAndCompressImage(processedFile, 1024, 1024, 0.8) 
      : await resizeAndCompressImage(processedFile, 2048, 2048, 0.9);
    
    const fileName = processedFile.name.split('.')[0] + '.jpg';
    const finalFile = new File([resizedBlob], fileName, { type: 'image/jpeg' });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedFiles.push({
        file: finalFile,
        url: e.target.result,
        isExisting: false
      });
      renderPreviews();
      updateNoImagesMessage();
      updateImageOrder();
    };
    reader.readAsDataURL(finalFile);
  } catch (error) {
    console.error('Error processing image:', error);
    alert("There was an error processing one of your images. Please try a different format.");
  }
}

// Reset button text
submitButton.textContent = originalButtonText;
imageInput.value = null;
}

  
  // File input change handler
  imageInput.addEventListener('change', (e) => handleFiles(e.target.files));
  
  // Drag and drop handlers
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  
  uploadArea.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
  });
  
  // Make images sortable
  new Sortable(imagePreview, {
    animation: 150,
    onEnd: (evt) => {
      const movedItem = uploadedFiles.splice(evt.oldIndex, 1)[0];
      uploadedFiles.splice(evt.newIndex, 0, movedItem);
      updateImageOrder();
    },
  });
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    isSubmitting = true;
    
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    
    if (!uploadedFiles.length) {
      alert("Please upload at least one image.");
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      isSubmitting = false;
      return;
    }
    
    const formData = new FormData(form);
    
    uploadedFiles
      .filter(fileObj => !fileObj.isExisting)
      .forEach((fileObj) => {
        formData.append("images", fileObj.file);
      });
    
    try {
      console.log("Submitting form data...");
      console.log("Image order:", imageOrderInput.value);
      
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        console.log("Form submitted successfully!");
        // Redirect to appropriate page
        window.location.href = isEditMode ? "/my-listings" : "/";
      } else if (response.status === 400) {
        const errorHtml = await response.text();
        document.body.innerHTML = errorHtml;
        console.error("Validation errors occurred.");
      } else {
        alert("An unexpected error occurred.");
        console.error("Server response:", await response.text());
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("An error occurred. Please try again.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      isSubmitting = false;
    }
  });
  
  updateNoImagesMessage();
});