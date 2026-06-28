import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const pathMap = {
  admin: 'Super Admin',
  cms: 'CMS',
  dashboard: 'Dashboard',
  blueprint: 'Website Blueprint',
  standards: 'Website Standards',
  sdk: 'Template SDK',
  'prompt-library': 'Prompt Library',
  'requirement-generator': 'AI Requirement Generator',
  upload: 'Upload Website',
  templates: 'Template Library',
  certification: 'AI Certification',
  reports: 'Validation Reports',
  rules: 'Certification Rules',
  subscriptions: 'Subscription Plans',
  'feature-flags': 'Feature Flags',
  domains: 'Domains',
  deployment: 'Deployment',
  health: 'Website Health',
  settings: 'Settings'
};

export default function CMSBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-secondaryText mb-4">
      <Link
        to="/admin/command-center"
        className="flex items-center hover:text-primary transition-colors text-gray-500"
      >
        <Home size={14} className="mr-1" />
        Admin
      </Link>
      
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const displayName = pathMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

        // Hide "admin" segment if we already have the Home link
        if (value === 'admin') return null;

        return (
          <React.Fragment key={to}>
            <ChevronRight size={12} className="text-gray-400" />
            {last ? (
              <span className="text-primary font-bold">{displayName}</span>
            ) : (
              <Link
                to={to === '/admin/cms' ? '/admin/cms/dashboard' : to}
                className="hover:text-primary transition-colors text-gray-500"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
