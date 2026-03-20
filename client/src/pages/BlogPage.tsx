import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { BlogPost } from "@shared/schema";
import { useEffect } from "react";

export default function BlogPage() {
  const { data: blogPosts, isLoading, error, refetch } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  useEffect(() => {
    // Log when blog posts are loaded or error occurs
    if (blogPosts) {
      console.log("Blog posts loaded:", blogPosts.length);
    }
    if (error) {
      console.error("Error loading blog posts:", error);
    }
    
    // Refetch on component mount to ensure fresh data
    refetch();
  }, [blogPosts, error, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-amber-800 mb-6">Spiritual Teachings</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <p>We apologize, but we're having trouble loading the spiritual teachings.</p>
          <p className="mt-1">Please try again later.</p>
          <p className="mt-1 text-sm">{error.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-800 mb-4">Spiritual Teachings</h1>
        <p className="text-lg text-amber-700 max-w-2xl mx-auto">
          Explore ancient wisdom, spiritual practices, and the profound teachings of Hindu philosophy through our curated collection of articles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts && blogPosts.length > 0 ? (
          blogPosts.map((post) => {
            // Safely format the date - handle both string and Date objects
            let formattedDate = '';
            try {
              if (post.createdAt) {
                // Handle both string dates and Date objects
                const date = typeof post.createdAt === 'string' 
                  ? new Date(post.createdAt) 
                  : post.createdAt;
                formattedDate = format(date, 'MMMM d, yyyy');
              }
            } catch (e) {
              console.error("Date formatting error:", e);
              formattedDate = 'Publication date unavailable';
            }
            
            return (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-300 border-amber-100">
                  <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-t-lg">
                    <img 
                      src={post.featuredImage || '/images/default-blog.jpg'} 
                      alt={post.title}
                      className="object-cover w-full h-48"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.src = '/images/default-blog.jpg';
                      }}
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-amber-800">{post.title}</CardTitle>
                    <CardDescription className="text-amber-600">
                      {formattedDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-700 line-clamp-3">{post.excerpt}</p>
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-amber-600">{post.category}</span>
                      <span className="text-sm text-blue-600 hover:underline">Read more →</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-amber-700">No articles available at the moment.</p>
            <p className="mt-2 text-amber-600">Please check back soon for new spiritual teachings.</p>
          </div>
        )}
      </div>

      {/* Subscribe section removed as requested */}
    </div>
  );
}