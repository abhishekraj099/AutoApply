"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, Upload, Loader2, X } from "lucide-react";

export default function EmailListsPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [contactForm, setContactForm] = useState({ email: "", name: "", company: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    try {
      const data = await api.getEmailLists();
      setLists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadListDetail(id) {
    try {
      const data = await api.getEmailList(id);
      setSelectedList(data);
    } catch (err) {
      console.error(err);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  }

  function openEdit(list) {
    setEditing(list);
    setForm({ name: list.name, description: list.description || "" });
    setDialogOpen(true);
  }

  function openDetail(list) {
    loadListDetail(list.id);
    setDetailOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.updateEmailList(editing.id, form);
      } else {
        await api.createEmailList(form);
      }
      setDialogOpen(false);
      loadLists();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this list and all contacts?")) return;
    try {
      await api.deleteEmailList(id);
      loadLists();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddContact() {
    if (!contactForm.email) return;
    try {
      await api.addContact(selectedList.id, contactForm);
      setContactForm({ email: "", name: "", company: "" });
      loadListDetail(selectedList.id);
      loadLists();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveContact(contactId) {
    try {
      await api.removeContact(selectedList.id, contactId);
      loadListDetail(selectedList.id);
      loadLists();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCSVImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await api.importCSV(selectedList.id, formData);
      alert(result.message);
      loadListDetail(selectedList.id);
      loadLists();
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
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
          <h1 className="text-3xl font-bold">Email Lists</h1>
          <p className="text-muted-foreground">Manage your recruiter email lists</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New List
        </Button>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No email lists yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(list)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    {list.description && <CardDescription>{list.description}</CardDescription>}
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(list)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(list.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{list.contact_count} contacts</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit List" : "New Email List"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>List Name</Label>
              <Input
                placeholder="e.g., Startup Recruiters"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="e.g., Tech startup HR contacts"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedList?.name} — Contacts</DialogTitle>
          </DialogHeader>

          {/* Add Contact */}
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Email *"
              className="flex-1 min-w-[200px]"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
            <Input
              placeholder="Name"
              className="w-36"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            />
            <Input
              placeholder="Company"
              className="w-36"
              value={contactForm.company}
              onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
            />
            <Button onClick={handleAddContact} disabled={!contactForm.email}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* CSV Import */}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
                </span>
              </Button>
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
            </label>
            <span className="text-xs text-muted-foreground">CSV with columns: email, name, company</span>
          </div>

          {/* Contacts Table */}
          {selectedList?.contacts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedList.contacts.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2">{c.email}</td>
                      <td className="py-2">{c.name || "—"}</td>
                      <td className="py-2">{c.company || "—"}</td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveContact(c.id)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No contacts in this list yet.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
