# Ready to push

Unzip this **over** your existing clone so `.git` is preserved, then run the commands below.

## 1. Drop the files that moved or are gone

```bash
git rm -r --cached cv/out
git rm --cached cv/master-part1.md cv/updates-inbox.md data/profile.json data/activity.json
git rm assets/index_old.html cv/out/publications.html cv/out/site-metrics.json
git rm --cached .DS_Store assets/.DS_Store cv/.DS_Store 2>/dev/null; true
```

`data/profile.json` comes straight back as a generated slim file. The others are now
in `cv/private/`, which is gitignored.

## 2. Rebuild and check

```bash
python3 cv/build.py
python3 cv/build_master.py
git add -A
git status --short
```

You should see exactly these tracked:

```
.github/workflows/validate.yml
.gitignore
.nojekyll
assets/*                       (unchanged, minus index_old.html)
cv/README.md
cv/build.py
cv/build_master.py
cv/exports/.gitkeep
cv/templates/publications.html
data/profile.json              (slim, generated)
data/publications.json
index.html
publications.html
```

Nothing under `cv/private/` or `cv/out/` should appear. If it does, `.gitignore` did not land.

## 3. Push

```bash
git commit -m "Split private working material out of the public repo; add Energy Storage 2026 paper"
git push
```

## 4. Back up cv/private/

It is the source of truth and git no longer protects it. Everything else can be regenerated.
