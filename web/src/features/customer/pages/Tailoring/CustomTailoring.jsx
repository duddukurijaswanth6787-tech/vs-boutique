import React from 'react';
import CustomerLayout from '../../../../components/CustomerLayout';
import InteractiveTailoringHub from '../../../../components/InteractiveTailoringHub';

const CustomTailoring = () => {
  return (
    <CustomerLayout>
      <div className="bg-background min-h-screen py-6">
        <InteractiveTailoringHub />
      </div>
    </CustomerLayout>
  );
};

export default CustomTailoring;
