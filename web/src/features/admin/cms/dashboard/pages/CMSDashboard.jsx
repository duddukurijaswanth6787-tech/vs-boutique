import React from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Play, Globe, Activity, Cpu, Clock, RefreshCw, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CMSPage, CMSStatsCard, CMSCard, CMSBadge, CMSStatusChip, CMSDataTable } from '../../components';

export default function CMSDashboard() {
  const mockActivities = [
    { id: 1, type: 'certification', title: 'AI Certification Passed', desc: "Template 'Boutique Luxe' version 1.2.0 passed rules evaluation.", time: '10 mins ago', status: 'passed' },
    { id: 2, type: 'upload', title: 'New Codebase Uploaded', desc: 'ZIP archive uploaded for boutique theme template.', time: '1 hour ago', status: 'pending' },
    { id: 3, type: 'deployment', title: 'Preview Generated', desc: 'Staging deployment preview generated for template ID #4928.', time: '3 hours ago', status: 'passed' },
    { id: 4, type: 'health', title: 'Degraded Endpoint Detected', desc: "Boutique storefront API check failed at '/products/details'.", time: '5 hours ago', status: 'failed' },
    { id: 5, type: 'domain', title: 'Domain Verification Failed', desc: 'DNS CNAME verification failed for brand boutique subdomain.', time: '1 day ago', status: 'failed' }
  ];

  return (
    <CMSPage 
      title="CMS Workspace Overview"
      description="Monitor website certifications, check build results, manage active domains, and review live website health statistics."
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
        <CMSStatsCard 
          label="Uploaded Websites" 
          value="42" 
          icon={UploadCloud} 
          trend={12} 
          isPositive={true} 
          delay={0.05} 
        />
        <CMSStatsCard 
          label="Certified Templates" 
          value="18" 
          icon={CheckCircle2} 
          trend={8} 
          isPositive={true} 
          delay={0.1} 
        />
        <CMSStatsCard 
          label="Pending Audits" 
          value="5" 
          icon={AlertCircle} 
          trend={-15} 
          isPositive={true} 
          delay={0.15} 
        />
        <CMSStatsCard 
          label="Live Sites" 
          value="12" 
          icon={Play} 
          trend={4} 
          isPositive={true} 
          delay={0.2} 
        />
        <CMSStatsCard 
          label="Custom Domains" 
          value="8" 
          icon={Globe} 
          trend={0} 
          isPositive={true} 
          delay={0.25} 
        />
        <CMSStatsCard 
          label="Health Avg" 
          value="98.2%" 
          icon={Activity} 
          trend={0.5} 
          isPositive={true} 
          delay={0.3} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities Panel */}
        <div className="lg:col-span-2">
          <CMSCard title="Recent Workspace Activity" subtitle="Real-time execution log of imports, compilation validation, and AI checks.">
            <div className="space-y-4">
              {mockActivities.map((act) => (
                <div key={act.id} className="flex items-start space-x-4 p-3.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="mt-0.5">
                    <CMSStatusChip status={act.status} label={act.status.toUpperCase()} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{act.title}</h4>
                      <span className="text-xs text-gray-400 font-semibold">{act.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CMSCard>
        </div>

        {/* AI & Resource Usage Panel */}
        <div className="space-y-8">
          <CMSCard title="AI Agent Usage" subtitle="Token volume consumptions in this billing cycle.">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                  <span>Static Rule Engine Scans</span>
                  <span>1,420 / 5,000 runs</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '28.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                  <span>AI Audit Tokens (Claude / GPT)</span>
                  <span>8.4M / 20M tokens</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-accent h-full rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                  <span>Cloud Staging Storage</span>
                  <span>2.4 GB / 10 GB</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '24%' }} />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl flex items-center space-x-3.5 border border-gray-100 mt-2">
                <div className="p-2.5 bg-primary/5 rounded-lg text-primary">
                  <Cpu size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">Orchestrator Health</h5>
                  <p className="text-xs text-green-600 font-bold mt-0.5">Active & Ready</p>
                </div>
              </div>
            </div>
          </CMSCard>

          <CMSCard title="Fast Actions" subtitle="Frequently used tasks">
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 rounded-2xl text-center transition-all cursor-pointer group">
                <UploadCloud size={20} className="text-gray-400 group-hover:text-primary mb-2 transition-colors" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-primary">Upload ZIP</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 rounded-2xl text-center transition-all cursor-pointer group">
                <RefreshCw size={20} className="text-gray-400 group-hover:text-primary mb-2 transition-colors" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-primary">Check Health</span>
              </button>
            </div>
          </CMSCard>
        </div>
      </div>
    </CMSPage>
  );
}
