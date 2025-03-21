import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Table, Badge, Tabs, Tab, Row, Col } from 'react-bootstrap';
import { Bar, Scatter, Histogram } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import DataService from '../services/DataService';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend
);

const DataAnalysisPanel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // 组件挂载时自动执行分析
    analyzeData();
  }, []);

  const analyzeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DataService.analyzeData();
      setAnalysisData(response);
      setLoading(false);
    } catch (err) {
      setError('数据分析失败: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  // 生成分布图数据
  const getDistributionChartData = () => {
    if (!analysisData || !analysisData.chart_data || !analysisData.chart_data.histogram) return null;
    
    const { histogram } = analysisData.chart_data;
    
    return {
      labels: histogram.col11.bin_centers.map(val => val.toFixed(0)),
      datasets: [
        {
          label: '空道数',
          data: histogram.col11.counts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: '总道数',
          data: histogram.col12.counts,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  // 生成空间分布图数据
  const getSpatialChartData = () => {
    if (!analysisData || !analysisData.chart_data || !analysisData.chart_data.spatial) return null;
    
    const { spatial } = analysisData.chart_data;
    
    // 将x和y坐标组合成点数据
    const pointData = [];
    for (let i = 0; i < spatial.x.length; i++) {
      pointData.push({
        x: spatial.x[i],
        y: spatial.y[i]
      });
    }
    
    return {
      datasets: [
        {
          label: '空道数 等于 总道数的检波点',
          data: pointData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          pointRadius: 5,
          pointHoverRadius: 8,
        }
      ]
    };
  };

  // 渲染连续性分析结果
  const renderContinuityAnalysis = () => {
    if (!analysisData || !analysisData.statistics || !analysisData.statistics.continuity) {
      return <Alert variant="info">没有连续性数据可显示</Alert>;
    }

    const { continuity } = analysisData.statistics;

    return (
      <div className="continuity-analysis">
        <div className="mb-4">
          <h5>连续性概览</h5>
          <div className="d-flex flex-wrap gap-3 mb-3">
            <Card className="stat-card">
              <Card.Body>
                <h6>连续段数量</h6>
                <div className="stat-value">{continuity.continuous_segments}</div>
              </Card.Body>
            </Card>
            <Card className="stat-card">
              <Card.Body>
                <h6>最长连续段</h6>
                <div className="stat-value">{continuity.longest_segment} 点</div>
              </Card.Body>
            </Card>
            <Card className="stat-card">
              <Card.Body>
                <h6>唯一值数量</h6>
                <div className="stat-value">{continuity.value_distribution?.unique_values || 0}</div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {continuity.segments && continuity.segments.length > 0 && (
          <div className="mb-4">
            <h5>连续段详情</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>起始检波点</th>
                  <th>结束检波点</th>
                  <th>长度</th>
                </tr>
              </thead>
              <tbody>
                {continuity.segments.map((segment, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{segment.start_point}</td>
                    <td>{segment.end_point}</td>
                    <td>{segment.length} 点</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {continuity.value_distribution && continuity.value_distribution.most_common && (
          <div>
            <h5>值分布</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>值</th>
                  <th>出现次数</th>
                </tr>
              </thead>
              <tbody>
                {continuity.value_distribution.most_common.map((item, index) => (
                  <tr key={index}>
                    <td>{item[0]}</td>
                    <td>{item[1]}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  // 渲染匹配点列表
  const renderMatchingPoints = () => {
    if (!analysisData || !analysisData.matching_points) {
      return <Alert variant="info">没有匹配点数据可显示</Alert>;
    }

    return (
      <div className="matching-points">
        <p>显示前 {analysisData.matching_points.length} 个匹配点（共 {analysisData.total_matching} 个）</p>
        <div className="table-responsive">
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>检波点ID</th>
                <th>空道数/总道数</th>
                <th>X坐标</th>
                <th>Y坐标</th>
                <th>高程</th>
              </tr>
            </thead>
            <tbody>
              {analysisData.matching_points.map((point, index) => (
                <tr key={index}>
                  <td>{point.point_id}</td>
                  <td>{point.value}</td>
                  <td>{point.x_coord.toFixed(2)}</td>
                  <td>{point.y_coord.toFixed(2)}</td>
                  <td>{point.elevation.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Card className="analysis-panel">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">数据分析 - 空道数与总道数</h4>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={analyzeData}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">分析中...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat me-2"></i>
                重新分析
              </>
            )}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {loading && !analysisData ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">正在分析数据，请稍候...</p>
          </div>
        ) : analysisData ? (
          <>
            <div className="analysis-overview mb-4">
              <Row>
                <Col md={4}>
                  <Card className="stat-card">
                    <Card.Body>
                      <h5>总检波点数</h5>
                      <div className="stat-value">{analysisData.statistics.total_points}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="stat-card">
                    <Card.Body>
                      <h5>空道数 等于 总道数的点</h5>
                      <div className="stat-value">{analysisData.statistics.matching_points}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="stat-card">
                    <Card.Body>
                      <h5>占比</h5>
                      <div className="stat-value">{analysisData.statistics.percentage}%</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              <Tab eventKey="overview" title="概览">
                <div className="py-3">
                  <h5 className="mb-3">数据分布</h5>
                  {getDistributionChartData() && (
                    <div style={{ height: '300px' }}>
                      <Bar 
                        data={getDistributionChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            title: {
                              display: true,
                              text: '空道数和总道数的分布'
                            },
                            legend: {
                              position: 'top',
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: '频率'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: '值'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  <h5 className="mb-3 mt-4">空间分布</h5>
                  {getSpatialChartData() && (
                    <div style={{ height: '400px' }}>
                      <Scatter 
                        data={getSpatialChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            title: {
                              display: true,
                              text: '空道数等于总道数的检波点空间分布'
                            },
                            legend: {
                              position: 'top',
                            }
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'X坐标'
                              }
                            },
                            y: {
                              title: {
                                display: true,
                                text: 'Y坐标'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </Tab>
              <Tab eventKey="continuity" title="连续性分析">
                <div className="py-3">
                  {renderContinuityAnalysis()}
                </div>
              </Tab>
              <Tab eventKey="points" title="匹配点列表">
                <div className="py-3">
                  {renderMatchingPoints()}
                </div>
              </Tab>
            </Tabs>
          </>
        ) : (
          <Alert variant="info">
            请点击"分析"按钮开始数据分析
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default DataAnalysisPanel;