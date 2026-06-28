import React from 'react';
import { CMSPage } from '../../components';

export default function SubscriptionPlans() {
  return (
    <CMSPage 
      title="Subscription Plans Configurator"
      description="Manage SaaS tier features, page count limits, custom domain allocations, and storage thresholds."
      isPlaceholder={true}
      emptyTitle="No Plans Configured"
      emptyDescription="Establish subscription plans (Trial, Basic, Premium) to govern template distribution."
      emptyActionText="Add New Pricing Plan"
    />
  );
}
