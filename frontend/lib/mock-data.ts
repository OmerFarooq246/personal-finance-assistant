import type {
  Account,
  Budget,
  ChatMessage,
  ChatSession,
  Receipt,
  Transaction,
  User,
  UserContext,
} from "./types";

export const currentUser: User = {
  id: 1,
  email: "alex.morgan@finance.com",
  role: "USER",
  created_at: "2026-01-05T09:00:00.000Z",
};

export const accounts: Account[] = [
  {
    id: 101,
    user_id: 1,
    name: "HBL Current Account",
    type: "Checking",
    currency: "PKR",
    balance: 842500,
    created_at: "2026-01-05T09:10:00.000Z",
    updated_at: "2026-06-02T12:20:00.000Z",
  },
  {
    id: 102,
    user_id: 1,
    name: "Meezan Savings",
    type: "Savings",
    currency: "PKR",
    balance: 1250000,
    created_at: "2026-01-05T09:12:00.000Z",
    updated_at: "2026-06-02T12:20:00.000Z",
  },
  {
    id: 103,
    user_id: 1,
    name: "UBL Credit Card",
    type: "Credit Card",
    currency: "PKR",
    balance: -86500,
    created_at: "2026-01-05T09:14:00.000Z",
    updated_at: "2026-06-02T12:20:00.000Z",
  },
];

export const receipts: Receipt[] = [
  {
    id: 1042,
    user_id: 1,
    file_name: "uber_ride_mar24.jpg",
    total_amount: 1250,
    raw_text: "Uber Pakistan\nTrip to Clifton\nTotal PKR 1,250.00",
    extracted_data: {
      merchant: "Uber Pakistan",
      category: "Transport",
      currency: "PKR",
      confidence: 0.96,
      items: [{ name: "Ride fare", quantity: 1, total_price: 1250 }],
    },
    processing_status: "PROCESSED",
    created_at: "2026-06-03T09:22:00.000Z",
    updated_at: "2026-06-03T09:22:15.000Z",
  },
  {
    id: 1043,
    user_id: 1,
    file_name: "foodpanda_lunch.pdf",
    total_amount: null,
    raw_text: null,
    extracted_data: { stage: "ocr", message: "Extracting text from PDF" },
    processing_status: "PROCESSING",
    created_at: "2026-06-03T13:10:00.000Z",
    updated_at: "2026-06-03T13:10:00.000Z",
  },
  {
    id: 1044,
    user_id: 1,
    file_name: "blurred_receipt_scan.jpg",
    total_amount: null,
    raw_text: null,
    extracted_data: { error: "Image was too blurred to extract reliable totals" },
    processing_status: "FAILED",
    created_at: "2026-06-02T18:40:00.000Z",
    updated_at: "2026-06-02T18:41:00.000Z",
  },
  {
    id: 1045,
    user_id: 1,
    file_name: "k-electric_bill.jpg",
    total_amount: 28500,
    raw_text: "K-Electric\nConsumer bill\nPayable amount PKR 28,500",
    extracted_data: {
      merchant: "K-Electric",
      category: "Utilities",
      bill_month: "May 2026",
      confidence: 0.91,
    },
    processing_status: "PROCESSED",
    created_at: "2026-06-01T19:00:00.000Z",
    updated_at: "2026-06-01T19:00:20.000Z",
  },
  {
    id: 1046,
    user_id: 1,
    file_name: "imtiaz_grocery.jpg",
    total_amount: 14500,
    raw_text: "Imtiaz Super Market\nMilk, rice, produce, household\nTotal 14,500",
    extracted_data: {
      merchant: "Imtiaz Super Market",
      category: "Groceries",
      items: [
        { name: "Rice", quantity: 1, total_price: 4200 },
        { name: "Milk", quantity: 6, total_price: 2100 },
        { name: "Produce", quantity: 1, total_price: 3900 },
      ],
      confidence: 0.94,
    },
    processing_status: "PROCESSED",
    created_at: "2026-05-28T16:45:00.000Z",
    updated_at: "2026-05-28T16:45:12.000Z",
  },
  {
    id: 1047,
    user_id: 1,
    file_name: "medical_lab.pdf",
    total_amount: 6800,
    raw_text: "Chughtai Lab\nBlood test panel\nTotal PKR 6,800",
    extracted_data: {
      merchant: "Chughtai Lab",
      category: "Healthcare",
      confidence: 0.88,
    },
    processing_status: "NEEDS_REVIEW",
    created_at: "2026-05-25T11:05:00.000Z",
    updated_at: "2026-05-25T11:06:00.000Z",
  },
  {
    id: 1048,
    user_id: 1,
    file_name: "kolachi_dinner.jpg",
    total_amount: 8250,
    raw_text: "Kolachi Restaurant\nDinner\nTotal PKR 8,250",
    extracted_data: {
      merchant: "Kolachi Restaurant",
      category: "Dining",
      confidence: 0.97,
    },
    processing_status: "PROCESSED",
    created_at: "2026-05-20T21:30:00.000Z",
    updated_at: "2026-05-20T21:30:08.000Z",
  },
  {
    id: 1049,
    user_id: 1,
    file_name: "office_supplies.jpg",
    total_amount: 3400,
    raw_text: "Office supplies\nStationery and printer paper\nTotal PKR 3,400",
    extracted_data: {
      merchant: "Liberty Books",
      category: "Shopping",
      confidence: 0.9,
    },
    processing_status: "PROCESSED",
    created_at: "2026-05-18T15:12:00.000Z",
    updated_at: "2026-05-18T15:12:11.000Z",
  },
];

