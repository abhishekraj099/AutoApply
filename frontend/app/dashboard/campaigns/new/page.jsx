"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [emailLists, setEmailLists] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("bulk");

  const [form, setForm] = useState({
    name: "",
    template_id: "",
    email_list_id: "",
    resume_id: "",
    subject: "",
    body: "",
    scheduled_at: "",
  });

  const [customEmails, setCustomEmails] = useState([
    { email: "", name: "", company: "", subject: "", body: "" },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [t, l, r] = await Promise.all([
        api.getTemplates(),
        api.getEmailLists(),
        api.getResumes(),
      ]);
      setTemplates(t);
      setEmailLists(l);
      setResumes(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateSelect(templateId) {
    setForm({ ...form, template_id: templateId });
    const template = templates.find((t) => t.id === parseInt(templateId));
    if (template) {
      setForm((prev) => ({
        ...prev,
        template_id: templateId,
        subject: template.subject,
        body: template.body,
      }));
    }
  }

  function addCustomEmail() {
    setCustomEmails([
      ...customEmails,
      { email: "", name: "", company: "", subject: "", body: "" },
    ]);
  }

  function removeCustomEmail(index) {
    setCustomEmails(customEmails.filter((_, i) => i !== index));
  }

  function updateCustomEmail(index, field, value) {
    const updated = [...customEmails];
    updated[index][field] = value;
    setCustomEmails(updated);
  }

  // Check send window
  function getSendWindowWarning() {
    if (!form.scheduled_at) return null;
    const date = new Date(form.scheduled_at);
    const hour = date.getHours();
    if ((hour >= 8 && hour < 10) || (hour >= 13 && hour < 15)) return null;
    return "⚠️ Scheduling outside recommended send windows (8–10 AM, 1–3 PM). Emails may have lower engagement.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        mode,
        template_id: form.template_id ? parseInt(form.template_id) : null,
        email_list_id: mode === "bulk" && form.email_list_id ? parseInt(form.email_list_id) : null,
        resume_id: form.resume_id ? parseInt(form.resume_id) : null,
        subject: form.subject,
        body: form.body,
        scheduled_at: form.scheduled_at || null,
        custom_emails: mode === "custom" ? customEmails.filter((e) => e.email) : undefined,
      };

      const campaign = await api.createCampaign(payload);
      router.push(`/dashboard/campaigns/${campaign.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sendWarning = getSendWindowWarning();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground">Set up a new email campaign</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Campaign Name *</Label>
              <Input
                placeholder="e.g., March 2026 — Software Engineer Applications"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Sending Mode</Label>
              <Tabs value={mode} onValueChange={setMode} className="mt-1">
                <TabsList>
                  <TabsTrigger value="bulk">Bulk Email</TabsTrigger>
                  <TabsTrigger value="custom">Custom Per Company</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Template & Content */}
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
            <CardDescription>
              Use {"{{name}}"} and {"{{company}}"} placeholders for personalization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.length > 0 && (
              <div>
                <Label>Load from Template (optional)</Label>
                <Select value={form.template_id} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === "bulk" && (
              <>
                <div>
                  <Label>Subject *</Label>
                  <Input
                    placeholder="Application for Software Engineer — {{company}}"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Email Body *</Label>
                  <Textarea
                    rows={8}
                    placeholder={`Hello {{name}},\n\nI am writing to express my interest...`}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bulk: Email List */}
        {mode === "bulk" && (
          <Card>
            <CardHeader>
              <CardTitle>Recipient List</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Email List *</Label>
              <Select
                value={form.email_list_id}
                onValueChange={(val) => setForm({ ...form, email_list_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an email list..." />
                </SelectTrigger>
                <SelectContent>
                  {emailLists.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name} ({l.contact_count} contacts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Custom: Individual Emails */}
        {mode === "custom" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Emails</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addCustomEmail}>
                  <Plus className="mr-1 h-4 w-4" /> Add Recipient
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {customEmails.map((ce, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Recipient {index + 1}</span>
                    {customEmails.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomEmail(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={ce.email}
                        onChange={(e) => updateCustomEmail(index, "email", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Recruiter Name</Label>
                      <Input
                        value={ce.name}
                        onChange={(e) => updateCustomEmail(index, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={ce.company}
                        onChange={(e) => updateCustomEmail(index, "company", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      placeholder="Custom subject (or uses default)"
                      value={ce.subject}
                      onChange={(e) => updateCustomEmail(index, "subject", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Body</Label>
                    <Textarea
                      rows={4}
                      placeholder="Custom body (or uses default)"
                      value={ce.body}
                      onChange={(e) => updateCustomEmail(index, "body", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Resume & Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle>Resume & Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Attach Resume (optional)</Label>
              <Select
                value={form.resume_id}
                onValueChange={(val) => setForm({ ...form, resume_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume..." />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.original_name} {r.is_default ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Schedule Send Time (optional — leave blank to save as draft)</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </div>

            {sendWarning && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                {sendWarning}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving || !form.name} size="lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Campaign
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
