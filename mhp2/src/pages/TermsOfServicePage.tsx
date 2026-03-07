import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <FileText className="w-4 h-4" />
              Terms of Service
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              My Health Passport – Terms & Conditions
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-foreground/90 space-y-10">
            <p>
              Welcome to My Health Passport. By accessing or using our website and services, you agree to the following terms and conditions. Please read them carefully before proceeding.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Overview of Services</h2>
              <p>
                My Health Passport provides preventive child health screening and wellness support services for schools and parents. Our services include nutrition screening, psychological screening, vision and dental screening, developmental milestone assessments, and integrated health reporting.
              </p>
              <p>
                Services are delivered through school-based programs, parent-initiated bookings, and digital health platforms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Eligibility and Consent</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Our services are designed for children and are accessed through their parents, legal guardians, or participating schools.</li>
                <li>By booking or enrolling in any service, you confirm that you are the parent or legal guardian of the child, or an authorized school representative.</li>
                <li>No service is initiated without informed consent from the parent or guardian.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Use of the Website</h2>
              <p>You agree to use this website only for lawful purposes. You must not:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide false or misleading information through any form or registration.</li>
                <li>Attempt to gain unauthorized access to any part of the website or its systems.</li>
                <li>Use the website in any way that may damage, disable, or impair the service.</li>
                <li>Reproduce, duplicate, or redistribute content without written permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Bookings and Payments</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>All bookings made through the website are subject to availability and confirmation.</li>
                <li>Payment, where applicable, must be completed at the time of booking through the payment methods available on the platform.</li>
                <li>Prices displayed are inclusive of applicable taxes unless stated otherwise.</li>
                <li>My Health Passport reserves the right to modify pricing with prior notice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Cancellation and Refund Policy</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Rescheduling is preferred over cancellation to maintain continuity of care.</li>
                <li>Cancellation requests must be made at least 48 hours before the scheduled service.</li>
                <li>Refunds, if applicable, will be processed within 7-10 business days to the original payment method.</li>
                <li>Repeated no-shows without prior communication may affect future scheduling.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Health Disclaimer</h2>
              <p>
                My Health Passport services are designed for early identification and preventive health awareness. They are not a substitute for professional medical diagnosis, treatment, or advice.
              </p>
              <p>
                Screening results and recommendations are meant to guide parents and schools toward appropriate next steps. Always consult a qualified healthcare provider for medical concerns.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Intellectual Property</h2>
              <p>
                All content on this website, including text, images, logos, graphics, and software, is the property of My Health Passport and is protected under applicable intellectual property laws. Unauthorized use, reproduction, or distribution is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Data Privacy</h2>
              <p>
                Your use of this website is also governed by our{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                , which outlines how we collect, store, and protect your information. By using our services, you consent to the practices described therein.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Limitation of Liability</h2>
              <p>
                My Health Passport shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or services. Our total liability is limited to the amount paid for the specific service in question.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Changes to These Terms</h2>
              <p>
                We may update these Terms of Service from time to time. Any changes will be posted on this page with an updated effective date. Continued use of the website after changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Governing Law</h2>
              <p>
                These terms are governed by and construed in accordance with the laws of India. Any disputes arising from the use of this website or services shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Contact</h2>
              <p>
                For questions or concerns regarding these Terms of Service, please contact us at{" "}
                <a href="mailto:admin@myhealthpassport.in" className="text-primary hover:underline">
                  admin@myhealthpassport.in
                </a>{" "}
                or call <span className="font-semibold">7793925151</span>.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