export const transactions: Transaction[] = [
  tx(1, 101, null, "INCOME", 450000, "MOCK_BANK", "Salary", "Tech Solutions Ltd", "Monthly salary", "2026-06-01"),
  tx(2, 101, 1046, "EXPENSE", 14500, "RECEIPT", "Groceries", "Imtiaz Super Market", "Monthly groceries", "2026-06-03"),
  tx(3, 103, 1043, "EXPENSE", 1850, "CSV", "Dining", "Foodpanda Pakistan", "Lunch delivery", "2026-06-03"),
  tx(4, 101, 1045, "EXPENSE", 28500, "RECEIPT", "Utilities", "K-Electric", "Electricity bill", "2026-06-02"),
  tx(5, 101, null, "TRANSFER", 50000, "MANUAL", "Internal Transfer", "Meezan Savings", "Transfer to savings", "2026-06-01"),
  tx(6, 103, 1042, "EXPENSE", 1250, "RECEIPT", "Transport", "Uber Pakistan", "Ride to Clifton", "2026-05-31"),
  tx(7, 103, null, "EXPENSE", 1200, "CSV", "Entertainment", "Netflix", "Monthly subscription", "2026-05-30", true),
  tx(8, 101, 1048, "EXPENSE", 8250, "RECEIPT", "Dining", "Kolachi Restaurant", "Dinner", "2026-05-28"),
  tx(9, 101, null, "EXPENSE", 12000, "CSV", "Transport", "PSO Fuel Station", "Fuel", "2026-05-26"),
  tx(10, 101, 1047, "EXPENSE", 6800, "RECEIPT", "Healthcare", "Chughtai Lab", "Lab tests", "2026-05-25"),
  tx(11, 101, null, "EXPENSE", 65000, "MOCK_BANK", "Rent", "Landlord Transfer", "Monthly rent", "2026-05-05", true),
  tx(12, 101, null, "INCOME", 450000, "MOCK_BANK", "Salary", "Tech Solutions Ltd", "Monthly salary", "2026-05-01"),
  tx(13, 101, null, "EXPENSE", 9300, "CSV", "Groceries", "Naheed Super Market", "Household", "2026-04-26"),
  tx(14, 103, null, "EXPENSE", 4800, "CSV", "Shopping", "Daraz.pk", "Online order", "2026-04-23"),
  tx(15, 101, null, "EXPENSE", 26000, "MOCK_BANK", "Utilities", "Sui Gas", "Gas bill", "2026-04-20"),
  tx(16, 101, null, "EXPENSE", 6400, "CSV", "Transport", "Careem", "Rides", "2026-04-18"),
  tx(17, 101, null, "INCOME", 45000, "MANUAL", "Salary", "Freelance Project", "Project payment", "2026-04-14"),
  tx(18, 101, null, "EXPENSE", 65000, "MOCK_BANK", "Rent", "Landlord Transfer", "Monthly rent", "2026-04-05", true),
  tx(19, 101, null, "INCOME", 450000, "MOCK_BANK", "Salary", "Tech Solutions Ltd", "Monthly salary", "2026-04-01"),
  tx(20, 101, null, "EXPENSE", 10800, "CSV", "Groceries", "Metro Cash & Carry", "Groceries", "2026-03-29"),
  tx(21, 103, null, "EXPENSE", 7200, "CSV", "Dining", "Xanders", "Dinner", "2026-03-25"),
  tx(22, 101, null, "EXPENSE", 11800, "CSV", "Transport", "Total Parco", "Fuel", "2026-03-21"),
  tx(23, 101, null, "EXPENSE", 21000, "MOCK_BANK", "Utilities", "Internet Provider", "Internet annual installment", "2026-03-18"),
  tx(24, 101, null, "TRANSFER", 75000, "MANUAL", "Internal Transfer", "Meezan Savings", "Savings top-up", "2026-03-12"),
  tx(25, 101, null, "EXPENSE", 65000, "MOCK_BANK", "Rent", "Landlord Transfer", "Monthly rent", "2026-03-05", true),
  tx(26, 101, null, "INCOME", 450000, "MOCK_BANK", "Salary", "Tech Solutions Ltd", "Monthly salary", "2026-03-01"),
  tx(27, 103, null, "EXPENSE", 9800, "CSV", "Shopping", "Outfitters", "Clothing", "2026-02-22"),
  tx(28, 101, null, "EXPENSE", 17200, "CSV", "Groceries", "Carrefour", "Groceries", "2026-02-18"),
  tx(29, 101, null, "EXPENSE", 3400, "RECEIPT", "Shopping", "Liberty Books", "Office supplies", "2026-02-15"),
  tx(30, 103, null, "EXPENSE", 1200, "CSV", "Entertainment", "Spotify", "Monthly subscription", "2026-02-13", true),
  tx(31, 101, null, "EXPENSE", 65000, "MOCK_BANK", "Rent", "Landlord Transfer", "Monthly rent", "2026-02-05", true),
  tx(32, 101, null, "INCOME", 450000, "MOCK_BANK", "Salary", "Tech Solutions Ltd", "Monthly salary", "2026-02-01"),
  tx(33, 101, null, "EXPENSE", 16800, "CSV", "Groceries", "Al-Fatah", "Groceries", "2026-01-28"),
  tx(34, 101, null, "EXPENSE", 5300, "CSV", "Dining", "Coffee Planet", "Meetings", "2026-01-22"),
  tx(35, 101, null, "EXPENSE", 11500, "CSV", "Healthcare", "Pharmacy", "Medicine", "2026-01-18"),
  tx(36, 101, null, "INCOME", 450000, "MOCK_BANK", "Salary", "Tech Solutions Ltd", "Monthly salary", "2026-01-01"),
];

