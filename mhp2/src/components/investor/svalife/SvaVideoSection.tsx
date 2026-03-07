import { Card, CardContent } from "@/components/ui/card";
import { Play, Users } from "lucide-react";

const SvaVideoSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-cyan-50/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-cyan-700 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Play className="w-4 h-4" />
            Presentation
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-800">
            See SVA Life in <span className="bg-gradient-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">Action</span>
          </h2>
          <p className="text-lg text-slate-600">
            Watch our founder presentation and client testimonials
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Video Placeholder */}
          <Card className="border-2 border-slate-200 overflow-hidden mb-8">
            <CardContent className="p-0">
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-cyan-900 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <p className="text-white/80 text-lg font-medium">Founder Presentation</p>
                  <p className="text-white/50 text-sm mt-1">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonials Placeholder */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Client Testimonials</p>
                    <p className="text-sm text-slate-500">Real transformation stories</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm">
                  Hear from executives and professionals who have transformed their health and performance with SVA Life.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-cyan-700 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Corporate Case Studies</p>
                    <p className="text-sm text-slate-500">Enterprise success stories</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm">
                  See how organizations have improved employee wellness and productivity through our corporate programs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SvaVideoSection;
