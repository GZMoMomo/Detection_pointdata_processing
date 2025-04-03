import React, { useState } from 'react';
import { Card, Form, Button, InputGroup, Badge, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaFilter, FaTimes, FaSearch, FaUndo, FaCheck } from 'react-icons/fa';

function FilterPanel({ columns, filters, onFiltersChange, onApplyFilters, onResetFilters }) {
  // 为每个字段创建一个初始状态对象
  const initialFieldStates = columns.map((_, index) => ({
    filterType: 'greaterThan',
    filterValue: '',
    minValue: '',
    maxValue: '',
    active: false
  }));
  
  const [fieldStates, setFieldStates] = useState(initialFieldStates);

  // 更新字段状态
  const updateFieldState = (columnIndex, property, value) => {
    const newFieldStates = [...fieldStates];
    newFieldStates[columnIndex] = {
      ...newFieldStates[columnIndex],
      [property]: value
    };
    setFieldStates(newFieldStates);
  };

  // 切换筛选类型
  const toggleFilterType = (columnIndex) => {
    const currentType = fieldStates[columnIndex].filterType;
    let nextType;
    
    switch (currentType) {
      case 'greaterThan': nextType = 'lessThan'; break;
      case 'lessThan': nextType = 'equals'; break;
      case 'equals': nextType = 'range'; break;
      case 'range': nextType = 'greaterThan'; break;
      default: nextType = 'greaterThan';
    }
    
    updateFieldState(columnIndex, 'filterType', nextType);
  };

  // 添加筛选条件
  const addFilter = (columnIndex) => {
    const fieldState = fieldStates[columnIndex];
    
    // 验证输入
    if (fieldState.filterType === 'range') {
      if (fieldState.minValue === '' || fieldState.maxValue === '') {
        alert('请输入区间的最小值和最大值');
        return;
      }
      if (parseFloat(fieldState.minValue) >= parseFloat(fieldState.maxValue)) {
        alert('最小值必须小于最大值');
        return;
      }
    } else if (fieldState.filterValue === '') {
      alert('请输入筛选值');
      return;
    }

    // 创建新的筛选条件
    const newFilter = {
      column: columnIndex,
      type: fieldState.filterType,
    };

    if (fieldState.filterType === 'range') {
      newFilter.min = parseFloat(fieldState.minValue);
      newFilter.max = parseFloat(fieldState.maxValue);
    } else {
      newFilter.value = parseFloat(fieldState.filterValue);
    }

    // 检查是否已存在相同列的筛选条件
    const existingFilterIndex = filters.findIndex(f => f.column === columnIndex);
    let updatedFilters;
    
    if (existingFilterIndex !== -1) {
      // 替换现有的筛选条件
      updatedFilters = [...filters];
      updatedFilters[existingFilterIndex] = newFilter;
    } else {
      // 添加新的筛选条件
      updatedFilters = [...filters, newFilter];
    }
    
    onFiltersChange(updatedFilters);
    
    // 标记该字段为活跃状态
    updateFieldState(columnIndex, 'active', true);
  };

  // 移除筛选条件
  const removeFilter = (columnIndex) => {
    const updatedFilters = filters.filter(f => f.column !== columnIndex);
    onFiltersChange(updatedFilters);
    
    // 重置该字段的状态
    updateFieldState(columnIndex, 'active', false);
  };

  // 获取筛选类型的图标/文本
  const getFilterTypeLabel = (type) => {
    switch (type) {
      case 'greaterThan': return '大于';
      case 'lessThan': return '小于';
      case 'equals': return '等于';
      case 'range': return '区间';
      default: return '';
    }
  };

  // 检查某列是否已有筛选条件
  const hasFilterForColumn = (columnIndex) => {
    return filters.some(f => f.column === columnIndex);
  };

  // 获取某列的筛选条件
  const getFilterForColumn = (columnIndex) => {
    return filters.find(f => f.column === columnIndex);
  };

  // 获取筛选条件的描述文本
  const getFilterDescription = (filter) => {
    const columnName = columns[filter.column];
    
    switch (filter.type) {
      case 'greaterThan':
        return `${columnName} > ${filter.value}`;
      case 'lessThan':
        return `${columnName} < ${filter.value}`;
      case 'equals':
        return `${columnName} = ${filter.value}`;
      case 'range':
        return `${columnName} 在 [${filter.min}, ${filter.max}] 区间内`;
      default:
        return '';
    }
  };

  // 验证数值输入
  const validateNumericInput = (value) => {
    return value === '' || !isNaN(parseFloat(value));
  };

  // 处理数值输入变化
  const handleNumericInputChange = (columnIndex, property, value) => {
    if (validateNumericInput(value)) {
      updateFieldState(columnIndex, property, value);
    }
  };

  return (
    <Card className="filter-panel mb-3 shadow-sm">
      <Card.Header className="bg-gradient d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <FaFilter className="me-2" />
          <h5 className="mb-0">数据筛选</h5>
        </div>
        <div>
          <Badge bg="primary" className="me-2">已选: {filters.length}</Badge>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={onResetFilters}
            title="重置所有筛选条件"
          >
            <FaUndo />
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="pb-2">
        <div className="filter-fields-container">
          {columns.map((column, index) => (
            <div 
              key={index} 
              className={`filter-field-row p-3 mb-2 rounded ${fieldStates[index].active ? 'bg-light border border-primary' : 'bg-light'}`}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="mb-0 fw-bold">{column}</h6>
                {hasFilterForColumn(index) && (
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => removeFilter(index)}
                    title="移除此筛选条件"
                  >
                    <FaTimes />
                  </Button>
                )}
              </div>
              
              <Row className="g-2 align-items-center">
                <Col xs="auto">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => toggleFilterType(index)}
                    className="filter-type-btn"
                  >
                    {getFilterTypeLabel(fieldStates[index].filterType)}
                  </Button>
                </Col>
                
                <Col>
                  {fieldStates[index].filterType === 'range' ? (
                    <InputGroup size="sm">
                      <Form.Control 
                        type="number" 
                        placeholder="最小值" 
                        value={fieldStates[index].minValue}
                        onChange={(e) => handleNumericInputChange(index, 'minValue', e.target.value)}
                      />
                      <InputGroup.Text>至</InputGroup.Text>
                      <Form.Control 
                        type="number" 
                        placeholder="最大值" 
                        value={fieldStates[index].maxValue}
                        onChange={(e) => handleNumericInputChange(index, 'maxValue', e.target.value)}
                      />
                    </InputGroup>
                  ) : (
                    <Form.Control 
                      type="number" 
                      size="sm"
                      placeholder={`输入${getFilterTypeLabel(fieldStates[index].filterType)}的值`}
                      value={fieldStates[index].filterValue}
                      onChange={(e) => handleNumericInputChange(index, 'filterValue', e.target.value)}
                    />
                  )}
                </Col>
                
                <Col xs="auto">
                  <Button 
                    variant={hasFilterForColumn(index) ? "success" : "primary"} 
                    size="sm" 
                    onClick={() => addFilter(index)}
                  >
                    {hasFilterForColumn(index) ? "更新" : "添加"}
                  </Button>
                </Col>
              </Row>
              
              {hasFilterForColumn(index) && (
                <div className="mt-2">
                  <Badge bg="info" className="p-2">
                    {getFilterDescription(getFilterForColumn(index))}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filters.length > 0 && (
          <div className="d-grid gap-2 mt-3">
            <Button 
              variant="success" 
              onClick={onApplyFilters}
              className="d-flex align-items-center justify-content-center"
            >
              <FaCheck className="me-2" />
              <span>应用所有筛选条件 ({filters.length})</span>
            </Button>
          </div>
        )}
        
        {filters.length === 0 && (
          <div className="text-center text-muted p-4 bg-light rounded">
            <p className="mb-0">尚未添加任何筛选条件</p>
            <p className="small mb-0">选择字段并设置筛选条件</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default FilterPanel;