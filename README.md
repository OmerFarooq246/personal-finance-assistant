# Personal Finance Assistant

A full-stack fintech web app built to demonstrate practical engineering for finance operations: banking-data ingestion, receipt extraction, budget tracking, cashflow visibility, and LLM-assisted financial analysis.

The product is designed around the kind of workflows common in underwriting, transaction servicing, accounting operations, and financial advisory work: turn messy financial inputs into structured data, surface useful insights quickly, and keep the user experience clean enough for business teams to use every day.

## Why This App Matters

Finance teams often receive data in fragmented formats: CSV bank exports, receipts, unstructured notes, and ad hoc questions from operators or founders. This app brings those workflows into one place and turns raw financial activity into something easier to understand, review, and act on.

The goal is not just to store transactions. The app helps a user move from financial data entry to financial understanding: upload statements and receipts, let AI assist with analysis, ask follow-up questions in plain language, and visualize trends through interactive dashboards.

## How It Works

The workflow starts with financial inputs. A user uploads bank transaction files and receipt documents, then the system structures that information into usable financial records. Transactions can be searched, filtered, reviewed, and connected with categories, budgets, receipts, and account context.

Once the data is available, the app turns it into insight. Interactive dashboards show cashflow, spending categories, recent activity, receipts, and budget usage, helping users quickly understand where money is coming from, where it is going, and what needs attention.

The user can then chat with their own financial history. Instead of manually digging through CSVs or dashboards, they can ask questions such as what changed this month, which categories are trending upward, what receipts need review, or how spending compares against budgets.

## AI-Powered Financial Analysis

The AI assistant is designed to make financial review feel conversational. Users do not need to know where every number lives or how to write a query. They can ask natural questions, and the assistant uses the available transaction history, receipts, budgets, accounts, and saved context to produce useful answers.

This creates a more practical finance workflow:

- upload financial data;
- let the system organize it;
- visualize cashflow and spending patterns;
- ask follow-up questions in plain language;
- use AI to find trends, summarize activity, and support financial decision-making.

For finance and operations teams, this means less time manually reviewing statements and receipts, and more time understanding the story behind the numbers.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Nivo charts
- **Backend:** Python, Django, Django REST Framework
- **Auth:** JWT with SimpleJWT
- **Database:** PostgreSQL
- **AI:** Gemini via `google-genai`
- **Files:** CSV transaction import, image/PDF receipt upload

## Project Structure

```text
personal-finance-assistant/
  django-backend/   # Django API, models, auth, LLM and finance services
  frontend/         # Next.js web app
```

## Setup

Backend:

```bash
cd django-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt | pip freeze > requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Role-Relevant Highlights

This project was built to demonstrate:

- strong Python/Django backend implementation;
- financial data modeling for accounts, transactions, receipts, budgets, chat sessions, and user context;
- practical banking-data workflows through CSV transaction imports;
- AI-assisted financial analysis using a structured LLM service flow;
- clean React/TypeScript frontend integration with a central API layer;
- user-focused product thinking for finance and operations teams.

## Demo Account

You can explore the application using the demo account below:

**Email:** `demo@example.com`
**Password:** `demo12345`

This account is provided for testing and preview purposes only. It allows users to log in and try the main features of the application without creating a new account.