import { invokeLLM } from "./_core/llm";
import { 
  getPostcardsNeedingTranscription, 
  getPostcardImages, 
  createTranscription, 
  updatePostcard 
} from "./db";

/**
 * Transcribe handwritten text from a single image using LLM vision
 */
async function transcribeImage(imageUrl: string): Promise<{
  text: string;
  confidence: string;
  language?: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert at reading and transcribing historical handwritten text from postcards. Transcribe the handwritten text exactly as it appears, preserving line breaks and formatting. If text is unclear or illegible, indicate with [illegible]. Include any dates, signatures, or addresses you can identify. Respond with ONLY the transcribed text, no additional commentary."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please transcribe all handwritten text visible in this postcard image. Include any dates, addresses, messages, and signatures."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    const messageContent = response.choices[0]?.message?.content;
    const transcribedText = typeof messageContent === 'string' ? messageContent : "";
    
    // Estimate confidence based on presence of [illegible] markers
    const illegibleCount = (transcribedText.match(/\[illegible\]/gi) || []).length;
    const totalWords = transcribedText.split(/\s+/).length;
    const confidencePercent = totalWords > 0 
      ? Math.round(((totalWords - illegibleCount) / totalWords) * 100)
      : 0;
    
    const confidence = `${confidencePercent}%`;
    
    // Attempt to detect language (simple heuristic)
    let language = "en";
    if (/[äöüß]/i.test(transcribedText)) {
      language = "de";
    } else if (/[àâçéèêëîïôùûü]/i.test(transcribedText)) {
      language = "fr";
    }
    
    return {
      text: transcribedText,
      confidence,
      language
    };
  } catch (error) {
    console.error("[Transcription] Error transcribing image:", imageUrl, error);
    throw error;
  }
}

/**
 * Process a single postcard for transcription
 */
async function transcribePostcard(postcardId: number): Promise<boolean> {
  try {
    console.log(`[Transcription] Processing postcard ${postcardId}`);
    
    // Update status to processing
    await updatePostcard(postcardId, {
      transcriptionStatus: "processing"
    });
    
    // Get all images for this postcard
    const images = await getPostcardImages(postcardId);
    
    if (images.length === 0) {
      console.log(`[Transcription] No images found for postcard ${postcardId}`);
      await updatePostcard(postcardId, {
        transcriptionStatus: "failed"
      });
      return false;
    }
    
    // Transcribe each image
    let successCount = 0;
    
    for (const image of images) {
      try {
        const result = await transcribeImage(image.s3Url);
        
        // Save transcription
        await createTranscription({
          postcardId: postcardId,
          imageId: image.id,
          transcribedText: result.text,
          confidence: result.confidence,
          language: result.language
        });
        
        successCount++;
        console.log(`[Transcription] Successfully transcribed image ${image.id}`);
        
        // Rate limiting between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[Transcription] Error transcribing image ${image.id}:`, error);
      }
    }
    
    // Update postcard status
    if (successCount > 0) {
      await updatePostcard(postcardId, {
        transcriptionStatus: "completed"
      });
      return true;
    } else {
      await updatePostcard(postcardId, {
        transcriptionStatus: "failed"
      });
      return false;
    }
    
  } catch (error) {
    console.error(`[Transcription] Error processing postcard ${postcardId}:`, error);
    await updatePostcard(postcardId, {
      transcriptionStatus: "failed"
    });
    return false;
  }
}

/**
 * Process all pending transcriptions
 */
export async function processTranscriptions(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  console.log("[Transcription] Starting transcription batch");
  
  const pendingPostcards = await getPostcardsNeedingTranscription();
  
  console.log(`[Transcription] Found ${pendingPostcards.length} postcards needing transcription`);
  
  let succeeded = 0;
  let failed = 0;
  
  for (const postcard of pendingPostcards) {
    const success = await transcribePostcard(postcard.id);
    if (success) {
      succeeded++;
    } else {
      failed++;
    }
  }
  
  console.log(`[Transcription] Batch complete: ${succeeded} succeeded, ${failed} failed`);
  
  return {
    processed: pendingPostcards.length,
    succeeded,
    failed
  };
}

/**
 * Transcribe a specific postcard by ID
 */
export async function transcribePostcardById(postcardId: number): Promise<boolean> {
  return await transcribePostcard(postcardId);
}
