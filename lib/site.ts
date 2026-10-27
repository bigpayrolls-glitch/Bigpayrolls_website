export const site = {
  name: 'Big Payrolls',
  legalName: 'Big Payrolls Solution Private Limited',
  domain: 'bigpayrolls.com',
  // Leave empty until ready: empty values are simply not shown on the site.
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  address: '',
  cin: 'U78100KA2025PTC205573',
  gstin: '',
};

/** How to reach us in policy text: the email if set, otherwise the website. */
export const contactLine = () =>
  site.email ? `by email at ${site.email}` : 'through the contact options on bigpayrolls.com or your client dashboard';

/**
 * Photos for the website. Put a photo in /public/photos/ and set its path here,
 * e.g. heroTeam: '/photos/hero-team.jpg'. Leave as null to show the placeholder.
 */
export const photos: Record<string, string | null> = {
  heroTeam: '/photos/hero-team.jpg',
  heroEmployee: '/photos/hero-employee.jpg',
  heroOwner: '/photos/hero-handshake.jpg',
  hrServices: '/photos/hr-services.jpg',
  techBuild: '/photos/tech-build.jpg',
  supportCall: '/photos/support-call.jpg',
  industryRestaurant: '/photos/industry-restaurant.jpg',
  industryRetail: '/photos/industry-retail.jpg',
  industryHealthcare: '/photos/industry-healthcare.jpg',
  industryManufacturing: '/photos/industry-manufacturing.jpg',
};
