# Properties File Editor

![Properties File Editor Screenshot](public/screenshot.png)

A powerful web application for editing and managing Java .properties files for internationalization (i18n) and localization. This tool allows you to easily edit translation files side by side, identify missing translations, and export your changes.

## 🌐 Live Demo

Try it now: [https://rs-bundle-editor.windsurf.build](https://rs-bundle-editor.windsurf.build)

## ✨ Features

- **Multi-Language Support**: Edit multiple language files side by side in a unified interface
- **Visual Indicators**: Missing translations are highlighted with a yellow background
- **Inline Editing**: Click on any cell to edit content directly
- **Keyboard Navigation**: Use Tab key to move between cells for efficient editing
- **Upload Functionality**: Easily import .properties files
- **Download Options**: Export all translations as a single ZIP archive
- **Responsive Design**: Does not work well on smaller mobile devices

## 🔧 Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Local Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/morja/resource-bundle-editor.git
   cd resource-bundle-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

To create a production build:

```bash
npm run build
```

The optimized files will be available in the `build` folder.

## 📝 How to Use

1. **Upload Files**: Click the "Upload Files" button to select your .properties files

2. **Edit Translations**: Click on any cell to edit the value. Press Tab to move to the next cell, or Enter to save and stay in the current cell

3. **Download Files**: Click the "Download All" button to download a ZIP file containing all your language files with the latest changes

## 🧩 File Format

The application supports standard Java .properties files in the following format:

```properties
key1=value1
key2=value2
# This is a comment
key3=value3 with spaces
```

## 🚀 Deployment

This application can be easily deployed to Netlify, Vercel, or any static site hosting service:

### Netlify Deployment

1. Fork this repository
2. Sign up/in to [Netlify](https://www.netlify.com/)
3. Click "New site from Git" and select your fork
4. Use the following settings:
   - Build command: `npm run build`
   - Publish directory: `build`
5. Click "Deploy site"

## 💡 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
