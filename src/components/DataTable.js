import React, { useState } from 'react';
import { Table, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';

function DataTable({ 
  data, 
  columns, 
  loading, 
  filteredMode
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // 处理排序
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 应用排序
  const getProcessedData = () => {
    // 直接使用原始数据副本
    let processedData = [...data];
  
    if (sortConfig.key !== null) {
      processedData = [...processedData].sort((a, b) => {
        // 根据模式获取要比较的值
        const valA = filteredMode ? a.rowData[sortConfig.key] : a[sortConfig.key];
        const valB = filteredMode ? b.rowData[sortConfig.key] : b[sortConfig.key];
  
        // 数值比较逻辑
        const numA = typeof valA === 'number' ? valA : Number(valA);
        const numB = typeof valB === 'number' ? valB : Number(valB);
  
        if (isNaN(numA) || isNaN(numB)) {
          const strCompare = String(valA).localeCompare(String(valB));
          return sortConfig.direction === 'ascending' ? strCompare : -strCompare;
        }
  
        return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
      });
    }
  
    return processedData;
  };

  // 渲染表格行
  const renderTableRows = () => {
    const processedData = getProcessedData();
    
    return processedData.map((item, rowIndex) => {
      // 统一处理两种模式的数据结构
      const rowData = filteredMode ? item.rowData : item;
      
      return (
        <motion.tr 
          key={rowIndex}
          className={filteredMode ? "filtered-row" : ""}
          initial={filteredMode ? { opacity: 0, backgroundColor: "#fff9c4" } : {}}
          animate={filteredMode ? { opacity: 1, backgroundColor: "transparent" } : {}}
          transition={filteredMode ? { duration: 0.5, delay: rowIndex * 0.03 } : {}}
        >
          {/* 匹配条件列 - 现在放在第一列 */}
          <td className="match-badges">
            {filteredMode && item.matchedFilters.map(filterIndex => (
              <span 
                key={filterIndex}
                className="badge bg-info me-1 filter-badge"
                title={`匹配条件 ${filterIndex + 1}`}
              >
                条件 {filterIndex + 1}
              </span>
            ))}
          </td>
          {/* 数据列 */}
          {rowData.map((value, colIndex) => (
            <td 
              key={colIndex}
              className={colIndex === 15 ? 'extra-column' : ''}
            >
              {typeof value === 'number' ? value.toFixed(2) : value}
            </td>
          ))}
        </motion.tr>
      );
    });
  };

  const getSortIcon = (columnIndex) => {
    if (sortConfig.key !== columnIndex) {
      return <i className="bi bi-arrow-down-up text-muted ms-1"></i>;
    }
    
    return sortConfig.direction === 'ascending' 
      ? <i className="bi bi-sort-down ms-1"></i> 
      : <i className="bi bi-sort-up ms-1"></i>;
  };

  return (
    <Card className="data-table-card">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <h4 className="mb-0">
            <i className={`bi ${filteredMode ? 'bi-funnel-fill' : 'bi-table'} me-2`}></i>
            {filteredMode ? '筛选结果' : '数据预览'}
            {filteredMode && (
              <span className="badge bg-success ms-2 rounded-pill">
                {data.length} 条记录
              </span>
            )}
          </h4>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table 
            striped 
            hover 
            className="data-table mb-0"
          >
            <thead>
              <tr>
                {/* 匹配条件列标题 - 现在放在第一列 */}
                <th>匹配条件</th>
                {/* 其他列标题 */}
                {columns.map((column, index) => (
                  <th 
                    key={index} 
                    className={`${index === 15 ? 'extra-column' : ''} sortable-header`}
                    onClick={() => requestSort(index)}
                  >
                    <div className="d-flex align-items-center">
                      <span>{column}</span>
                      {getSortIcon(index)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-5">
                    <i className="bi bi-inbox-fill display-4 d-block mb-3 text-muted"></i>
                    <h5>没有数据可显示</h5>
                    <p className="text-muted">请上传文件或调整筛选条件</p>
                  </td>
                </tr>
              ) : renderTableRows()}
            </tbody>
          </Table>
        </div>
      </Card.Body>
      
      <Card.Footer className="d-flex justify-content-between align-items-center">
        <div>
          {!filteredMode && (
            <small className="text-muted">
              共 {data.length} 条数据
            </small>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
}

export default DataTable;