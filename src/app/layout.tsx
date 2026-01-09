import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Documentation Vision',
    description: 'Generate documentation from video using AI',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}
