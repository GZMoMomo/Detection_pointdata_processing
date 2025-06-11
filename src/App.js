import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import FileUploader from './components/FileUploader';
import DataTable from './components/DataTable';
import FilterPanel from './components/FilterPanel';
import StatisticsPanel from './components/StatisticsPanel';
import DataAnalysisPanel from './components/DataAnalysisPanel';
import ChatBubble from './components/ChatBubble'; 
import DataService from './services/DataService';
import { motion } from 'framer-motion';

function App() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('filter');

  // 检查数据状态
  useEffect(() => {
    const checkData = async () => {
      try {
        const dataId = DataService.getCurrentDataId();
        console.log('当前data_id:', dataId);
        
        if (!dataId) {
          console.log('没有data_id，设置fileUploaded为false');
          setFileUploaded(false);
          return;
        }

        console.log('开始获取数据...');
        const response = await DataService.getData();
        console.log('获取数据响应:', response);
        
        if (response.error) {
          console.error('获取数据错误:', response.error);
          setFileUploaded(false);
        } else {
          console.log('数据获取成功，更新状态');
          setFileUploaded(true);
          setData(response.data);
          setColumns(response.columns);
          setTotalRows(response.totalRows);
        }
      } catch (err) {
        console.error('检查数据状态错误:', err);
        setFileUploaded(false);
      }
    };

    console.log('useEffect触发，fileUploaded:', fileUploaded);
    if (fileUploaded) {
      checkData();
    }
  }, [fileUploaded]);

  // 处理文件上传成功
  const handleFileUploadSuccess = async (response) => {
    try {
      setFileUploaded(true);
      setColumns(response.columns);
      setTotalRows(response.totalRows);
      
      // 加载数据
      await loadData();
    } catch (err) {
      setError('上传成功但加载数据失败: ' + (err.response?.data?.error || err.message));
      setFileUploaded(false);
    }
  };

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await DataService.getData();
      if (response.error) {
        throw new Error(response.error);
      }
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setError('加载数据失败: ' + (err.response?.data?.error || err.message));
      setLoading(false);
      setFileUploaded(false);
    }
  };

  // 处理筛选条件变化
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // 应用筛选
  const applyFilters = async () => {
    if (!fileUploaded) {
      setError('请先上传文件');
      return;
    }

    if (filters.length === 0) {
      setError('请至少添加一个筛选条件');
      setTimeout(() => setError(null), 5000);
      return;
    }
  
    try {
      setLoading(true);
      const response = await DataService.filterData(filters);
      setFilteredData(response.filteredData);
      setStatistics(response.statistics);
      setLoading(false);
    } catch (err) {
      setError('筛选数据失败: ' + (err.response?.data?.error || err.message));
      setTimeout(() => setError(null), 5000);
      setLoading(false);
    }
  };

  // 导出数据
  const exportData = async () => {
    if (!fileUploaded) {
      setError('请先上传文件');
      return null;
    }

    if (!filteredData.length) {
      setError('没有数据可导出');
      return null;
    }
  
    try {
      setLoading(true);
      const result = await DataService.exportData(filteredData, filters);
      setLoading(false);
      return result;
    } catch (err) {
      setError('导出数据失败: ' + (err.response?.data?.error || err.message));
      setLoading(false);
      return null;
    }
  };

  // 重置筛选
  const resetFilters = () => {
    setFilters([]);
    setFilteredData([]);
    setStatistics(null);
  };

  // 处理数据过期
  const handleDataExpired = () => {
    setFileUploaded(false);
    setData([]);
    setFilteredData([]);
    setStatistics(null);
    setError('数据已过期，请重新上传文件');
  };

  return (
    <div className="app-wrapper">
      <Container fluid className="app-container">
        <header className="app-header">
          <h1 className="app-title">数据筛选与分析工具</h1>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-container"
          >
            <Alert variant="danger" className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div className="flex-grow-1">{error}</div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
                aria-label="关闭"
              ></button>
            </Alert>
          </motion.div>
        )}
        
        {loading && (
          <div className="global-loading">
            <Spinner animation="border" variant="primary" />
            <span>处理中...</span>
          </div>
        )}
        
        {!fileUploaded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FileUploader onUploadSuccess={handleFileUploadSuccess} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3 main-tabs"
            >
              <Tab eventKey="filter" title="数据筛选">
                <Row>
                  <Col lg={4} md={5} className="filter-sidebar">
                    <div className="filter-container">
                      <div className="filter-panel-scroll">
                        <FilterPanel 
                          columns={columns} 
                          filters={filters} 
                          onFiltersChange={handleFiltersChange}
                          onApplyFilters={applyFilters}
                          onResetFilters={resetFilters}
                        />
                      </div>
                    </div>
                  </Col>
                  
                  <Col lg={6} md={5} className="main-content">
                    <DataTable 
                      data={filteredData.length > 0 ? filteredData : data}
                      columns={columns}
                      loading={loading}
                      filteredMode={filteredData.length > 0}
                    />
                  </Col>
                  
                  {statistics && (
                    <Col lg={2} md={2} className="statistics-sidebar">
                      <div className="statistics-panel-vertical">
                        <StatisticsPanel 
                          statistics={statistics} 
                          filters={filters}
                          columns={columns}
                          onExport={exportData}
                        />
                      </div>
                    </Col>
                  )}
                </Row>
              </Tab>
              <Tab eventKey="analysis" title="数据分析">
                <Row>
                  <Col xs={12}>
                    <DataAnalysisPanel onDataExpired={handleDataExpired} />
                  </Col>
                </Row>
              </Tab>
            </Tabs>
          </motion.div>
        )}
        
        <footer className="app-footer">
          <p>© {new Date().getFullYear()} 数据筛选与分析工具 | 版本 1.0.0</p>
        </footer>
      </Container>
      
      <ChatBubble />
    </div>
  );
}

export default App;