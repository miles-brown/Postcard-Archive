import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Loader2, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Archive,
  Search,
  FileText,
  Settings
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Fetch scraping logs
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.admin.scraper.logs.useQuery({
    limit: 20
  }, {
    enabled: user?.role === 'admin'
  });

  // Fetch all postcards for admin
  const { data: postcards, isLoading: postcardsLoading, refetch: refetchPostcards } = trpc.admin.postcards.listAll.useQuery({
    warPeriod: selectedPeriod !== "all" ? (selectedPeriod as "WWI" | "WWII" | "Holocaust") : undefined
  }, {
    enabled: user?.role === 'admin'
  });

  // Mutations
  const runScraper = trpc.admin.scraper.run.useMutation({
    onSuccess: (data) => {
      toast.success(`Scraper completed: ${data.itemsAdded} new postcards added`);
      refetchLogs();
      refetchPostcards();
    },
    onError: (error) => {
      toast.error(`Scraper failed: ${error.message}`);
    }
  });

  const processTranscriptions = trpc.admin.transcription.processAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Transcription completed: ${data.succeeded} succeeded, ${data.failed} failed`);
      refetchPostcards();
    },
    onError: (error) => {
      toast.error(`Transcription failed: ${error.message}`);
    }
  });

  const deletePostcard = trpc.admin.postcards.delete.useMutation({
    onSuccess: () => {
      toast.success("Postcard deleted");
      refetchPostcards();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    }
  });

  const togglePublic = trpc.admin.postcards.update.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated");
      refetchPostcards();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">Log In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: postcards?.length || 0,
    transcribed: postcards?.filter(p => p.transcriptionStatus === 'completed').length || 0,
    pending: postcards?.filter(p => p.transcriptionStatus === 'pending').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage scraping, transcription, and postcard archive
              </p>
            </div>
            <Link href="/gallery">
              <Button variant="outline">View Public Gallery</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-12 space-y-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Postcards</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Archive className="w-10 h-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transcribed</p>
                  <p className="text-3xl font-bold">{stats.transcribed}</p>
                </div>
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manually trigger scraping and transcription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => runScraper.mutate({})}
                disabled={runScraper.isPending}
                className="flex-1"
              >
                {runScraper.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Run Scraper (All Periods)
              </Button>

              <Button
                onClick={() => processTranscriptions.mutate()}
                disabled={processTranscriptions.isPending || stats.pending === 0}
                variant="secondary"
                className="flex-1"
              >
                {processTranscriptions.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Process Transcriptions ({stats.pending})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scraping Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Scraping Activity</CardTitle>
              <CardDescription>Last 20 scraping operations</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
            >
              <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !logs || logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No scraping logs yet</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="mt-1">
                      {log.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          log.status === 'completed' ? 'default' :
                          log.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {log.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{log.searchQuery}</p>
                      {log.status === 'completed' && (
                        <p className="text-xs text-muted-foreground">
                          Found: {log.itemsFound} • Added: {log.itemsAdded}
                        </p>
                      )}
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Postcard Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Postcard Management</CardTitle>
                <CardDescription>Review and manage all postcards</CardDescription>
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="WWI">WWI</SelectItem>
                  <SelectItem value="WWII">WWII</SelectItem>
                  <SelectItem value="Holocaust">Holocaust</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {postcardsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !postcards || postcards.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No postcards found</p>
            ) : (
              <div className="space-y-4">
                {postcards.map((postcard) => (
                  <div key={postcard.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    {postcard.primaryImage && (
                      <img
                        src={postcard.primaryImage.s3Url}
                        alt={postcard.title}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{postcard.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{postcard.warPeriod}</Badge>
                            <Badge variant={postcard.isPublic ? 'default' : 'secondary'}>
                              {postcard.isPublic ? 'Public' : 'Hidden'}
                            </Badge>
                            <Badge variant={
                              postcard.transcriptionStatus === 'completed' ? 'default' :
                              postcard.transcriptionStatus === 'pending' ? 'secondary' :
                              postcard.transcriptionStatus === 'processing' ? 'secondary' : 'destructive'
                            }>
                              {postcard.transcriptionStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/postcard/${postcard.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublic.mutate({
                            id: postcard.id,
                            isPublic: !postcard.isPublic
                          })}
                        >
                          {postcard.isPublic ? 'Hide' : 'Publish'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this postcard?')) {
                              deletePostcard.mutate({ id: postcard.id });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
