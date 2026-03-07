import {
  Brain,
  Stethoscope,
  CheckCircle2,
  GraduationCap,
  BookOpen,
} from "lucide-react";

const Tag = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${className}`}>{children}</span>
);

const SchoolCompactContent = () => (
  <div className="space-y-6">
    <div className="grid sm:grid-cols-2 gap-3">
      {[
        { icon: Brain, label: "Psychologist", sub: "5 days a week", emoji: "🧠" },
        { icon: Stethoscope, label: "Nutritionist", sub: "5 days a week", emoji: "🥗" },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-emerald-50 border border-mint/10">
          <span className="text-2xl">{item.emoji}</span>
          <span className="text-sm font-bold text-foreground">{item.label}</span>
          <Tag className="bg-mint/10 text-mint">{item.sub}</Tag>
        </div>
      ))}
    </div>

    {/* What we deliver */}
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">What We Deliver</p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {[
          "Detailed counselling & psychology assessments",
          "Comprehensive nutrition evaluations",
          "Complete My Health Passport for every child",
          "CBSE-mandated counsellor role fulfilled",
          "Parent feedback & discussion sessions",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-50/60 border border-mint/10">
            <CheckCircle2 className="w-4 h-4 text-mint shrink-0 mt-0.5" />
            <span className="text-sm text-foreground/80">{item}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Curriculum & Training */}
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Curriculum & Training Included</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-mint/20 bg-emerald-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mint/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-mint" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Student Curriculum</h4>
          </div>
          <div className="space-y-2">
            {[
              "Age-wise emotional wellbeing sessions",
              "Nutrition awareness & healthy habits",
              "Behavioural & social skills modules",
              "Mindfulness & self-regulation exercises",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint shrink-0 mt-0.5" />
                <span className="text-[13px] text-foreground/75">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-mint/20 bg-emerald-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mint/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-mint" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Teacher Training</h4>
          </div>
          <div className="space-y-2">
            {[
              "Monthly workshops on child psychology",
              "Red-flag identification & referral guidance",
              "Classroom wellbeing strategies",
              "Nutrition impact on learning & behaviour",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint shrink-0 mt-0.5" />
                <span className="text-[13px] text-foreground/75">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SchoolCompactContent;
