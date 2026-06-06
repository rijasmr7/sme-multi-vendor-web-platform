import React from 'react';
import { Trophy } from 'lucide-react';

const TopProducts = ({ products }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-500">
          <Trophy size={20} />
        </div>
        <h3 className="text-lg font-semibold text-white">Top Products</h3>
      </div>
      
      <div className="flex flex-col gap-4">
        {products && products.length > 0 ? (
          products.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-slate-500 w-6">#{index + 1}</span>
                <div>
                  <p className="text-white font-medium capitalize">{product.name.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-slate-400">{product.orders} Orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-brand">{product.views}</p>
                <p className="text-xs text-slate-400">Views</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400">
            No product data available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProducts;
