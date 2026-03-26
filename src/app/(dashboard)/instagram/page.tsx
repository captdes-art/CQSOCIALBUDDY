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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  RefreshCw,
  Heart,
  MessageCircle,
  Users,
  Image,
  Instagram,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface IGProfile {
  id: string;
  username: string;
  name: string;
  biography: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url: string;
}

interface IGMedia {
  id: string;
  caption: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url: string | null;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

export default function InstagramPage() {
  const [profile, setProfile] = useState<IGProfile | null>(null);
  const [media, setMedia] = useState<IGMedia[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/meta/instagram/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
    } catch (err) {
      if (err instanceof Error && !err.message.includes("No active")) {
        toast.error(err.message);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadMedia = useCallback(async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch("/api/meta/instagram/media?limit=20");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMedia(data.media || []);
    } catch (err) {
      if (err instanceof Error && !err.message.includes("No active")) {
        toast.error(err.message);
      }
    } finally {
      setLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadMedia();
  }, [loadProfile, loadMedia]);

  function handleRefresh() {
    loadProfile();
    loadMedia();
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Instagram className="h-6 w-6" />
          Instagram
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loadingProfile || loadingMedia}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loadingProfile || loadingMedia ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !profile ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No Instagram account connected. Go to Settings &gt; Integrations to connect.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.profile_picture_url} alt={profile.username} />
                  <AvatarFallback className="text-lg">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    @{profile.username} (ID: {profile.id})
                  </p>
                  {profile.biography && (
                    <p className="text-sm mt-2">{profile.biography}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg border">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Followers</span>
                  </div>
                  <p className="text-xl font-bold">{profile.followers_count.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Following</span>
                  </div>
                  <p className="text-xl font-bold">{profile.follows_count.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Image className="h-4 w-4" />
                    <span className="text-xs">Posts</span>
                  </div>
                  <p className="text-xl font-bold">{profile.media_count.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Media
            {profile && (
              <Badge variant="secondary" className="text-[10px]">
                @{profile.username}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMedia ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : media.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No media found.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-lg overflow-hidden border aspect-square"
                >
                  <img
                    src={item.thumbnail_url || item.media_url}
                    alt={item.caption?.slice(0, 50) || "Instagram post"}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-sm">
                        <Heart className="h-4 w-4" />
                        {item.like_count}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <MessageCircle className="h-4 w-4" />
                        {item.comments_count}
                      </span>
                    </div>
                    {item.caption && (
                      <p className="text-xs px-2 text-center line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                    <span className="text-[10px] opacity-70">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Media type badge */}
                  {item.media_type !== "IMAGE" && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-[9px]"
                    >
                      {item.media_type === "VIDEO" ? "Video" : "Carousel"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
