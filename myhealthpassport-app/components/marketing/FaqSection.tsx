'use client';
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const faqs = [
  {
    question: "What is included in a child health checkup?",
    answer: "A comprehensive child health checkup includes physical screening, vision and dental assessments, nutrition evaluation, developmental monitoring, emotional wellbeing assessment, and preventive health recommendations.",
  },
  {
    question: "Why is pediatric health screening important for school children?",
    answer: "Pediatric health screening helps identify early signs of vision problems, nutritional deficiencies, emotional stress, developmental delays, and learning-related challenges before they affect academic performance and wellbeing.",
  },
  {
    question: "How do school health programs benefit students?",
    answer: "A structured school health program supports early detection, healthier habits, improved attendance, emotional wellbeing, and better learning outcomes for children.",
  },
  {
    question: "What is a digital health passport for kids?",
    answer: "A digital health passport for kids India is a secure online health record system that stores screening reports, growth tracking, wellness updates, and child health history in one place.",
  },
  {
    question: "Are mental health screening programs important in schools?",
    answer: "Yes. Mental health screening programs in schools help identify stress, anxiety, emotional difficulties, and behavioural concerns early, allowing timely support for children.",
  },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-card relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-semibold mb-5">
            FAQs
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
            Frequently Asked Questions About{" "}
            <span className="text-gradient-hero">Child Health Screening</span>
          </h2>
        </AnimatedSection>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <AnimatedSection key={index} delay={index * 80}>
              <div className="border border-border rounded-2xl overflow-hidden bg-background">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm sm:text-base hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  aria-expanded={openIndex === index}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-brand shrink-0 ml-4 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
