# Project Verification Commands

Scaffold template — copy this into your project root and fill in the commands that exist.

## React / Vite / Next.js
- install: `npm install`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm test`
- build: `npm run build`

## Laravel
- install: `composer install && npm install`
- lint: `./vendor/bin/pint --test`
- test: `php artisan test`
- build: `npm run build`

## Python / Django
- install: `pip install -r requirements.txt`
- lint: `ruff check .`
- typecheck: `mypy .`
- test: `pytest`
- build: (none)

## Go
- install: `go mod tidy`
- lint: `golangci-lint run`
- test: `go test ./...`
- build: `go build ./...`

## Rule
- Run only commands that actually exist in package.json, composer.json, requirements.txt, go.mod, or project scripts.
- Never invent long-running E2E checks unless explicitly requested.
- Prefer `npm run` scripts over global tools when both exist.
