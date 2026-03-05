import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Bookmark, Search } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

export default function Profile() {
    const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
    const { data: postcards, isLoading: postcardsLoading } = trpc.users.getSavedCollections.useQuery(undefined, {
        enabled: !!user,
    });

    if (userLoading || postcardsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Not Signed In</h2>
                    <p className="text-muted-foreground mb-6">
                        You must be signed in to view your profile and collections.
                    </p>
                    <Link href="/">
                        <Button>Back to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container py-4 flex justify-between items-center">
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                    <UserMenu />
                </div>
            </header>

            <main className="container py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                        {user.name}'s Collection
                    </h1>
                    <p className="subtitle text-xl text-muted-foreground">
                        Your hand-curated saved postcards.
                    </p>
                </div>

                {/* Empty state */}
                {!postcards || postcards.length === 0 ? (
                    <div className="text-center py-24 bg-card rounded-xl border border-border">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                            <Bookmark className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Your collection is empty</h2>
                        <p className="text-muted-foreground mb-6">
                            You haven't saved any postcards yet.
                        </p>
                        <Link href="/gallery">
                            <Button>
                                <Search className="w-4 h-4 mr-2" />
                                Browse Gallery
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 text-sm text-muted-foreground">
                            Showing {postcards.length} saved {postcards.length === 1 ? "postcard" : "postcards"}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {postcards.map((postcard) => (
                                <Link key={postcard.id} href={`/postcard/${postcard.id}`}>
                                    <Card className="card-hover overflow-hidden h-full">
                                        {/* Image */}
                                        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                            {postcard.primaryImage ? (
                                                <img
                                                    src={postcard.primaryImage.s3Url}
                                                    alt={postcard.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    No image
                                                </div>
                                            )}

                                            {/* War period badge */}
                                            <div className="absolute top-3 right-3">
                                                <Badge
                                                    variant={
                                                        postcard.warPeriod === "WWI"
                                                            ? "secondary"
                                                            : postcard.warPeriod === "WWII"
                                                                ? "default"
                                                                : "destructive"
                                                    }
                                                >
                                                    {postcard.warPeriod}
                                                </Badge>
                                            </div>
                                        </div>

                                        <CardContent className="p-6">
                                            <h3 className="font-bold text-lg mb-2 line-clamp-2">
                                                {postcard.title}
                                            </h3>

                                            {postcard.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                                    {postcard.description}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>
                                                    {new Date(postcard.dateFound).toLocaleDateString()}
                                                </span>
                                                {postcard.transcriptionStatus === "completed" && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Transcribed
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
