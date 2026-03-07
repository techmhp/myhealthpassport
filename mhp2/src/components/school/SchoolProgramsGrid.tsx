import { useState } from "react";
import { Eye, Heart, Building2, ChevronRight, X, Sparkles, ArrowRight } from "lucide-react";
import SchoolAwarenessContent from "./SchoolAwarenessContent";
import SchoolCompactContent from "./SchoolCompactContent";
import SchoolBuddyCentreContent from "./SchoolBuddyCentreContent";

const programs = [
  {
    id: "awareness",
    number: "01",
    tag: "Entry Point",
    title: "Awareness & Screening Program",
    oneLiner: "Nutrition and Psychology awareness talks combined with eye & dental screening.",
    icon: Eye,
    emoji: "🎯",
    color: "text-lavender",
    bg: "bg-violet-50",
    bgStrong: "bg-lavender",
    border: "border-lavender/20",
    hoverBorder: "hover:border-lavender/50",
    tagBg: "bg-lavender/15 text-lavender",
    accentGradient: "from-violet-50 to-lavender/5",
    glowShadow: "hover:shadow-[0_8px_30px_-8px_hsl(270_67%_75%/0.25)]",
    highlights: [
      "Teacher & parent awareness talks",
      "Eye & dental screening camps",
      "Observation framework for early identification",
    ],
  },
  {
    id: "camp",
    number: "02",
    tag: "Space-Efficient",
    title: "Compact Health Buddy Centre",
    oneLiner: "Year-round psychologist & nutritionist — minimal space, maximum impact.",
    icon: Heart,
    emoji: "💚",
    color: "text-mint",
    bg: "bg-emerald-50",
    bgStrong: "bg-mint",
    border: "border-mint/20",
    hoverBorder: "hover:border-mint/50",
    tagBg: "bg-mint/15 text-mint",
    accentGradient: "from-emerald-50 to-mint/5",
    glowShadow: "hover:shadow-[0_8px_30px_-8px_hsl(158_64%_52%/0.25)]",
    highlights: [
      "Psychologist & nutritionist 5 days/week",
      "Complete My Health Passport for every child",
      "CBSE-mandated counsellor role fulfilled",
    ],
  },
  {
    id: "buddy",
    number: "03",
    tag: "Most Comprehensive",
    title: "MHP Health Buddy Centre",
    oneLiner: "A complete on-campus MHP presence — curriculum, monitoring & continuous parent coordination.",
    icon: Building2,
    emoji: "🏥",
    color: "text-brand",
    bg: "bg-brand-light",
    bgStrong: "bg-brand",
    border: "border-brand/20",
    hoverBorder: "hover:border-brand/50",
    tagBg: "bg-brand/10 text-brand",
    accentGradient: "from-brand-light to-brand/5",
    glowShadow: "hover:shadow-[0_8px_30px_-8px_hsl(214_100%_50%/0.25)]",
    highlights: [
      "Full on-campus MHP wellness centre",
      "Student & teacher curriculum delivery",
      "Continuous monitoring & parent coordination",
    ],
  },
];

const SchoolProgramsGrid = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Choose Your Model
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
            Three Ways Schools Work With{" "}
            <span className="text-gradient-hero">MHP</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From awareness talks to a full on-campus health centre — every school finds its fit.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {programs.map((p) => {
            const Icon = p.icon;
            const isExpanded = expandedId === p.id;

            return (
              <div
                key={p.id}
                className={`group relative rounded-3xl border-2 bg-card overflow-hidden transition-all duration-300 flex flex-col ${p.border} ${p.hoverBorder} ${p.glowShadow} ${
                  isExpanded ? "ring-2 ring-offset-2 ring-offset-background ring-primary/20" : ""
                }`}
              >
                {/* Accent top bar */}
                <div className={`h-1.5 ${p.bgStrong}`} />

                {/* Icon + Number header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center">
                    <div className={`w-14 h-14 rounded-2xl ${p.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`w-7 h-7 ${p.color}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl font-black text-muted-foreground/15 leading-none select-none">{p.number}</span>
                    <h3 className="text-xl font-extrabold text-foreground leading-tight">
                      {p.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {p.oneLiner}
                  </p>
                </div>

                {/* Divider */}
                <div className="mx-6 border-t border-border/60" />

                {/* Highlights */}
                <div className="px-6 py-5 flex-1">
                  <ul className="space-y-3">
                    {p.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-lg ${p.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <ChevronRight className={`w-3.5 h-3.5 ${p.color}`} />
                        </div>
                        <span className="text-sm text-foreground/85 font-medium">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Know More button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      isExpanded
                        ? `${p.bgStrong} text-primary-foreground shadow-md`
                        : `${p.bg} ${p.color} border ${p.border} hover:shadow-sm`
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        <X className="w-4 h-4" />
                        Close Details
                      </>
                    ) : (
                      <>
                        Know More
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded content below grid */}
        {expandedId && (
          <div className="max-w-6xl mx-auto mt-8 animate-in fade-in slide-in-from-top-3 duration-300">
            {(() => {
              const p = programs.find((p) => p.id === expandedId)!;
              const Icon = p.icon;
              return (
                <div className={`rounded-3xl border-2 ${p.border} bg-gradient-to-br ${p.accentGradient} p-6 sm:p-8 lg:p-10`}>
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${p.bg} rounded-2xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${p.color}`} />
                      </div>
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                          {p.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{p.oneLiner}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Content */}
                  {expandedId === "awareness" && <SchoolAwarenessContent />}
                  {expandedId === "camp" && <SchoolCompactContent />}
                  {expandedId === "buddy" && <SchoolBuddyCentreContent />}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
};

export default SchoolProgramsGrid;
