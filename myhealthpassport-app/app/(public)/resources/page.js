'use client';

import Link from 'next/link';
import { BookOpen, Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { Card, CardContent } from '@/components/shadcn/card';
import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { blogs } from '@/data/blogContent';

const videos = [
  {
    title: "MHP Intro",
    thumbnail: "/placeholder.svg",
    duration: "3:24",
    description: "An introduction to My Health Passport and our mission.",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold text-center mb-4">Resources</h1>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Explore our blog posts and video content to learn more about children&apos;s health and development.
        </p>

        <Tabs defaultValue="blogs" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="blogs" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Blogs
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" /> Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blogs">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link key={blog.slug} href={`/blog/${blog.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-48 object-cover"
                    />
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {blog.category}
                        </span>
                        <span>{blog.readTime}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{blog.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{blog.excerpt}</p>
                      <p className="text-xs text-muted-foreground mt-3">{blog.date}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-2">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
