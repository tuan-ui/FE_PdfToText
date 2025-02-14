<template>
    <div>
      <input type="file" multiple @change="handleFileUpload" accept=".pdf,.png,.jpg,.jpeg" />
      <input type="text" v-model="searchQuery" placeholder="Tìm kiếm..." />
      <button @click="submitFiles">Send</button>
  
      <ul>
        <li v-for="(file, index) in files" :key="index">
          {{ file.name }} ({{ file.type }})
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        files: [],
        searchQuery: ''
      };
    },
    methods: {
      handleFileUpload(event) {
        this.files = Array.from(event.target.files);
      },
      async submitFiles() {
        const formData = new FormData();
        this.files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('search', this.searchQuery);

        try {
            const response = await fetch('http://localhost:8080/api/ocr/PdfToText', {
            method: 'POST',
            body: formData
            });

            // Kiểm tra nếu server trả về JSON hợp lệ
            const textResponse = await response.text();  // Lấy phản hồi dưới dạng text
            let result = {};

            try {
            result = JSON.parse(textResponse);  // Thử phân tích JSON từ phản hồi
            } catch (error) {
            console.error("Response is not a valid JSON:", textResponse);
            throw new Error("Invalid JSON response");
            }

            console.log('Success:', result);
        } catch (error) {
            console.error('Error:', error);
        }
      }
    }
  };
  </script>
  
  <style scoped>

  </style>