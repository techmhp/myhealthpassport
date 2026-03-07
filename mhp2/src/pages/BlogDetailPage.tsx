import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { blogs } from "@/data/blogContent";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "./NotFound";

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero image */}
        <div className="w-full max-w-4xl mx-auto px-4 mb-8">
          <Link to="/resources">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Resources
            </Button>
          </Link>
          <div className="rounded-2xl overflow-hidden aspect-[21/9] mb-6">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {blog.category}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {blog.readTime}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {blog.date}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-8">
            {blog.title}
          </h1>
        </div>

        {/* Content */}
        <article className="w-full max-w-3xl mx-auto px-4">
          {blog.sections.map((section, i) => (
            <div key={i} className="mb-8">
              {section.heading && (
                <h2 className="text-2xl font-bold mb-3 text-foreground">
                  {section.heading}
                </h2>
              )}
              <div className="text-base leading-relaxed text-muted-foreground whitespace-pre-line prose-content">
                {section.content.split("\n").map((line, j) => {
                  // Handle bold markdown
                  const parts = line.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={j} className={line.startsWith("•") ? "pl-4 mb-1" : "mb-3"}>
                      {parts.map((part, k) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={k} className="text-foreground font-semibold">
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={k}>{part}</span>
                        )
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </article>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-4 mt-12">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Want more health insights?</h3>
            <p className="text-muted-foreground mb-4">
              Explore all our resources for parents and schools.
            </p>
            <Link to="/resources">
              <Button>Browse All Resources</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
