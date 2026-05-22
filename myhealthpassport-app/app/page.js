import Script from 'next/script';
import Header from '@/components/marketing/Header';
import Hero from '@/components/marketing/Hero';
import NeedSection from '@/components/marketing/NeedSection';
import PillarsSection from '@/components/marketing/PillarsSection';
import ChildrenStruggleSection from '@/components/marketing/ChildrenStruggleSection';
import SecuritySection from '@/components/marketing/SecuritySection';
import FaqSection from '@/components/marketing/FaqSection';
import Footer from '@/components/marketing/Footer';
import WhatsAppButton from '@/components/marketing/WhatsAppButton';

export const metadata = {
  title: 'Child Health Checkup & School Wellness Programs India',
  description: 'Comprehensive child health checkup with pediatric health screening, wellness programs, mental health support, and digital health records for kids.',
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is included in a child health checkup?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A child health checkup includes physical screening, nutrition evaluation, vision and dental screening, developmental monitoring, and emotional wellbeing assessments."
      }
    },
    {
      "@type": "Question",
      "name": "Why is pediatric health screening important for school children?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pediatric health screening helps identify health, developmental, emotional, and learning-related concerns early before they affect academic performance and wellbeing."
      }
    },
    {
      "@type": "Question",
      "name": "How do school health programs benefit students?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "School health programs support early detection, healthy habits, emotional wellbeing, and improved learning outcomes for children."
      }
    },
    {
      "@type": "Question",
      "name": "What is a digital health passport for kids?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A digital health passport stores child health records, wellness reports, and screening history securely in one accessible platform."
      }
    },
    {
      "@type": "Question",
      "name": "Are mental health screening programs important in schools?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Mental health screening programs help identify stress, anxiety, emotional challenges, and behavioural concerns early in children."
      }
    }
  ]
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "My Health Passport",
  "url": "https://www.myhealthpassport.in/",
  "logo": "https://www.myhealthpassport.in/marketing-assets/logo.png",
  "sameAs": [
    "https://www.facebook.com/people/My-Health-Passport/61578963448009/",
    "https://www.instagram.com/my_health_passport_/",
    "https://www.linkedin.com/company/myhealthpassport/"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "areaServed": "IN",
    "availableLanguage": ["English"]
  }
};

const medicalOrgSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "name": "My Health Passport",
  "url": "https://www.myhealthpassport.in/",
  "logo": "https://www.myhealthpassport.in/marketing-assets/logo.png",
  "medicalSpecialty": ["Pediatrics", "Preventive Medicine"],
  "description": "Child health checkup and pediatric health screening services for schools and parents.",
  "areaServed": {
    "@type": "Country",
    "name": "India"
  }
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "My Health Passport",
  "url": "https://www.myhealthpassport.in/",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "3rd Floor, Trendset Grande Apartment Block-A, SB Tower, Nagarjuna Cir Rd, Punjagutta",
    "addressLocality": "Hyderabad",
    "addressRegion": "Telangana",
    "postalCode": "500082",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "17.3850",
    "longitude": "78.4867"
  },
  "openingHours": "Mo-Sa 09:00-18:00",
  "priceRange": "$$"
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.myhealthpassport.in/"
    }
  ]
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-medical-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalOrgSchema) }}
      />
      <Script
        id="schema-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main>
        <Hero />
        <PillarsSection />
        <NeedSection />
        <ChildrenStruggleSection />
        <SecuritySection />
        <FaqSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
