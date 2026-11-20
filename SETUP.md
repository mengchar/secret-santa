# Secret Santa setup

## 1. Wishlist storage (Google Sheet, ~5 min)

1. Create a new Google Sheet (any name).
2. In the sheet: **Extensions → Apps Script**.
3. Delete the starter code, paste in all of `wishlist-apps-script.gs`, and save.
4. Click **Deploy → New deployment**. Click the gear next to "Select type" and pick **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, approve the permissions prompt (Google will warn that the app is unverified; choose *Advanced → Go to project*; it's your own script).
6. Copy the **Web app URL** (ends in `/exec`).
7. Open `index.html`, find `const WISHLIST_URL = "";` and paste the URL between the quotes.

If you later edit the script, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## 2. GitHub Pages

1. Create a repo and add `index.html` (the other two files are optional).
2. Repo **Settings → Pages**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`.
3. After a minute your page is at `https://<your-username>.github.io/<repo-name>/`.

## Notes

- The draw is baked into `index.html` (scrambled, not encrypted). Anyone determined enough to dig through the code could decode it, so it's an honor system.
- Anyone with the page link can edit any person's wishlist. Also honor system.
- The wishlists sit in your Google Sheet, so you can see them there. You can't see the draw there.
