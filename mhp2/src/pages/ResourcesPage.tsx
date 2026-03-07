import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Play, BookOpen, Clock, ArrowRight } from "lucide-react";
import { blogs } from "@/data/blogContent";

const videos = [
  {
    title: "My Health Passport – Introductory Video",
    description: "Learn about My Health Passport and how we're transforming child health through proactive screening and continuous wellness support.",
    videoUrl: "/videos/mhp-intro-video.mp4",
  },
];

const ResourcesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <BookOpen className="w-4 h-4" />
              Resources
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              Blogs & Videos
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay informed with expert insights, health tips, and product updates from My Health Passport.
            </p>
          </div>
        </section>

        {/* Tabs */}
        <section className="container mx-auto px-4">
          <Tabs defaultValue="blogs" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="h-12 px-1">
                <TabsTrigger value="blogs" className="px-6 text-base gap-2">
                  <BookOpen className="w-4 h-4" />
                  Blogs
                </TabsTrigger>
                <TabsTrigger value="videos" className="px-6 text-base gap-2">
                  <Play className="w-4 h-4" />
                  Videos
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Blogs Tab */}
            <TabsContent value="blogs">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {blogs.map((blog, i) => (
                  <Link key={i} to={`/blog/${blog.slug}`} className="block">
                    <Card className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer h-full">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {blog.category}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {blog.readTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {blog.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{blog.date}</span>
                          <span className="text-primary text-sm font-medium flex items-center gap-1">
                            Read more <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <div className="max-w-3xl mx-auto">
                {videos.map((video, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video">
                      <video
                        src={video.videoUrl}
                        controls
                        className="w-full h-full object-cover"
                        poster=""
                      />
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {video.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ResourcesPage;
