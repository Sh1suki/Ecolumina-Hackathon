# Manual Setup Guide for EcoLumina Project

This guide will help you recreate the EcoLumina project from scratch by manually copying code. Follow each step in order.

---

## STEP 1: Create Project Folder

1. Create a new folder named `Ecolumina` (or your preferred project name)
2. Navigate into this folder in your terminal/command prompt

---

## STEP 2: Initialize NPM Project

1. Open terminal/command prompt in your project folder
2. Run the following command:
   ```
   npm init -y
   ```

---

## STEP 3: Install Dependencies

Run the following command to install all required packages:
```
npm install @google/genai@^1.30.0 canvas-confetti@^1.9.3 react@^19.2.0 react-dom@^19.2.0 react-router-dom@^7.9.6 vite@^7.2.6 @vitejs/plugin-react@^5.1.1 vite-plugin-pwa@^1.2.0 firebase@^12.6.0
```

Then install development dependencies:
```
npm install --save-dev @types/node@^22.14.0 @vitejs/plugin-react@^5.0.0 typescript@~5.8.2 vite@^6.2.0
```

---

## STEP 4: Create Folder Structure

Create the following folders in your project root:
- `components` (folder)
- `pages` (folder)
- `services` (folder)
- `utils` (folder)

---

## STEP 5: Create Configuration Files

### 5.1 Create `package.json`
- Open the existing `package.json` file in your current project
- Copy the entire contents manually
- Replace the auto-generated `package.json` with the copied content

### 5.2 Create `tsconfig.json`
- Open the existing `tsconfig.json` file in your current project
- Create a new file named `tsconfig.json` in your new project root
- Copy the entire contents from the existing file manually

### 5.3 Create `vite.config.ts`
- Open the existing `vite.config.ts` file in your current project
- Create a new file named `vite.config.ts` in your new project root
- Copy the entire contents from the existing file manually

---

## STEP 6: Create Root HTML and Manifest Files

### 6.1 Create `index.html`
- Open the existing `index.html` file in your current project
- Create a new file named `index.html` in your new project root
- Copy the entire contents from the existing file manually

### 6.2 Create `manifest.json`
- Open the existing `manifest.json` file in your current project
- Create a new file named `manifest.json` in your new project root
- Copy the entire contents from the existing file manually

### 6.3 Create `metadata.json`
- Open the existing `metadata.json` file in your current project
- Create a new file named `metadata.json` in your new project root
- Copy the entire contents from the existing file manually

---

## STEP 7: Create Type Definitions

### 7.1 Create `types.ts`
- Open the existing `types.ts` file in your current project
- Create a new file named `types.ts` in your new project root
- Copy the entire contents from the existing file manually

---

## STEP 8: Create Main Application Files

### 8.1 Create `index.tsx`
- Open the existing `index.tsx` file in your current project
- Create a new file named `index.tsx` in your new project root
- Copy the entire contents from the existing file manually

### 8.2 Create `App.tsx`
- Open the existing `App.tsx` file in your current project
- Create a new file named `App.tsx` in your new project root
- Copy the entire contents from the existing file manually

---

## STEP 9: Create Component Files

### 9.1 Create `components/Layout.tsx`
- Open the existing `components/Layout.tsx` file in your current project
- Create a new file named `Layout.tsx` inside the `components` folder
- Copy the entire contents from the existing file manually

### 9.2 Create `components/Camera.tsx`
- Open the existing `components/Camera.tsx` file in your current project
- Create a new file named `Camera.tsx` inside the `components` folder
- Copy the entire contents from the existing file manually

---

## STEP 10: Create Page Files

### 10.1 Create `pages/Login.tsx`
- Open the existing `pages/Login.tsx` file in your current project
- Create a new file named `Login.tsx` inside the `pages` folder
- Copy the entire contents from the existing file manually

### 10.2 Create `pages/Home.tsx`
- Open the existing `pages/Home.tsx` file in your current project
- Create a new file named `Home.tsx` inside the `pages` folder
- Copy the entire contents from the existing file manually

### 10.3 Create `pages/Scan.tsx`
- Open the existing `pages/Scan.tsx` file in your current project
- Create a new file named `Scan.tsx` inside the `pages` folder
- Copy the entire contents from the existing file manually

### 10.4 Create `pages/Result.tsx`
- Open the existing `pages/Result.tsx` file in your current project
- Create a new file named `Result.tsx` inside the `pages` folder
- Copy the entire contents from the existing file manually

