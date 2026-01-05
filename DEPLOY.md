# Deploying Foogle to Netlify

You can deploy Foogle to Netlify in just a few minutes appropriately for a static site.

## Option 1: Netlify Drop (Easiest)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Locate your project folder on your computer:
   `C:\Users\Niles\.gemini\antigravity\scratch\boggle-clone`
3. Drag and drop the **entire folder** onto the Netlify drop area.
4. Netlify will upload and publish your site instantly.
5. You can then change the site name (e.g., `foogle-game.netlify.app`) in "Site Settings".

## Option 2: Netlify CLI (Advanced)
If you have node.js installed, you can use the command line:

1. Install Netlify CLI:
   ```bash
   npm install netlify-cli -g
   ```
2. Run deployment:
   ```bash
   netlify deploy --prod
   ```
3. Follow the prompts to create a new site.
   - Publish directory: `.` (current directory)

## Pre-deployment Checklist
- Ensure `index.html`, `style.css`, `script.js` and `words_alpha.txt` are all in the root folder.
- Test one last time locally to ensure everything works.
