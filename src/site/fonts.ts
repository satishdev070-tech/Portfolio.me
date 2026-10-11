import {
  DM_Sans, Fraunces, IBM_Plex_Sans, Inter, JetBrains_Mono, Lora, Noto_Sans_Devanagari, Noto_Serif_Devanagari,
  Playfair_Display, Source_Serif_4, Space_Grotesk,
} from 'next/font/google'

// Self-hosted at build time by next/font (options must be literals). preload:false: @font-face rules
// are declared for every template font, but a browser only downloads the faces a page uses.

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-inter' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-dm-sans' })
const plex = IBM_Plex_Sans({ subsets: ['latin'], display: 'swap', preload: false, weight: ['400', '500', '600', '700'], variable: '--font-ibm-plex-sans' })
const grotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-space-grotesk' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-source-serif' })
const lora = Lora({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-lora' })
const fraunces = Fraunces({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-fraunces' })
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-playfair' })
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-jetbrains-mono' })
const devaSans = Noto_Sans_Devanagari({ subsets: ['devanagari'], display: 'swap', preload: false, weight: ['400', '600', '700'], variable: '--font-devanagari-sans' })
const devaSerif = Noto_Serif_Devanagari({ subsets: ['devanagari'], display: 'swap', preload: false, weight: ['400', '600'], variable: '--font-devanagari-serif' })

export const siteFontVariables = [
  inter, dmSans, plex, grotesk, sourceSerif, lora, fraunces, playfair, mono, devaSans, devaSerif,
].map((f) => f.variable).join(' ')
