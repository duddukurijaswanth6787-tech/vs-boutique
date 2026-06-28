import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const DangerZoneTab = ({ handleSoftDeleteBoutique }) => {
    return (
        <div className="max-w-2xl mx-auto py-10 space-y-10">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-100/50">
                    <AlertTriangle size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Danger Zone</h3>
                    <p className="text-gray-500 font-medium">Critical actions that affect the boutique's visibility and data.</p>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border-2 border-red-100 shadow-xl shadow-red-50/50 overflow-hidden">
                <div className="p-10 space-y-8">
                    <div className="flex items-start space-x-6">
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex-shrink-0">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-gray-900 mb-1 uppercase tracking-tight">Delete Boutique</h4>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                This will soft-delete the boutique from the platform. All linked owners will lose access immediately. 
                                The boutique will no longer appear on the mobile app for customers.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-red-50">
                        <button 
                            onClick={handleSoftDeleteBoutique}
                            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                        >
                            Deactivate & Delete Boutique
                        </button>
                    </div>
                </div>
                <div className="bg-red-50/50 p-6 text-center">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Action requires "DELETE" text confirmation</p>
                </div>
            </div>
        </div>
    );
};

export default DangerZoneTab;
