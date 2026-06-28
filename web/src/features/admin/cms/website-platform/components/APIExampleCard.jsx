import React, { useState } from 'react';
import { Shield, Key } from 'lucide-react';
import JSONViewer from './JSONViewer';

export default function APIExampleCard({ apiData, heading }) {
  const [activeTab, setActiveTab] = useState('response'); // 'request' | 'response'

  if (!apiData) return null;

  const getMethodColor = (method) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'POST': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PUT': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DELETE': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="border border-gray-150 rounded-3xl overflow-hidden bg-white shadow-sm text-left text-xs">
      {/* Header */}
      <div className="bg-gray-50/50 border-b border-gray-150 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 text-[10px] font-black border rounded-md uppercase tracking-wider ${getMethodColor(apiData.method)}`}>
            {apiData.method}
          </span>
          <span className="font-mono text-gray-800 font-bold">{apiData.endpoint}</span>
        </div>
        {heading && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{heading}</span>}
      </div>

      {/* Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side: Metadata info */}
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-gray-150 space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Authorization Details</span>
            <div className="flex flex-wrap gap-2 pt-1 font-bold text-[10px]">
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">
                <Shield size={12} className="text-gray-400" /> {apiData.authentication}
              </span>
              {apiData.permissions && (
                <span className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-lg border border-primary/10">
                  <Key size={12} className="text-primary/70" /> {apiData.permissions}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Future Validator Engine Rule</span>
            <p className="text-gray-500 leading-relaxed font-semibold text-[10px]">
              {apiData.validation}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Error Responses</span>
            <div className="space-y-1">
              {Object.keys(apiData.errors).map(code => (
                <div key={code} className="flex items-center gap-2 p-1.5 bg-red-50/20 border border-red-100/50 rounded-xl px-3 font-semibold text-[10px]">
                  <span className="font-bold text-red-600 w-8">{code}</span>
                  <span className="text-gray-600">{apiData.errors[code]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Payload Tabs */}
        <div className="p-5 flex flex-col bg-gray-50/20">
          <div className="flex border-b border-gray-100 pb-2 mb-3">
            <button
              onClick={() => setActiveTab('request')}
              className={`pb-1.5 px-3 text-[10px] font-bold border-b-2 -mb-[11px] transition-all ${
                activeTab === 'request' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Request Payload
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`pb-1.5 px-3 text-[10px] font-bold border-b-2 -mb-[11px] transition-all ml-2 ${
                activeTab === 'response' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Expected Response
            </button>
          </div>

          <div className="flex-1">
            {activeTab === 'request' ? (
              <JSONViewer jsonSchema={apiData.request} heading="Request Schema" />
            ) : (
              <JSONViewer jsonSchema={apiData.response} heading="Response Schema" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
