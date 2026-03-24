"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  ThumbsUp,
  MessageCircle,
  Share2,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PagePost {
  id: string;
  message: string;
  created_time: string;
  full_picture: string | null;
  permalink_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
}

export default function EngagementPage() {
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [page, setPage] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta/pages/posts?limit=25");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts || []);
      setPage(data.page || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const totalLikes = posts.reduce((sum, p) => sum + p.likes_count, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments_count, 0);
  const totalShares = posts.reduce((sum, p) => sum + p.shares_count, 0);

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Page Engagement
          </h1>
          {page && (
            <p className="text-sm text-muted-foreground mt-1">
              Page: {page.name} (ID: {page.id})
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {page && !loading && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">Total Likes</span>
              </div>
              <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">Total Comments</span>
              </div>
              <p className="text-2xl font-bold">{totalComments.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Total Shares</span>
              </div>
              <p className="text-2xl font-bold">{totalShares.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recent Posts
            {posts.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {posts.length} posts
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !page ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No Facebook Page connected. Go to Settings &gt; Integrations to connect.
            </p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No posts found on this Page.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 rounded-lg border space-y-3">
                  {/* Post content */}
                  {post.message && (
                    <p className="text-sm whitespace-pre-wrap line-clamp-4">
                      {post.message}
                    </p>
                  )}

                  {/* Post image */}
                  {post.full_picture && (
                    <img
                      src={post.full_picture}
                      alt="Post image"
                      className="rounded-lg max-h-64 object-cover w-full"
                    />
                  )}

                  {/* Engagement metrics */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {post.likes_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3.5 w-3.5" />
                      {post.shares_count.toLocaleString()}
                    </span>
                    <span className="ml-auto text-xs">
                      {formatDistanceToNow(new Date(post.created_time), { addSuffix: true })}
                    </span>
                    {post.permalink_url && (
                      <a
                        href={post.permalink_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
