# Facet — task runner
# Install: brew install just
# Usage:  just <recipe>   or   just --list

set dotenv-load := false

tx_app_window := "facet-app"
tx_proxy_window := "facet-proxy"

# List available recipes
default:
    @just --list

# Create the tmux session used by tx
tmux-new:
    @session="${TMUX_SESSION:-labs}"; \
    if tmux has-session -t "$session" 2>/dev/null; then \
        echo "tmux session '$session' already exists"; \
    else \
        tmux new-session -d -s "$session" -n shell; \
        echo "created tmux session '$session'"; \
    fi

# Install dependencies
install:
    npm install

# Start Vite dev server
dev:
    npm run dev

# Start Vite dev server in a dedicated tx/tmux window
tx-dev: tmux-new
    @if tmux list-windows -t "${TMUX_SESSION:-labs}" -F "#{window_name}" | grep -qx "{{tx_app_window}}"; then \
        if tx running {{tx_app_window}} >/dev/null 2>&1; then \
            echo "{{tx_app_window}} is already running"; \
        else \
            tx send {{tx_app_window}} "cd \"$PWD\" && ./scripts/tx-start-app.sh"; \
        fi; \
    else \
        tx new {{tx_app_window}}; \
        tx send {{tx_app_window}} "cd \"$PWD\" && ./scripts/tx-start-app.sh"; \
    fi
    @tx read {{tx_app_window}} 20

# Start the local AI proxy in a dedicated tx/tmux window
tx-proxy: tmux-new
    @if tmux list-windows -t "${TMUX_SESSION:-labs}" -F "#{window_name}" | grep -qx "{{tx_proxy_window}}"; then \
        if tx running {{tx_proxy_window}} >/dev/null 2>&1; then \
            echo "{{tx_proxy_window}} is already running"; \
        else \
            tx send {{tx_proxy_window}} "cd \"$PWD\" && ./scripts/tx-start-proxy.sh"; \
        fi; \
    else \
        tx new {{tx_proxy_window}}; \
        tx send {{tx_proxy_window}} "cd \"$PWD\" && ./scripts/tx-start-proxy.sh"; \
    fi
    @tx read {{tx_proxy_window}} 20

# Start both app and proxy with tx/tmux
tx-up: tx-dev tx-proxy

# Show status for tx-managed app windows
tx-status:
    @echo "== {{tx_app_window}} =="
    @tx status {{tx_app_window}} || true
    @echo ""
    @echo "== {{tx_proxy_window}} =="
    @tx status {{tx_proxy_window}} || true

# Stop tx-managed app windows
tx-stop:
    @if tmux list-windows -t "${TMUX_SESSION:-labs}" -F "#{window_name}" | grep -qx "{{tx_app_window}}"; then tx kill {{tx_app_window}}; else echo "{{tx_app_window}} is not running"; fi
    @if tmux list-windows -t "${TMUX_SESSION:-labs}" -F "#{window_name}" | grep -qx "{{tx_proxy_window}}"; then tx kill {{tx_proxy_window}}; else echo "{{tx_proxy_window}} is not running"; fi

# TypeScript check + Vite production build
build:
    npm run build

# TypeScript type-check only (no emit)
typecheck:
    npm run typecheck

# Run all Vitest tests
test:
    npm run test

# Run a single test file (e.g., just test-file src/test/assembler.test.ts)
test-file file:
    npx vitest run {{ file }}

# Run tests in watch mode
test-watch:
    npx vitest

# ESLint
lint:
    npm run lint

# Preview production build locally
preview:
    npm run preview

# Full CI check: typecheck + lint + test
ci: typecheck lint test

# Clean build artifacts
clean:
    rm -rf dist
