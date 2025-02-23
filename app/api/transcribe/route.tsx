import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ensureTempDir = () => {
  console.log(process.platform);
  const tmpDir = process.platform === 'win32' ? 'C:\\tmp' : '/tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
};

// Utility function to save buffer data as a file
const saveBufferToFile = async (buffer: Buffer, filePath: string) => {
  const stream = Readable.from(buffer);
  const writeStream = fs.createWriteStream(filePath);

  return new Promise<void>((resolve, reject) => {
    stream.pipe(writeStream);
    writeStream.on('finish', () => resolve());
    writeStream.on('error', reject);
  });
};

// API handler for POST requests
export async function POST(req: NextRequest) {
  console.log('Received request:', req);
  try {
    // Validate Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid Content-Type' },
        { status: 400 }
      );
    }

    // Extract audio file from the request
    const formData = await req.formData();
    const audioFile = formData.get('file');
    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Audio file not found or invalid' },
        { status: 400 }
      );
    }

    // Accept both WebM and WAV files
    if (
      !audioFile.type.includes('audio/webm') &&
      !audioFile.type.includes('audio/wav')
    ) {
      return NextResponse.json(
        { error: 'Invalid audio format' },
        { status: 400 }
      );
    }

    // Convert audio file to a buffer and save to a temporary file
    const fileBuffer = Buffer.from(await audioFile.arrayBuffer());
    const tmpDir = ensureTempDir();
    const audioPath = path.join(tmpDir, 'audio.webm');
    await saveBufferToFile(fileBuffer, audioPath);

    // Call OpenAI API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
    });

    console.log('Finish request:', req);

    // Respond with transcription result
    return NextResponse.json({ result: transcription.text });
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
