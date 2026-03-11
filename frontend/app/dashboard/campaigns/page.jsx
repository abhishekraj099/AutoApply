"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Eye, Trash2, Loader2, Mail } from "lucide-react";

const statusColors = {
  draft: "secondary",
  scheduled: "warning",
  running: "default",
  completed: "success",
  failed: "destructive",
  cancelled: "outline",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await api.deleteCampaign(id);
      loadCampaigns();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">View and manage your email campaigns</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No campaigns yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const progress = campaign.total_emails > 0
              ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_emails) * 100)
              : 0;

            return (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/dashboard/campaigns/${campaign.id}`} className="text-lg font-semibold hover:underline">
                          {campaign.name}
                        </Link>
                        <Badge variant={statusColors[campaign.status]}>{campaign.status}</Badge>
                        <Badge variant="outline">{campaign.mode}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        {campaign.template_name && <span>Template: {campaign.template_name}</span>}
                        {campaign.list_name && <span>List: {campaign.list_name}</span>}
                        {campaign.scheduled_at && <span>Scheduled: {formatDate(campaign.scheduled_at)}</span>}
                      </div>

                      {/* Progress Bar */}
                      {campaign.total_emails > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{campaign.sent_count} sent, {campaign.failed_count} failed</span>
                            <span>{campaign.sent_count + campaign.failed_count} / {campaign.total_emails}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/dashboard/campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </Link>
                      {campaign.status === "draft" && (
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(campaign.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
