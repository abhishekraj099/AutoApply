"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";

const statusColors = {
  draft: "secondary",
  scheduled: "warning",
  running: "default",
  completed: "success",
  failed: "destructive",
  cancelled: "outline",
  pending: "warning",
  sent: "success",
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const stats = await api.getDashboardStats();
      setData(stats);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your email campaigns</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.sentToday || 0} sent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Campaigns</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.runningCampaigns || 0} running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEmails || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.sentLastHour || 0} sent last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Emails</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedEmails || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.totalCampaigns || 0} total campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Campaigns</CardTitle>
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.recentCampaigns?.length > 0 ? (
            <div className="space-y-4">
              {data.recentCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {campaign.sent_count}/{campaign.total_emails} sent
                      {campaign.scheduled_at && ` · Scheduled: ${formatDate(campaign.scheduled_at)}`}
                    </p>
                  </div>
                  <Badge variant={statusColors[campaign.status]}>{campaign.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No campaigns yet.{" "}
              <Link href="/dashboard/campaigns/new" className="text-primary hover:underline">
                Create your first campaign
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Emails */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Emails</CardTitle>
          <Link href="/dashboard/history">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.recentEmails?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Campaign</th>
                    <th className="pb-2 font-medium">Sent At</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEmails.map((email, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{email.to_email}</td>
                      <td className="py-2">{email.company || "—"}</td>
                      <td className="py-2">{email.campaign_name}</td>
                      <td className="py-2">{formatDate(email.sent_at)}</td>
                      <td className="py-2">
                        <Badge variant={statusColors[email.status]}>{email.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No emails sent yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
