import IntentClassifier from '../components/IntentClassifier';

export default function Home() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Intent Classification</h1>
      <IntentClassifier mode="QUERY" />
    </div>
  );
}