import React from 'react';
import { Hero } from './Hero';
import { Features } from './Features';
import { HowItWorks } from './HowItWorks';
import { AIEngine } from './AIEngine';
import { WaitingLoungeSection } from './WaitingLoungeSection';
import { QueueManagementSection } from './QueueManagementSection';
import { AdminPortalSection } from './AdminPortalSection';
import { StudentPortalSection } from './StudentPortalSection';
import { AnalyticsSection } from './AnalyticsSection';
import { SecuritySection } from './SecuritySection';
import { TechStackSection } from './TechStackSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FAQSection } from './FAQSection';
import { MarketingFooter } from './MarketingFooter';

export const MarketingLanding: React.FC = () => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <Hero />
    <Features />
    <HowItWorks />
    <AIEngine />
    <WaitingLoungeSection />
    <QueueManagementSection />
    <AdminPortalSection />
    <StudentPortalSection />
    <AnalyticsSection />
    <SecuritySection />
    <TechStackSection />
    <TestimonialsSection />
    <FAQSection />
    <MarketingFooter />
  </div>
);
