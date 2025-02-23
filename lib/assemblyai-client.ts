// 'use client';

// import { RealtimeTranscriber } from 'assemblyai';
// import { getAssemblyToken } from './getAssemblyToken';

// export async function createTranscriber(
//   sampleRate = 16000
// ): Promise<RealtimeTranscriber> {
//   const token = await getAssemblyToken();

//   if (!token) {
//     throw new Error('Failed to get AssemblyAI token');
//   }

//   return new RealtimeTranscriber({
//     token,
//     sampleRate,
//     endUtteranceSilenceThreshold: 1000,
//   });
// }
