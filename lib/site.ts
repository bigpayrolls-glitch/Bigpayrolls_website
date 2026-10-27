export const site = {
  name: 'Big Payrolls',
  legalName: 'Big Payrolls Solution Private Limited',
  domain: 'bigpayrolls.com',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '[Phone number]',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '[Email address]',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  address: '[Office address]',
  cin: '[Your CIN]',
  gstin: '[Your GSTIN]',
};

/**
 * Photos for the website. Put a photo in /public/photos/ and set its path here,
 * e.g. heroTeam: '/photos/hero-team.jpg'. Leave as null to show the placeholder.
 */
export const photos: Record<string, string | null> = {
  heroTeam: null,
  heroEmployee: null,
  heroOwner: null,
  hrServices: null,
  techBuild: null,
  supportCall: null,
  industryRestaurant: null,
  industryRetail: null,
  industryHealthcare: null,
  industryManufacturing: null,
};
