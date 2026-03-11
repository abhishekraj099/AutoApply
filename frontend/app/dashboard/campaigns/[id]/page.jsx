"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Play,
  XCircle,
  Eye,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
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

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [preview, setPreview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadCampaign = useCallback(async () => {
    try {
      const data = await api.getCampaign(params.id);
      setCampaign(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  async function loadPreview() {
    try {
      const data = await api.previewCampaign(params.id);
      setPreview(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadLogs() {
    try {
      const data = await api.getCampaignLogs(params.id);
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSchedule() {
    setActionLoading(true);
    try {
      const result = await api.scheduleCampaign(params.id, { scheduled_at: scheduledAt });
      if (result.warning) alert(result.warning);
      setScheduleDialogOpen(false);
      loadCampaign();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this campaign? Pending emails will not be sent.")) return;
    try {
      await api.cancelCampaign(params.id);
      loadCampaign();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleTestEmail() {
    if (!testEmail) return;
    setActionLoading(true);
    try {
      await api.sendTestEmail(params.id, { test_email: testEmail });
      alert("Test email sent!");
      setTestDialogOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return <p className="text-muted-foreground">Campaign not found.</p>;
  }

  const progress = campaign.total_emails > 0
    ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_emails) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge variant={statusColors[campaign.status]} className="text-sm">
              {campaign.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {campaign.mode === "bulk" ? "Bulk" : "Custom"} campaign
            {campaign.scheduled_at && ` · Scheduled for ${formatDate(campaign.scheduled_at)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <>
              <Button variant="outline" onClick={() => setTestDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" /> Test Email
              </Button>
              <Button onClick={() => setScheduleDialogOpen(true)}>
                <Play className="mr-2 h-4 w-4" /> Schedule
              </Button>
            </>
          )}
          {["scheduled", "running"].includes(campaign.status) && (
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          <Button variant="outline" onClick={loadCampaign}>
            <RotateCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Progress */}
      {campaign.total_emails > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>
                {campaign.sent_count} sent · {campaign.failed_count} failed · {campaign.total_emails - campaign.sent_count - campaign.failed_count} remaining
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="mt-2 text-sm text-muted-foreground">
              {campaign.sent_count + campaign.failed_count} / {campaign.total_emails} emails processed
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{campaign.total_emails}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{campaign.sent_count}</p>
            <p className="text-sm text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-600">{campaign.failed_count}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {campaign.total_emails - campaign.sent_count - campaign.failed_count}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Emails, Preview, Logs */}
      <Tabs defaultValue="emails" onValueChange={(val) => {
        if (val === "preview") loadPreview();
        if (val === "logs") loadLogs();
      }}>
        <TabsList>
          <TabsTrigger value="emails">Emails ({campaign.emails?.length || 0})</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <Card>
            <CardContent className="pt-6">
              {campaign.emails?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Company</th>
                        <th className="pb-2 font-medium">Subject</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Sent At</th>
                        <th className="pb-2 font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaign.emails.map((email) => (
                        <tr key={email.id} className="border-b last:border-0">
                          <td className="py-2">{email.to_email}</td>
                          <td className="py-2">{email.to_name || "—"}</td>
                          <td className="py-2">{email.company || "—"}</td>
                          <td className="py-2 max-w-[200px] truncate">{email.subject}</td>
                          <td className="py-2">
                            <Badge variant={statusColors[email.status]}>{email.status}</Badge>
                            {email.retry_count > 0 && (
                              <span className="ml-1 text-xs text-muted-foreground">({email.retry_count} retries)</span>
                            )}
                          </td>
                          <td className="py-2">{formatDate(email.sent_at)}</td>
                          <td className="py-2 max-w-[150px] truncate text-destructive text-xs">
                            {email.error_message || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No emails in this campaign.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-6">
              {preview ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Campaign:</strong> {preview.campaign_name}</div>
                    <div><strong>Mode:</strong> {preview.mode}</div>
                    <div><strong>Total Emails:</strong> {preview.total_emails}</div>
                    <div><strong>Scheduled:</strong> {formatDate(preview.scheduled_at)}</div>
                    {preview.resume && (
                      <div><strong>Resume:</strong> {preview.resume.name}</div>
                    )}
                  </div>
                  <hr />
                  <h3 className="font-semibold">Sample Emails (first 5)</h3>
                  {preview.sample_emails?.map((email, i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm"><strong>To:</strong> {email.to_email} {email.to_name && `(${email.to_name})`}</p>
                      <p className="text-sm"><strong>Subject:</strong> {email.subject}</p>
                      <div className="rounded bg-muted p-3 text-sm whitespace-pre-wrap">{email.body}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="pt-6">
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 rounded border p-3 text-sm">
                      <Badge variant={
                        log.event === "sent" ? "success" :
                        log.event === "failed" ? "destructive" :
                        log.event === "retry" ? "warning" : "secondary"
                      }>
                        {log.event}
                      </Badge>
                      <div className="flex-1">
                        <p>{log.details}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No logs yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send a test email to yourself to preview the campaign before launching.
          </p>
          <Input
            type="email"
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTestEmail} disabled={actionLoading || !testEmail}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Select when to start sending. Recommended: 8–10 AM or 1–3 PM.
          </p>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={actionLoading || !scheduledAt}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
