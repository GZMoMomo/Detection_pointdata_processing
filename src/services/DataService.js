import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.102.240:4000/api';

// 配置axios实例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// 存储当前活动的data_id
let currentDataId = null;

const DataService = {
  // 上传文件
  uploadFile: async (formData, onUploadProgress) => {
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    // 保存返回的data_id
    currentDataId = response.data.data_id;
    return response.data;
  },

  // 获取分页数据
  getData: async () => {
    if (!currentDataId) {
      throw new Error('没有活动的数据ID');
    }
    console.log('获取数据时使用的data_id:', currentDataId);
    const response = await apiClient.get('/data', {
      params: {
        data_id: currentDataId
      }
    });
    return response.data;
  },

  // 筛选数据
  filterData: async (filters) => {
    if (!currentDataId) {
      throw new Error('没有活动的数据ID');
    }
    console.log('筛选数据时使用的data_id:', currentDataId);
    const response = await apiClient.post('/filter', { 
      filters,
      data_id: currentDataId 
    });
    return response.data;
  },

  // 导出数据
  exportData: async (filteredData, filters) => {
    const response = await apiClient.post('/export', { 
        filteredData,
        filters
    });
    return response.data;
  },
  
  // 下载导出的文件
  downloadExportedFile: () => {
    const downloadLink = document.createElement('a');
    downloadLink.href = `${API_URL}/download`;
    downloadLink.download = 'filtered_data.xlsx';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  },

  analyzeData: async () => {
    try {
      if (!currentDataId) {
        throw new Error('没有活动的数据ID');
      }
      console.log('分析数据时使用的data_id:', currentDataId);
      const response = await apiClient.get('/analyze', {
        params: {
          data_id: currentDataId
        }
      });
      return response.data;
    } catch (error) {
      console.error('分析数据错误:', error);
      throw error;
    }
  },
  
  // 分析特定值
  analyzeSpecificValue: async (value) => {
    try {
      const response = await apiClient.get(`/analyze/value/${value}`, {
        params: {
          data_id: currentDataId
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 获取当前data_id
  getCurrentDataId: () => currentDataId,

  // 清除当前data_id
  clearCurrentDataId: () => {
    currentDataId = null;
  }
};

export default DataService;