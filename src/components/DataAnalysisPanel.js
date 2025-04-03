import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Table, Badge, Tabs, Tab, Row, Col, Form } from 'react-bootstrap';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Scatter, Pie, Line } from 'react-chartjs-2';
import DataService from '../services/DataService';
import 'chartjs-plugin-zoom';
import 'chartjs-plugin-annotation';
import 'chartjs-plugin-datalabels';


// 注册Chart.js组件
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

const DataAnalysisPanel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [colorScale, setColorScale] = useState('viridis');
  const [spatialView, setSpatialView] = useState('2d');
  const [clusterHighlight, setClusterHighlight] = useState(null);

  // 颜色比例尺选项
  const colorScaleOptions = [
    { value: 'viridis', label: 'Viridis (默认)' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'inferno', label: 'Inferno' },
    { value: 'magma', label: 'Magma' },
    { value: 'rainbow', label: 'Rainbow' }
  ];

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

  // 生成比例分布图数据
  const getRatioChartData = () => {
    if (!analysisData || !analysisData.chart_data || !analysisData.chart_data.ratio) return null;
    
    const { ratio } = analysisData.chart_data;
    
    return {
      labels: ratio.bin_centers.map(val => (val * 100).toFixed(0) + '%'),
      datasets: [
        {
          label: '空道数/总道数比例',
          data: ratio.counts,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
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
    const pointColors = [];
    
    // 生成颜色映射
    const min = Math.min(...spatial.values);
    const max = Math.max(...spatial.values);
    const range = max - min;
    
    for (let i = 0; i < spatial.x.length; i++) {
      pointData.push({
        x: spatial.x[i],
        y: spatial.y[i]
      });
      
      // 根据值生成颜色
      if (range > 0) {
        const normalizedValue = (spatial.values[i] - min) / range;
        pointColors.push(getColorFromScale(normalizedValue, colorScale));
      } else {
        pointColors.push('rgba(255, 99, 132, 0.6)');
      }
    }
    
    // 添加聚类中心点（如果有）
    const clusterData = [];
    const clusterLabels = [];
    
    if (analysisData.spatial_clusters && analysisData.spatial_clusters.length > 0) {
      analysisData.spatial_clusters.forEach(cluster => {
        clusterData.push({
          x: cluster.center_x,
          y: cluster.center_y
        });
        clusterLabels.push(`聚类 #${cluster.id} (${cluster.size}点)`);
      });
    }
    
    return {
      datasets: [
        {
          label: '空道数 等于 总道数的检波点',
          data: pointData,
          backgroundColor: pointColors,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
        {
          label: '聚类中心',
          data: clusterData,
          backgroundColor: 'rgba(255, 206, 86, 1)',
          pointRadius: 10,
          pointHoverRadius: 15,
          pointStyle: 'triangle'
        }
      ]
    };
  };

  // 根据比例尺生成颜色
  const getColorFromScale = (value, scale) => {
    // 简化的颜色比例尺实现
    switch(scale) {
      case 'plasma':
        return `rgba(${Math.round(255 * value)}, ${Math.round(128 * (1-value))}, ${Math.round(255 * (1-value))}, 0.7)`;
      case 'inferno':
        return `rgba(${Math.round(255 * value)}, ${Math.round(80 * value)}, ${Math.round(200 * (1-value))}, 0.7)`;
      case 'magma':
        return `rgba(${Math.round(255 * value)}, ${Math.round(50 + 100 * (1-value))}, ${Math.round(200 * (1-value))}, 0.7)`;
      case 'rainbow':
        // 简化的彩虹色谱
        const hue = value * 280; // 0-280度色相范围
        return `hsla(${hue}, 100%, 50%, 0.7)`;
      case 'viridis':
      default:
        // 从蓝色到黄色的渐变
        return `rgba(${Math.round(50 + 200 * value)}, ${Math.round(150 + 100 * value)}, ${Math.round(200 * (1-value))}, 0.7)`;
    }
  };

  // 生成聚类分析饼图
  const getClusterPieData = () => {
    if (!analysisData || !analysisData.spatial_clusters) return null;
    
    const labels = analysisData.spatial_clusters.map(c => `聚类 #${c.id}`);
    const data = analysisData.spatial_clusters.map(c => c.size);
    
    // 添加未聚类的点
    const totalClustered = data.reduce((sum, val) => sum + val, 0);
    const totalPoints = analysisData.total_matching;
    const unclustered = totalPoints - totalClustered;
    
    if (unclustered > 0) {
      labels.push('未聚类点');
      data.push(unclustered);
    }
    
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
          ],
          borderWidth: 1
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

    // 准备连续段长度分布数据
    const segmentLengths = continuity.segments ? continuity.segments.map(s => s.length) : [];
    const lengthCounts = {};
    segmentLengths.forEach(length => {
      lengthCounts[length] = (lengthCounts[length] || 0) + 1;
    });
    
    const lengthChartData = {
      labels: Object.keys(lengthCounts).sort((a, b) => parseInt(a) - parseInt(b)),
      datasets: [{
        label: '连续段长度分布',
        data: Object.keys(lengthCounts).sort((a, b) => parseInt(a) - parseInt(b)).map(k => lengthCounts[k]),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };

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

        {/* 连续段长度分布图 */}
        <div className="mb-4">
          <h5>连续段长度分布</h5>
          <div style={{ height: '250px' }}>
            <Bar 
              data={lengthChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: '连续段长度分布'
                  },
                  legend: {
                    display: false
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
                      text: '连续段长度'
                    }
                  }
                }
              }}
            />
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
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {continuity.segments.map((segment, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{segment.start_point}</td>
                    <td>{segment.end_point}</td>
                    <td>{segment.length} 点</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => {
                          // 这里可以添加查看连续段详情的功能
                          alert(`连续段 #${index+1} 包含 ${segment.length} 个点，从 ${segment.start_point} 到 ${segment.end_point}`);
                        }}
                      >
                        查看详情
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {continuity.value_distribution && continuity.value_distribution.most_common && (
          <div>
            <h5>值分布</h5>
            <Row>
              <Col md={6}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>值</th>
                      <th>出现次数</th>
                      <th>占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {continuity.value_distribution.most_common.map((item, index) => (
                      <tr key={index}>
                        <td>{item[0]}</td>
                        <td>{item[1]}</td>
                        <td>{((item[1] / analysisData.statistics.matching_points) * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                {/* 值分布饼图 */}
                <div style={{ height: '250px' }}>
                  <Pie 
                    data={{
                      labels: continuity.value_distribution.most_common.map(item => `${item[0]}`),
                      datasets: [{
                        data: continuity.value_distribution.most_common.map(item => item[1]),
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.7)',
                          'rgba(54, 162, 235, 0.7)',
                          'rgba(255, 206, 86, 0.7)',
                          'rgba(75, 192, 192, 0.7)',
                          'rgba(153, 102, 255, 0.7)',
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: '空道数/总道数值分布'
                        },
                        legend: {
                          position: 'right',
                        }
                      }
                    }}
                  />
                </div>
              </Col>
            </Row>
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
                <th>操作</th>
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
                  <td>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => {
                        // 这里可以添加定位到地图上的功能
                        alert(`定位到检波点 ${point.point_id}，坐标: (${point.x_coord.toFixed(2)}, ${point.y_coord.toFixed(2)})`);
                      }}
                    >
                      <i className="bi bi-geo-alt"></i> 定位
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  // 渲染空间聚类分析
  const renderSpatialClusters = () => {
    if (!analysisData || !analysisData.spatial_clusters || analysisData.spatial_clusters.length === 0) {
      return <Alert variant="info">没有聚类数据可显示或点数不足以进行聚类分析</Alert>;
    }

    return (
      <div className="spatial-clusters">
        <Row>
          <Col md={6}>
            <h5>聚类分布</h5>
            <div style={{ height: '300px' }}>
              <Pie 
                data={getClusterPieData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: '聚类分布'
                    },
                    legend: {
                      position: 'right',
                    }
                  }
                }}
              />
            </div>
          </Col>
          <Col md={6}>
            <h5>聚类详情</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>聚类ID</th>
                  <th>点数量</th>
                  <th>中心坐标</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.spatial_clusters.map((cluster, index) => (
                  <tr key={index} className={clusterHighlight === cluster.id ? 'table-primary' : ''}>
                    <td>{cluster.id}</td>
                    <td>{cluster.size}</td>
                    <td>({cluster.center_x.toFixed(2)}, {cluster.center_y.toFixed(2)})</td>
                    <td>
                      <Button 
                        variant={clusterHighlight === cluster.id ? "primary" : "outline-primary"}
                        size="sm"
                        onClick={() => {
                          if (clusterHighlight === cluster.id) {
                            setClusterHighlight(null);
                          } else {
                            setClusterHighlight(cluster.id);
                          }
                        }}
                      >
                        {clusterHighlight === cluster.id ? "取消高亮" : "高亮显示"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
        
        <h5 className="mt-4">聚类点示例</h5>
        <div className="table-responsive">
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>聚类ID</th>
                <th>示例点</th>
              </tr>
            </thead>
            <tbody>
              {analysisData.spatial_clusters.map((cluster, index) => (
                <tr key={index}>
                  <td>{cluster.id}</td>
                  <td>
                    {cluster.points.map((pointId, i) => (
                      <Badge 
                        key={i} 
                        bg="secondary" 
                        className="me-1 mb-1"
                        style={{cursor: 'pointer'}}
                        onClick={() => {
                          // 这里可以添加点击查看点详情的功能
                          alert(`检波点 ${pointId} 属于聚类 #${cluster.id}`);
                        }}
                      >
                        {pointId}
                      </Badge>
                    ))}
                    {cluster.size > 10 && <Badge bg="light" text="dark">+{cluster.size - 10}个点</Badge>}
                  </td>
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
  <>刷新分析</>
)}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">加载中...</span>
            </Spinner>
            <p className="mt-3">正在分析数据，请稍候...</p>
          </div>
        ) : analysisData ? (
          <div className="analysis-content">
            <div className="mb-4">
              <h5>分析概览</h5>
              <div className="d-flex flex-wrap gap-3 mb-3">
                <Card className="stat-card">
                  <Card.Body>
                    <h6>总检波点数</h6>
                    <div className="stat-value">{analysisData.statistics.total_points}</div>
                  </Card.Body>
                </Card>
                <Card className="stat-card">
                  <Card.Body>
                    <h6>空道数=总道数的点</h6>
                    <div className="stat-value">{analysisData.statistics.matching_points}</div>
                  </Card.Body>
                </Card>
                <Card className="stat-card">
                  <Card.Body>
                    <h6>占比</h6>
                    <div className="stat-value">{analysisData.statistics.percentage}%</div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              <Tab eventKey="overview" title="数据分布">
                <Row className="mt-4">
                  <Col lg={6} className="mb-4">
                    <h5>空道数与总道数分布</h5>
                    <div style={{ height: '300px' }}>
                      {analysisData.chart_data && (
                        <Bar 
                          data={getDistributionChartData()} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              title: {
                                display: true,
                                text: '空道数与总道数分布'
                              },
                              zoom: {
                                pan: {
                                  enabled: true,
                                  mode: 'x'
                                },
                                zoom: {
                                  wheel: {
                                    enabled: true,
                                  },
                                  pinch: {
                                    enabled: true
                                  },
                                  mode: 'x',
                                }
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
                                  text: '道数'
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </Col>
                  <Col lg={6} className="mb-4">
                    <h5>空道数/总道数比例分布</h5>
                    <div style={{ height: '300px' }}>
                      {analysisData.chart_data && (
                        <Bar 
                          data={getRatioChartData()} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              title: {
                                display: true,
                                text: '空道数/总道数比例分布'
                              },
                              zoom: {
                                pan: {
                                  enabled: true,
                                  mode: 'x'
                                },
                                zoom: {
                                  wheel: {
                                    enabled: true,
                                  },
                                  pinch: {
                                    enabled: true
                                  },
                                  mode: 'x',
                                }
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
                                  text: '比例'
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="spatial" title="空间分布">
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>检波点空间分布</h5>
                    <div className="d-flex gap-2">
                      <Form.Select 
                        size="sm" 
                        style={{width: '150px'}}
                        value={colorScale}
                        onChange={(e) => setColorScale(e.target.value)}
                      >
                        {colorScaleOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Select 
                        size="sm" 
                        style={{width: '100px'}}
                        value={spatialView}
                        onChange={(e) => setSpatialView(e.target.value)}
                      >
                        <option value="2d">2D视图</option>
                        <option value="3d">3D视图</option>
                      </Form.Select>
                    </div>
                  </div>
                  
                  <div style={{ height: '500px', position: 'relative' }}>
                    {analysisData.chart_data && (
                      <Scatter 
                        data={getSpatialChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            title: {
                              display: true,
                              text: '检波点空间分布'
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const point = context.raw;
                                  return `坐标: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
                                }
                              }
                            },
                            zoom: {
                              pan: {
                                enabled: true,
                                mode: 'xy'
                              },
                              zoom: {
                                wheel: {
                                  enabled: true,
                                },
                                pinch: {
                                  enabled: true
                                },
                                mode: 'xy',
                              }
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
                    )}
                    
                    {/* 颜色图例 */}
                    <div 
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50px',
                        width: '30px',
                        height: '200px',
                        background: 'linear-gradient(to top, blue, cyan, lime, yellow, red)',
                        borderRadius: '3px',
                        boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                      }}
                    />
                    <div style={{position: 'absolute', right: '55px', top: '45px', fontSize: '12px'}}>高</div>
                    <div style={{position: 'absolute', right: '55px', top: '245px', fontSize: '12px'}}>低</div>
                  </div>
                  
                  {/* 如果有聚类数据，显示聚类信息 */}
                  {analysisData.spatial_clusters && analysisData.spatial_clusters.length > 0 && (
                    <div className="mt-4">
                      <h5>空间聚类分析</h5>
                      <p>
                        系统检测到 {analysisData.spatial_clusters.length} 个空间聚类。
                        点击下方聚类ID可在地图上高亮显示。
                      </p>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {analysisData.spatial_clusters.map(cluster => (
                          <Badge 
                            key={cluster.id}
                            bg={clusterHighlight === cluster.id ? "primary" : "secondary"}
                            style={{cursor: 'pointer'}}
                            onClick={() => {
                              if (clusterHighlight === cluster.id) {
                                setClusterHighlight(null);
                              } else {
                                setClusterHighlight(cluster.id);
                              }
                            }}
                          >
                            聚类 #{cluster.id} ({cluster.size}点)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Tab>
              
              <Tab eventKey="continuity" title="连续性分析">
                <div className="mt-4">
                  {renderContinuityAnalysis()}
                </div>
              </Tab>
              
              <Tab eventKey="points" title="匹配点列表">
                <div className="mt-4">
                  {renderMatchingPoints()}
                </div>
              </Tab>
              
              <Tab eventKey="clusters" title="聚类分析">
                <div className="mt-4">
                  {renderSpatialClusters()}
                </div>
              </Tab>
            </Tabs>
            
            <div className="mt-4">
              <h5>数据导出</h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-success" 
                  onClick={() => {
                    // 导出匹配点数据为CSV
                    if (!analysisData || !analysisData.matching_points) {
                      alert('没有可导出的数据');
                      return;
                    }
                    
                    // 创建CSV内容
                    const headers = ['检波点ID', '空道数/总道数', 'X坐标', 'Y坐标', '高程'];
                    const csvContent = [
                      headers.join(','),
                      ...analysisData.matching_points.map(point => 
                        [
                          point.point_id,
                          point.value,
                          point.x_coord,
                          point.y_coord,
                          point.elevation
                        ].join(',')
                      )
                    ].join('\n');
                    
                    // 创建下载链接
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', '匹配点数据.csv');
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  导出匹配点数据 (CSV)
                </Button>
                
                <Button 
                  variant="outline-success" 
                  onClick={() => {
                    // 导出分析结果为JSON
                    if (!analysisData) {
                      alert('没有可导出的数据');
                      return;
                    }
                    
                    const jsonStr = JSON.stringify(analysisData, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', '分析结果.json');
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  导出完整分析结果 (JSON)
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="info">
            请点击"刷新分析"按钮开始分析数据
          </Alert>
        )}
      </Card.Body>
      <Card.Footer className="text-muted">
        <small>
          数据分析工具 - 中石化石油物探技术研究院 | 地震处理解释中心
        </small>
      </Card.Footer>
    </Card>
  );
};

export default DataAnalysisPanel;