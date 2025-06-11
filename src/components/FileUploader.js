import React, { useState, useRef } from 'react';
import { Card, Button, ProgressBar, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import DataService from '../services/DataService';

function FileUploader({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    
    // 更严格的文件类型验证
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('只支持上传TXT文件');
      return;
    }
    
    // 添加文件大小验证
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`文件大小不能超过10MB，当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }
    
    setFile(file);
    uploadFile(file); // 自动上传文件
  };
  
  // 改进上传后的状态重置
  const resetUploadState = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    setUploading(false);
  };

  const uploadFile = async (fileToUpload) => {
    if (!fileToUpload) {
      setError('请选择一个文件');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      
      const formData = new FormData();
      formData.append('file', fileToUpload);
      
      console.log('开始上传文件...');
      const response = await DataService.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });
      
      console.log('文件上传响应:', response);
      setUploading(false);
      onUploadSuccess(response);
    } catch (err) {
      console.error('上传失败:', err);
      setError('上传失败: ' + (err.response?.data?.error || err.message));
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-uploader-container">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="text-center uploader-card">
          <Card.Header as="h5">
            <i className="bi bi-cloud-upload me-2"></i>
            上传数据文件
          </Card.Header>
          <Card.Body>
            <motion.div 
              className={`drop-area ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".txt"
                style={{ display: 'none' }}
              />
              
              <div className="upload-icon-container">
                <i className="bi bi-cloud-arrow-up-fill"></i>
              </div>
              
              <h4 className="upload-title">数据文件上传</h4>
              <p className="upload-description">
                拖放TXT文件到此处，或点击选择文件
              </p>
              
              {file && (
                <motion.div 
                  className="selected-file"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <i className="bi bi-file-text-fill"></i>
                  <span className="filename">{file.name}</span>
                  <span className="filesize">({(file.size / 1024).toFixed(2)} KB)</span>
                </motion.div>
              )}
            </motion.div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="danger" className="mt-3 d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </Alert>
              </motion.div>
            )}
            
            {uploading && (
              <motion.div 
                className="mt-4 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ProgressBar 
                  now={progress} 
                  label={`${progress}%`} 
                  animated 
                  variant="success"
                  className="custom-progress"
                />
                <p className="text-muted mt-2">正在上传文件，请稍候...</p>
              </motion.div>
            )}
          </Card.Body>
          <Card.Footer className="text-muted">
            <div className="file-format-info">
              <i className="bi bi-info-circle me-2"></i>
              支持15列数值的TXT文件，列之间用空格分隔
            </div>
          </Card.Footer>
        </Card>
      </motion.div>
    </div>
  );
}

export default FileUploader;