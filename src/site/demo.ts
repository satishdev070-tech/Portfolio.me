import type { Collections, ProfileDoc, SiteDocument, SiteSection, TemplateConfig } from './types'

// Sample content for template previews ("live demo"). Keyed by templates.demo_profile_key.
// Names and organizations are fictional.

type Demo = { profile: Partial<ProfileDoc> & { full_name: string }; collections: Partial<Collections>; content?: Record<string, Record<string, unknown>> }

let n = 0
const id = () => `demo-${++n}`
const img = (i: number, base: string) => `${base}/demo/work-${i}.svg`

const BASE: Collections = {
  experiences: [], education: [], skills: [], services: [], projects: [], publications: [], awards: [], certifications: [],
  testimonials: [], social_links: [], locations: [], achievements: [], media: [],
}

function exp(title: string, organization: string, start: string, end: string | null, description: string, highlights: string[] = []) {
  return { id: id(), title, organization, employment_type: 'full_time', location: null, start_date: start, end_date: end, is_current: !end, description, highlights }
}
function edu(degree: string, institution: string, start: string, end: string, field: string | null = null) {
  return { id: id(), institution, degree, field_of_study: field, start_date: start, end_date: end, grade: null, description: null }
}
function svc(title: string, description: string, price_text: string | null = null, duration_text: string | null = null) {
  return { id: id(), title, description, price_text, duration_text, cta_label: null, cta_url: null }
}
function quote(author_name: string, author_title: string, q: string, rating: number | null = 5) {
  return { id: id(), author_name, author_title, author_org: null, quote: q, rating, avatar_url: null }
}
const skills = (list: string[], category: string | null = null) => list.map((name) => ({ id: id(), name, category, level: 4 }))
const social = (platform: string, url: string) => ({ id: id(), platform, url, label: null })
const stat = (metric: string, title: string) => ({ id: id(), title, metric, description: null, achieved_on: null })

