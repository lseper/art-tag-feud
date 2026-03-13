#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILELIST="$SCRIPT_DIR/filelist.md"
LOGFILE="$SCRIPT_DIR/translate-batch.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

DRY_RUN=false
SINGLE_FILE=""
SKIP_TEST=false
SKIP_COMMIT=false

succeeded=0
failed=0
skipped=0
failed_files=()
current_file=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Iterate over untranslated routes that are present in the react application, but still link to the old Angular application in ./missing.md and run agent translate/test/commit.

Options:
  --dry-run        List files that would be processed without running anything
  --file <path>    Process a single file instead of the full list
  --skip-test      Skip the browser test step
  --skip-commit    Skip the git commit step
  -h, --help       Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN=true; shift ;;
    --file)       SINGLE_FILE="$2"; shift 2 ;;
    --skip-test)  SKIP_TEST=true; shift ;;
    --skip-commit) SKIP_COMMIT=true; shift ;;
    -h|--help)    usage; exit 0 ;;
    *)            echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

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
  if [[ ${#failed_files[@]} -gt 0 ]]; then
    echo -e "\n${RED}Failed files:${RESET}"
    for f in "${failed_files[@]}"; do
      echo "  - $f"
    done
  fi
  echo -e "${BOLD}====================================${RESET}"
  log "SUMMARY: succeeded=$succeeded failed=$failed skipped=$skipped"
}

trap 'echo -e "\n${YELLOW}Interrupted.${RESET}"; print_summary; exit 130' INT

run_agent_step() {
  local step_name="$1"
  local prompt="$2"
  local file="$3"
  local output_file
  output_file=$(mktemp)

  echo -e "  ${CYAN}[$step_name]${RESET} Running..."
  log "START step=$step_name file=$file"

  if agent --yolo -p --output-format json "$prompt" > "$output_file" 2>&1; then
    local is_error
    is_error=$(jq -r '.is_error // false' "$output_file" 2>/dev/null || echo "unknown")

    if [[ "$is_error" == "true" ]]; then
      echo -e "  ${RED}[$step_name] FAILED (agent reported error)${RESET}"
      log "FAIL step=$step_name file=$file reason=agent_is_error"
      log "OUTPUT: $(head -c 2000 "$output_file")"
      rm -f "$output_file"
      return 1
    fi

    echo -e "  ${GREEN}[$step_name] OK${RESET}"
    log "OK step=$step_name file=$file"
    rm -f "$output_file"
    return 0
  else
    local exit_code=$?
    echo -e "  ${RED}[$step_name] FAILED (exit code $exit_code)${RESET}"
    log "FAIL step=$step_name file=$file reason=exit_code_$exit_code"
    log "OUTPUT: $(head -c 2000 "$output_file")"
    rm -f "$output_file"
    return 1
  fi
}

# --- Collect files to process ---

files=()
if [[ -n "$SINGLE_FILE" ]]; then
  files=("$SINGLE_FILE")
else
  while IFS= read -r line; do
    files+=("$line")
  done < <(grep -v '^\[x\]' "$FILELIST" | sed 's/^\[.\] //')
fi

total=${#files[@]}

if [[ $total -eq 0 ]]; then
  echo -e "${GREEN}Nothing to do -- all files are marked [x].${RESET}"
  exit 0
fi

if $DRY_RUN; then
  echo -e "${BOLD}Dry run -- $total file(s) would be processed:${RESET}"
  for f in "${files[@]}"; do
    echo "  $f"
  done
  exit 0
fi

echo -e "${BOLD}Starting batch translation: $total file(s)${RESET}"
echo "Log: $LOGFILE"
log "=== BATCH START ($total files) ==="
echo ""

# --- Main loop ---

for i in "${!files[@]}"; do
  file="${files[$i]}"
  n=$((i + 1))
  current_file="$file"

  echo -e "${BOLD}[$n/$total]${RESET} ${CYAN}$file${RESET}"
  log "--- FILE $n/$total: $file ---"

  # Step 1: Translate
  translate_prompt="You are translating a Razor/AngularJS view to React as part of the RadarFS migration.

File to translate: ${file}

Instructions:
1. Read the source .cshtml file and any associated AngularJS controllers/services.
2. Follow the Translation Workflow in AGENTS.md -- mark the file as [-] in filelist.md before starting.
3. Create React component(s) in frontend/src/modules/ following the patterns of existing translated modules.
4. Reuse existing backend JSON APIs. Only create a new WebApi controller if no JSON endpoint exists (see AGENTS.md rules).
5. Follow all Quality Rules from AGENTS.md: setTitle hook, no mock data, styles-convention, tables, forms, dialogs, inputs, filter-sidebar conventions.
6. Wire up routing so the new page is accessible in the React app.
7. Do NOT modify any existing .cs files, .cshtml files, config files, or frontend/public files."

  if ! run_agent_step "TRANSLATE" "$translate_prompt" "$file"; then
    failed=$((failed + 1))
    failed_files+=("$file (translate)")
    echo -e "  ${YELLOW}Skipping remaining steps for this file.${RESET}"
    echo ""
    continue
  fi

  # Step 2: Test
  if $SKIP_TEST; then
    echo -e "  ${YELLOW}[TEST] Skipped (--skip-test)${RESET}"
  else
    test_prompt="You just translated ${file} from Razor/AngularJS to React.

Test the translation by following .cursor/rules/review-translation.mdc:
1. Open the legacy page on localhost:8087 and the React page on localhost:3000 side-by-side using the browser automation tool.
2. Compare core behavior: buttons, actions, navigation, dialog/form flows, success/error states.
3. Check list pages at multiple breakpoints (mobile 390x844, tablet 768x1024, desktop 1280x800, large 1600x900).
4. Check create/edit flows end-to-end if applicable.
5. Cross-check implementation against qa.mdc, tables.mdc, forms.mdc, dialog-convention.mdc, inputs.mdc, filter-sidebar.mdc, styles-convention.mdc.
6. Fix any blocking issues found. Log non-blocking issues.
7. Include a screenshot of the legacy page and the React page 
8. Report PASS, CONDITIONAL PASS, or FAIL with screenshots and mismatch details.

Credentials -- Username: modelcode@radarhealthcare.net, Password: ztk5vbj-wjb@BHT4yrj, OrgId: 16"

    if ! run_agent_step "TEST" "$test_prompt" "$file"; then
      failed=$((failed + 1))
      failed_files+=("$file (test)")
      echo -e "  ${YELLOW}Skipping commit step for this file.${RESET}"
      echo ""
      continue
    fi
  fi

  # Step 3: Commit
  if $SKIP_COMMIT; then
    echo -e "  ${YELLOW}[COMMIT] Skipped (--skip-commit)${RESET}"
  else
    commit_prompt="Create a git commit for the translation of ${file}.

Steps:
1. Run the pre-commit hook: cd frontend && npm run lint && npm run build. Fix any lint or build errors before proceeding.
2. Update filelist.md: change the line for ${file} from [-] to [x].
3. Create a git branch named after the module (e.g., translate/activity-log) if not already on one.
4. Stage all changed/new files in frontend (do not include anything outside of frontend/ and such as .cursor/).
5. Commit with a descriptive message summarizing what was translated.
6. Do NOT push to remote."

    if ! run_agent_step "COMMIT" "$commit_prompt" "$file"; then
      failed=$((failed + 1))
      failed_files+=("$file (commit)")
      echo ""
      continue
    fi
  fi

  succeeded=$((succeeded + 1))
  echo -e "  ${GREEN}All steps completed.${RESET}"
  echo ""
done

log "=== BATCH END ==="
print_summary