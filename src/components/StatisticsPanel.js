import React, { useState } from 'react';
import { Card, Button, ListGroup, Badge, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FaChartBar, FaDownload, FaInfoCircle } from 'react-icons/fa';
import DataService from '../services/DataService';

function StatisticsPanel({ statistics, filters, columns, onExport, filteredData }) {
    
  const [exporting, setExporting] = useState(false);
  
    // 准备图表数据
  const prepareChartData = () => {
    if (!statistics || !filters || !statistics.filterMatches) return [];
    
    return filters.map((filter, index) => {
      // 确保 filterMatches 数组存在且有足够的元素
      const matches = statistics.filterMatches && statistics.filterMatches[index] !== undefined
        ? statistics.filterMatches[index]
        : 0;
      
      const columnName = columns[filter.column] || `列 ${filter.column}`;
      let filterDesc = '';
      
      switch (filter.type) {
        case 'greaterThan':
          filterDesc = `${columnName} > ${filter.value}`;
          break;
        case 'lessThan':
          filterDesc = `${columnName} < ${filter.value}`;
          break;
        case 'equals':
          filterDesc = `${columnName} = ${filter.value}`;
          break;
        case 'range':
          filterDesc = `${columnName} [${filter.min}-${filter.max}]`;
          break;
        default:
          filterDesc = columnName;
      }
      
      return {
        name: `条件${index + 1}`,
        description: filterDesc,
        matches: matches
      };
    });
  };

  const chartData = prepareChartData();
  
  // 图表颜色
  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
  
  // 计算匹配率
  const calculateMatchRate = (matches) => {
    if (!statistics || statistics.totalMatched === 0) return 0;
    return ((matches / statistics.totalMatched) * 100).toFixed(1);
  };

  // 处理导出操作
  const handleExport = async () => {
    try {
      setExporting(true);
      // 调用父组件的导出函数，这会触发API请求
      const result = await onExport();
      
      // 如果导出成功，调用下载函数
      if (result && result.downloadUrl) {
        DataService.downloadExportedFile();
      }
      setExporting(false);
    } catch (error) {
      console.error('导出失败:', error);
      setExporting(false);
    }
  };

  return (
    <Card className="statistics-panel mb-3 shadow-sm">
      <Card.Header className="bg-gradient d-flex align-items-center">
        <FaChartBar className="me-2" />
        <h5 className="mb-0">筛选结果统计</h5>
      </Card.Header>
      <Card.Body>
        <div className="text-center mb-4">
          <div className="stats-summary p-3 bg-light rounded">
            <h2 className="display-4 fw-bold text-primary mb-0">
              {statistics?.totalMatched || 0}
            </h2>
            <p className="text-muted mb-0">匹配记录总数</p>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <>
            <h6 className="d-flex align-items-center mb-3">
              <FaInfoCircle className="me-2 text-primary" />
              <span>各筛选条件匹配情况</span>
            </h6>
            
            <div className="chart-container mb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart 
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#E0E0E0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#E0E0E0' }}
                    tickLine={{ stroke: '#E0E0E0' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [`${value} 条记录`, props.payload.description]}
                    labelFormatter={() => '匹配数量'}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E0E0E0',
                      borderRadius: '4px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="matches" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="filter-details mb-4">
              <ListGroup variant="flush" className="shadow-sm rounded">
                {chartData.map((item, index) => (
                  <ListGroup.Item 
                    key={index} 
                    className="d-flex justify-content-between align-items-center"
                    style={{ 
                      borderLeft: `4px solid ${CHART_COLORS[index % CHART_COLORS.length]}`,
                      padding: '0.75rem 1rem'
                    }}
                  >
                    <div>
                      <Badge 
                        bg="light" 
                        text="dark" 
                        className="me-2 shadow-sm"
                      >
                        {item.name}
                      </Badge>
                      <span className="filter-desc">{item.description}</span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{item.matches}</div>
                      <small className="text-muted">
                        {calculateMatchRate(item.matches)}% 匹配率
                      </small>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </>
        ) : (
          <div className="text-center text-muted p-4 bg-light rounded mb-4">
            <p className="mb-0">尚无筛选结果数据</p>
            <p className="small mb-0">应用筛选条件后将显示统计信息</p>
          </div>
        )}
        
        <Button 
        variant="success" 
        className="w-100 d-flex align-items-center justify-content-center shadow-sm"
        onClick={handleExport}
        disabled={!statistics || statistics.totalMatched === 0 || exporting}
      >
        {exporting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span>导出中...</span>
          </>
        ) : (
          <>
            <FaDownload className="me-2" />
            <span>导出筛选结果</span>
          </>
        )}
      </Button>
      </Card.Body>
    </Card>
  );
}

export default StatisticsPanel;