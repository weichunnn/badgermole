export type Mode = 'home' | 'query' | 'guide';
export type Message = {
  role: string;
  content: string | Array<{ type: string; text?: string; image?: string }>;
};
