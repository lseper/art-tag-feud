#!/usr/bin/env bash
set -euo pipefail

export GIT_TERMINAL_PROMPT=0
export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FEATURE_LIST="$SCRIPT_DIR/feature-list.txt"
LOGFILE="$SCRIPT_DIR/implement-feature.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

DRY_RUN=false
SINGLE_FEATURE=""
SKIP_FUNCTIONAL=false
MAX_FIX_ATTEMPTS=3
CLAUDE_MODEL=""

succeeded=0
failed=0
skipped=0
failed_features=()
current_feature=""

STORYBOOK_PID=""
FRONTEND_PID=""
BACKEND_PID=""

LAST_STATIC_ERRORS=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Iterate over feature specs in feature-list.txt and implement each one using
Claude, then verify via static builds/tests and functional browser testing
before merging into the 'auto' branch.

Options:
  --dry-run            List features that would be processed without running anything
  --feature <path>     Process a single feature instead of the full list
  --skip-functional    Skip storybook/e2e verification (steps 5a, 5b)
  --max-attempts <n>   Max fix attempts per verification loop (default: 3)
  --model <model>      Claude model to use (e.g., sonnet, opus)
  -h, --help           Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)         DRY_RUN=true; shift ;;
    --feature)         SINGLE_FEATURE="$2"; shift 2 ;;
    --skip-functional) SKIP_FUNCTIONAL=true; shift ;;
    --max-attempts)    MAX_FIX_ATTEMPTS="$2"; shift 2 ;;
    --model)           CLAUDE_MODEL="$2"; shift 2 ;;
    -h|--help)         usage; exit 0 ;;
    *)                 echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" >> "$LOGFILE"
}

