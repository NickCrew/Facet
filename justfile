# Facet — task runner
# Install: brew install just
# Usage:  just <recipe>   or   just --list

set dotenv-load := false

tmux_app_window := "facet-app"
tmux_proxy_window := "facet-proxy"

# List available recipes
default:
    @just --list

# Create the tmux session used by cortex tmux
tmux-new:
    @session="${TMUX_SESSION:-facet}"; \
    if tmux has-session -t "$session" 2>/dev/null; then \
        echo "tmux session '$session' already exists"; \
    else \
        tmux new-session -d -s "$session" -n shell; \
        echo "created tmux session '$session'"; \
    fi

# Install dependencies
install:
    pnpm install

# Start Vite dev server
dev:
    pnpm run dev

# Start the local AI proxy
dev-proxy:
    pnpm run dev:proxy

# Start app and proxy together with pnpm workspace scripts
dev-all:
    pnpm run dev:all

# Start Vite dev server in a dedicated service window
svc-dev: tmux-new
    @if tmux list-windows -t "${TMUX_SESSION:-facet}" -F "#{window_name}" | grep -qx "{{tmux_app_window}}"; then \
        if cortex tmux running {{tmux_app_window}} >/dev/null 2>&1; then \
            echo "{{tmux_app_window}} is already running"; \
        else \
            cortex tmux send {{tmux_app_window}} "cd \"$PWD\" && ./scripts/tx-start-app.sh"; \
        fi; \
    else \
        cortex tmux new {{tmux_app_window}}; \
        cortex tmux send {{tmux_app_window}} "cd \"$PWD\" && ./scripts/tx-start-app.sh"; \
    fi
    @cortex tmux read {{tmux_app_window}} 20

# Start the local AI proxy in a dedicated service window
svc-proxy: tmux-new
    @if tmux list-windows -t "${TMUX_SESSION:-facet}" -F "#{window_name}" | grep -qx "{{tmux_proxy_window}}"; then \
        if cortex tmux running {{tmux_proxy_window}} >/dev/null 2>&1; then \
            echo "{{tmux_proxy_window}} is already running"; \
        else \
            cortex tmux send {{tmux_proxy_window}} "cd \"$PWD\" && ./scripts/tx-start-proxy.sh"; \
        fi; \
    else \
        cortex tmux new {{tmux_proxy_window}}; \
        cortex tmux send {{tmux_proxy_window}} "cd \"$PWD\" && ./scripts/tx-start-proxy.sh"; \
    fi
    @cortex tmux read {{tmux_proxy_window}} 20

# Start both app and proxy service windows
svc-up: svc-dev svc-proxy

# Show status for service windows
svc-status:
    @echo "== {{tmux_app_window}} =="
    @cortex tmux status {{tmux_app_window}} || true
    @echo ""
    @echo "== {{tmux_proxy_window}} =="
    @cortex tmux status {{tmux_proxy_window}} || true

# Print the tmux session name used by service recipes
svc-session:
    @echo "${TMUX_SESSION:-facet}"

# Enter the shell window for the service tmux session
svc-shell: tmux-new
    @session="${TMUX_SESSION:-facet}"; \
    tmux select-window -t "$session:shell"; \
    if [ -n "$TMUX" ]; then \
        tmux switch-client -t "$session"; \
    else \
        tmux attach-session -t "$session"; \
    fi

# Restart the Vite dev server service window
svc-restart:
    @if tmux list-windows -t "${TMUX_SESSION:-facet}" -F "#{window_name}" | grep -qx "{{tmux_app_window}}"; then cortex tmux kill {{tmux_app_window}}; fi
    @just svc-dev

# Stop service windows
svc-stop:
    @if tmux list-windows -t "${TMUX_SESSION:-facet}" -F "#{window_name}" | grep -qx "{{tmux_app_window}}"; then cortex tmux kill {{tmux_app_window}}; else echo "{{tmux_app_window}} is not running"; fi
    @if tmux list-windows -t "${TMUX_SESSION:-facet}" -F "#{window_name}" | grep -qx "{{tmux_proxy_window}}"; then cortex tmux kill {{tmux_proxy_window}}; else echo "{{tmux_proxy_window}} is not running"; fi

# TypeScript check + Vite production build
build:
    pnpm run build

# TypeScript type-check only (no emit)
typecheck:
    pnpm run typecheck

# Run all Vitest tests
test:
    pnpm run test

# Run a single test file (e.g., just test-file src/test/assembler.test.ts)
test-file file:
    pnpm exec vitest run {{ file }}

# Run tests in watch mode
test-watch:
    pnpm exec vitest

# ESLint
lint:
    pnpm run lint

# Preview production build locally
preview:
    pnpm run preview

# Full CI check: typecheck + lint + test
ci: typecheck lint test

# Clean build artifacts
clean:
    rm -rf dist
