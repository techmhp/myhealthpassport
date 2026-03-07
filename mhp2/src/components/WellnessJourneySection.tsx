import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WellnessJourneySectionProps {
  variant: "parent" | "school";
}

const WellnessJourneySection = ({ variant }: WellnessJourneySectionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    schoolName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (variant === "school") {
        if (!formData.fullName || !formData.phone || !formData.email || !formData.schoolName) {
          toast.error("Please fill in all fields.");
          return;
        }

        const { error } = await supabase.from("school_leads").insert({
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          school_name: formData.schoolName,
        });

        if (error) {
          toast.error("Something went wrong. Please try again.");
          console.error("Submission error:", error);
          return;
        }
      }

      toast.success("Thank you! We'll be in touch shortly.");
      setFormData({ fullName: "", phone: "", email: "", schoolName: "" });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSchool = variant === "school";

  return (
    <section className="py-20 lg:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <ArrowRight className="w-4 h-4" />
              {isSchool ? "Partner With Us" : "Get Started Today"}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              {isSchool ? (
                <>
                  Bring Preventive Health{" "}
                  <span className="text-gradient-hero">To Your School</span>
                </>
              ) : (
                <>
                  Ready To Start Your{" "}
                  <span className="text-gradient-hero">Wellness Journey?</span>
                </>
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isSchool
                ? "Share your details and our team will connect with you to design a health program tailored for your school."
                : "Join a nationwide movement prioritizing early intervention and lifelong wellness."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-background p-8 sm:p-12 rounded-3xl border border-border shadow-card">
            <div className={`grid ${isSchool ? "sm:grid-cols-2" : ""} gap-6 mb-8`}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                  {isSchool ? "Contact Person" : "Full Name"}
                </label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  {isSchool ? "Contact Number" : "Phone Number"}
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              {isSchool && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label htmlFor="schoolName" className="block text-sm font-medium mb-2">
                      School Name
                    </label>
                    <Input
                      id="schoolName"
                      placeholder="Enter school name"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>
            
            <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl shadow-glow" disabled={isSubmitting}>
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? "Submitting..." : isSchool ? "Request a Callback" : "Start Your Wellness Journey"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default WellnessJourneySection;
