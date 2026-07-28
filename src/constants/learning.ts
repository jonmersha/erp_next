export const learningContent: Record<string, { title: string; description: string; howItWorks: string[] }> = {
  'dashboard': {
    title: 'Dashboard',
    description: 'The central hub for monitoring your food complex operations.',
    howItWorks: [
      'Provides a high-level overview of key performance indicators.',
      'Displays real-time alerts for inventory and production.',
      'Allows quick navigation to critical operational areas.'
    ]
  },
  'planning': {
    title: 'Planning & Forecasting',
    description: 'Manage production, procurement, and sales targets to optimize supply chain.',
    howItWorks: [
      'Set production targets for factories based on demand.',
      'Plan raw material procurement to ensure availability.',
      'Forecast sales to align production and procurement.'
    ]
  },
  'procurement': {
    title: 'Procurement',
    description: 'Manage suppliers and raw material acquisitions.',
    howItWorks: [
      'Create and manage purchase orders for raw materials.',
      'Maintain a database of approved suppliers.',
      'Track order status from pending to received.'
    ]
  },
  'inventory': {
    title: 'Inventory',
    description: 'Track raw materials and finished products across locations.',
    howItWorks: [
      'Monitor stock levels in real-time.',
      'Manage batch numbers and expiry dates.',
      'Transfer stock between warehouses and factories.'
    ]
  },
  'production': {
    title: 'Production',
    description: 'Oversee factory operations and production schedules.',
    howItWorks: [
      'Manage production runs and monitor progress.',
      'Track equipment usage and maintenance.',
      'Ensure production meets quality standards.'
    ]
  },
  'sales': {
    title: 'Sales',
    description: 'Manage customer orders and revenue.',
    howItWorks: [
      'Process sales orders from outlets.',
      'Track order status from pending to delivered.',
      'Monitor revenue and sales performance.'
    ]
  },
  // Add more as needed
};
