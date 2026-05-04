# TradingAgents — setup guide for a new machine

This document walks through installing everything needed to run **TradingAgents** on a fresh computer: system prerequisites, Python package install, API keys, the interactive CLI, the optional local web dashboard (Next.js + FastAPI), Docker, and common pitfalls.

Project layout (high level):

- **`tradingagents/`** — core LangGraph multi-agent framework (Python).
- **`cli/`** — Typer-based interactive terminal UI; entry point `tradingagents` after install.
- **`web_backend/`** — FastAPI server for the local web UI.
- **`web-ui/`** — Next.js 15 frontend.

Official Python requirement: **Python ≥ 3.10** (`pyproject.toml`). The shipped **Dockerfile** uses **Python 3.12**. The main **README** shows **conda** with **Python 3.13** — any of 3.10–3.13 is reasonable if your OS and wheels support it.

---

## 1. What you need on the machine (overview)

| Component | Required for | Notes |
|-----------|----------------|-------|
| **Git** | Clone / updates | — |
| **Python 3.10+** | CLI, library, FastAPI backend | Use a venv or conda env (strongly recommended). |
| **pip** (recent) | Install the project | Usually ships with Python. |
| **C compiler / build tools** | Rare; most deps have wheels | If `pip install .` fails building a package, install MSVC Build Tools (Windows) or `build-essential` (Linux). |
| **Node.js 18.18+** (20 LTS recommended) | Web UI only | Next.js 15; `npm` comes with Node. |
| **Network** | LLM APIs, market data | yfinance/Alpha Vantage/OpenAI/etc. need outbound HTTPS. |
| **Docker Desktop** (optional) | `docker compose` workflow | See [Section 8](#8-docker-alternative-setup). |

You do **not** need a separate database server for the default setup: checkpoints use **SQLite** under `~/.tradingagents/cache/checkpoints/` (configurable via `TRADINGAGENTS_CACHE_DIR`).

---

## 2. Step-by-step: system prerequisites

### 2.1 Windows

1. Install **[Python 3.10+](https://www.python.org/downloads/)**  
   - During setup, enable **“Add python.exe to PATH”**.  
   - Prefer **“Install for all users”** or a per-user install with PATH, so `python` and `pip` work in PowerShell.

2. Install **Git for Windows** if you do not already have Git.

3. (Optional web UI) Install **[Node.js LTS](https://nodejs.org/)** (e.g. 20.x).

4. (Optional) **Docker Desktop** for Windows with WSL2 backend if you plan to use Compose.

5. If `pip install .` fails with errors about compiling C extensions, install **[Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)** with the “Desktop development with C++” workload (or minimal MSVC toolchain as prompted by the failing package).

### 2.2 macOS

1. Install **Xcode Command Line Tools** (if not already):  
   `xcode-select --install`

2. Install **Python 3.10+** via [python.org](https://www.python.org/downloads/), **Homebrew** (`brew install python@3.12`), or **pyenv**.

3. **Node** for the web UI: `brew install node` or use nvm.

### 2.3 Linux (Debian/Ubuntu example)

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip build-essential
# Optional: Node via NodeSource or distro packages meeting Next.js 15 requirements
```

---

## 3. Get the source code

```bash
git clone https://github.com/TauricResearch/TradingAgents.git
cd TradingAgents
```

If you use a fork or private mirror, replace the URL.

---

## 4. Python environment and package install

### 4.1 Create an isolated environment

**venv (built-in):**

```bash
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows cmd:
# .venv\Scripts\activate.bat
# macOS/Linux:
# source .venv/bin/activate
```

**conda (as in README):**

```bash
conda create -n tradingagents python=3.12
conda activate tradingagents
```

### 4.2 Upgrade pip (recommended)

```bash
python -m pip install --upgrade pip
```

### 4.3 Install TradingAgents from the repo root

From the directory that contains `pyproject.toml`:

```bash
pip install .
```

This installs the **`tradingagents`** package and declares **all Python dependencies** from `pyproject.toml`, including (non-exhaustive):

- **LangChain / LangGraph**: `langchain-core`, `langgraph`, `langgraph-checkpoint-sqlite`, `langchain-openai`, `langchain-anthropic`, `langchain-google-genai`, `langchain-experimental`
- **LLM / HTTP**: `requests`, provider SDKs pulled transitively by LangChain packages
- **Data / numerics**: `pandas`, `yfinance`, `stockstats`, `pytz`
- **CLI / server**: `typer`, `rich`, `questionary`, `fastapi`, `uvicorn`, `python-dotenv`
- **Parsing / output**: `parsel`, `markdown`, `xhtml2pdf`, `tqdm`, `typing-extensions`
- **Other**: `backtrader`, `redis` (declared dependency; default flows use SQLite checkpoints and local files)

After a successful install, the console script **`tradingagents`** should be on your PATH inside the active environment.

**Editable install (for development):**

```bash
pip install -e .
```

### 4.4 Run without installing (from source)

You can still run the CLI module directly:

```bash
python -m cli.main
```

You must have dependencies installed in that environment (`pip install .` or `pip install -e .`).

---

## 5. API keys and environment files

The CLI and `web_backend` load:

1. **`.env`** in the current working directory (via `load_dotenv()` — typical usage: create `.env` in the **project root** and run commands from there).
2. **`.env.enterprise`** (optional, **does not** override variables already set in `.env`).

### 5.1 Create `.env`

The upstream README references copying `.env.example`; if that file is not in your tree, create **`.env`** manually in the repo root with the variables you need.

**LLM providers (set at least one matching your chosen provider):**

| Variable | Provider |
|----------|-----------|
| `OPENAI_API_KEY` | OpenAI |
| `GOOGLE_API_KEY` | Google Gemini |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `XAI_API_KEY` | xAI Grok |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `DASHSCOPE_API_KEY` | Qwen (Alibaba DashScope) |
| `ZHIPU_API_KEY` | GLM (Zhipu) |
| `OPENROUTER_API_KEY` | OpenRouter |

**Data (optional depending on vendor config):**

| Variable | When needed |
|----------|-------------|
| `ALPHA_VANTAGE_API_KEY` | When you route tools to Alpha Vantage instead of yfinance (see `tradingagents/default_config.py` `data_vendors` / `tool_vendors`). |

**Azure OpenAI (enterprise):**

Copy `.env.enterprise.example` to **`.env.enterprise`** and fill:

- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT_NAME`
- Optionally `OPENAI_API_VERSION`

### 5.2 Local models (Ollama)

No cloud API key is required if you use **Ollama**: install [Ollama](https://ollama.com/), run the daemon, pull a model, and set `llm_provider` to `"ollama"` in code or choose Ollama in the CLI/UI. Default OpenAI-compatible URL is `http://localhost:11434/v1`.

### 5.3 Optional paths (persistence)

| Variable | Purpose |
|----------|---------|
| `TRADINGAGENTS_CACHE_DIR` | Base for caches and checkpoint DBs (default under `~/.tradingagents/cache`). |
| `TRADINGAGENTS_RESULTS_DIR` | Logs / results directory override. |
| `TRADINGAGENTS_MEMORY_LOG_PATH` | Decision memory markdown path (default under `~/.tradingagents/memory/`). |

---

## 6. Verify the CLI

From the **project root** (so `.env` is found):

```bash
tradingagents
```

Or:

```bash
python -m cli.main
```

You should get the interactive flow (ticker, date, provider, analysts, etc.). If you see authentication errors, confirm the correct API key for the selected provider is in `.env` or exported in the shell.

**Non-interactive / tests:** Some tests need real keys; see `tests/conftest.py` for markers and env expectations. Install **pytest** if you run tests (not always installed as a main dependency):

```bash
pip install pytest
pytest
```

---

## 7. Local web app (FastAPI + Next.js)

This gives a browser UI at **http://localhost:3000** talking to an API on **http://localhost:8000**.

### 7.1 Terminal A — Python backend

From repo root, with venv activated and `pip install .` done:

```bash
uvicorn web_backend.app:app --host 0.0.0.0 --port 8000 --reload
```

- Uses `.env` / `.env.enterprise` from the **current working directory** — start uvicorn from the repo root.
- Health check: `GET http://localhost:8000/api/health`
- CORS is allowed for `http://localhost:3000` and `http://127.0.0.1:3000`.

### 7.2 Terminal B — Next.js frontend

```bash
cd web-ui
npm install
npm run dev
```

### 7.3 Point the UI at a different API URL

The frontend reads `NEXT_PUBLIC_TRADING_API_URL`; default is `http://localhost:8000`.

**Windows PowerShell:**

```powershell
cd web-ui
$env:NEXT_PUBLIC_TRADING_API_URL="http://localhost:8000"; npm run dev
```

**macOS/Linux:**

```bash
cd web-ui
NEXT_PUBLIC_TRADING_API_URL=http://127.0.0.1:8000 npm run dev
```

For production builds, set the same variable before `npm run build`.

### 7.4 PDF export

The backend uses **Markdown → HTML → PDF** via `xhtml2pdf`. On minimal Linux images, if PDFs render with missing glyphs, install system fonts (e.g. `fonts-dejavu-core` on Debian).

---

## 8. Docker (alternative setup)

Prerequisites: **Docker** and **Docker Compose**.

1. Create **`.env`** in the project root (same variables as [Section 5](#5-api-keys-and-environment-files)).

2. Run the CLI in a container:

```bash
docker compose run --rm tradingagents
```

3. **Ollama profile** (local models):

```bash
docker compose --profile ollama run --rm tradingagents-ollama
```

The Compose file mounts a named volume for **`/home/appuser/.tradingagents`** so cache and memory survive container removal.

The **Dockerfile** installs the package with `pip install .` on **Python 3.12-slim**. If you need the web stack in Docker, you would extend the image or add services (not defined in the default `docker-compose.yml`).

---

## 9. Dependency reference (quick list)

### 9.1 System-level

- Git, Python 3.10+, pip  
- Node 18.18+ (for `web-ui`)  
- Optional: Docker, Ollama, C++ build tools if wheels fail  

### 9.2 Python (`pip install .`)

All packages are pinned with minimum versions in **`pyproject.toml`** `[project] dependencies`. After install, `pip show tradingagents` or `pip list` confirms the environment.

### 9.3 Node (`web-ui/package.json`)

Runtime: **Next.js 15**, **React 19**, **@xyflow/react**, **react-markdown**, **remark-gfm**.  
Dev: TypeScript, Vitest, `@types/*`.

Install with **`npm install`** inside **`web-ui/`**.

---

## 10. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| `ModuleNotFoundError` | Activate the correct venv; re-run `pip install .` from repo root. |
| LLM 401 / invalid key | `.env` in cwd; variable name matches provider; no stray quotes/spaces. |
| `uvicorn` not found | Same environment as `pip install .`; try `python -m uvicorn web_backend.app:app --host 0.0.0.0 --port 8000`. |
| Web UI cannot reach API | Backend running; firewall; `NEXT_PUBLIC_TRADING_API_URL` matches actual host/port; browser mixed content (use `http` locally). |
| yfinance / network errors | Corporate proxy/firewall; outbound HTTPS. |
| Windows console encoding | Recent releases include UTF-8 fixes; use Windows Terminal and UTF-8 where possible. |
| SQLite / permission errors | Writable home directory for `~/.tradingagents` or set `TRADINGAGENTS_CACHE_DIR` to a writable path. |

---

## 11. Minimal “happy path” checklist

1. Install Python 3.10+, Git, (optional) Node.  
2. `git clone` → `cd TradingAgents`.  
3. `python -m venv .venv` → activate.  
4. `python -m pip install --upgrade pip` → `pip install .`  
5. Create **`.env`** with at least one LLM provider key.  
6. Run **`tradingagents`** from repo root.  
7. Optional: **`uvicorn web_backend.app:app --port 8000`** + **`cd web-ui && npm install && npm run dev`**.

For framework behavior, persistence, and checkpoint flags, see **`README.md`** and **`CHANGELOG.md`**.
