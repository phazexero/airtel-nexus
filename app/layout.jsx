import './globals.css';
import { DbProvider } from '@/lib/db';

export const metadata = {
  title: 'Altura Altcare',
  description:
    'Two independent apps sharing one data layer: the Airtel customer app and the care console behind it.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

// Applies the stored theme before first paint so there is no flash of the
// wrong one. Each app has its own key and its own default, so this has to read
// the path rather than a single global preference.
const THEME_BOOT = `(function(){try{var p=location.pathname;
var k=p.indexOf('/care')===0?'nexus.theme.care':p.indexOf('/my')===0?'nexus.theme.my':'nexus.theme.landing';
var d=k==='nexus.theme.my'?'light':'dark';
document.documentElement.dataset.theme=localStorage.getItem(k)||d;
}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        {/* The data provider lives here rather than in each app's layout.
            Per-app providers meant every new route, error boundary and
            not-found page was one oversight away from rendering a consumer
            outside the provider, which throws and takes the screen down.
            One provider at the root removes the whole class of mistake, and
            the working set is warm by the time either app is opened. */}
        <DbProvider>{children}</DbProvider>
      </body>
    </html>
  );
}
