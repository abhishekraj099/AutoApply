"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const statusColors = {
  pending: "warning",
  sent: "success",
  failed: "destructive",
  cancelled: "outline",
};

export default function HistoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadHistory();
  }, [page]);

  async function loadHistory() {
    setLoading(true);
    try {
      const result = await api.getEmailHistory(page, 50);
      setData(result);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email History</h1>
        <p className="text-muted-foreground">
          Complete history of all emails sent ({data?.pagination?.total || 0} total)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {data?.emails?.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Recruiter Email</th>
                      <th className="pb-2 font-medium">Company</th>
                      <th className="pb-2 font-medium">Campaign</th>
                      <th className="pb-2 font-medium">Subject</th>
                      <th className="pb-2 font-medium">Sent At</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.emails.map((email) => (
                      <tr key={email.id} className="border-b last:border-0">
                        <td className="py-2">{email.to_email}</td>
                        <td className="py-2">{email.company || "—"}</td>
                        <td className="py-2">{email.campaign_name}</td>
                        <td className="py-2 max-w-[200px] truncate">{email.subject}</td>
                        <td className="py-2">{formatDate(email.sent_at)}</td>
                        <td className="py-2">
                          <Badge variant={statusColors[email.status]}>{email.status}</Badge>
                        </td>
                        <td className="py-2 max-w-[150px] truncate text-xs text-destructive">
                          {email.error_message || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No email history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