print_summary() {
  echo ""
  echo -e "${BOLD}========== BATCH SUMMARY ==========${RESET}"
  echo -e "  Succeeded : ${GREEN}${succeeded}${RESET}"
  echo -e "  Failed    : ${RED}${failed}${RESET}"
  echo -e "  Skipped   : ${YELLOW}${skipped}${RESET}"
  if [[ ${#failed_features[@]} -gt 0 ]]; then
    echo -e "\n${RED}Failed features:${RESET}"
    for f in "${failed_features[@]}"; do
      echo "  - $f"
    done
  fi
  echo -e "${BOLD}====================================${RESET}"
  log "SUMMARY: succeeded=$succeeded failed=$failed skipped=$skipped"
}

stop_servers() {
  for pid_var in STORYBOOK_PID FRONTEND_PID BACKEND_PID; do
    local pid="${!pid_var}"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
    eval "$pid_var=''"
  done
  agent-browser close > /dev/null 2>&1 || true
}

cleanup() {
  stop_servers
  print_summary
}

trap cleanup EXIT
trap 'echo -e "\n${YELLOW}Interrupted.${RESET}"; exit 130' INT

wait_for_server() {
  local url="$1"
  local timeout="${2:-60}"
  local elapsed=0
  echo -e "    ${CYAN}Waiting for ${url}...${RESET}"
  while ! curl -sf -o /dev/null "$url" 2>/dev/null; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [[ $elapsed -ge $timeout ]]; then
      echo -e "    ${RED}Timeout waiting for ${url} after ${timeout}s${RESET}"
      return 1
    fi
  done
}

run_claude() {
  local step_name="$1"
  local prompt="$2"
  local output_file
  output_file=$(mktemp)

  echo -e "  ${CYAN}[$step_name]${RESET} Running Claude..."
  log "START step=$step_name feature=$current_feature"

  local -a cmd=(claude -p --dangerously-skip-permissions --output-format json)
  if [[ -n "$CLAUDE_MODEL" ]]; then
    cmd+=(--model "$CLAUDE_MODEL")
  fi

  if "${cmd[@]}" "$prompt" > "$output_file" 2>&1; then
    local is_error
    is_error=$(jq -r '.is_error // false' "$output_file" 2>/dev/null || echo "unknown")

    if [[ "$is_error" == "true" ]]; then
      echo -e "  ${RED}[$step_name] FAILED (Claude reported error)${RESET}"
      log "FAIL step=$step_name reason=claude_is_error"
      log "OUTPUT: $(head -c 4000 "$output_file")"
      rm -f "$output_file"
      return 1
    fi

    echo -e "  ${GREEN}[$step_name] OK${RESET}"
    log "OK step=$step_name"
    rm -f "$output_file"
    return 0
  else
    local exit_code=$?
    echo -e "  ${RED}[$step_name] FAILED (exit code $exit_code)${RESET}"
    log "FAIL step=$step_name reason=exit_code_$exit_code"
    log "OUTPUT: $(head -c 4000 "$output_file")"
    rm -f "$output_file"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Prerequisite: ensure frontend has a "test" script
# ---------------------------------------------------------------------------

ensure_test_script() {
  if ! node -e "const p=JSON.parse(require('fs').readFileSync('$ROOT_DIR/frontend/package.json','utf8')); if(!p.scripts||!p.scripts.test) process.exit(1)" 2>/dev/null; then
    echo -e "${CYAN}Adding 'test' script to frontend/package.json...${RESET}"
    (cd "$ROOT_DIR/frontend" && npm pkg set scripts.test="vitest run")
    log "Added test script to frontend/package.json"
  fi
}

# ---------------------------------------------------------------------------
# Server management
# ---------------------------------------------------------------------------

start_servers() {
  local need_storybook="${1:-true}"
  local need_frontend="${2:-true}"
  local need_backend="${3:-true}"

  if [[ "$need_storybook" == "true" ]]; then
    echo -e "  ${CYAN}Starting Storybook on :6006...${RESET}"
    (cd "$ROOT_DIR/frontend" && npm run storybook) > /dev/null 2>&1 &
    STORYBOOK_PID=$!
  fi

  if [[ "$need_frontend" == "true" ]]; then
    echo -e "  ${CYAN}Starting frontend dev server on :5173...${RESET}"
    (cd "$ROOT_DIR/frontend" && npm run dev) > /dev/null 2>&1 &
    FRONTEND_PID=$!
  fi

  if [[ "$need_backend" == "true" ]]; then
    echo -e "  ${CYAN}Starting backend dev server...${RESET}"
    (cd "$ROOT_DIR/backend" && npm run dev) > /dev/null 2>&1 &
    BACKEND_PID=$!
  fi

  if [[ "$need_storybook" == "true" ]]; then
    wait_for_server "http://localhost:6006" 120 || return 1
  fi
  if [[ "$need_frontend" == "true" ]]; then
    wait_for_server "http://localhost:5173" 60 || return 1
  fi
  if [[ "$need_backend" == "true" ]]; then
    sleep 5
  fi

  echo -e "  ${GREEN}Servers ready.${RESET}"
}

# ---------------------------------------------------------------------------
# Storybook baseline capture
# ---------------------------------------------------------------------------

discover_stories() {
  local json
  json=$(curl -sf "http://localhost:6006/index.json" 2>/dev/null || true)
  if [[ -n "$json" ]]; then
    echo "$json" | jq -r '(.entries // .stories // {}) | keys[]' 2>/dev/null || true
  fi
}

capture_storybook_baselines() {
  local baseline_dir="$1"
  mkdir -p "$baseline_dir"

  echo -e "  ${CYAN}[BASELINE] Capturing storybook baselines...${RESET}"
  log "BASELINE: starting capture to $baseline_dir"

  start_servers true false false || {
    echo -e "  ${YELLOW}[BASELINE] Could not start Storybook, skipping baselines.${RESET}"
    stop_servers
    return 0
  }

  local stories
  stories=$(discover_stories)

  if [[ -z "$stories" ]]; then
    echo -e "  ${YELLOW}[BASELINE] No stories discovered, skipping baselines.${RESET}"
    stop_servers
    return 0
  fi

  local count=0
  while IFS= read -r story_id; do
    [[ -z "$story_id" ]] && continue
    local safe_name
    safe_name=$(echo "$story_id" | tr '/' '-' | tr ' ' '-')
    local url="http://localhost:6006/iframe.html?id=${story_id}&viewMode=story"

    agent-browser open "$url" > /dev/null 2>&1 || continue
    agent-browser wait --load networkidle > /dev/null 2>&1 || true
    agent-browser screenshot "${baseline_dir}/${safe_name}--desktop.png" > /dev/null 2>&1 || true

    count=$((count + 1))
  done <<< "$stories"

  agent-browser close > /dev/null 2>&1 || true
  stop_servers

  echo -e "  ${GREEN}[BASELINE] Captured ${count} story screenshots.${RESET}"
  log "BASELINE: captured $count stories to $baseline_dir"
}

# ---------------------------------------------------------------------------
# Static verification
# ---------------------------------------------------------------------------

static_verify() {
  local step_output
  step_output=$(mktemp)
  LAST_STATIC_ERRORS=""
  local errors=""

  echo -e "  ${CYAN}[BUILD-FE]${RESET} Building frontend..."
  if (cd "$ROOT_DIR/frontend" && npm run build) > "$step_output" 2>&1; then
    echo -e "  ${GREEN}[BUILD-FE] OK${RESET}"
  else
    echo -e "  ${RED}[BUILD-FE] FAILED${RESET}"
    errors+="FRONTEND BUILD FAILED:"$'\n'"$(tail -80 "$step_output")"$'\n\n'
  fi

  echo -e "  ${CYAN}[TEST-FE]${RESET} Testing frontend..."
  if (cd "$ROOT_DIR/frontend" && npm run test) > "$step_output" 2>&1; then
    echo -e "  ${GREEN}[TEST-FE] OK${RESET}"
  else
    echo -e "  ${RED}[TEST-FE] FAILED${RESET}"
    errors+="FRONTEND TESTS FAILED:"$'\n'"$(tail -80 "$step_output")"$'\n\n'
  fi

  local has_backend_changes="false"
  if cd "$ROOT_DIR" && git diff --name-only auto 2>/dev/null | grep -q '^backend/'; then
    has_backend_changes="true"
  fi

  if [[ "$has_backend_changes" == "true" ]]; then
    echo -e "  ${CYAN}[BUILD-BE]${RESET} Building backend..."
    if (cd "$ROOT_DIR/backend" && npm run build) > "$step_output" 2>&1; then
      echo -e "  ${GREEN}[BUILD-BE] OK${RESET}"
    else
      echo -e "  ${RED}[BUILD-BE] FAILED${RESET}"
      errors+="BACKEND BUILD FAILED:"$'\n'"$(tail -80 "$step_output")"$'\n\n'
    fi
  else
    echo -e "  ${YELLOW}[BUILD-BE] Skipped (no backend changes)${RESET}"
  fi

  echo -e "  ${CYAN}[TEST-BE]${RESET} Testing backend..."
  if (cd "$ROOT_DIR/backend" && npm run test) > "$step_output" 2>&1; then
    echo -e "  ${GREEN}[TEST-BE] OK${RESET}"
  else
    echo -e "  ${RED}[TEST-BE] FAILED${RESET}"
    errors+="BACKEND TESTS FAILED:"$'\n'"$(tail -80 "$step_output")"$'\n\n'
  fi

  rm -f "$step_output"

  if [[ -n "$errors" ]]; then
    LAST_STATIC_ERRORS="$errors"
    return 1
  fi

  return 0
}

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------

ensure_test_script

if ! $DRY_RUN; then
  if ! (cd "$ROOT_DIR" && git rev-parse --verify auto > /dev/null 2>&1); then
    echo -e "${RED}Branch 'auto' does not exist. Create it first.${RESET}"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Collect features to process
# ---------------------------------------------------------------------------

features=()
if [[ -n "$SINGLE_FEATURE" ]]; then
  features=("$SINGLE_FEATURE")
else
  while IFS= read -r line; do
    feat_path=$(echo "$line" | sed 's/^- \[ \] //')
    features+=("$feat_path")
  done < <(grep '^- \[ \]' "$FEATURE_LIST" 2>/dev/null || true)
fi

total=${#features[@]}

if [[ $total -eq 0 ]]; then
  echo -e "${GREEN}Nothing to do -- all features are marked [x] or list is empty.${RESET}"
  exit 0
fi

if $DRY_RUN; then
  echo -e "${BOLD}Dry run -- $total feature(s) would be processed:${RESET}"
  for f in "${features[@]}"; do
    echo "  $f"
  done
  exit 0
fi

echo -e "${BOLD}Starting feature implementation batch: $total feature(s)${RESET}"
echo "Log: $LOGFILE"
log "=== BATCH START ($total features) ==="
echo ""

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

for i in "${!features[@]}"; do
  feature_path="${features[$i]}"
  n=$((i + 1))
  current_feature="$feature_path"
  branch_name="feature/$(basename "$feature_path" .md)"

  echo -e "${BOLD}[$n/$total]${RESET} ${CYAN}$feature_path${RESET}"
  log "--- FEATURE $n/$total: $feature_path ---"

  # ---- Read feature spec ----

  if [[ ! -f "$ROOT_DIR/$feature_path" ]]; then
    echo -e "  ${RED}Feature spec not found: $ROOT_DIR/$feature_path${RESET}"
    failed=$((failed + 1))
    failed_features+=("$feature_path (spec not found)")
    echo ""
    continue
  fi

  feature_spec=$(<"$ROOT_DIR/$feature_path")

  # ---- Create feature branch off auto ----

  echo -e "  ${CYAN}Creating branch '${branch_name}' off 'auto'...${RESET}"
  cd "$ROOT_DIR"
  git checkout auto
  git checkout -b "$branch_name" 2>/dev/null || {
    echo -e "  ${YELLOW}Branch '${branch_name}' already exists, checking it out...${RESET}"
    git checkout "$branch_name"
  }

  # ---- Capture storybook baselines (before implementation) ----

  BASELINE_DIR=$(mktemp -d)
  if ! $SKIP_FUNCTIONAL; then
    capture_storybook_baselines "$BASELINE_DIR" || true
  fi

  # ---- Mark as in-progress ----

  if [[ -z "$SINGLE_FEATURE" ]]; then
    sed -i '' "s|^- \[ \] ${feature_path}$|- [-] ${feature_path}|" "$FEATURE_LIST" 2>/dev/null || true
  fi

  # ---- Step 3: Implement feature with Claude ----

  implement_prompt="You are implementing a new feature for the Art Tag Feud project.

Feature spec file: ${feature_path}

--- BEGIN FEATURE SPECIFICATION ---
${feature_spec}
--- END FEATURE SPECIFICATION ---

Instructions:
1. Read and understand the feature specification thoroughly.
2. Implement the feature following the project architecture and conventions described in CLAUDE.md.
3. Write appropriate tests for the new functionality (both frontend vitest tests and backend vitest tests as applicable).
4. Ensure all new code follows existing patterns in the codebase.
5. Create or update Storybook stories for any new or modified UI components.
6. Do NOT modify any files unrelated to this feature.
7. Do NOT run git commit -- just implement the code changes."

  if ! run_claude "IMPLEMENT" "$implement_prompt"; then
    failed=$((failed + 1))
    failed_features+=("$feature_path (implement)")
    cd "$ROOT_DIR" && git checkout auto 2>/dev/null || true
    [[ -z "$SINGLE_FEATURE" ]] && sed -i '' "s|^- \[-\] ${feature_path}$|- [ ] ${feature_path}|" "$FEATURE_LIST" 2>/dev/null || true
    rm -rf "$BASELINE_DIR"
    echo ""
    continue
  fi

  # ---- Step 4: Static verification loop ----

  static_passed=false
  for attempt in $(seq 1 "$MAX_FIX_ATTEMPTS"); do
    echo -e "  ${CYAN}[STATIC] Verification attempt $attempt/$MAX_FIX_ATTEMPTS${RESET}"

    if static_verify; then
      static_passed=true
      echo -e "  ${GREEN}[STATIC] All checks passed.${RESET}"
      break
    fi

    if [[ $attempt -eq "$MAX_FIX_ATTEMPTS" ]]; then
      echo -e "  ${RED}[STATIC] Failed after $MAX_FIX_ATTEMPTS attempts.${RESET}"
      break
    fi

    fix_prompt="The feature implementation for '${feature_path}' has build or test errors that need fixing.

--- ERRORS ---
${LAST_STATIC_ERRORS}
--- END ERRORS ---

--- FEATURE SPEC (for context) ---
${feature_spec}
--- END FEATURE SPEC ---

Please fix all build errors, type errors, lint errors, and test failures.
Do NOT run git commit -- just fix the code."

    run_claude "FIX-STATIC-$attempt" "$fix_prompt" || true
  done

  if ! $static_passed; then
    failed=$((failed + 1))
    failed_features+=("$feature_path (static verification)")
    cd "$ROOT_DIR" && git checkout auto 2>/dev/null || true
    [[ -z "$SINGLE_FEATURE" ]] && sed -i '' "s|^- \[-\] ${feature_path}$|- [ ] ${feature_path}|" "$FEATURE_LIST" 2>/dev/null || true
    rm -rf "$BASELINE_DIR"
    echo ""
    continue
  fi

  # ---- Step 5: Functional verification loop ----

  if $SKIP_FUNCTIONAL; then
    echo -e "  ${YELLOW}[FUNCTIONAL] Skipped (--skip-functional)${RESET}"
  else
    functional_passed=false

    for attempt in $(seq 1 "$MAX_FIX_ATTEMPTS"); do
      echo -e "  ${CYAN}[FUNCTIONAL] Verification attempt $attempt/$MAX_FIX_ATTEMPTS${RESET}"

      if ! start_servers true true true; then
        echo -e "  ${RED}[FUNCTIONAL] Failed to start servers.${RESET}"
        stop_servers
        continue
      fi

      # -- 5a: Storybook regression check --

      storybook_prompt="You are verifying that a newly implemented feature has NOT caused unintended visual regressions in Storybook.

Feature implemented: ${feature_path}

--- FEATURE SPEC ---
${feature_spec}
--- END FEATURE SPEC ---

Baseline screenshots directory: ${BASELINE_DIR}
(Files are named <story-id>--desktop.png)

Instructions:
1. Open Storybook at http://localhost:6006
2. Navigate through ALL stories listed in the sidebar.
3. For each story, verify it at BOTH a desktop viewport (1280x800) and a mobile viewport (390x844).
4. Where baseline screenshots exist in ${BASELINE_DIR}, use agent-browser diff screenshot --baseline <path> to compare.
5. Only UI components that are PART OF THIS FEATURE should have visual changes.
6. Any visual changes in components NOT related to this feature are REGRESSIONS.
7. Report PASS if no regressions. Report FAIL with details of regressed stories."

      storybook_ok=true
      if ! run_claude "STORYBOOK-CHECK" "$storybook_prompt"; then
        storybook_ok=false
      fi

      # -- 5b: E2E integration test --

      e2e_ok=true
      if $storybook_ok; then
        e2e_prompt="You are running an end-to-end integration test for a newly implemented feature.

Feature: ${feature_path}

--- FEATURE SPEC ---
${feature_spec}
--- END FEATURE SPEC ---

Instructions:
1. The frontend is running at http://localhost:5173
2. The backend is running (WebSocket on :8080, HTTP on :3010).
3. Use agent-browser to open the application and test the feature end-to-end as described in the spec.
4. Verify ALL expected behavior works correctly.
5. Test at both desktop (1280x800) and mobile (390x844) viewport widths.
6. Report PASS if the feature works as specified, FAIL with details otherwise."

        if ! run_claude "E2E-TEST" "$e2e_prompt"; then
          e2e_ok=false
        fi
      fi

      stop_servers

      if $storybook_ok && $e2e_ok; then
        functional_passed=true
        echo -e "  ${GREEN}[FUNCTIONAL] All checks passed.${RESET}"
        break
      fi

      if [[ $attempt -eq "$MAX_FIX_ATTEMPTS" ]]; then
        echo -e "  ${RED}[FUNCTIONAL] Failed after $MAX_FIX_ATTEMPTS attempts.${RESET}"
        break
      fi

      # Build context about what failed
      fix_context=""
      if ! $storybook_ok; then
        fix_context="The Storybook regression check found unintended visual changes in components not related to this feature."
      fi
      if ! $e2e_ok; then
        fix_context="${fix_context} The E2E integration test failed -- the feature does not work as described in the spec."
      fi

      fix_func_prompt="The functional verification for feature '${feature_path}' failed.

${fix_context}

--- FEATURE SPEC ---
${feature_spec}
--- END FEATURE SPEC ---

Please fix the issues so that:
- Only components related to this feature have visual changes in Storybook.
- The feature works end-to-end as described in the specification.
Do NOT run git commit -- just fix the code."

      run_claude "FIX-FUNCTIONAL-$attempt" "$fix_func_prompt" || true

      echo -e "  ${CYAN}[STATIC] Re-verifying after functional fix...${RESET}"
      if ! static_verify; then
        run_claude "FIX-STATIC-POST-FUNC-$attempt" \
          "Fix build/test errors introduced while fixing functional issues for ${feature_path}. Errors: ${LAST_STATIC_ERRORS}" || true
      fi
    done

    if ! $functional_passed; then
      failed=$((failed + 1))
      failed_features+=("$feature_path (functional verification)")
      cd "$ROOT_DIR" && git checkout auto 2>/dev/null || true
      [[ -z "$SINGLE_FEATURE" ]] && sed -i '' "s|^- \[-\] ${feature_path}$|- [ ] ${feature_path}|" "$FEATURE_LIST" 2>/dev/null || true
      rm -rf "$BASELINE_DIR"
      echo ""
      continue
    fi
  fi

  # Clean up baselines
  rm -rf "$BASELINE_DIR"

  # ---- Step 6: Merge feature branch into auto ----

  echo -e "  ${CYAN}[MERGE] Committing and merging '${branch_name}' into 'auto'...${RESET}"
  cd "$ROOT_DIR"
  git add -A
  git commit -m "feat: implement $(basename "$feature_path" .md)" --no-verify --no-gpg-sign 2>/dev/null || true
  git checkout auto
  if git merge --no-ff --no-gpg-sign "$branch_name" -m "Merge $branch_name into auto"; then
    echo -e "  ${GREEN}[MERGE] OK${RESET}"
    git branch -d "$branch_name" 2>/dev/null || true
  else
    echo -e "  ${RED}[MERGE] Merge conflict! Aborting merge.${RESET}"
    git merge --abort 2>/dev/null || true
    failed=$((failed + 1))
    failed_features+=("$feature_path (merge conflict)")
    [[ -z "$SINGLE_FEATURE" ]] && sed -i '' "s|^- \[-\] ${feature_path}$|- [ ] ${feature_path}|" "$FEATURE_LIST" 2>/dev/null || true
    echo ""
    continue
  fi

  # ---- Step 7: Mark feature as completed ----

  if [[ -z "$SINGLE_FEATURE" ]]; then
    sed -i '' "s|^- \[-\] ${feature_path}$|- [x] ${feature_path}|" "$FEATURE_LIST" 2>/dev/null || true
  fi

  succeeded=$((succeeded + 1))
  echo -e "  ${GREEN}Feature completed successfully.${RESET}"
  log "COMPLETED: $feature_path"
  echo ""
done

log "=== BATCH END ==="
