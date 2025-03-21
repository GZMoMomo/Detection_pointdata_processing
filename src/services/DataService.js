import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// 配置axios实例，支持跨域请求和凭证
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

const DataService = {
  // 上传文件
  uploadFile: async (formData, onUploadProgress) => {
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // 获取分页数据
  getData: async () => {
    const response = await apiClient.get('/data');
    return response.data;
  },

  // 筛选数据
  filterData: async (filters) => {
    const response = await apiClient.post('/filter', { filters });
    return response.data;
  },

  // 导出数据
  exportData: async (filteredData) => {
    const response = await apiClient.post('/export', { filteredData });
    return response.data;
  },
  
  // 下载导出的文件
  downloadExportedFile: () => {
    // 创建一个隐藏的a标签，触发文件下载
    const downloadLink = document.createElement('a');
    downloadLink.href = `${API_URL}/download`;
    downloadLink.download = 'filtered_data.xlsx';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  },

  analyzeData: async () => {
    try {
      const response = await axios.get(`${API_URL}/analyze`, { withCredentials: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // 分析特定值
  analyzeSpecificValue: async (value) => {
    try {
      const response = await axios.get(`${API_URL}/analyze/value/${value}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

};



export default DataService;