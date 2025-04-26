document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const noImagesMessage = document.getElementById('noImagesMessage');

    let uploadedFiles = [];

    function updateNoImagesMessage() {
        noImagesMessage.style.display = uploadedFiles.length ? 'none' : 'block';
        imagePreview.style.display = uploadedFiles.length ? 'grid' : 'none';
    }

    function renderPreviews() {
        imagePreview.innerHTML = '';
        uploadedFiles.forEach((fileObj, idx) => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'preview-image';

            const img = document.createElement('img');
            img.src = fileObj.url;
            img.alt = `Image ${idx + 1}`;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '×';
            removeBtn.type = 'button';
            removeBtn.onclick = (e) => {
                e.preventDefault();
                uploadedFiles.splice(idx, 1);
                renderPreviews();
                updateNoImagesMessage();
            };

            previewWrapper.appendChild(img);
            previewWrapper.appendChild(removeBtn);
            imagePreview.appendChild(previewWrapper);
        });
    }

    async function handleFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;

            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedFiles.push({
                    file: file,
                    url: e.target.result
                });
                renderPreviews();
                updateNoImagesMessage();
            };
            reader.readAsDataURL(file);
        }

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

    // Initialize UI
    updateNoImagesMessage();
    
    document.querySelector('.feedback-form').addEventListener('submit', function(e) {
        const oldInputs = document.querySelectorAll('.cloned-file-input');
        oldInputs.forEach(input => input.remove());
        
        // For each file in uploadedFiles, create a new file input and append to form
        uploadedFiles.forEach((fileObj, index) => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.name = 'images';
            fileInput.classList.add('cloned-file-input');
            fileInput.style.display = 'none';
            
            // Create a DataTransfer object and add the file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(fileObj.file);
            fileInput.files = dataTransfer.files;
            
            // Append to form
            this.appendChild(fileInput);
        });
        
        // Let the form submit normally
    });
});