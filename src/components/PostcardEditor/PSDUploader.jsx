import React, { useState } from 'react';
import { PSDLoader } from './PSDLoader';

const PSDUploader = ({ cesdk, onPSDLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.psd')) {
      setError('Please select a valid PSD file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading PSD file:', file.name);
      const result = await PSDLoader.loadPSDFromLocal(cesdk, file);
      
      if (result.success) {
        console.log('PSD loaded successfully via upload');
        onPSDLoaded && onPSDLoaded(result);
      } else {
        setError(result.error || 'Failed to load PSD file');
      }
    } catch (err) {
      console.error('Error loading PSD:', err);
      setError(err.message || 'Failed to load PSD file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="psd-uploader">
      <div className="upload-section">
        <h3>Upload Custom PSD Template</h3>
        <p>Have your own PSD design? Upload it here.</p>
        
        <label className="file-input-label">
          <input
            type="file"
            accept=".psd"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="file-input"
          />
          <span className="upload-button">
            {isLoading ? 'Loading...' : 'Choose PSD File'}
          </span>
        </label>

        {error && (
          <div className="upload-error">
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .psd-uploader {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .upload-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1f36;
          margin-bottom: 8px;
        }

        .upload-section p {
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 16px;
        }

        .file-input {
          display: none;
        }

        .file-input-label {
          display: inline-block;
          cursor: pointer;
        }

        .upload-button {
          padding: 10px 24px;
          background: #007bff;
          color: white;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .upload-button:hover {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .upload-error {
          margin-top: 12px;
          padding: 10px;
          background: #f8d7da;
          color: #721c24;
          border-radius: 4px;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default PSDUploader;