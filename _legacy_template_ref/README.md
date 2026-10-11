# Ajeet Kumar Mishra | अजीत कुमार मिश्रा — Academic & Archaeological Portfolio

> Doctoral Researcher in Archaeology | Heritage Documentation & Epigraphy Specialist  
> पुरातत्व में शोधार्थी | विरासत दस्तावेज़ीकरण एवं पुरालेख विशेषज्ञ  
> Indian Institute of Heritage (IIH), Noida • Banaras Hindu University (BHU) Alumnus

A bespoke, responsive, and high-performance HTML5/CSS3/JavaScript academic portfolio website designed for **Ajeet Kumar Mishra**. 

Built from comprehensive CV data reviewed from [https://hello.cv/satishdev](https://hello.cv/satishdev), featuring an editorial scholarly aesthetic, bilingual support (English & हिन्दी), 5 specialized themes, archaeological SVG illustrations, project showcase cards, and print-ready CV export.

---

## 🌐 Bilingual Support (English & हिन्दी)

- Instant 1-click **Language Switcher (EN / हिन्दी)** in the top navigation and mobile drawer.
- 92+ translated data attributes translating all section titles, academic introductions, excavation details, degrees, awards, and skills seamlessly.
- Choice is remembered in `localStorage` across visits.

---

## 🏛️ Archaeological Visual Showcase Cards

Includes dedicated project showcase cards with custom vector diagrams:
1. **Kunal, Haryana (2023–24)**: Pre-Harappan stratigraphy, Hakra phase, trench section diagram.
2. **Kurdi, Baghpat, UP (2024–25)**: Painted Grey Ware (PGW) protohistoric vessel silhouette & concentric slip band.
3. **Inscriptions of Kashi Project (2017–19)**: Unrecorded lithic inscription slab with Brahmi & Devanagari epigraphs.
4. **National Museum Kushan Art Corpus**: Tagore National Fellowship, Mathura/Gandhara lotus medallion and stucco art study.

---

## 🎨 5 Specialized Themes

Easily switch themes on-the-fly via the theme selector in the navigation bar:

1. **Parchment** *(Default Light)*: Classic editorial academic paper, deep ink typography (`#18181B`), warm terracotta accent (`#9A3412`), and archival ivory background (`#FBFBFA`).
2. **Obsidian** *(Dark Room)*: Deep midnight obsidian (`#121214`), off-white reading text (`#F4F4F5`), and burnt ember accent (`#EA580C`).
3. **Terracotta** *(Ancient Clay)*: Sun-baked pottery and protohistoric earthen tones (`#F8F2ED`), espresso text (`#2E1E17`), and rich clay accent (`#B94719`).
4. **Sandstone** *(Lithic Monument)*: Ancient stone monument tones (`#F4EFE6`), basalt typography (`#24201B`), and warm ochre/gold bronze accent (`#A16207`).
5. **Sage** *(Fieldwork Archive)*: Natural fieldwork notebook and lichen stone (`#F2F4F2`), deep graphite text (`#1A241E`), and muted forest epigraphy green accent (`#2D6A4F`).

---

## 📂 Project Structure

```text
Hello-Me-Portfolio/
├── index.html                                    # Main semantic bilingual HTML5 portfolio document
├── assets/
│   ├── css/
│   │   └── styles.css                            # 5 theme tokens, typography, project cards, print styles
│   ├── js/
│   │   └── main.js                               # 5-theme switcher, EN/HI engine, clipboard copy, print
│   └── images/
│       ├── profile.jpeg                          # High-resolution original portrait photograph
│       ├── archaeology-hero-illustration.svg     # Hero background stratigraphy & epigraphy watermark
│       ├── kunal-excavation.svg                  # Pre-Harappan trench stratigraphy diagram
│       ├── kurdi-pgw.svg                         # Painted Grey Ware ceramic vessel diagram
│       ├── kashi-inscriptions.svg                # Lithic stone inscription tablet illustration
│       └── kushan-sculpture.svg                  # Kushan lotus medallion illustration
└── README.md                                     # Documentation and deployment guide
```

---

## 🚀 How to Run Locally

### Option 1: Direct File Open
Double-click `index.html` in Finder or open it with any modern web browser (Safari, Chrome, Firefox, Edge).

### Option 2: Local HTTP Server
Run a local Python server from this directory:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.
