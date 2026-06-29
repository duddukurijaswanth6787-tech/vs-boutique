import React, { useState, useEffect } from 'react';
import api from '../../../../../services/api';
import { Upload, ShieldCheck, AlertCircle, FileText, CheckCircle, RefreshCw, Server, ArrowRight, Activity, Clock } from 'lucide-react';

export default function UploadWebsite() {
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState('');
  
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchUploads, 3000); // Poll status every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [bpRes, uploadRes] = await Promise.all([
        api.get('/api/v1/cms/blueprints'),
        api.get('/api/v1/cms/projects')
      ]);

      if (bpRes.data?.success) {
        setBlueprints(bpRes.data.blueprints);
        if (bpRes.data.blueprints.length > 0) {
          setSelectedBlueprint(bpRes.data.blueprints[0].id);
        }
      }
      if (uploadRes.data?.success) {
        setUploads(uploadRes.data.uploads);
      }
    } catch (err) {
      console.error('Failed to load initial upload data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUploads = async () => {
    try {
      const res = await api.get('/api/v1/cms/projects');
      if (res.data?.success) {
        setUploads(res.data.uploads);
      }
    } catch (err) {
      console.error('Failed to poll uploads:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setUploadError('');
      } else {
        setUploadError('Only ZIP archives (.zip) are allowed.');
        setFile(null);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a ZIP file to upload.');
      return;
    }
    if (!selectedBlueprint) {
      setUploadError('Please select an associated blueprint preset.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('blueprintId', selectedBlueprint);

    try {
      const res = await api.post('/api/v1/cms/projects/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('zip-file-input');
        if (fileInput) fileInput.value = '';
        
        fetchUploads();
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const base = 'px-2.5 py-0.5 rounded-full text-xs font-bold border ';
    switch (status) {
      case 'COMPLETED':
        return `${base} bg-green-50 text-green-700 border-green-200`;
      case 'FAILED':
        return `${base} bg-red-50 text-red-700 border-red-200`;
      case 'SCANNING':
      case 'EXTRACTING':
        return `${base} bg-blue-50 text-blue-700 border-blue-200 animate-pulse`;
      default:
        return `${base} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  const getVirusBadge = (scan) => {
    const base = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ';
    if (scan === 'CLEAN') return `${base} bg-emerald-50 text-emerald-700 border border-emerald-100`;
    if (scan === 'INFECTED') return `${base} bg-red-50 text-red-700 border border-red-100`;
    return `${base} bg-gray-50 text-gray-500`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Upload className="text-primary w-7 h-7" />
            ZIP Ingestion Sandbox
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit externally compiled website code archives to the secure extraction and threat evaluation pipeline.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Upload Drag & Drop Ingestor Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-800 text-sm">Submit New Codebase</h3>
              
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Blueprint selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Target Blueprint</label>
                  <select
                    value={selectedBlueprint}
                    onChange={(e) => setSelectedBlueprint(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-150 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none hover:bg-gray-100/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    {blueprints.map(bp => (
                      <option key={bp.id} value={bp.id}>{bp.name} ({bp.key})</option>
                    ))}
                  </select>
                </div>

                {/* File picker */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ZIP Archive</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-gray-50/50 relative cursor-pointer group">
                    <input
                      id="zip-file-input"
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileText className="mx-auto w-8 h-8 text-gray-400 group-hover:text-primary transition-colors mb-2" />
                    {file ? (
                      <div className="text-xs font-bold text-gray-800 line-clamp-1">{file.name}</div>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-gray-600">Drag or click to select archive</div>
                        <div className="text-[10px] text-gray-400 mt-1">ZIP packages only (max 50MB)</div>
                      </>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="w-full bg-primary hover:bg-primary-light text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="animate-spin w-4 h-4" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Upload & Verify
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Ingestion Monitor Log Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Sandbox Ingestion Monitor
                </h3>
                <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Live polling
                </span>
              </div>

              {uploads.length === 0 ? (
                <div className="p-16 text-center text-gray-400">
                  <Server className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold">No codebase submissions found</p>
                  <p className="text-xs text-gray-400 mt-1">Submit a ZIP archive to kick off the threat checks.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase bg-gray-50/20">
                        <th className="p-4 pl-6">Archive Package</th>
                        <th className="p-4">Virus Scan</th>
                        <th className="p-4">Sandbox Status</th>
                        <th className="p-4 pr-6 text-right">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {uploads.map(u => (
                        <tr key={u.id} className="hover:bg-gray-55/20 transition-colors">
                          <td className="p-4 pl-6 max-w-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-gray-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-800 truncate">{u.filename}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{(u.sizeBytes / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {getVirusBadge(u.virusScanResult)}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={getStatusBadge(u.status)}>{u.status}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{u.progressPercent}%</span>
                              </div>
                              {u.sandboxPath && (
                                <div className="text-[9px] text-gray-400 truncate max-w-[200px]" title={u.sandboxPath}>
                                  Path: ...{u.sandboxPath.slice(-30)}
                                </div>
                              )}
                              {u.errorDetails && (
                                <div className="text-[9px] text-red-500 font-bold leading-normal max-w-[200px]">
                                  {u.errorDetails}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 pr-6 text-right text-gray-400 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
