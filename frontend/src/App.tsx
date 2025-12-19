import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:3000/api';

interface Job {
  id: string;
  modelId: string;
  jobType: 'stl_conversion' | 'preview_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface Model {
  id: string;
  name: string;
  fileUri: string;
  stlFileUri?: string;
  previewImageUri?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  jobs?: Job[];
}

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Poll for updates every 3 seconds
  useEffect(() => {
    fetchModels();
    const interval = setInterval(() => {
      fetchModels();
      if (selectedModel) {
        fetchModelDetails(selectedModel.id);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedModel?.id]);

  const fetchModels = async () => {
    try {
      const response = await axios.get<Model[]>(`${API_BASE_URL}/models`);
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchModelDetails = async (id: string) => {
    try {
      const response = await axios.get<Model>(`${API_BASE_URL}/models/${id}`);
      setSelectedModel(response.data);
    } catch (error) {
      console.error('Error fetching model details:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.glb')) {
      alert('Please upload a .glb file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('model', file);
    formData.append('name', file.name);

    try {
      await axios.post(`${API_BASE_URL}/models/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchModels();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleReprocess = async (modelId: string) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/models/${modelId}/reprocess`);
      await fetchModelDetails(modelId);
    } catch (error) {
      console.error('Error reprocessing model:', error);
      alert('Failed to reprocess model');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'processing':
        return '#2196f3';
      case 'failed':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⟳';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎨 3D Model Manager</h1>
        <p>Upload and process your GLB models</p>
      </header>

      <div className="content">
        <div className="sidebar">
          <div className="upload-section">
            <h2>Upload Model</h2>
            <label className="file-upload">
              <input
                type="file"
                accept=".glb"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <span>{uploading ? 'Uploading...' : 'Choose GLB File'}</span>
            </label>
          </div>

          <div className="models-list">
            <h2>Models ({models.length})</h2>
            {models.length === 0 ? (
              <p className="empty-state">No models yet. Upload one to get started!</p>
            ) : (
              <ul>
                {models.map((model) => (
                  <li
                    key={model.id}
                    className={selectedModel?.id === model.id ? 'active' : ''}
                    onClick={() => fetchModelDetails(model.id)}
                  >
                    <div className="model-item">
                      <span className="model-name">{model.name}</span>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(model.status) }}
                      >
                        {getStatusEmoji(model.status)} {model.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="main-panel">
          {selectedModel ? (
            <div className="model-details">
              <div className="details-header">
                <h2>{selectedModel.name}</h2>
                <button
                  className="reprocess-btn"
                  onClick={() => handleReprocess(selectedModel.id)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : '🔄 Reprocess'}
                </button>
              </div>

              <div className="metadata">
                <h3>Metadata</h3>
                <table>
                  <tbody>
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{selectedModel.id}</td>
                    </tr>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{selectedModel.name}</td>
                    </tr>
                    <tr>
                      <td><strong>File URI:</strong></td>
                      <td className="file-path">{selectedModel.fileUri}</td>
                    </tr>
                    <tr>
                      <td><strong>STL File:</strong></td>
                      <td className="file-path">
                        {selectedModel.stlFileUri || 'Not generated yet'}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Preview Image:</strong></td>
                      <td className="file-path">
                        {selectedModel.previewImageUri || 'Not generated yet'}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(selectedModel.status) }}
                        >
                          {getStatusEmoji(selectedModel.status)} {selectedModel.status}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Created:</strong></td>
                      <td>{new Date(selectedModel.createdAt).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td><strong>Updated:</strong></td>
                      <td>{new Date(selectedModel.updatedAt).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="jobs">
                <h3>Processing Jobs</h3>
                {selectedModel.jobs && selectedModel.jobs.length > 0 ? (
                  <div className="jobs-list">
                    {selectedModel.jobs.map((job) => (
                      <div key={job.id} className="job-card">
                        <div className="job-header">
                          <span className="job-type">
                            {job.jobType === 'stl_conversion'
                              ? '📦 STL Conversion'
                              : '🖼️ Preview Generation'}
                          </span>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(job.status) }}
                          >
                            {getStatusEmoji(job.status)} {job.status}
                          </span>
                        </div>
                        {job.errorMessage && (
                          <div className="error-message">❌ {job.errorMessage}</div>
                        )}
                        <div className="job-time">
                          {new Date(job.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No jobs for this model</p>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state-main">
              <h2>👈 Select a model to view details</h2>
              <p>Choose a model from the list or upload a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
