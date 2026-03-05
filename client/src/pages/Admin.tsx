import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, RefreshCw, CheckCircle, XCircle, Clock,
  Archive, Search, FileText, UploadIcon, ImagePlus,
  Database, Sparkles, AlertCircle, ArrowLeft, Settings2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Upload Context State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [warPeriod, setWarPeriod] = useState<"WWI" | "WWII" | "Holocaust">("WWII");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.admin.scraper.logs.useQuery({
    limit: 15
  }, { enabled: user?.role === 'admin' });

  const { data: postcards, isLoading: postcardsLoading, refetch: refetchPostcards } = trpc.admin.postcards.listAll.useQuery({
    warPeriod: selectedPeriod !== "all" ? (selectedPeriod as "WWI" | "WWII" | "Holocaust") : undefined
  }, { enabled: user?.role === 'admin' });

  const runScraper = trpc.admin.scraper.run.useMutation({
    onSuccess: (data) => {
      toast.success(`Scraper finished: ${data.itemsAdded} new elements synced`);
      refetchLogs();
      refetchPostcards();
    },
    onError: (error) => toast.error(`Scraper failed: ${error.message}`)
  });

  const processTranscriptions = trpc.admin.transcription.processAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Pipeline sequence finished processing.`);
      refetchPostcards();
    },
    onError: (error) => toast.error(`Transcription pipeline failed: ${error.message}`)
  });

  const deletePostcard = trpc.admin.postcards.delete.useMutation({
    onSuccess: () => { toast.success("Entity removed natively"); refetchPostcards(); }
  });

  const togglePublic = trpc.admin.postcards.update.useMutation({
    onSuccess: () => { toast.success("Visibility matrix updated"); refetchPostcards(); }
  });

  const uploadMutation = trpc.users.uploadPostcard.useMutation({
    onSuccess: () => {
      toast.success("Media successfully injected to pipeline");
      setFrontImage(null); setBackImage(null); setTitle(""); setDescription("");
      refetchPostcards();
    },
    onError: (err) => toast.error(err.message || "Pipeline injection failed")
  });

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFrontImage(await fileToBase64(e.target.files[0]));
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setBackImage(await fileToBase64(e.target.files[0]));
  };

  const handleAdminUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontImage) return toast.error("Front visual artifact required for pipeline mapping");
    uploadMutation.mutate({ title, description, warPeriod, frontImageBase64: frontImage, backImageBase64: backImage || undefined });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full shadow-lg border-red-500/20">
          <CardHeader>
            <div className="mx-auto bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center">Restricted Access</CardTitle>
            <CardDescription className="text-center">High privilege clearance required for pipeline operations.</CardDescription>
          </CardHeader>
          <CardContent>
            {!user ? (
              <Link href="/login" className="block w-full">
                <Button className="w-full">Sign In</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button className="w-full" variant="outline">Return to Public Root</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: postcards?.length || 0,
    transcribed: postcards?.filter(p => p.transcriptionStatus === 'completed').length || 0,
    pending: postcards?.filter(p => p.transcriptionStatus === 'pending').length || 0,
    processing: postcards?.filter(p => p.transcriptionStatus === 'processing').length || 0,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/gallery">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold font-serif flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Archive Systems Console
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Systems Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="w-full relative">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-8 h-auto gap-2 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="py-3 data-[state=active]:shadow-sm">System Overview</TabsTrigger>
            <TabsTrigger value="automation" className="py-3 data-[state=active]:shadow-sm">Crawlers & Scrapers</TabsTrigger>
            <TabsTrigger value="ingestion" className="py-3 data-[state=active]:shadow-sm">Media Ingestion Pipeline</TabsTrigger>
            <TabsTrigger value="catalogs" className="py-3 data-[state=active]:shadow-sm">Content Catalogs</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground tracking-tight">Total Volume</p>
                      <p className="text-4xl font-bold">{stats.total}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Archive className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground tracking-tight">AI Indexed</p>
                      <p className="text-4xl font-bold">{stats.transcribed}</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground tracking-tight">Pending Jobs</p>
                      <p className="text-4xl font-bold">{stats.pending}</p>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground tracking-tight">Active Transcribing</p>
                      <p className="text-4xl font-bold">{stats.processing}</p>
                    </div>
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Automations Execution
                </CardTitle>
                <CardDescription>Force-trigger critical background sequences directly</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm border-b pb-2">Data Acquisition</h3>
                  <Button
                    onClick={() => runScraper.mutate({})}
                    disabled={runScraper.isPending}
                    className="w-full justify-start h-12 shadow-sm"
                    variant="default"
                  >
                    {runScraper.isPending ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Search className="w-4 h-4 mr-3" />}
                    Execute eBay Crawler Node
                  </Button>
                  <p className="text-xs text-muted-foreground">Spins up scraping orchestrator across all historical era endpoints.</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-sm border-b pb-2">AI Processing</h3>
                  <Button
                    onClick={() => processTranscriptions.mutate()}
                    disabled={processTranscriptions.isPending || stats.pending === 0}
                    variant="secondary"
                    className="w-full justify-start h-12 shadow-sm border border-border"
                  >
                    {processTranscriptions.isPending ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <FileText className="w-4 h-4 mr-3" />}
                    Process Queue ({stats.pending} waiting)
                  </Button>
                  <p className="text-xs text-muted-foreground">Dispatches Vision API requests concurrently for all pending queue items.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* TAB 2: CRAWLERS & SCRAPERS */}
          <TabsContent value="automation" className="animate-in fade-in duration-500 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
                <div>
                  <CardTitle className="text-lg">Scraper Telemetry Logs</CardTitle>
                  <CardDescription>Execution traces from the last 15 automated cron sweeps</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchLogs()} disabled={logsLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                  Poll Status
                </Button>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !logs || logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Settings2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>No operational logs recorded in registry.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors">
                        <div className="mt-1 bg-background rounded-full p-1 shadow-sm border">
                          {log.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : log.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-destructive" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize h-5">
                              {log.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                              {log.startedAt ? new Date(log.startedAt).toLocaleString() : 'Unknown Time'}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-2">Query Filter: <span className="font-normal text-muted-foreground">{log.searchQuery}</span></p>
                          {log.status === 'completed' && (
                            <div className="flex gap-4 mt-2">
                              <p className="text-xs font-mono text-muted-foreground"><span className="text-foreground">Found:</span> {log.itemsFound}</p>
                              <p className="text-xs font-mono text-muted-foreground"><span className="text-foreground">Inserted:</span> {log.itemsAdded}</p>
                            </div>
                          )}
                          {log.errorMessage && (
                            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-mono whitespace-pre-wrap">
                              {log.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* TAB 3: INGESTION PIPELINE */}
          <TabsContent value="ingestion" className="animate-in fade-in duration-500">
            <Card className="max-w-4xl mx-auto shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <UploadIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Direct Media Ingestion</CardTitle>
                    <CardDescription>Manually push singular assets into the S3 proxy & translation pipeline</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAdminUpload} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="title" className="text-sm font-semibold">Asset Manifest Title</Label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Historical Reference Title..." className="h-11" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="period" className="text-sm font-semibold">Chronological Era</Label>
                      <Select value={warPeriod} onValueChange={(v: any) => setWarPeriod(v)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select Era" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WWI">World War I (1914-1918)</SelectItem>
                          <SelectItem value="WWII">World War II (1939-1945)</SelectItem>
                          <SelectItem value="Holocaust">The Holocaust (1933-1945)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="desc" className="text-sm font-semibold">Contextual Metadata Description</Label>
                    <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Structural details, translations, sender origins..." className="min-h-[100px] resize-none" />
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl border border-border">
                    <h3 className="font-semibold text-sm mb-4">Binary Object Attachment (Base64 Mapping)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Side A (Primary)</Label>
                        <div className="border-2 border-dashed border-primary/40 bg-background rounded-lg p-6 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 transition-all group overflow-hidden h-48">
                          {frontImage ? (
                            <>
                              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 text-sm font-medium">Replace Image</div>
                              <img src={frontImage} alt="Front preview" className="w-full h-full object-contain" />
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              <ImagePlus className="w-8 h-8 mb-3 opacity-50" />
                              <span className="text-sm font-medium text-foreground">Click to map asset</span>
                              <span className="text-xs mt-1">JPEG, PNG, WEBP</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFrontUpload} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Side B (Reverse)</Label>
                        <div className="border-2 border-dashed border-border bg-background rounded-lg p-6 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 transition-all group overflow-hidden h-48">
                          {backImage ? (
                            <>
                              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 text-sm font-medium">Replace Image</div>
                              <img src={backImage} alt="Back preview" className="w-full h-full object-contain" />
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              <ImagePlus className="w-8 h-8 mb-3 opacity-50" />
                              <span className="text-sm font-medium text-foreground">Click to map asset</span>
                              <span className="text-xs mt-1">(Optional Context)</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleBackUpload} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-12 text-md shadow-md" disabled={uploadMutation.isPending || !frontImage || !title}>
                    {uploadMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Database className="w-5 h-5 mr-2" />}
                    Commit Sequence to DB
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>


          {/* TAB 4: CONTENT CATALOGS */}
          <TabsContent value="catalogs" className="animate-in fade-in duration-500">
            <Card className="shadow-sm border-t-4 border-t-primary">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                <div>
                  <CardTitle className="text-xl">Node Explorer Matrix</CardTitle>
                  <CardDescription>Direct manipulation of indexed archives</CardDescription>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full sm:w-[220px] bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">View All Epochs</SelectItem>
                    <SelectItem value="WWI">Epoch: WWI</SelectItem>
                    <SelectItem value="WWII">Epoch: WWII</SelectItem>
                    <SelectItem value="Holocaust">Epoch: Holocaust</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                {postcardsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : !postcards || postcards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Archive className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-lg">No entities found in current matrix slice.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-0 divide-y divide-border border-y">
                    {postcards.map((postcard) => (
                      <div key={postcard.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 p-4 hover:bg-muted/20 transition-all group">
                        <div className="shrink-0 relative overflow-hidden rounded-md border shadow-sm self-start sm:self-center">
                          {postcard.primaryImage ? (
                            <img src={postcard.primaryImage.s3Url} alt={postcard.title} className="w-32 h-24 object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-32 h-24 bg-muted flex items-center justify-center"><ImagePlus className="w-6 h-6 opacity-20" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="tracking-widest uppercase text-[10px] font-semibold">{postcard.warPeriod}</Badge>
                            <Badge variant={postcard.isPublic ? 'default' : 'secondary'} className={postcard.isPublic ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-none' : ''}>
                              {postcard.isPublic ? 'PUBLIC ROUTE' : 'HIDDEN NODE'}
                            </Badge>
                            <Badge variant={
                              postcard.transcriptionStatus === 'completed' ? 'default' :
                                postcard.transcriptionStatus === 'pending' ? 'secondary' :
                                  postcard.transcriptionStatus === 'processing' ? 'secondary' : 'destructive'
                            } className={postcard.transcriptionStatus === 'completed' ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-none border-none' : ''}>
                              {postcard.transcriptionStatus.toUpperCase()}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-base truncate">{postcard.title}</h4>
                          <p className="text-sm text-muted-foreground truncate mt-1">ID: {postcard.ebayId || `LOCAL-${postcard.id}`} • Imported: {postcard.dateFound ? new Date(postcard.dateFound).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:self-center">
                          <Link href={`/postcard/${postcard.id}`}>
                            <Button size="sm" variant="outline" className="h-9 font-medium shadow-sm">Inspect</Button>
                          </Link>
                          <Button size="sm" variant={postcard.isPublic ? "secondary" : "default"} className="h-9 font-medium shadow-sm" onClick={() => togglePublic.mutate({ id: postcard.id, isPublic: !postcard.isPublic })}>
                            {postcard.isPublic ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Irreversible node deletion. Confirm?')) { deletePostcard.mutate({ id: postcard.id }); } }}>
                            Terminate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
