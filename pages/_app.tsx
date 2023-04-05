import '@/styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { getInitialProps } from 'react-i18next';

const inter = Inter({ subsets: ['latin'] });

function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <SessionProvider refetchOnWindowFocus={false} session={session}>
      <div className={inter.className}>
        <Toaster />
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  );
}
export default appWithTranslation(App);
