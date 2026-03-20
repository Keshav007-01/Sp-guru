import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Loader2, ArrowLeft, Calendar, User, Eye, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { BlogPost } from "@shared/schema";

export default function BlogPostPage() {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["/api/blog-posts", slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog-posts/${slug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog post");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/blog" className="flex items-center text-amber-600 hover:text-amber-800 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Teachings
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <p>We apologize, but we couldn't find the spiritual teaching you're looking for.</p>
          <p className="mt-1">It may have been moved or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/50 min-h-screen pb-16">
      <div className="container mx-auto px-4 py-8">
        <Link href="/blog" className="flex items-center text-amber-600 hover:text-amber-800 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Teachings
        </Link>

        {/* Featured Image */}
        <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-8 shadow-lg">
          <img 
            src={post.featuredImage || '/images/default-blog.jpg'} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-800 mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center text-amber-600 gap-4 mb-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{post.author || "Divine Mantras Team"}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{post.createdAt && format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{post.viewCount || 0} views</span>
            </div>
            
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              <span>{post.category}</span>
            </div>
          </div>
          
          <p className="text-lg font-medium text-amber-700 mb-8">
            {post.excerpt}
          </p>
          
          <Separator className="bg-amber-200 my-6" />
        </div>

        {/* Article Content */}
        <div 
          className="prose lg:prose-xl prose-amber max-w-4xl mx-auto"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Placeholder for future related topics and sharing features */}

        {/* Next/Prev Articles */}
        <div className="max-w-4xl mx-auto mt-16">
          <Separator className="bg-amber-200 mb-8" />
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {post.slug === 'power-of-mantras-and-meditation' && (
              <Link href="/blog/introduction-to-vedic-mantras" className="flex-1">
                <div className="bg-white p-4 rounded-lg shadow border border-amber-100 hover:border-amber-300 transition-colors">
                  <p className="text-sm text-amber-600 mb-1">Previous Teaching</p>
                  <h4 className="text-lg font-semibold text-amber-800 hover:text-amber-600">Introduction to Vedic Mantras</h4>
                </div>
              </Link>
            )}
            
            {post.slug === 'introduction-to-vedic-mantras' && (
              <Link href="/blog/power-of-mantras-and-meditation" className="flex-1 ml-auto">
                <div className="bg-white p-4 rounded-lg shadow border border-amber-100 hover:border-amber-300 transition-colors text-right">
                  <p className="text-sm text-amber-600 mb-1">Next Teaching</p>
                  <h4 className="text-lg font-semibold text-amber-800 hover:text-amber-600">The Power of Mantras and Meditation</h4>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}