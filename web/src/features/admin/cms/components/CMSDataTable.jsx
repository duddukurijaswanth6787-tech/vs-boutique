import React from 'react';

export default function CMSDataTable({ headers = [], children, emptyText = 'No data available' }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-100">
              {headers.map((header, idx) => (
                <th 
                  key={idx} 
                  className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {React.Children.count(children) === 0 ? (
              <tr>
                <td 
                  colSpan={headers.length || 1} 
                  className="px-6 py-10 text-center text-sm text-gray-400 font-medium"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
