from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import tempfile
import json
import uuid
from itertools import groupby
from operator import itemgetter
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from collections import Counter

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # 用于session加密
CORS(app, supports_credentials=True)  # 允许跨域请求

# 临时文件存储
UPLOAD_FOLDER = tempfile.gettempdir()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# 创建一个字典来存储数据
data_store = {}

# 定义新的列名
COLUMN_NAMES = [
    "检波点信号站", 
    "背景噪声能量", 
    "初至以下反射能量1", 
    "近偏移距能量", 
    "加球面扩散补偿后有效反射能量2", 
    "初至能量比", 
    "近远偏移距能量比", 
    "50Hz干扰能量值", 
    "低频干扰能量值", 
    "高频干扰能量值", 
    "空道数", 
    "总道数", 
    "检波点x坐标", 
    "检波点y坐标", 
    "检波点高程", 
    "总道数-空道数"
]

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """处理文件上传请求"""
    if 'file' not in request.files:
        return jsonify({'error': '没有文件部分'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if file and file.filename.endswith('.txt'):
        # 保存文件到临时目录
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_data.txt')
        file.save(filepath)
        
        try:
            # 读取文件并解析
            data = []
            with open(filepath, 'r') as f:
                for line in f:
                    values = line.strip().split()
                    if len(values) != 15:
                        return jsonify({'error': f'文件格式错误: 每行应有15列数据，但发现{len(values)}列'}), 400
                    
                    try:
                        # 转换为浮点数
                        numeric_values = [float(val) for val in values]
                        # 计算额外列 (第12列 - 第11列)
                        extra_column = numeric_values[11] - numeric_values[10]
                        numeric_values.append(extra_column)
                        data.append(numeric_values)
                    except ValueError:
                        return jsonify({'error': '文件包含非数值数据'}), 400
            
            # 生成唯一ID并存储数据
            data_id = str(uuid.uuid4())
            data_store[data_id] = data
            
            # 在session中只存储ID
            session['data_id'] = data_id
            
            # 返回数据概览
            return jsonify({
                'message': '文件上传成功',
                'totalRows': len(data),
                'previewRows': data[:10] if len(data) > 10 else data,
                'columns': COLUMN_NAMES
            })
            
        except Exception as e:
            return jsonify({'error': f'处理文件时出错: {str(e)}'}), 500
    
    return jsonify({'error': '仅支持txt文件'}), 400

@app.route('/api/data', methods=['GET'])
def get_data():
    """获取所有数据，不分页"""
    if 'data_id' not in session:
        return jsonify({'error': '没有数据，请先上传文件'}), 400
    
    data_id = session['data_id']
    if data_id not in data_store:
        return jsonify({'error': '数据已过期，请重新上传文件'}), 400
    
    data = data_store[data_id]
    total = len(data)
    
    return jsonify({
        'data': data,
        'totalRows': total,
        'columns': COLUMN_NAMES
    })

@app.route('/api/filter', methods=['POST'])
def filter_data():
    """根据条件筛选数据"""
    if 'data_id' not in session:
        return jsonify({'error': '没有数据，请先上传文件'}), 400
    
    data_id = session['data_id']
    if data_id not in data_store:
        return jsonify({'error': '数据已过期，请重新上传文件'}), 400
    
    # 从请求中获取过滤条件
    filters = request.json.get('filters', [])
    if not filters:
        return jsonify({'error': '未提供过滤条件'}), 400
    
    data = data_store[data_id]
    filtered_data = []
    filter_matches = [0] * len(filters)
    
    # 对每一行数据应用筛选条件
    for row in data:
        matched_filters = []
        
        for idx, filter_condition in enumerate(filters):
            column = filter_condition.get('column')
            if column < 0 or column > 15:  # 包括额外列
                continue
                
            filter_type = filter_condition.get('type')
            value = filter_condition.get('value')
            min_val = filter_condition.get('min')
            max_val = filter_condition.get('max')
            
            # 获取对应列的值
            col_value = row[column]
            
            # 应用筛选条件
            if filter_type == 'greaterThan' and col_value > value:
                matched_filters.append(idx)
                filter_matches[idx] += 1
            elif filter_type == 'lessThan' and col_value < value:
                matched_filters.append(idx)
                filter_matches[idx] += 1
            elif filter_type == 'equals' and col_value == value:
                matched_filters.append(idx)
                filter_matches[idx] += 1
            elif filter_type == 'range' and min_val <= col_value <= max_val:
                matched_filters.append(idx)
                filter_matches[idx] += 1
        
        # 如果匹配了任何筛选条件（OR关系），则添加到结果中
        if matched_filters:
            filtered_data.append({
                'rowData': row,
                'matchedFilters': matched_filters
            })
    
    # 返回筛选结果和统计信息
    return jsonify({
        'filteredData': filtered_data,
        'statistics': {
            'totalMatched': len(filtered_data),
            'filterMatches': filter_matches
        }
    })

@app.route('/api/export', methods=['POST'])
def export_data():
    """导出筛选后的数据为Excel并提供直接下载"""
    filtered_data = request.json.get('filteredData', [])
    
    if not filtered_data:
        return jsonify({'error': '没有数据可导出'}), 400
    
    # 提取行数据
    rows = [item['rowData'] for item in filtered_data]
    
    # 创建DataFrame
    df = pd.DataFrame(rows, columns=COLUMN_NAMES)
    
    # 生成临时Excel文件
    export_path = os.path.join(app.config['UPLOAD_FOLDER'], 'exported_data.xlsx')
    df.to_excel(export_path, index=False)
    
    # 返回文件下载链接
    return jsonify({
        'message': '数据导出成功',
        'downloadUrl': '/api/download'
    })

@app.route('/api/download', methods=['GET'])
def download_file():
    """提供Excel文件下载"""
    export_path = os.path.join(app.config['UPLOAD_FOLDER'], 'exported_data.xlsx')
    
    if not os.path.exists(export_path):
        return jsonify({'error': '导出文件不存在，请先导出数据'}), 404
    
    # 直接发送文件给客户端下载
    return send_file(
        export_path,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='filtered_data.xlsx'
    )

@app.route('/api/analyze', methods=['GET'])
def analyze_data():
    """分析第11列和第12列的数据关系"""
    if 'data_id' not in session:
        return jsonify({'error': '没有数据，请先上传文件'}), 400
    
    data_id = session['data_id']
    if data_id not in data_store:
        return jsonify({'error': '数据已过期，请重新上传文件'}), 400
    
    data = data_store[data_id]
    
    # 找出第11列和第12列值相同的检波点
    matching_points = []
    for i, row in enumerate(data):
        # 第11列和第12列的索引分别为10和11
        if row[10] == row[11]:
            matching_points.append({
                'index': i,
                'point_id': row[0],  # 检波点信号站
                'value': row[10],    # 相同的值
                'x_coord': row[12],  # x坐标
                'y_coord': row[13],  # y坐标
                'elevation': row[14], # 高程
                'full_data': row     # 完整数据行
            })
    
    # 分析连续性
    continuity_analysis = analyze_continuity(matching_points)
    
    # 生成统计信息
    statistics = {
        'total_points': len(data),
        'matching_points': len(matching_points),
        'percentage': round(len(matching_points) / len(data) * 100, 2) if data else 0,
        'continuity': continuity_analysis
    }
    
    # 为前端准备分布数据
    # 提取第11列和第12列的数据
    col11_data = [row[10] for row in data]
    col12_data = [row[11] for row in data]
    
    # 计算分布数据
    distribution_data = {
        'col11': {
            'values': col11_data,
            'min': min(col11_data) if col11_data else 0,
            'max': max(col11_data) if col11_data else 0,
            'mean': sum(col11_data) / len(col11_data) if col11_data else 0,
        },
        'col12': {
            'values': col12_data,
            'min': min(col12_data) if col12_data else 0,
            'max': max(col12_data) if col12_data else 0,
            'mean': sum(col12_data) / len(col12_data) if col12_data else 0,
        }
    }
    
    # 计算直方图数据
    import numpy as np
    hist_bins = 30
    col11_hist, col11_bin_edges = np.histogram(col11_data, bins=hist_bins)
    col12_hist, col12_bin_edges = np.histogram(col12_data, bins=hist_bins)
    
    histogram_data = {
        'col11': {
            'counts': col11_hist.tolist(),
            'bin_edges': col11_bin_edges.tolist(),
            'bin_centers': [(col11_bin_edges[i] + col11_bin_edges[i+1])/2 for i in range(len(col11_bin_edges)-1)]
        },
        'col12': {
            'counts': col12_hist.tolist(),
            'bin_edges': col12_bin_edges.tolist(),
            'bin_centers': [(col12_bin_edges[i] + col12_bin_edges[i+1])/2 for i in range(len(col12_bin_edges)-1)]
        }
    }
    
    # 提取匹配点的坐标数据用于空间分布图
    spatial_data = {
        'x': [p['x_coord'] for p in matching_points],
        'y': [p['y_coord'] for p in matching_points]
    }
    
    return jsonify({
        'matching_points': matching_points[:100],  # 限制返回数量，避免数据过大
        'total_matching': len(matching_points),
        'statistics': statistics,
        'chart_data': {
            'distribution': distribution_data,
            'histogram': histogram_data,
            'spatial': spatial_data
        }
    })

def analyze_continuity(matching_points):
    """分析匹配点的连续性"""
    if not matching_points:
        return {'continuous_segments': 0, 'details': []}
    
    # 按检波点ID排序
    sorted_points = sorted(matching_points, key=lambda x: x['point_id'])
    
    # 查找连续的段
    segments = []
    for k, g in groupby(enumerate(sorted_points), lambda ix: ix[0] - ix[1]['index']):
        group = list(map(itemgetter(1), g))
        if len(group) > 1:  # 只考虑至少有2个点的连续段
            segments.append({
                'start_point': group[0]['point_id'],
                'end_point': group[-1]['point_id'],
                'length': len(group),
                'points': [p['point_id'] for p in group]
            })
    
    # 分析值的分布
    value_distribution = Counter([p['value'] for p in matching_points])
    most_common_values = value_distribution.most_common(5)
    
    return {
        'continuous_segments': len(segments),
        'longest_segment': max([s['length'] for s in segments]) if segments else 0,
        'segments': segments[:10],  # 限制返回的段数量
        'value_distribution': {
            'most_common': most_common_values,
            'unique_values': len(value_distribution)
        }
    }

def generate_distribution_chart(data):
    """生成第11列和第12列的数据分布图"""
    # 使用Agg后端，这是一个非交互式后端，不需要GUI
    import matplotlib
    matplotlib.use('Agg')
    
    plt.figure(figsize=(10, 6))
    
    # 提取第11列和第12列的数据
    col11 = [row[10] for row in data]
    col12 = [row[11] for row in data]
    
    plt.hist([col11, col12], bins=30, alpha=0.7, label=['空道数', '总道数'])
    plt.xlabel('值')
    plt.ylabel('频率')
    plt.title('第11列(空道数)和第12列(总道数)的分布')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # 将图表转换为base64编码的字符串
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()
    plt.close()  # 关闭图形，释放资源
    
    graphic = base64.b64encode(image_png).decode('utf-8')
    return graphic

def generate_spatial_chart(matching_points):
    """生成匹配点的空间分布图"""
    # 使用Agg后端
    import matplotlib
    matplotlib.use('Agg')
    
    if not matching_points or 'x_coord' not in matching_points[0]:
        return None
    
    plt.figure(figsize=(10, 8))
    
    # 提取坐标
    x_coords = [p['x_coord'] for p in matching_points]
    y_coords = [p['y_coord'] for p in matching_points]
    
    plt.scatter(x_coords, y_coords, alpha=0.7, c='blue')
    plt.xlabel('X坐标')
    plt.ylabel('Y坐标')
    plt.title('空道数等于总道数的检波点空间分布')
    plt.grid(True, alpha=0.3)
    
    # 将图表转换为base64编码的字符串
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()
    plt.close()  # 关闭图形，释放资源
    
    graphic = base64.b64encode(image_png).decode('utf-8')
    return graphic

# 添加一个新的路由来获取特定值的分析
@app.route('/api/analyze/value/<float:value>', methods=['GET'])
def analyze_specific_value(value):
    """分析特定值在第11列和第12列中的分布"""
    if 'data_id' not in session:
        return jsonify({'error': '没有数据，请先上传文件'}), 400
    
    data_id = session['data_id']
    if data_id not in data_store:
        return jsonify({'error': '数据已过期，请重新上传文件'}), 400
    
    data = data_store[data_id]
    
    # 找出第11列等于指定值的点
    col11_matches = [row for row in data if row[10] == value]
    
    # 找出第12列等于指定值的点
    col12_matches = [row for row in data if row[11] == value]
    
    # 找出两列都等于指定值的点
    both_matches = [row for row in data if row[10] == value and row[11] == value]
    
    return jsonify({
        'value': value,
        'col11_matches': len(col11_matches),
        'col12_matches': len(col12_matches),
        'both_matches': len(both_matches),
        'col11_percentage': round(len(col11_matches) / len(data) * 100, 2) if data else 0,
        'col12_percentage': round(len(col12_matches) / len(data) * 100, 2) if data else 0,
        'both_percentage': round(len(both_matches) / len(data) * 100, 2) if data else 0,
        'sample_points': [row[0] for row in both_matches[:20]]  # 返回前20个匹配点的ID
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)  