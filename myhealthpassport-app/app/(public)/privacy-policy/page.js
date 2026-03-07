'use client';

import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import { Shield } from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-16">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Shield className="w-4 h-4" />
              Privacy & Policy
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              A Note on Privacy
            </h1>
            <p className="text-lg text-muted-foreground">
              My Health Passport – School Services
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-foreground/90 space-y-10">
            <p>
              At My Health Passport, we value trust and respect privacy. Any personal information shared with us by students, parents, or schools is handled with care, discretion, and responsibility.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Respect for Privacy</h2>
              <p>
                Information shared during conversations, screenings, assessments, forms, reports, or ongoing school-based services is treated as private. This includes details about the student, family context, wellbeing concerns, and any records created as part of our work together.
              </p>
              <p>
                We recognize that information related to children is especially sensitive and handle it accordingly, with care for dignity, safety, and emotional wellbeing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Purpose of Information Collection</h2>
              <p>Information is collected solely to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Support school-based Nutrition and Psychology services</li>
                <li>Maintain accurate professional records</li>
                <li>Ensure continuity and quality of care</li>
                <li>Enable appropriate follow-ups and progress monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Use of Information</h2>
              <p>
                Information is collected only to support student wellbeing, deliver Nutrition and Psychological services, maintain professional records, and ensure continuity of care.
              </p>
              <p>
                Information is not shared with others without parent or legal guardian consent, except in situations where disclosure is required for safety, child protection, or by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Secure Storage and Access</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Physical records are stored in secure and protected locations.</li>
                <li>Digital records are maintained on secure systems with restricted, role-based access.</li>
                <li>Only authorized professionals directly involved in the student&apos;s care may access information.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Online and Tele-Services</h2>
              <p>For online consultations, assessments, or electronic communication:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Reasonable measures are taken to protect privacy and confidentiality.</li>
                <li>Parents and students are encouraged to use private devices and environments.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">When Information May Be Shared</h2>
              <p>In rare circumstances, information may need to be shared, such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>When there is concern about immediate safety or risk of harm to the student or others.</li>
                <li>When disclosure is legally required, including child protection obligations.</li>
                <li>When limited consultation within the professional team is necessary, using minimal identifying information.</li>
              </ul>
              <p>Wherever possible, this is discussed with parents or guardians beforehand.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Parent and Guardian Rights</h2>
              <p>Parents and guardians have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Seek clarification about how information is used or stored.</li>
                <li>Ask questions regarding privacy, confidentiality, and professional boundaries.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Escalation Protocol</h2>
              <p>
                There are moments when a student&apos;s situation may need additional attention or a different level of response. This approach exists to support responsible decision-making and safety while continuing to respect privacy and trust.
              </p>
              <p>
                Escalation may be considered when a concern cannot be responsibly managed at the current level, when safety feels uncertain, or when a student appears significantly overwhelmed or distressed.
              </p>
              <p>In such moments, the first response is always to pause, listen, and understand the situation before moving forward.</p>

              <h3 className="text-xl font-semibold text-foreground mt-4">When Escalation May Be Considered</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>A concern cannot be managed at the current level</li>
                <li>Safety feels uncertain</li>
                <li>A student appears significantly distressed</li>
                <li>Guidance beyond the immediate scope of care is required</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4">Internal Review</h3>
              <p>
                If additional perspective is needed, the situation may be reviewed internally in a limited and focused manner, with only essential information shared.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4">External Support or Legal Requirements</h3>
              <p>
                In rare cases, external support or legal requirements may need to be considered. When this happens, it is approached carefully and, wherever possible, communicated with parents or guardians in advance.
              </p>
              <p>Any such step is documented with discretion, stored securely, and accessed only by authorised team members.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Session Rescheduling & Attendance Guidelines</h2>
              <p className="text-sm text-muted-foreground mb-2">(Program-Based School Services)</p>
              <p>
                Our services operate as structured programs rather than isolated sessions. Continuity is essential for meaningful progress.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Rescheduling is preferred over cancellation</li>
                <li>Repeated late cancellations or no-shows may impact program flow</li>
                <li>Changes are confirmed only after a new time is mutually agreed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Transition and Termination Protocols</h2>

              <h3 className="text-xl font-semibold text-foreground mt-4">Pathway 1: Health Talk → Deep Dive (Direct Intervention)</h3>
              <p>This pathway may be recommended when:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Teachers and parents report clear, consistent concerns</li>
                <li>Behavioural, emotional, or regulation difficulties are already evident</li>
                <li>The need for individualised support is well understood</li>
                <li>Both school and parents agree that intervention is required</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4">Pathway 2: Health Talk → Discovery → Deep Dive (Clarity-Building)</h3>
              <p>This pathway may be recommended when:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Teachers or parents are unsure or divided about concerns</li>
                <li>Symptoms are mild, mixed, or context-specific</li>
                <li>There is hesitation about the need for therapy</li>
                <li>The child&apos;s needs are not yet clearly defined</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4">Termination</h3>
              <p>Termination may occur if:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Extended non-responsiveness</li>
                <li>Discontinuation without communication</li>
                <li>Boundary or safety concerns</li>
                <li>Clinical inappropriateness</li>
              </ul>
              <p>All closures are documented respectfully and confidentially.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Renewal Policy</h2>
              <p>
                Renewal refers to the planned continuation of services after a defined program period has been completed. Renewal is not automatic, assumed, or indefinite. It is a deliberate, reviewed, and mutually agreed decision based on the student&apos;s needs, progress, and readiness.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4">When Renewal May Be Considered</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Identified goals are partially met but still in progress</li>
                <li>The student is benefiting from continued structure and support</li>
                <li>Emotional, behavioural, nutritional, or regulation patterns require further consolidation</li>
                <li>Transitions make continued support helpful</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4">Review Before Renewal</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Progress is reviewed across emotional, behavioural, nutritional, and functional indicators</li>
                <li>Observations from sessions, parents, and school inputs are considered</li>
                <li>The student&apos;s capacity for independence and self-regulation is evaluated</li>
                <li>Risks of over-support versus under-support are weighed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Voluntary Participation</h2>
              <p>Participation in My Health Passport services is entirely voluntary. As a parent or legal guardian:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You have the right to ask questions or seek clarity at any stage.</li>
                <li>You may choose to discontinue services; however, program-related terms remain applicable.</li>
              </ul>
              <p>No service is initiated without your informed consent.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Confidentiality and Privacy</h2>
              <p>All information shared during sessions, assessments, forms, or communication is treated as confidential. Information will not be shared without consent, except:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>When there is concern about immediate safety or risk of harm</li>
                <li>When disclosure is required by law or child protection obligations</li>
                <li>When limited internal professional consultation is required for quality care</li>
              </ul>
              <p>Records are stored securely and accessed only by authorised professionals.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Core Principle</h2>
              <p>
                This framework exists to protect students, respect families, support schools responsibly, and uphold ethical, legal, and professional integrity at every stage of care.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Contact</h2>
              <p>
                For questions or concerns regarding privacy or confidentiality, please contact us at{" "}
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

export default PrivacyPolicyPage;
