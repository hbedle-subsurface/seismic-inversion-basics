# Adding page counting to a repository

Same procedure in every teaching repository. One GoatCounter account,
`hbedle`, covers all of them; the path tells them apart.

1. Copy `assets/count.js` **verbatim**. Do not edit it.

2. Load it at the foot of the body, **before** the page's own scripts:

   ```html
   <!-- root page -->        <script src="assets/count.js"></script>
   <!-- page in modules/ --> <script src="../assets/count.js"></script>
   ```

3. Give every page a real `<title>`. GoatCounter shows it beside the path,
   and a page called "Untitled" counts perfectly well and tells you nothing.

4. Put the disclosure notice in the footer. It is in every module already;
   copy it verbatim, changing only the site title in the citation line.

Counts are at <https://hbedle.goatcounter.com>, listed by page.

## The one thing not to remove

`window.goatcounter.path` in `count.js` strips the query string. These sites
write every control position into the address bar so a setup can be handed
out as a link. Left alone, GoatCounter files each visit under its own row —
one module of avo-basics has about eleven billion reachable URLs, so five
hundred visits would appear as five hundred rows of one view each and the
module's total would read zero.

Removing it breaks nothing visibly. It quietly makes the dashboard useless,
which is worse.

## Switching it off

Empty `COUNT_CODE`, or delete the file and the one `<script>` line that loads
it. Nothing else depends on it, in any repository.