function demos(base: string): Record<string, Demo> {
  return {
    professional: {
      profile: { full_name: 'Ananya Iyer', headline: 'Product Operations Lead', bio_short: 'I help product teams ship reliably: planning, process and the unglamorous work in between.', city: 'Bengaluru', region: 'Karnataka', years_experience: 9 },
      collections: {
        experiences: [exp('Product Operations Lead', 'Northwind Labs', '2021-04-01', null, 'Run planning and release operations for a 60-person product org.', ['Cut release lead time from 3 weeks to 6 days', 'Introduced quarterly planning used by 8 teams']), exp('Program Manager', 'Kestrel Systems', '2017-06-01', '2021-03-01', 'Delivered cross-team programmes for the payments platform.')],
        education: [edu('MBA', 'Indian Institute of Management, Kozhikode', '2015-06-01', '2017-04-01'), edu('B.E.', 'PES University', '2010-08-01', '2014-05-01', 'Computer Science')],
        skills: skills(['Program management', 'OKRs', 'SQL', 'Stakeholder management', 'Process design']),
        projects: [{ id: id(), title: 'Release train', role: 'Lead', description: 'Weekly release cadence across web and mobile.', url: null, image_url: null, tags: ['process'], start_date: '2022-01-01', end_date: null, is_featured: true }],
        testimonials: [quote('Rahul Menon', 'VP Product, Northwind', 'Ananya made our releases boring, in the best possible way.')],
        social_links: [social('linkedin', 'https://www.linkedin.com/in/example')],
      },
    },
    doctor: {
      profile: { full_name: 'Dr. Asha Rao', headline: 'Consultant Interventional Cardiologist', tagline: 'Evidence-based heart care, explained clearly.', bio_short: 'Cardiologist with 14 years of experience in angioplasty, heart-failure care and preventive cardiology.', bio_long: 'I am a consultant interventional cardiologist in Pune with 14 years of experience. I focus on angioplasty, heart-failure management and preventive cardiology.\n\nI believe patients deserve clear explanations and a plan they understand, not just a prescription.', city: 'Pune', region: 'Maharashtra', years_experience: 14, phone: '+91 98765 43210', email: 'clinic@example.com', languages: ['English', 'Hindi', 'Marathi'] },
      collections: {
        services: [svc('Cardiac consultation', 'Assessment of chest pain, breathlessness, palpitations and blood pressure.', '₹1,000', '30 min'), svc('Angioplasty', 'Coronary angioplasty and stenting, with a clear plan before and after the procedure.'), svc('Preventive heart check-up', 'ECG, echo and lipid review with a personalised risk plan.', '₹2,500')],
        experiences: [exp('Consultant Cardiologist', 'Sahyadri Heart Institute', '2016-01-01', null, 'Interventional cardiology, cath lab and heart-failure clinic.'), exp('Senior Resident, Cardiology', 'KEM Hospital, Mumbai', '2012-08-01', '2015-12-01', 'DM residency with a focus on interventions.')],
        education: [edu('DM Cardiology', 'Seth GS Medical College & KEM Hospital', '2012-08-01', '2015-07-01'), edu('MD Medicine', 'BJ Medical College, Pune', '2009-06-01', '2012-05-01'), edu('MBBS', 'BJ Medical College, Pune', '2003-08-01', '2009-02-01')],
        certifications: [{ id: id(), name: 'Fellow, Cardiological Society of India', issuer: 'CSI', issued_on: '2018-01-01', expires_on: null, credential_id: null, credential_url: null }],
        awards: [{ id: id(), title: 'Young Investigator Award', issuer: 'Cardiological Society of India', awarded_on: '2017-11-01', description: null, url: null }],
        testimonials: [quote('Suresh K.', 'Patient', 'Dr. Rao explained everything patiently. I knew exactly what to expect before my procedure.'), quote('Meera P.', 'Patient’s daughter', 'Calm, thorough and kind. We felt in safe hands.')],
        locations: [{ id: id(), label: 'Sahyadri Heart Institute', address_line: 'Karve Road, Erandwane', city: 'Pune', region: 'Maharashtra', country_code: 'IN', postal_code: '411004', phone: '+91 20 1234 5678', hours: 'Mon–Sat, 10am–2pm', map_url: null, is_service_area: false, is_primary: true }],
        achievements: [stat('5,000+', 'Patients treated'), stat('1,200+', 'Angioplasties'), stat('14', 'Years in practice')],
      },
      content: { specialization: { items: [{ title: 'Interventional cardiology', description: 'Angioplasty and stenting for blocked arteries.' }, { title: 'Heart failure', description: 'Long-term management and medication optimisation.' }] }, appointments: { note: 'Appointments are confirmed by phone within one working day.' } },
    },
    lawyer: {
      profile: { full_name: 'Adv. Kabir Malhotra', headline: 'Advocate, Delhi High Court · Commercial & Arbitration', bio_short: 'Twelve years advising companies and founders on commercial disputes, arbitration and contracts.', bio_long: 'I am an advocate enrolled with the Bar Council of Delhi, practising before the Delhi High Court and arbitral tribunals.\n\nMy practice focuses on commercial disputes, domestic and international arbitration, and contract advisory for growing companies.', city: 'New Delhi', years_experience: 12, email: 'chambers@example.com' },
      collections: {
        services: [svc('Commercial litigation', 'Representation in contract, recovery and shareholder disputes.'), svc('Arbitration', 'Domestic and international arbitration, including emergency relief.'), svc('Contract advisory', 'Drafting and review of commercial agreements.')],
        experiences: [exp('Independent Practice', 'Chambers of Kabir Malhotra', '2018-04-01', null, 'Commercial litigation and arbitration.'), exp('Associate', 'Lex & Partners', '2013-07-01', '2018-03-01', 'Disputes team.')],
        education: [edu('LL.M.', 'National Law School of India University', '2012-07-01', '2013-06-01', 'Business Law'), edu('B.A. LL.B. (Hons.)', 'Faculty of Law, University of Delhi', '2007-07-01', '2012-05-01')],
        awards: [{ id: id(), title: 'Recognised Practitioner, Dispute Resolution', issuer: 'Legal 500 India', awarded_on: '2023-01-01', description: null, url: null }],
      },
      content: { specialization: { items: [{ title: 'Commercial disputes', description: 'Contract, recovery and shareholder disputes.' }, { title: 'Arbitration', description: 'SIAC, ICC and ad hoc arbitrations seated in India.' }] } },
    },
    professor: {
      profile: { full_name: 'Prof. Meenakshi Sundaram', headline: 'Professor of Archaeology, Department of Ancient History', bio_short: 'I study early historic urbanism in the Ganga plain through excavation, epigraphy and ceramic analysis.', city: 'Varanasi', years_experience: 22 },
      collections: {
        publications: [
          { id: id(), title: 'Early historic settlements of the middle Ganga plain: a ceramic perspective', authors: 'Sundaram M., Verma R.', venue: 'Journal of South Asian Archaeology', published_on: '2023-03-01', pub_type: 'journal', url: null, doi: '10.1000/jsaa.2023.014', abstract: null },
          { id: id(), title: 'Inscriptions of Kashi: a corpus', authors: 'Sundaram M.', venue: 'Oxford University Press', published_on: '2019-01-01', pub_type: 'book', url: null, doi: null, abstract: null },
          { id: id(), title: 'Stratigraphy at Kurdi: new radiocarbon dates', authors: 'Sundaram M., Khan A., Das P.', venue: 'Puratattva', published_on: '2021-06-01', pub_type: 'article', url: null, doi: null, abstract: null },
        ],
        education: [edu('Ph.D.', 'Banaras Hindu University', '1998-07-01', '2003-05-01', 'Ancient Indian History & Archaeology'), edu('M.A.', 'Deccan College, Pune', '1996-07-01', '1998-05-01', 'Archaeology')],
        projects: [{ id: id(), title: 'Kurdi excavation', role: 'Director', description: 'Multi-season excavation of a Painted Grey Ware settlement.', url: null, image_url: img(1, base), tags: ['excavation'], start_date: '2021-01-01', end_date: null, is_featured: true }],
        awards: [{ id: id(), title: 'Tagore National Fellowship', issuer: 'Ministry of Culture', awarded_on: '2018-01-01', description: null, url: null }],
      },
      content: {
        research: { items: [{ title: 'Early historic urbanism', description: 'Settlement hierarchies and craft production in the Ganga plain.' }, { title: 'Epigraphy', description: 'Brahmi and Nagari inscriptions of the Varanasi region.' }] },
        teaching: { items: [{ title: 'Field Methods in Archaeology', subtitle: 'M.A., Semester II' }, { title: 'Indian Epigraphy', subtitle: 'M.A., Semester III' }] },
        speaking: { items: [{ title: 'Keynote: Cities before the Mauryas', subtitle: 'Indian Archaeological Society', date: '2024' }] },
      },
    },
    'software-engineer': {
      profile: { full_name: 'Arjun Mehta', headline: 'Senior Software Engineer · Distributed systems', bio_short: 'I build reliable backend systems and the tools that make other engineers faster.', city: 'Hyderabad', years_experience: 8 },
      collections: {
        experiences: [exp('Senior Software Engineer', 'Lattice Payments', '2021-02-01', null, 'Own the ledger service processing 4M transactions a day.', ['Designed an idempotent ledger with exactly-once posting', 'Cut p99 latency by 62%']), exp('Software Engineer', 'Quasar Analytics', '2017-07-01', '2021-01-01', 'Built the ingestion pipeline and query API.')],
        projects: [
          { id: id(), title: 'pgqueue', role: 'Author', description: 'A small, fast job queue on Postgres SKIP LOCKED.', url: 'https://github.com/example/pgqueue', image_url: img(5, base), tags: ['Go', 'Postgres'], start_date: '2022-01-01', end_date: null, is_featured: true },
          { id: id(), title: 'Tracekit', role: 'Maintainer', description: 'OpenTelemetry helpers for Go services.', url: null, image_url: img(2, base), tags: ['Go', 'Observability'], start_date: '2020-01-01', end_date: null, is_featured: false },
        ],
        skills: [...skills(['Go', 'TypeScript', 'Rust'], 'Languages'), ...skills(['Postgres', 'Kafka', 'Kubernetes'], 'Infrastructure')],
        education: [edu('B.Tech', 'IIIT Hyderabad', '2013-07-01', '2017-05-01', 'Computer Science')],
        social_links: [social('github', 'https://github.com/example'), social('linkedin', 'https://www.linkedin.com/in/example')],
      },
    },
    researcher: {
      profile: { full_name: 'Dr. Farah Siddiqui', headline: 'Research Scientist · Climate & Agriculture', bio_short: 'I model how changing monsoons affect smallholder farming, and what helps farmers adapt.', city: 'New Delhi' },
      collections: {
        publications: [
          { id: id(), title: 'Monsoon variability and smallholder yields in central India', authors: 'Siddiqui F., Rao P.', venue: 'Nature Food', published_on: '2024-02-01', pub_type: 'journal', url: null, doi: '10.1000/nf.2024.11', abstract: null },
          { id: id(), title: 'Weather-index insurance uptake: evidence from Maharashtra', authors: 'Siddiqui F.', venue: 'World Development', published_on: '2022-09-01', pub_type: 'journal', url: null, doi: null, abstract: null },
        ],
        projects: [{ id: id(), title: 'Monsoon Futures', role: 'Principal investigator', description: 'Five-year study across 1,200 farms.', url: null, image_url: null, tags: ['climate'], start_date: '2021-01-01', end_date: null, is_featured: true }],
        education: [edu('Ph.D.', 'Indian Institute of Science', '2012-08-01', '2017-06-01', 'Climate Science')],
        awards: [{ id: id(), title: 'INSA Young Scientist Medal', issuer: 'Indian National Science Academy', awarded_on: '2022-01-01', description: null, url: null }],
      },
      content: { research: { items: [{ title: 'Climate adaptation', description: 'Which interventions change outcomes for smallholders.' }, { title: 'Crop modelling', description: 'Coupling crop and climate models at district scale.' }] } },
    },
    designer: {
      profile: { full_name: 'Isha Kapoor', headline: 'Independent brand & product designer', bio_short: 'Identity systems and product design for companies that care about craft.', city: 'Mumbai' },
      collections: {
        projects: [1, 2, 3, 4].map((i) => ({ id: id(), title: ['Saffron Bank identity', 'Monsoon app', 'Kiln ceramics', 'Atlas type study'][i - 1], role: ['Brand', 'Product', 'Packaging', 'Type'][i - 1], description: 'Identity, guidelines and launch.', url: null, image_url: img(i, base), tags: [], start_date: null, end_date: null, is_featured: true })),
        media: [3, 4, 6].map((i) => ({ id: id(), kind: 'image' as const, title: null, caption: null, url: img(i, base), mime_type: 'image/svg+xml', width: 800, height: 600, alt: 'Studio work' })),
        services: [svc('Brand identity', 'Strategy, logo, type and colour systems.', 'From ₹2,50,000'), svc('Product design', 'Research-led UI for web and mobile.')],
        testimonials: [quote('Nikhil Rao', 'Founder, Kiln', 'Isha understood the brand better than we did.')],
      },
    },
    politician: {
      profile: { full_name: 'Shri Vikram Patil', headline: 'Member of Legislative Assembly, Kothrud', bio_short: 'Working for better public transport, cleaner water and safer streets in Kothrud.', city: 'Pune' },
      collections: {
        achievements: [stat('42 km', 'New water pipelines'), stat('18', 'Schools renovated'), stat('3', 'Public health centres')],
        projects: [{ id: id(), title: 'Clean Water Kothrud', role: null, description: 'Pipeline replacement across 12 wards.', url: null, image_url: img(2, base), tags: [], start_date: '2022-01-01', end_date: null, is_featured: true }, { id: id(), title: 'Safe Streets', role: null, description: 'Street lighting and pedestrian crossings near schools.', url: null, image_url: img(5, base), tags: [], start_date: '2023-01-01', end_date: null, is_featured: false }],
        media: [1, 6, 3].map((i) => ({ id: id(), kind: 'image' as const, title: null, caption: 'Ward meeting', url: img(i, base), mime_type: 'image/svg+xml', width: 800, height: 600, alt: 'Community event' })),
        testimonials: [quote('Residents’ Association, Ward 14', 'Kothrud', 'The new lights changed how safe our lanes feel at night.', null)],
      },
      content: { news: { items: [{ title: 'Foundation stone laid for new health centre', date: 'Sep 2026' }] } },
    },
    founder: {
      profile: { full_name: 'Neha Agarwal', headline: 'Founder & CEO, Fieldwise', bio_short: 'Building software that helps 40,000 field technicians do their best work.', city: 'Gurugram', years_experience: 16 },
      collections: {
        achievements: [stat('$18M', 'Raised'), stat('40,000', 'Technicians on Fieldwise'), stat('120', 'Team members')],
        experiences: [exp('Founder & CEO', 'Fieldwise', '2019-01-01', null, 'Field-service software for India and South-East Asia.'), exp('VP Operations', 'UrbanFix', '2014-01-01', '2018-12-01', 'Scaled operations to 30 cities.')],
        education: [edu('MBA', 'Indian School of Business', '2012-06-01', '2013-04-01')],
      },
      content: { speaking: { items: [{ title: 'Building for the field, not the office', subtitle: 'SaaSBoomi Annual', date: '2025' }, { title: 'Fireside chat', subtitle: 'Nasscom Product Conclave', date: '2024' }] } },
    },
    'content-creator': {
      profile: { full_name: 'Rhea Fernandes', headline: 'Food & travel creator · 1.2M followers', bio_short: 'Regional Indian food, one kitchen at a time. Partnerships with brands that respect the craft.', city: 'Goa' },
      collections: {
        achievements: [stat('1.2M', 'Instagram followers'), stat('480K', 'YouTube subscribers'), stat('60+', 'Brand partners')],
        projects: [1, 4, 6, 2].map((i, k) => ({ id: id(), title: ['Konkan Kitchens series', 'Monsoon street food', 'Spice routes', 'Home bakers of Goa'][k], role: 'Series', description: null, url: null, image_url: img(i, base), tags: [], start_date: null, end_date: null, is_featured: true })),
        services: [svc('Brand integrations', 'Recipes and stories built around your product.'), svc('Destination features', 'Short-form series for tourism boards.')],
        social_links: [social('instagram', 'https://instagram.com/example'), social('youtube', 'https://youtube.com/@example')],
        testimonials: [quote('Marketing Lead', 'A spice brand', 'Our best-performing campaign of the year.')],
      },
    },
    electrician: {
      profile: { full_name: 'Ramesh Electricals', headline: 'Licensed electrician · Home & office wiring', tagline: 'Same-day repairs across Pune West. Safe, tidy, on time.', bio_short: 'Licensed electrician with 15 years of experience in home wiring, repairs and inverter installation.', city: 'Pune', years_experience: 15, phone: '+91 98220 12345', whatsapp: '+919822012345' },
      collections: {
        services: [svc('Wiring & rewiring', 'New wiring and full rewiring for flats and bungalows.'), svc('Repairs', 'Short circuits, tripping MCBs, fans, lights and switches.', 'Visit ₹300'), svc('Inverter & UPS', 'Installation and maintenance of inverters and batteries.')],
        locations: ['Kothrud', 'Karve Nagar', 'Warje', 'Baner', 'Aundh'].map((label) => ({ id: id(), label, address_line: null, city: 'Pune', region: null, country_code: 'IN', postal_code: null, phone: null, hours: null, map_url: null, is_service_area: true, is_primary: false })),
        media: [5, 1, 3].map((i) => ({ id: id(), kind: 'image' as const, title: null, caption: null, url: img(i, base), mime_type: 'image/svg+xml', width: 800, height: 600, alt: 'Completed job' })),
        testimonials: [quote('Priya S.', 'Kothrud', 'Came within two hours and fixed it properly. Fair price.'), quote('Anil D.', 'Baner', 'Rewired our whole flat neatly. Highly recommended.')],
      },
    },
    consultant: {
      profile: { full_name: 'Sanjay Bhatt', headline: 'Growth strategy consultant for D2C brands', bio_short: 'I help consumer brands between ₹10 and ₹100 crore find their next stage of growth.', city: 'Mumbai', years_experience: 15, email: 'hello@example.com' },
      collections: {
        services: [svc('Growth diagnostic', 'Four-week review of channels, unit economics and retention.', '₹4,50,000'), svc('Fractional CMO', 'Hands-on leadership for marketing teams.', 'Monthly retainer'), svc('Board advisory', 'Quarterly strategy support for founders.')],
        achievements: [stat('35+', 'Brands advised'), stat('3.1×', 'Median revenue growth'), stat('15', 'Years in consumer')],
        experiences: [exp('Independent consultant', 'Bhatt Advisory', '2019-01-01', null, 'Strategy for D2C and consumer brands.'), exp('Head of Growth', 'Lumen Beauty', '2014-01-01', '2018-12-01', 'Grew revenue from ₹12 Cr to ₹140 Cr.')],
        testimonials: [quote('Founder', 'A D2C home brand', 'Sanjay found growth we had been leaving on the table for two years.')],
      },
      content: { cta: { heading: 'Is your brand ready for its next stage?', body: 'Book a 30-minute call. No pitch, just a candid look at where growth is coming from.', button_label: 'Book a call', button_url: 'mailto:hello@example.com' } },
    },
  }
}

