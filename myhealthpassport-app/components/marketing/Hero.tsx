'use client';
import { Button } from "@/components/shadcn/button";
import Link from "next/link";
import HealthPassportMockup from "./HealthPassportMockup"; // refreshed

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen lg:h-screen lg:max-h-screen flex items-center pt-24 sm:pt-28 pb-8 sm:pb-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-soft" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mint/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="flex flex-col items-start text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 animate-fade-in">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse-soft" />
              Trusted by Schools & Parents
            </div>
            
            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-2 sm:mb-3 animate-slide-up">
              Every Child Deserves{" "}
              <span className="text-gradient-hero">Early, Thoughtful Care</span>
            </h1>
            
            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mb-3 sm:mb-4 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Empowering schools and parents through proactive child health screening and continuous wellness support. Create your child's unique Health Passport today.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full sm:w-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button asChild size="lg" className="text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 rounded-xl shadow-glow justify-center">
                <Link href="/parents">
                  <span className="mr-2 text-base sm:text-lg">👨‍👩‍👧</span>
                  For Parents
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 rounded-xl bg-card hover:bg-secondary justify-center">
                <Link href="/schools">
                  <span className="mr-2 text-base sm:text-lg">🏫</span>
                  For Schools
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 rounded-xl border-brand/30 bg-brand-light text-brand-dark hover:bg-brand/10 justify-center">
                <Link href="/parents#programs">
                  <span className="mr-2 text-base sm:text-lg">📋</span>
                  Explore Our Programs →
                </Link>
              </Button>
            </div>

            {/* Tagline */}

            {/* Tagline */}
            <div className="w-full mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-brand/30 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gradient-hero animate-typing">
                A Healthier Child is a Happier One ✨
              </p>
            </div>

            {/* Mobile Mockup - Compact Version */}
            <div className="lg:hidden w-full mt-4 sm:mt-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex justify-center">
                <div className="w-full max-w-[220px] sm:max-w-[260px] animate-float">
                  <HealthPassportMockup />
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Health Passport Mockup (Desktop) */}
          <div className="hidden lg:flex justify-center items-center animate-slide-up -mt-8" style={{ animationDelay: "0.2s" }}>
            <div className="animate-float w-full max-w-[320px] xl:max-w-[360px]">
              <HealthPassportMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
