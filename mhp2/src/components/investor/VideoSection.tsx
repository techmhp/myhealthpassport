import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";

const VideoSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-sunshine/20 text-sunshine px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Play className="w-4 h-4" />
            Video Presentation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            See My Health Passport in Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Watch our pitch presentation and product demo
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Product Explanation Video */}
          <Card className="overflow-hidden mb-8">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black">
                <video 
                  src="/videos/product-explanation.mp4"
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                />
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Product Explanation — See how My Health Passport works
          </p>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
