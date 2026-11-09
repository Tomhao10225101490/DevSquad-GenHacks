import type {Metadata} from 'next';
import '@fontsource/geist/400.css';import '@fontsource/geist/500.css';import '@fontsource/geist/600.css';import '@fontsource/geist/700.css';import '@fontsource/jetbrains-mono/400.css';
import '@xyflow/react/dist/style.css';import './globals.css';
export const metadata:Metadata={title:'DevSquad — Every fix leaves a paper trail',description:'An inspectable software team workbench. Replay real test evidence, inspect changes and download a verified patch.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
