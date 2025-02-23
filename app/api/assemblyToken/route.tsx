import { AssemblyAI } from 'assemblyai';

export async function POST() {
  const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return Response.error();
  }

  const assemblyClient = new AssemblyAI({ apiKey: apiKey });

  const token = await assemblyClient.realtime.createTemporaryToken({
    expires_in: 3_600_000_000,
  });

  return Response.json({ token });
}
