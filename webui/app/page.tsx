import Image from 'next/image'
import Link from 'next/link'
import RootLayout from '@/app/layout'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">

      <div style={{ width: '100%', height: '100%', justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'inline-flex' }}>
        <div style={{ width: 24, height: 24 }} >
          <img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' alt='GitHub Logo' style={{ width: '20px', height: '20px' }} />
        </div>
        <div style={{ width: '100%', color: '#0F172A', fontSize: 18, fontFamily: 'Inter', fontWeight: '600', lineHeight: 2, wordWrap: 'break-word' }}>
          <a href='https://github.com/fishaudio/fish-speech'>
            fish speech
          </a>
        </div>
      </div>
      <div style={{ width: '100%', textAlign: 'center', color: '#0F172A', fontSize: 48, fontFamily: 'Inter', fontWeight: '800', wordWrap: 'break-word' }}>Fish speech</div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          src="/fish-audio.jpg"
          alt="fish audio Logo"
          className="dark:invert"
          width={400}
          height={24}
          priority
        />
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left" style={{ textAlign: 'center' }}>


        <Link
          href="/train"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Train{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Train your model with your own data.
          </p>
        </Link>

        <Link
          href="/inference"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Inference{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Inference with your model.
          </p>
        </Link>
      </div>
    </main>
  )
}
