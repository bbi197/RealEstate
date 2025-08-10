# My Real Estate App (Netlify-ready)

## Quick start

1. Install dependencies
   ```
   npm install
   ```

2. Run dev server
   ```
   npm run dev
   ```

3. Build
   ```
   npm run build
   ```

4. Preview production build
   ```
   npm run preview
   ```

## Deploy to Netlify (manual)
- Create a GitHub repo, push this project.
- In Netlify, choose **Import from Git**, connect repo.
- Build command: `npm run build`
- Publish directory: `dist`
- (Optional) Set environment variable `REACT_APP_MAPBOX_TOKEN` if you want map.

The contact form uses Netlify Forms (`name="lead-contact"`). When deployed to Netlify, submissions will be captured in Netlify dashboard.
# RealEstate
