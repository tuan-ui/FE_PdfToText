<template>
  <div>
    <h3>Import Files</h3>
    <input type="file" multiple @change="handleFileUpload" accept=".pdf,.png,.jpg,.jpeg" />
    <button @click="importFiles">Import</button>
    
    <ul>
      <li v-for="(file, index) in files" :key="index">
        {{ file.name }} ({{ file.type }})
      </li>
    </ul>

    <h3>Search Files</h3>
    <input type="text" v-model="searchQuery" placeholder="Tìm kiếm..." />
    <button @click="searchFiles">Search</button>
    
    <h3>File List</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>File Name</th>
          <th>Path</th>
          <th>Create Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in fileList" :key="file.id">
          <td>{{ file.id }}</td>
          <td>{{ file.fileName }}</td>
          <td>{{ file.path }}</td>
          <td>{{ formatDate(file.createDate) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      files: [],
      searchQuery: '',
      fileList: [],
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10
    };
  },
  created() {
    this.fetchFiles();
  },
  methods: {
    handleFileUpload(event) {
      this.files = Array.from(event.target.files);
    },
    async importFiles() {
      const formData = new FormData();
      this.files.forEach(file => {
        formData.append('files', file);
      });

      try {
        const response = await fetch('http://localhost:8080/api/ocr/ImportFile', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        console.log('Import Success:', result);
        this.fetchFiles();
      } catch (error) {
        console.error('Import Error:', error);
      }
    },
    async searchFiles() {
      try {
        const response = await fetch(`http://localhost:8080/api/ocr/Search?search=${encodeURIComponent(this.searchQuery)}&page=${this.currentPage - 1}&size=${this.itemsPerPage}`);
        const result = await response.json();
        this.updateFileList(result);
      } catch (error) {
        console.error('Search Error:', error);
      }
    },
    async fetchFiles() {
      try {
        const response = await fetch(`http://localhost:8080/api/ocr/GetAllFiles?page=${this.currentPage - 1}&size=${this.itemsPerPage}`);
        const result = await response.json();
        this.updateFileList(result);
      } catch (error) {
        console.error('Fetch Files Error:', error);
      }
    },
    updateFileList(result) {
      if (result.success) {
        this.fileList = result.listDocxText || [];
        this.totalPages = result.pageInfo.totalPages || 1;
      } else {
        console.error('Failed to fetch files:', result);
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.fetchFiles();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.fetchFiles();
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  }
};
</script>

<style scoped>
.pagination {
  margin-top: 20px;
}

.pagination button {
  margin: 0 5px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>
