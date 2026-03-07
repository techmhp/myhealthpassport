'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { blogs } from '@/data/blogContent';

function NotFoundContent() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Blog Not Found</h1>
        <p className="text-muted-foreground mb-6">The blog post you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/resources">
          <Button>Back to Resources</Button>
        </Link>
      </div>
    </div>
  );
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) return <NotFoundContent />;

  const renderContent = (content) => {
    return content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/resources" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </Link>

        <img src={blog.image} alt={blog.title} className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8" />

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <Tag className="w-3 h-3" /> {blog.category}
          </span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {blog.readTime}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blog.date}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">{blog.title}</h1>

        <div className="prose prose-lg max-w-none">
          {blog.sections.map((section, index) => (
            <div key={index} className="mb-6">
              {section.heading && (
                <h2 className="text-xl font-bold mt-8 mb-3">{section.heading}</h2>
              )}
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {renderContent(section.content)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-card rounded-2xl border text-center">
          <h3 className="text-xl font-bold mb-2">Want to learn more?</h3>
          <p className="text-muted-foreground mb-4">Book a screening or talk to our team.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/parents">
              <Button>For Parents</Button>
            </Link>
            <Link href="/resources">
              <Button variant="outline">More Resources</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
