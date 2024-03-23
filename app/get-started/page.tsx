import TwitterButton from '../components/TwitterButton'
import LineButton from '../components/LineButton'

export default function GetStarted() {
  return (
    <main className="flex min-h-screen justify-center gap-10 flex-col items-center">
      <TwitterButton />
      <hr />
      <LineButton />
    </main>
  );
}
