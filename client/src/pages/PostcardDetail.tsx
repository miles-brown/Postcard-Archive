import { useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2, ArrowLeft, ExternalLink, Calendar, DollarSign, User,
  ZoomIn, ZoomOut, Maximize, Bookmark, Edit3
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { UserMenu } from "@/components/UserMenu";

export default function PostcardDetail() {
  const [, params] = useRoute("/postcard/:id");
  const postcardId = params?.id ? parseInt(params.id) : 0;

  const [suggestion, setSuggestion] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: user } = trpc.auth.me.useQuery();

  const { data: postcard, isLoading, error } = trpc.postcards.getById.useQuery({
    id: postcardId,
  });

  const { data: isSaved } = trpc.users.isPostcardSaved.useQuery(postcardId, {
    enabled: !!user && postcardId > 0,
  });

  const toggleSave = trpc.users.toggleSavePostcard.useMutation({
    onSuccess: (data) => {
      utils.users.isPostcardSaved.invalidate(postcardId);
      toast.success(data.saved ? "Saved to your collection" : "Removed from collection");
    }
  });

  const submitSuggestion = trpc.users.submitTranscriptionSuggestion.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
      setSuggestion("");
      toast.success("Thank you! Your transcription suggestion has been submitted for review.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit suggestion");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !postcard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Postcard not found</h2>
          <p className="text-muted-foreground mb-6">
            This postcard may have been removed or doesn't exist.
          </p>
          <Link href="/gallery">
            <Button>Back to Gallery</Button>
          </Link>
        </div>
      </div>
    );
  }

  const jsonLdSchema = postcard ? {
    "@context": {
      "dc": "http://purl.org/dc/elements/1.1/",
      "schema": "https://schema.org/"
    },
    "@id": `${window.location.origin}/postcard/${postcard.id}`,
    "@type": ["schema:VisualArtwork", "schema:ArchiveComponent"],
    "schema:name": postcard.title,
    "schema:description": postcard.description,
    "schema:image": postcard.images?.[0]?.s3Url,
    "schema:artMedium": "Postcard",
    "dc:title": postcard.title,
    "dc:subject": postcard.warPeriod,
    "dc:description": postcard.description,
    "dc:date": postcard.dateFound,
    "dc:format": "image/jpeg",
    "dc:type": "PhysicalObject",
    "dc:identifier": postcard.ebayId || `LOCAL-${postcard.id}`
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {jsonLdSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }} />
      )}
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/gallery">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
          <UserMenu />
        </div>
      </header>

      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            {postcard.images && postcard.images.length > 0 ? (
              postcard.images.map((image, index) => (
                <Card key={image.id} className="overflow-hidden relative group">
                  <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={8}
                    centerZoomedOut={true}
                    wheel={{ step: 0.1 }}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1 rounded-md backdrop-blur-sm border shadow-sm">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()}>
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()}>
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetTransform()}>
                            <Maximize className="h-4 w-4" />
                          </Button>
                        </div>
                        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                          <img
                            src={image.s3Url}
                            alt={`${postcard.title} - Image ${index + 1}`}
                            className="w-full h-auto cursor-zoom-in"
                          />
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
                </Card>
              ))
            ) : (
              <Card className="aspect-[4/3] bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
              </Card>
            )}
          </div>

          {/* Details */}
          <div className="space-y-8">
            {/* Title and metadata */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold">{postcard.title}</h1>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      postcard.warPeriod === "WWI"
                        ? "secondary"
                        : postcard.warPeriod === "WWII"
                          ? "default"
                          : "destructive"
                    }
                    className="text-sm"
                  >
                    {postcard.warPeriod}
                  </Badge>
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 ${isSaved ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
                      onClick={() => toggleSave.mutate({ postcardId })}
                      disabled={toggleSave.isPending}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? "Saved" : "Save to Collection"}
                    </Button>
                  )}
                </div>
              </div>

              {postcard.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {postcard.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Listing information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Listing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {postcard.price && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold">{postcard.price}</p>
                    </div>
                  </div>
                )}

                {postcard.seller && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Seller</p>
                      <p className="font-semibold">{postcard.seller}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date Found</p>
                    <p className="font-semibold">
                      {new Date(postcard.dateFound).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <a
                  href={postcard.ebayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    View on eBay
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Transcriptions */}
            {postcard.transcriptions && postcard.transcriptions.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Transcription</CardTitle>
                  {user && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit3 className="h-4 w-4" />
                          Suggest Fix
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Suggest a Transcription Fix</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Notice an error in the AI-generated transcription? Help us improve the archive by submitting your correction.
                          </p>
                          <Textarea
                            placeholder="Type your suggested transcription here..."
                            className="min-h-[150px] font-serif"
                            value={suggestion}
                            onChange={(e) => setSuggestion(e.target.value)}
                          />
                          <Button
                            className="w-full"
                            disabled={!suggestion.trim() || submitSuggestion.isPending}
                            onClick={() => submitSuggestion.mutate({ postcardId, suggestedText: suggestion })}
                          >
                            {submitSuggestion.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Suggestion
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {postcard.transcriptions.map((transcription, index) => (
                    <div key={transcription.id}>
                      {index > 0 && <Separator className="my-6" />}

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {transcription.language && (
                            <Badge variant="outline" className="text-xs">
                              {transcription.language.toUpperCase()}
                            </Badge>
                          )}
                          {transcription.confidence && (
                            <Badge variant="secondary" className="text-xs">
                              {transcription.confidence} confidence
                            </Badge>
                          )}
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap font-serif leading-relaxed">
                            {transcription.transcribedText}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {postcard.transcriptionStatus === "pending" && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Transcription pending. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}

            {postcard.transcriptionStatus === "processing" && (
              <Card className="bg-muted">
                <CardContent className="pt-6 flex items-center justify-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Transcription in progress...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main >

      {/* Footer */}
      < footer className="border-t border-border mt-24" >
        <div className="container py-12 text-center text-sm text-muted-foreground">
          <p>Historical Postcard Archive • Preserving handwritten history</p>
        </div>
      </footer >
    </div >
  );
}
