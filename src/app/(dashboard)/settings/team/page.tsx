"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Profile, UserRole } from "@/types";

export default function TeamPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get current user's role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setCurrentRole((profile?.role as UserRole) || null);

      // Get all team members (admin only)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at");

      setMembers((profiles as Profile[]) || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update role");
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
    );
    toast.success("Role updated");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAdmin = currentRole === "admin";

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Team Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who has access and what they can do.
            {!isAdmin && " Only admins can change roles."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const initials = (member.full_name || "?")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.full_name || "Unnamed"}
                          </p>
                          {member.id === currentUserId && (
                            <Badge variant="outline" className="text-[10px]">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdmin && member.id !== currentUserId ? (
                        <Select
                          value={member.role}
                          onValueChange={(v) =>
                            handleRoleChange(member.id, v as UserRole)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="reviewer">Reviewer</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            <p className="font-medium mb-1">Role Permissions:</p>
            <ul className="space-y-1 text-xs">
              <li><strong>Admin:</strong> Full access — manage team, approve messages, change settings</li>
              <li><strong>Reviewer:</strong> Approve/reject drafts, flag conversations, send replies</li>
              <li><strong>Viewer:</strong> Read-only access to inbox and dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
