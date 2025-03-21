import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import FileUploader from './components/FileUploader';
import DataTable from './components/DataTable';
import FilterPanel from './components/FilterPanel';
import StatisticsPanel from './components/StatisticsPanel';
import DataAnalysisPanel from './components/DataAnalysisPanel'; // 导入新组件
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
  const [activeTab, setActiveTab] = useState('filter'); // 默认显示筛选标签页

  // 处理文件上传成功
  const handleFileUploadSuccess = (response) => {
    setFileUploaded(true);
    setColumns(response.columns);
    setTotalRows(response.totalRows);
    
    // 加载数据
    loadData();
  };

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await DataService.getData();
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setError('加载数据失败: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  // 处理筛选条件变化
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // 应用筛选
  const applyFilters = async () => {
    if (filters.length === 0) {
      setError('请至少添加一个筛选条件');
      // 添加自动清除错误的定时器
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
    if (!filteredData.length) {
      setError('没有数据可导出');
      return null;
    }
  
    try {
      setLoading(true);
      const result = await DataService.exportData(filteredData);
      setLoading(false);
      return result; // 返回导出结果
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
                      
                      {statistics && (
                        <div className="statistics-panel-scroll">
                          <StatisticsPanel 
                            statistics={statistics} 
                            filters={filters}
                            columns={columns}
                            onExport={exportData}
                          />
                        </div>
                      )}
                    </div>
                  </Col>
                    
                  <Col lg={8} md={7} className="main-content">
                    <DataTable 
                      data={filteredData.length > 0 ? filteredData : data}
                      columns={columns}
                      loading={loading}
                      filteredMode={filteredData.length > 0}
                    />
                  </Col>
                </Row>
              </Tab>
              <Tab eventKey="analysis" title="数据分析">
                <Row>
                  <Col xs={12}>
                    <DataAnalysisPanel />
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
    </div>
  );
}

export default App;