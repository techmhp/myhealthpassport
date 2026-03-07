import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText,
  Brain,
  Utensils,
  Activity,
  Eye,
  Shield,
  Sparkles,
  CheckCircle2,
  Download
} from "lucide-react";

const ProductSection = () => {
  const uspPoints = [
    {
      icon: Shield,
      title: "Non-Diagnostic Approach",
      description: "We don't diagnose or treat — we screen, educate, and empower. This significantly reduces liability and regulatory complexity."
    },
    {
      icon: Sparkles,
      title: "Holistic 6-Pillar Framework",
      description: "The only platform covering Physical, Nutritional, Emotional, Vision, Dental, and Lab screening in one integrated system."
    },
    {
      icon: FileText,
      title: "Personalized Health Passport",
      description: "Each child receives a comprehensive, longitudinal health record that travels with them throughout their schooling."
    },
    {
      icon: Brain,
      title: "Behavioral Insight Reports",
      description: "Proprietary assessment tools that identify early learning and behavioral challenges before they impact academic performance."
    }
  ];

  const reportTypes = [
    {
      icon: Activity,
      title: "Comprehensive Health Report",
      color: "brand",
      downloadUrl: "/downloads/comprehensive-health-report.pdf",
      features: [
        "Physical health screening",
        "Nutritional assessment",
        "Emotional wellbeing evaluation",
        "Vision screening results",
        "Dental health check",
        "Lab test indicators",
        "Integrated health summary"
      ]
    },
    {
      icon: Brain,
      title: "Psychology & Behavioral Report",
      color: "lavender",
      downloadUrl: "/downloads/psychology-report.pdf",
      features: [
        "Emotional resilience assessment",
        "Social behavior patterns",
        "Learning style identification",
        "Attention & focus metrics",
        "Stress & anxiety indicators",
        "Parent-child relationship insights",
        "Actionable recommendations"
      ]
    },
    {
      icon: Utensils,
      title: "Nutrition & Diet Report",
      color: "mint",
      downloadUrl: "/downloads/nutrition-report.pdf",
      features: [
        "Nutritional gap analysis",
        "Growth trajectory tracking",
        "Dietary habits assessment",
        "Micronutrient deficiency indicators",
        "Personalized meal recommendations",
        "Age-appropriate portion guidance",
        "Food allergy/intolerance alerts"
      ]
    }
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    brand: { bg: "bg-brand/10", text: "text-brand", border: "border-brand/30" },
    lavender: { bg: "bg-lavender/10", text: "text-lavender", border: "border-lavender/30" },
    mint: { bg: "bg-mint/10", text: "text-mint", border: "border-mint/30" }
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-mint/20 text-mint px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <FileText className="w-4 h-4" />
            Our Product
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Unique Selling Proposition
          </h2>
          <p className="text-lg text-muted-foreground">
            What makes My Health Passport different from any other health screening solution
          </p>
        </div>

        {/* USP Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
          {uspPoints.map((point, index) => (
            <Card key={index} className="border-brand/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
                    <point.icon className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{point.title}</h3>
                    <p className="text-sm text-muted-foreground">{point.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sample Reports Section */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Premium Report Samples</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {reportTypes.map((report, index) => {
              const colors = colorClasses[report.color];
              return (
                <a 
                  key={index} 
                  href={report.downloadUrl} 
                  download 
                  className="group block transition-transform hover:scale-[1.02]"
                >
                  <Card className={`${colors.border} border-2 h-full cursor-pointer group-hover:shadow-lg transition-shadow`}>
                    <CardHeader className={`${colors.bg}`}>
                      <CardTitle className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-background rounded-lg flex items-center justify-center`}>
                          <report.icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <span className="text-base">{report.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground mb-3">
                        Assessment includes:
                      </p>
                      <ul className="space-y-1.5">
                        {report.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${colors.text} shrink-0`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${colors.text}`}>
                        <Download className="w-4 h-4" />
                        <span>Download Sample</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>

          {/* Additional Product Features */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <Activity className="w-8 h-8 text-brand mx-auto mb-2" />
                <p className="text-xs font-medium">Physical Screening</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Eye className="w-8 h-8 text-mint mx-auto mb-2" />
                <p className="text-xs font-medium">Vision Assessment</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Activity className="w-8 h-8 text-coral mx-auto mb-2" />
                <p className="text-xs font-medium">Dental Checkup</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <FileText className="w-8 h-8 text-lavender mx-auto mb-2" />
                <p className="text-xs font-medium">Lab Reports</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
