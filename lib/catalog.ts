// What clients can choose in the "Get started" wizard. Edit freely.

export const SERVICES = [
  { id: 'website', t: 'Website', d: 'Business site, landing page, portfolio' },
  { id: 'ordering', t: 'Online ordering or booking', d: 'Orders, appointments, reservations' },
  { id: 'app', t: 'Mobile app', d: 'Android and iOS apps' },
  { id: 'software', t: 'Custom software', d: 'Dashboards, CRM, billing, internal tools' },
  { id: 'payroll', t: 'Payroll processing', d: 'Salaries, payslips, reimbursements' },
  { id: 'compliance', t: 'PF, ESI and compliance', d: 'Returns, challans, PT, LWF, gratuity' },
  { id: 'hiring', t: 'Recruitment and staffing', d: 'Find, screen and onboard people' },
  { id: 'pfmitra', t: 'PF Mitra', d: 'Our PF management product' },
  { id: 'atg', t: 'Auto Talent Grid', d: 'Our AI hiring product' },
  { id: 'branding', t: 'Branding and logo', d: 'Logo, colours, brand kit' },
  { id: 'marketing', t: 'Digital marketing and SEO', d: 'Google ranking, social media' },
  { id: 'hosting', t: 'Hosting and maintenance', d: 'Domain, hosting, monthly support' },
] as const;

export const INDUSTRIES = [
  { id: 'food', t: 'Hotel and restaurant', d: 'Restaurants, cafes, cloud kitchens' },
  { id: 'retail', t: 'Retail and shop', d: 'Clothing, grocery, electronics' },
  { id: 'health', t: 'Healthcare', d: 'Clinics, hospitals, labs, pharmacy' },
  { id: 'edu', t: 'Education and coaching', d: 'Schools, coaching, courses' },
  { id: 'salon', t: 'Salon and spa', d: 'Salons, spas, beauty parlours' },
  { id: 'realty', t: 'Real estate', d: 'Builders, agents, rentals' },
  { id: 'fit', t: 'Gym and fitness', d: 'Gyms, yoga, sports academies' },
  { id: 'mfg', t: 'Manufacturing', d: 'Factories, workshops, contract staff' },
  { id: 'pro', t: 'Professional services', d: 'CA, lawyers, consultants, IT' },
  { id: 'other', t: 'Other', d: 'Logistics, travel, events, NGO' },
] as const;

export const TYPES: Record<string, string[]> = {
  food: ['Restaurant (dine-in)', 'Cloud kitchen', 'Hotel with rooms', 'Cafe or bakery', 'Sweet shop', 'Catering'],
  retail: ['Clothing and fashion', 'Grocery or supermarket', 'Electronics', 'Jewellery', 'Furniture', 'Wholesale or distributor'],
  health: ['Clinic', 'Hospital', 'Diagnostic lab', 'Pharmacy', 'Dental clinic', 'Physiotherapy'],
  edu: ['School', 'Coaching centre', 'College', 'Online courses', 'Play school', 'Training institute'],
  salon: ['Salon', 'Spa', 'Beauty parlour', 'Salon chain', 'Bridal studio'],
  realty: ['Builder or developer', 'Property agent', 'Rentals and PG', 'Interior designer'],
  fit: ['Gym', 'Yoga studio', 'Sports academy', 'Dance studio', 'Personal trainer'],
  mfg: ['Factory', 'Workshop', 'Packaging', 'Textiles', 'Food processing'],
  pro: ['CA or accounting', 'Law firm', 'Consultant', 'Marketing agency', 'IT services'],
  other: ['Logistics', 'Travel agency', 'Event management', 'NGO or trust', 'Something else'],
};

export const COMMON_FEATURES = [
  'WhatsApp chat button',
  'Enquiry or contact form',
  'Google Maps and location',
  'Photo gallery',
  'Admin dashboard',
  'Online payment (UPI, cards)',
  'SEO and Google listing',
  'Domain and hosting',
];

export const INDUSTRY_FEATURES: Record<string, string[]> = {
  food: ['Online food ordering', 'Table reservation', 'Room booking', 'Menu and price management', 'Kitchen order screen', 'Offers and coupons'],
  retail: ['Product catalogue', 'Shopping cart and checkout', 'Stock and inventory', 'Delivery tracking', 'Offers and coupons'],
  health: ['Appointment booking', 'Doctor profiles', 'Patient records', 'Report download', 'Reminders by SMS or WhatsApp'],
  edu: ['Admission form', 'Course listing', 'Student login', 'Fee payment', 'Attendance and results'],
  salon: ['Appointment booking', 'Service menu and prices', 'Staff schedule', 'Memberships and packages'],
  realty: ['Property listings', 'Search and filters', 'Site visit booking', 'Lead management (CRM)'],
  fit: ['Membership plans', 'Class schedule', 'Trainer profiles', 'Attendance tracking'],
  mfg: ['Contract staff payroll', 'Shift and attendance', 'Product catalogue', 'Dealer enquiries'],
  pro: ['Service pages', 'Lead capture', 'Client portal', 'Invoicing and billing'],
  other: ['Lead capture', 'Customer login', 'Booking or orders', 'Reports'],
};

export const BUDGETS = ['Under ₹20,000', '₹20,000 – 40,000', '₹40,000 – 75,000', '₹75,000+', 'Not sure yet'];
export const TIMELINES = ['Urgent (2 weeks)', 'Within 1 month', 'Flexible'];
export const CALL_SLOTS = ['10:30 AM', '12:00 PM', '3:00 PM', '5:00 PM', '6:30 PM'];
export const CALL_MODES = ['Phone call', 'WhatsApp call', 'Google Meet'];

export const INTERESTS = [
  { id: 'hr', t: 'HR and payroll services', d: 'Payroll, PF, ESI, compliance' },
  { id: 'tech', t: 'Tech build', d: 'Website, app or software' },
  { id: 'pfmitra', t: 'PF Mitra', d: 'PF management product' },
  { id: 'atg', t: 'Auto Talent Grid', d: 'AI hiring product' },
];

export const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

/** Request status flow, shown to clients in their dashboard. */
export const STATUS_FLOW = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'call_scheduled', label: 'Call scheduled' },
  { id: 'quote_sent', label: 'Quote ready' },
  { id: 'accepted', label: 'Accepted and paid' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'live', label: 'Live' },
] as const;

export function statusLabel(id: string) {
  if (id === 'changes_requested') return 'Changes requested';
  if (id === 'cancelled') return 'Cancelled';
  return STATUS_FLOW.find((s) => s.id === id)?.label ?? id;
}

/** Next 6 days, skipping Sundays, as labels like "Wed 28 Oct". */
export function nextCallDays(from = new Date(), count = 6) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const out: { iso: string; label: string }[] = [];
  const d = new Date(from);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ iso, label: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}` });
  }
  return out;
}
