import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, Smile, BarChart2, Star, Zap, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar, ShieldCheck, Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getMarketplaceInsights } from '@core/services';

const MarketplaceInsights = () => {
  const [data, setData] = useState({
    topPerforming: [],
    topCSAT: [],
    topGrowing: [],
    topRevenue: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('performing');

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await getMarketplaceInsights();
      if (res?.success) {
        setData({
          topPerforming: res.topPerforming || [],
          topCSAT: res.topCSAT || [],
          topGrowing: res.topGrowing || [],
          topRevenue: res.topRevenue || []
        });
      }
    } catch (err) {
      console.error('Error fetching marketplace insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-3xl font-black text-gray-900">Marketplace Insights</h2>
        <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
          Dynamic metrics scoring boutique quality index, customer satisfaction (CSAT), and revenue trajectories.
        </p>
      </div>

      {/* Tabs / Switcher */}
      <div className="bg-white p-2 rounded-2xl border border-gray-50 shadow-card flex flex-wrap gap-1">
        {[
          { id: 'performing', label: 'Top Performing', icon: Award },
          { id: 'csat', label: 'Customer Satisfaction (CSAT)', icon: Smile },
          { id: 'growing', label: 'Fastest Growing', icon: TrendingUp },
          { id: 'revenue', label: 'Highest Revenue', icon: BarChart2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3.5 text-xs md:text-sm font-extrabold rounded-xl transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 list */}
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-card col-span-1 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <h3 className="text-lg font-black text-gray-900 flex items-center space-x-2">
              <span>Leaderboard Rankings</span>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Top 5</span>
            </h3>
            <button 
              onClick={fetchInsights} 
              className="text-xs text-primary font-bold hover:underline flex items-center space-x-1"
            >
              <Activity size={12} className="animate-pulse" />
              <span>Recalculate live</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 font-bold">
              Compiling real-time ratings index...
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(() => {
                let list = [];
                let metricName = '';
                let metricKey = '';
                let unit = '';

                if (activeTab === 'performing') {
                  list = data.topPerforming;
                  metricName = 'Boutique Score';
                  metricKey = 'boutiqueScore';
                  unit = '/ 100';
                } else if (activeTab === 'csat') {
                  list = data.topCSAT;
                  metricName = 'CSAT Score';
                  metricKey = 'csatScore';
                  unit = '%';
                } else if (activeTab === 'growing') {
                  list = data.topGrowing;
                  metricName = 'MoM Growth';
                  metricKey = 'revenueGrowth';
                  unit = '%';
                } else if (activeTab === 'revenue') {
                  list = data.topRevenue;
                  metricName = 'Gross Revenue';
                  metricKey = 'totalRevenue';
                  unit = '₹';
                }

                if (list.length === 0) {
                  return (
                    <div className="py-8 text-center text-gray-400 font-bold">
                      No boutique metrics found. Ensure bookings and reviews are approved.
                    </div>
                  );
                }

                return list.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="py-4 flex items-center justify-between group first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border ${
                        idx === 0 
                          ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20' 
                          : idx === 1 
                          ? 'bg-gray-400 border-gray-500 text-white' 
                          : idx === 2 
                          ? 'bg-amber-700 border-amber-800 text-white' 
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}>
                        {idx + 1}
                      </div>

                      <div>
                        <p className="font-extrabold text-gray-900 group-hover:text-primary transition-colors text-base">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">Owner: {item.ownerName || 'Boutique Team'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{metricName}</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">
                        {metricKey === 'totalRevenue' 
                          ? `${unit}${Number(item[metricKey]).toLocaleString('en-IN')}` 
                          : `${item[metricKey]}${unit}`
                        }
                      </p>
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Dynamic scoring logic breakdown card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-card col-span-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center space-x-2 pb-2 border-b border-gray-50">
              <Zap size={18} className="text-primary" />
              <span>Scoring Weightings</span>
            </h3>
            
            <div className="space-y-4 text-xs font-semibold text-gray-600">
              <div className="space-y-2">
                <p className="font-black text-gray-800 flex justify-between">
                  <span>Boutique Score Index</span>
                  <span className="text-primary">100 Max</span>
                </p>
                <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                  <div className="flex justify-between"><span>⭐ Star Rating</span><span className="font-bold text-gray-800">40%</span></div>
                  <div className="flex justify-between"><span>📝 Reviews Volume</span><span className="font-bold text-gray-800">20%</span></div>
                  <div className="flex justify-between"><span>🎯 Booking Conversion</span><span className="font-bold text-gray-800">15%</span></div>
                  <div className="flex justify-between"><span>📈 Revenue Growth MoM</span><span className="font-bold text-gray-800">15%</span></div>
                  <div className="flex justify-between"><span>⚡ Response Time Avg</span><span className="font-bold text-gray-800">10%</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-black text-gray-800 flex justify-between">
                  <span>CSAT Index</span>
                  <span className="text-primary">100% Max</span>
                </p>
                <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                  <div className="flex justify-between"><span>💬 Moderated Ratings</span><span className="font-bold text-gray-800">40%</span></div>
                  <div className="flex justify-between"><span>🔁 Repeat Customer Rate</span><span className="font-bold text-gray-800">30%</span></div>
                  <div className="flex justify-between"><span>📅 Booking Completion</span><span className="font-bold text-gray-800">20%</span></div>
                  <div className="flex justify-between"><span>⚠️ Complaint Rate Factor</span><span className="font-bold text-gray-800">10%</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center space-x-3 mt-4">
            <Flame size={20} className="text-primary animate-bounce flex-shrink-0" />
            <p className="text-xs text-primary-dark font-medium leading-relaxed">
              Updates to bookings completion state or approving new reviews immediately recalculates these leaderboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceInsights;
