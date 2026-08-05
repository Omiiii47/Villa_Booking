import './globals.css';
import AppProviders from '../src/components/AppProviders';

export const metadata = {
  title: 'Solscape Stays',
  description:
    'Curating extraordinary villa experiences for discerning travelers who seek the exceptional.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
