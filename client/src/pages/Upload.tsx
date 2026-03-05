import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, UploadIcon, ImagePlus } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

export default function Upload() {
    const [, navigate] = useLocation();
    const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [warPeriod, setWarPeriod] = useState<"WWI" | "WWII" | "Holocaust">("WWII");

    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);

    const uploadMutation = trpc.users.uploadPostcard.useMutation({
        onSuccess: (data) => {
            toast.success("Postcard uploaded successfully! It is now pending transcription.");
            navigate(`/postcard/${data.postcardId}`);
        },
        onError: (err) => {
            toast.error(err.message || "Failed to upload postcard");
        }
    });

    const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const b64 = await fileToBase64(e.target.files[0]);
            setFrontImage(b64);
        }
    };

    const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const b64 = await fileToBase64(e.target.files[0]);
            setBackImage(b64);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!frontImage) {
            toast.error("Please provide front postcard image");
            return;
        }

        uploadMutation.mutate({
            title,
            description,
            warPeriod,
            frontImageBase64: frontImage,
            backImageBase64: backImage || undefined
        });
    };

    if (userLoading) {
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
                        You must be signed in to upload postcards to the archive.
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

            <main className="container py-12 max-w-3xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4">
                        Contribute to the Archive
                    </h1>
                    <p className="subtitle text-xl text-muted-foreground">
                        Safely digitize and upload your historical handwritten documents.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload Postcard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="title">Document Title / Brief Summary</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g., Letter from Charles to Mary, 1944"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="period">Historical Era</Label>
                                <Select value={warPeriod} onValueChange={(v: any) => setWarPeriod(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Era" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WWI">World War I (1914-1918)</SelectItem>
                                        <SelectItem value="WWII">World War II (1939-1945)</SelectItem>
                                        <SelectItem value="Holocaust">The Holocaust (1933-1945)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc">Full Description / Transcript Context</Label>
                                <Textarea
                                    id="desc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide context, such as sender/recipient details, postmarks, or known locations..."
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Front Side (Required)</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 transition-colors">
                                        {frontImage ? (
                                            <img src={frontImage} alt="Front preview" className="w-full h-auto object-contain max-h-[200px]" />
                                        ) : (
                                            <>
                                                <ImagePlus className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <span className="text-sm text-foreground">Click to upload image</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFrontUpload}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Back Side (Optional)</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 transition-colors">
                                        {backImage ? (
                                            <img src={backImage} alt="Back preview" className="w-full h-auto object-contain max-h-[200px]" />
                                        ) : (
                                            <>
                                                <ImagePlus className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <span className="text-sm text-foreground">Click to upload image</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleBackUpload}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={uploadMutation.isPending || !frontImage || !title}>
                                {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadIcon className="w-4 h-4 mr-2" />}
                                Submit for AI Transcription
                            </Button>

                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
