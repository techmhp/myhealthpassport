'use client';
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { ArrowRight, Send } from "lucide-react";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    schoolName: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <section id="contact" className="py-20 lg:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <ArrowRight className="w-4 h-4" />
              Get Started Today
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              Ready To Start Your{" "}
              <span className="text-gradient-hero">Wellness Journey?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join a nationwide movement prioritizing early intervention and lifelong wellness.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-background p-8 sm:p-12 rounded-3xl border border-border shadow-card">
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                  Full Name
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
                  Phone Number
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
            </div>
            
            <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl shadow-glow">
              <Send className="mr-2 h-5 w-5" />
              Start Your Wellness Journey
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