export const budgets: Budget[] = [
  budget(201, "Groceries", 60000, "MONTHLY", "2026-06-01", "2026-06-30"),
  budget(202, "Dining", 35000, "MONTHLY", "2026-06-01", "2026-06-30"),
  budget(203, "Transport", 45000, "MONTHLY", "2026-06-01", "2026-06-30"),
  budget(204, "Utilities", 70000, "MONTHLY", "2026-06-01", "2026-06-30"),
  budget(205, null, 300000, "MONTHLY", "2026-06-01", "2026-06-30"),
];

export const userContext: UserContext[] = [
  context(301, "Prefers all summaries in PKR unless another currency is requested."),
  context(302, "Wants recurring subscriptions highlighted during monthly reviews."),
  context(303, "Treats rent, utilities, and groceries as essential spending."),
];

export const chatSessions: ChatSession[] = [
  session(401, "June Cashflow Review", "2026-06-03T10:42:00.000Z"),
  session(402, "Grocery Budget Analysis", "2026-06-02T15:20:00.000Z"),
  session(403, "Receipt Follow Up", "2026-05-29T11:10:00.000Z"),
  session(404, "Subscriptions Check", "2026-05-15T09:05:00.000Z"),
];

export const chatMessages: ChatMessage[] = [
  message(501, 401, "USER", "Can you summarize June cashflow so far?", "2026-06-03T10:42:00.000Z"),
  message(502, 401, "ASSISTANT", "Your June income is PKR 450,000 and tracked expenses are PKR 96,100 so far. Net cashflow is positive at PKR 353,900.", "2026-06-03T10:42:10.000Z"),
  message(503, 401, "USER", "What is driving the spend?", "2026-06-03T10:43:00.000Z"),
  message(504, 401, "ASSISTANT", "Utilities, groceries, and transfers are the largest items. K-Electric was PKR 28,500, groceries were PKR 14,500, and your savings transfer was PKR 50,000.", "2026-06-03T10:43:12.000Z"),
  message(505, 402, "USER", "Am I on track for groceries?", "2026-06-02T15:20:00.000Z"),
  message(506, 402, "ASSISTANT", "Yes. You have spent PKR 14,500 against a PKR 60,000 monthly grocery budget, which is 24% utilized.", "2026-06-02T15:20:08.000Z"),
  message(507, 402, "USER", "Compare it to last month.", "2026-06-02T15:21:00.000Z"),
  message(508, 402, "ASSISTANT", "Last month groceries totaled PKR 23,800. June is currently lower, but the month is still in progress.", "2026-06-02T15:21:08.000Z"),
  message(509, 403, "USER", "Which receipts need attention?", "2026-05-29T11:10:00.000Z"),
  message(510, 403, "ASSISTANT", "The medical_lab.pdf receipt needs review and blurred_receipt_scan.jpg failed processing.", "2026-05-29T11:10:09.000Z"),
  message(511, 404, "USER", "Show recurring subscriptions.", "2026-05-15T09:05:00.000Z"),
  message(512, 404, "ASSISTANT", "Netflix and Spotify are marked as recurring subscriptions. Together they are PKR 2,400 per month.", "2026-05-15T09:05:08.000Z"),
];

