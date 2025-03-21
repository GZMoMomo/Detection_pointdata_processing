import React, { useState } from 'react';
import { Card, Form, Button, InputGroup, Badge, Accordion, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaFilter, FaPlus, FaTimes, FaSearch, FaUndo, FaCheck } from 'react-icons/fa';

function FilterPanel({ columns, filters, onFiltersChange, onApplyFilters, onResetFilters }) {
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [filterType, setFilterType] = useState('greaterThan');
  const [filterValue, setFilterValue] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  // 添加筛选条件
  const addFilter = () => {
    // 验证输入
    if (filterType === 'range') {
      if (minValue === '' || maxValue === '') {
        alert('请输入区间的最小值和最大值');
        return;
      }
      if (parseFloat(minValue) >= parseFloat(maxValue)) {
        alert('最小值必须小于最大值');
        return;
      }
    } else if (filterValue === '') {
      alert('请输入筛选值');
      return;
    }

    // 创建新的筛选条件
    const newFilter = {
      column: parseInt(selectedColumn),
      type: filterType,
    };

    if (filterType === 'range') {
      newFilter.min = parseFloat(minValue);
      newFilter.max = parseFloat(maxValue);
    } else {
      newFilter.value = parseFloat(filterValue);
    }

    // 更新筛选条件列表
    const updatedFilters = [...filters, newFilter];
    onFiltersChange(updatedFilters);

    // 重置输入
    setFilterValue('');
    setMinValue('');
    setMaxValue('');
  };

  // 移除筛选条件
  const removeFilter = (index) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(updatedFilters);
  };

  // 获取筛选条件的文本描述
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

  const validateNumericInput = (value) => {
    return value === '' || !isNaN(parseFloat(value));
  };

  const handleFilterValueChange = (e) => {
    const value = e.target.value;
    if (validateNumericInput(value)) {
      setFilterValue(value);
    }
  };

  const handleMinValueChange = (e) => {
    const value = e.target.value;
    if (validateNumericInput(value)) {
      setMinValue(value);
    }
  };
  
  const handleMaxValueChange = (e) => {
    const value = e.target.value;
    if (validateNumericInput(value)) {
      setMaxValue(value);
    }
  };

  // 获取筛选类型的图标
  const getFilterTypeIcon = (type) => {
    switch (type) {
      case 'greaterThan':
        return '>';
      case 'lessThan':
        return '<';
      case 'equals':
        return '=';
      case 'range':
        return '[ ]';
      default:
        return '';
    }
  };

  // 获取筛选条件的背景颜色
  const getFilterBadgeColor = (index) => {
    const colors = ['primary', 'success', 'info', 'warning', 'danger'];
    return colors[index % colors.length];
  };

  return (
    <Card className={`filter-panel mb-3 shadow-sm `}>
      <Card.Header className="bg-gradient d-flex align-items-center">
        <FaFilter className="me-2" />
        <h5 className="mb-0">数据筛选</h5>
      </Card.Header>
      <Card.Body className="pb-2">
        <Accordion defaultActiveKey="0" className="mb-3">
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <span className="fw-bold">添加筛选条件</span>
            </Accordion.Header>
            <Accordion.Body className="pt-3 pb-3">
              <Form>
                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label className="fw-semibold">选择列</Form.Label>
                      <Form.Select 
                        value={selectedColumn}
                        onChange={(e) => setSelectedColumn(e.target.value)}
                        className="shadow-sm"
                      >
                        {columns.map((column, index) => (
                          <option key={index} value={index}>
                            {column}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label className="fw-semibold">筛选类型</Form.Label>
                      <Form.Select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="shadow-sm"
                      >
                        <option value="greaterThan">大于</option>
                        <option value="lessThan">小于</option>
                        <option value="equals">等于</option>
                        <option value="range">区间</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {filterType === 'range' ? (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">区间值</Form.Label>
                    <InputGroup className="shadow-sm">
                      <Form.Control 
                        type="number" 
                        placeholder="最小值" 
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                      />
                      <InputGroup.Text className="bg-light">至</InputGroup.Text>
                      <Form.Control 
                        type="number" 
                        placeholder="最大值" 
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">筛选值</Form.Label>
                    <InputGroup className="shadow-sm">
                      <InputGroup.Text className="bg-light">
                        {getFilterTypeIcon(filterType)}
                      </InputGroup.Text>
                      <Form.Control 
                        type="number" 
                        placeholder="输入数值" 
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                )}

                <Button 
                  variant="primary" 
                  onClick={addFilter} 
                  className="w-100 d-flex align-items-center justify-content-center shadow-sm"
                >
                  <FaPlus className="me-2" />
                  <span>添加筛选条件</span>
                </Button>
              </Form>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {filters.length > 0 && (
          <div className="filter-conditions p-3 bg-light rounded mb-3">
            <h6 className="d-flex align-items-center mb-3">
              <FaSearch className="me-2 text-primary" />
              <span>已添加的筛选条件</span>
              <span className="ms-2 badge bg-secondary">{filters.length}</span>
            </h6>
            <div className="filter-tags d-flex flex-wrap gap-2 mb-3">
              {filters.map((filter, index) => (
                <OverlayTrigger
                  key={index}
                  placement="top"
                  overlay={
                    <Tooltip id={`tooltip-${index}`}>
                      点击移除此筛选条件
                    </Tooltip>
                  }
                >
                  <Badge 
                    bg={getFilterBadgeColor(index)}
                    className="filter-tag py-2 px-3 d-flex align-items-center shadow-sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => removeFilter(index)}
                  >
                    <span className="me-2">{getFilterDescription(filter)}</span>
                    <FaTimes size={12} />
                  </Badge>
                </OverlayTrigger>
              ))}
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                variant="success" 
                onClick={onApplyFilters}
                className="flex-grow-1 d-flex align-items-center justify-content-center shadow-sm"
              >
                <FaCheck className="me-2" />
                <span>应用筛选条件</span>
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={onResetFilters}
                className="d-flex align-items-center justify-content-center shadow-sm"
              >
                <FaUndo className="me-2" />
                <span>重置</span>
              </Button>
            </div>
          </div>
        )}

        {filters.length === 0 && (
          <div className="text-center text-muted p-4 bg-light rounded">
            <p className="mb-0">尚未添加任何筛选条件</p>
            <p className="small mb-0">添加条件后将在此处显示</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default FilterPanel;