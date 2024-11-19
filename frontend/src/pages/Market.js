

import React from 'react';
import MarketModal from '../components/MarketModal';

const commonContainerClass = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200";

export const Market = () => (
  <div className={commonContainerClass}>
    <MarketModal />
  </div>
);

export default Market;