function tx(
  id: number,
  accountId: number | null,
  receiptId: number | null,
  type: Transaction["type"],
  amount: number,
  source: Transaction["source"],
  category: string,
  merchant: string,
  description: string,
  date: string,
  recurring = false,
): Transaction {
  return {
    id,
    user_id: 1,
    account_id: accountId,
    receipt_id: receiptId,
    type,
    amount,
    currency: "PKR",
    source,
    external_id: source === "CSV" || source === "MOCK_BANK" ? `mock-${id}` : null,
    is_recurring: recurring,
    category,
    merchant,
    description,
    transaction_date: `${date}T10:00:00.000Z`,
    created_at: `${date}T10:05:00.000Z`,
    updated_at: `${date}T10:05:00.000Z`,
  };
}

function budget(
  id: number,
  category: string | null,
  amount: number,
  period: Budget["period"],
  start: string,
  end: string,
): Budget {
  return {
    id,
    user_id: 1,
    category,
    amount,
    currency: "PKR",
    period,
    start_date: `${start}T00:00:00.000Z`,
    end_date: `${end}T23:59:59.000Z`,
    created_at: `${start}T00:00:00.000Z`,
    updated_at: `${start}T00:00:00.000Z`,
  };
}

function context(id: number, value: string): UserContext {
  return {
    id,
    user_id: 1,
    context: value,
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-01T10:00:00.000Z",
  };
}

function session(id: number, title: string, updated: string): ChatSession {
  return {
    id,
    title,
    user_id: 1,
    created_at: updated,
    updated_at: updated,
  };
}

function message(
  id: number,
  sessionId: number,
  role: ChatMessage["role"],
  content: string,
  createdAt: string,
): ChatMessage {
  return {
    id,
    session_id: sessionId,
    role,
    content,
    metadata_json: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