/** Build a SiteDocument for previewing a template with sample (or the user's own) content. */
export function demoDocument(opts: {
  template: { id: string; slug: string; name: string; layout: string; tier: 'free' | 'premium'; version: number; config: TemplateConfig }
  demoKey?: string | null
  baseUrl: string
  locale?: string
}): SiteDocument {
  const all = demos(opts.baseUrl)
  const demo = all[opts.demoKey ?? 'professional'] ?? all.professional
  const sections: SiteSection[] = opts.template.config.sections.map((s, i) => ({
    id: `s-${i}`, type: s.type, variant: s.variant, content: demo.content?.[s.type] ?? {}, settings: {},
  }))
  return {
    schema: 1,
    generated_at: new Date().toISOString(),
    website: { id: 'demo', slug: 'demo', name: demo.profile.full_name, locale: opts.locale ?? 'en', custom_domain: null, show_branding: false, settings: {} },
    template: { ...opts.template, layout: opts.template.layout as SiteDocument['template']['layout'], version_id: 'demo' },
    theme: {},
    seo: {},
    profile: {
      display_name: null, headline: null, tagline: null, bio_short: null, bio_long: null, avatar_url: null, cover_url: null, email: 'hello@example.com',
      phone: null, whatsapp: null, website_url: null, city: null, region: null, country_code: 'IN', languages: [], years_experience: null,
      availability: null, pronouns: null, extra: {}, profession: null, ...demo.profile,
    },
    collections: { ...BASE, ...demo.collections } as Collections,
    sections,
  }
}

/** Swap a user's draft document onto another template (for "preview with my content"). */
export function withTemplate(doc: SiteDocument, template: { id: string; slug: string; name: string; layout: string; tier: 'free' | 'premium'; version: number; config: TemplateConfig }): SiteDocument {
  const variantFor = new Map(template.config.sections.map((s) => [s.type, s.variant]))
  return {
    ...doc,
    template: { ...template, layout: template.layout as SiteDocument['template']['layout'], version_id: 'preview' },
    theme: {},
    sections: doc.sections.map((s) => ({ ...s, variant: variantFor.get(s.type) ?? s.variant })),
  }
}