### 10.5 Create `pages/Workshop.tsx`
- Open the existing `pages/Workshop.tsx` file in your current project
- Create a new file named `Workshop.tsx` inside the `pages` folder
- Copy the entire contents from the existing file manually

### 10.6 Create `pages/Leaderboard.tsx`
- Open the existing `pages/Leaderboard.tsx` file in your current project
- Create a new file named `Leaderboard.tsx` inside the `pages` folder
- Copy the entire contents from the existing file manually

---

## STEP 11: Create Service Files

### 11.1 Create `services/firebase.ts`
- Open the existing `services/firebase.ts` file in your current project
- Create a new file named `firebase.ts` inside the `services` folder
- Copy the entire contents from the existing file manually

### 11.2 Create `services/db.ts`
- Open the existing `services/db.ts` file in your current project
- Create a new file named `db.ts` inside the `services` folder
- Copy the entire contents from the existing file manually

### 11.3 Create `services/gemini.ts`
- Open the existing `services/gemini.ts` file in your current project
- Create a new file named `gemini.ts` inside the `services` folder
- Copy the entire contents from the existing file manually

---

## STEP 12: Create Utility Files

### 12.1 Create `utils/share.ts`
- Open the existing `utils/share.ts` file in your current project
- Create a new file named `share.ts` inside the `utils` folder
- Copy the entire contents from the existing file manually

---

## STEP 13: Verify Project Structure

Your project structure should now look like this:

```
Ecolumina/
├── components/
│   ├── Camera.tsx
│   └── Layout.tsx
├── pages/
│   ├── Home.tsx
│   ├── Leaderboard.tsx
│   ├── Login.tsx
│   ├── Result.tsx
│   ├── Scan.tsx
│   └── Workshop.tsx
├── services/
│   ├── db.ts
│   ├── firebase.ts
│   └── gemini.ts
├── utils/
│   └── share.ts
├── App.tsx
├── index.html
├── index.tsx
├── manifest.json
├── metadata.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── types.ts
└── vite.config.ts
```

---

## STEP 14: Additional Files (if needed)

### 14.1 CSS File
- The `index.html` file references `/index.css` on line 49
- If you have an `index.css` file in your original project, copy it to the root
- If the file doesn't exist, you can either:
  - Create an empty `index.css` file in the root, or
  - Remove the line `<link rel="stylesheet" href="/index.css">` from `index.html`

### 14.2 Other Files
If you have any additional files like:
- Image assets (icons, images, etc.)
- Other configuration files
- Environment files (`.env`)

Copy them to the same locations in your new project.

---

## STEP 15: Test the Project

1. Run the development server:
   ```
   npm run dev
   ```

2. If there are any errors, check:
   - All files were copied correctly
   - All dependencies are installed
   - File paths and imports are correct

---

## Notes:

- Make sure to copy code exactly as it appears, including all whitespace and indentation
- Pay special attention to import statements - they should match the folder structure
- If you encounter TypeScript errors, verify that all type definitions are correctly copied
- Check that all environment variables or API keys are properly configured in the service files

---

## Quick Reference: File Locations

When copying code, refer to these files in your original project:

**Root Files:**
- `package.json` → Copy to root
- `tsconfig.json` → Copy to root
- `vite.config.ts` → Copy to root
- `index.html` → Copy to root
- `manifest.json` → Copy to root
- `metadata.json` → Copy to root
- `types.ts` → Copy to root
- `index.tsx` → Copy to root
- `App.tsx` → Copy to root

**Components:**
- `components/Layout.tsx` → Copy to `components/` folder
- `components/Camera.tsx` → Copy to `components/` folder

**Pages:**
- `pages/Login.tsx` → Copy to `pages/` folder
- `pages/Home.tsx` → Copy to `pages/` folder
- `pages/Scan.tsx` → Copy to `pages/` folder
- `pages/Result.tsx` → Copy to `pages/` folder
- `pages/Workshop.tsx` → Copy to `pages/` folder
- `pages/Leaderboard.tsx` → Copy to `pages/` folder

**Services:**
- `services/firebase.ts` → Copy to `services/` folder
- `services/db.ts` → Copy to `services/` folder
- `services/gemini.ts` → Copy to `services/` folder

**Utils:**
- `utils/share.ts` → Copy to `utils/` folder

---

**Good luck with your manual setup!**

