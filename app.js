// AuraBudget Application Script

// --- CONSTANTS & CONFIGURATION ---
const STORAGE_KEYS = {
  TRANSACTIONS: 'aurabudget_transactions',
  BUDGET_LIMIT: 'aurabudget_budget_limit',
  ALERT_THRESHOLD: 'aurabudget_alert_threshold',
  CURRENCY: 'aurabudget_currency'
};

const CURRENCY_CONFIGS = {
  INR: { locale: 'en-IN', symbol: '₹' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'en-IE', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
  JPY: { locale: 'ja-JP', symbol: '¥' }
};

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
  expense: [
    'Food & Dining', 
    'Rent & Utilities', 
    'Transportation', 
    'Entertainment', 
    'Shopping', 
    'Healthcare', 
    'Travel', 
    'Education', 
    'Other'
  ]
};

// Color mapping for category charts
const CATEGORY_COLORS = {
  'Salary': 'rgba(16, 185, 129, 0.8)',      // Emerald
  'Freelance': 'rgba(52, 211, 153, 0.8)',   // Light emerald
  'Investments': 'rgba(99, 102, 241, 0.8)', // Indigo
  'Gift': 'rgba(236, 72, 153, 0.8)',        // Pink
  'Other': 'rgba(156, 163, 175, 0.8)',      // Grey
  
  'Food & Dining': 'rgba(244, 63, 94, 0.8)',    // Rose
  'Rent & Utilities': 'rgba(59, 130, 246, 0.8)', // Blue
  'Transportation': 'rgba(245, 158, 11, 0.8)',  // Amber
  'Entertainment': 'rgba(139, 92, 246, 0.8)',   // Violet
  'Shopping': 'rgba(236, 72, 153, 0.8)',        // Pink
  'Healthcare': 'rgba(20, 184, 166, 0.8)',      // Teal
  'Travel': 'rgba(14, 165, 233, 0.8)',          // Sky blue
  'Education': 'rgba(249, 115, 22, 0.8)'        // Orange
};

const CATEGORY_BORDER_COLORS = {
  'Salary': 'rgb(16, 185, 129)',
  'Freelance': 'rgb(52, 211, 153)',
  'Investments': 'rgb(99, 102, 241)',
  'Gift': 'rgb(236, 72, 153)',
  'Other': 'rgb(156, 163, 175)',
  
  'Food & Dining': 'rgb(244, 63, 94)',
  'Rent & Utilities': 'rgb(59, 130, 246)',
  'Transportation': 'rgb(245, 158, 11)',
  'Entertainment': 'rgb(139, 92, 246)',
  'Shopping': 'rgb(236, 72, 153)',
  'Healthcare': 'rgb(20, 184, 166)',
  'Travel': 'rgb(14, 165, 233)',
  'Education': 'rgb(249, 115, 22)'
};

// --- APP STATE ---
const state = {
  transactions: [],
  budgetLimit: 1200,
  alertThreshold: 85,
  currency: 'INR',
  isAlertBannerDismissed: false,
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    month: 'all', // "YYYY-MM"
    sort: 'date-desc'
  },
  pagination: {
    currentPage: 1,
    pageSize: 8
  },
  charts: {
    category: null,
    trend: null
  },
  activeTab: 'dashboard'
};

// --- DOM ELEMENTS REFERENCE ---
const dom = {
  // Navigation & Shell
  sidebar: document.getElementById('sidebar'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  closeSidebarBtn: document.getElementById('closeSidebarBtn'),
  navButtons: document.querySelectorAll('.nav-link'),
  tabContents: document.querySelectorAll('.tab-content'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  headerMonthFilter: document.getElementById('headerMonthFilter'),
  
  // Dashboard metrics
  valNetBalance: document.getElementById('valNetBalance'),
  valTotalIncome: document.getElementById('valTotalIncome'),
  valTotalExpenses: document.getElementById('valTotalExpenses'),
  valSavingsRate: document.getElementById('valSavingsRate'),
  savingsRateProgress: document.getElementById('savingsRateProgress'),
  
  // Budget banner & progress
  budgetAlertBanner: document.getElementById('budgetAlertBanner'),
  alertBannerTitle: document.getElementById('alertBannerTitle'),
  alertBannerText: document.getElementById('alertBannerText'),
  btnCloseAlertBanner: document.getElementById('btnCloseAlertBanner'),
  budgetSpentVal: document.getElementById('budgetSpentVal'),
  budgetLimitVal: document.getElementById('budgetLimitVal'),
  budgetProgressBar: document.getElementById('budgetProgressBar'),
  budgetStatusText: document.getElementById('budgetStatusText'),
  
  // Transaction CRUD triggers
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),
  btnEmptyStateAdd: document.getElementById('btnEmptyStateAdd'),
  
  // Table Lists
  recentTransactionsTable: document.getElementById('recentTransactionsTableBody'),
  fullTransactionsTable: document.getElementById('fullTransactionsTableBody'),
  tableEmptyState: document.getElementById('tableEmptyState'),
  btnViewAllTransactions: document.getElementById('btnViewAllTransactions'),
  
  // Filters Toolbar
  searchTxInput: document.getElementById('searchTxInput'),
  filterType: document.getElementById('filterType'),
  filterCategory: document.getElementById('filterCategory'),
  filterSort: document.getElementById('filterSort'),
  btnClearFilters: document.getElementById('btnClearFilters'),
  
  // Pagination
  paginationControls: document.getElementById('paginationControls'),
  paginationInfo: document.getElementById('paginationInfo'),
  btnPrevPage: document.getElementById('btnPrevPage'),
  btnNextPage: document.getElementById('btnNextPage'),
  pageNumbersContainer: document.getElementById('pageNumbersContainer'),
  
  // Modals & Forms
  transactionModal: document.getElementById('transactionModal'),
  transactionForm: document.getElementById('transactionForm'),
  txId: document.getElementById('txId'),
  typeExpense: document.getElementById('typeExpense'),
  typeIncome: document.getElementById('typeIncome'),
  txAmount: document.getElementById('txAmount'),
  txDate: document.getElementById('txDate'),
  txCategory: document.getElementById('txCategory'),
  txDescription: document.getElementById('txDescription'),
  txNotes: document.getElementById('txNotes'),
  modalTitleText: document.getElementById('modalTitleText'),
  btnCancelModal: document.getElementById('btnCancelModal'),
  btnCancelForm: document.getElementById('btnCancelForm'),
  btnSubmitForm: document.getElementById('btnSubmitForm'),
  
  // Confirmation dialog
  confirmModal: document.getElementById('confirmModal'),
  btnCancelConfirm: document.getElementById('btnCancelConfirm'),
  btnApproveConfirm: document.getElementById('btnApproveConfirm'),
  
  // Settings Tab
  budgetSettingsForm: document.getElementById('budgetSettingsForm'),
  inputBudgetLimit: document.getElementById('inputBudgetLimit'),
  inputAlertThreshold: document.getElementById('inputAlertThreshold'),
  inputCurrency: document.getElementById('inputCurrency'),
  btnExportCSV: document.getElementById('btnExportCSV'),
  btnExportCSV2: document.getElementById('btnExportCSV2'),
  btnTriggerImport: document.getElementById('btnTriggerImport'),
  btnTriggerImport2: document.getElementById('btnTriggerImport2'),
  csvFileInput: document.getElementById('csvFileInput'),
  btnResetData: document.getElementById('btnResetData'),
  
  // Toast notifications wrapper
  toastContainer: document.getElementById('toastContainer')
};

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
  initAppState();
  setupEventListeners();
  initThemeAndIcons();
  
  // Render application
  renderDashboard();
  renderTransactionsLedger();
  
  showToast('Welcome to AuraBudget!', 'info');
});

// Load state from this browser's local storage.
function initAppState() {
  // 1. Transactions
  const savedTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (savedTxs) {
    const parsedTransactions = JSON.parse(savedTxs);
    state.transactions = parsedTransactions.filter(tx => !isSeedTransaction(tx));

    if (state.transactions.length !== parsedTransactions.length) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    }
  } else {
    state.transactions = [];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  }
  
  // 2. Budget Settings
  const savedBudgetLimit = localStorage.getItem(STORAGE_KEYS.BUDGET_LIMIT);
  state.budgetLimit = savedBudgetLimit !== null ? parseFloat(savedBudgetLimit) : 1200.00;
  
  const savedAlertThreshold = localStorage.getItem(STORAGE_KEYS.ALERT_THRESHOLD);
  state.alertThreshold = savedAlertThreshold !== null ? parseInt(savedAlertThreshold) : 85;

  const savedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
  state.currency = savedCurrency !== null ? savedCurrency : 'INR';
  
  // Synced input values in Settings Tab
  dom.inputBudgetLimit.value = state.budgetLimit;
  dom.inputAlertThreshold.value = state.alertThreshold;
  dom.inputCurrency.value = state.currency;
  
  updateUIPrefixes();
  
  // 3. Date Filters setup - default to current month
  populateMonthFilterOptions();
  
  // Setup default form date as today
  dom.txDate.value = getTodayDateString();
  
  // Populate category list in form based on type toggles
  updateFormCategories('expense');
  updateFilterCategories();
}

// Draw/compile calendar dates based on transaction records
function populateMonthFilterOptions() {
  const months = new Set();
  
  // Scan all transaction dates
  state.transactions.forEach(tx => {
    if (tx.date) {
      months.add(tx.date.substring(0, 7)); // YYYY-MM
    }
  });
  
  // Add current month in case it's empty
  const currentMonthStr = getTodayDateString().substring(0, 7);
  months.add(currentMonthStr);
  
  // Sort in descending order (recent months first)
  const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
  
  // Clear lists
  dom.headerMonthFilter.innerHTML = '';
  
  // Option for "All Time"
  const allTimeOpt = document.createElement('option');
  allTimeOpt.value = 'all';
  allTimeOpt.textContent = 'All Time';
  dom.headerMonthFilter.appendChild(allTimeOpt);
  
  // Populate elements
  sortedMonths.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = formatMonthYearString(m);
    dom.headerMonthFilter.appendChild(opt);
  });
  
  // Default to current month if present, else default to 'all'
  if (sortedMonths.includes(currentMonthStr)) {
    state.filters.month = currentMonthStr;
    dom.headerMonthFilter.value = currentMonthStr;
  } else {
    state.filters.month = 'all';
    dom.headerMonthFilter.value = 'all';
  }
}

// Generate active options inside category filter select
function updateFilterCategories() {
  dom.filterCategory.innerHTML = '<option value="all">All Categories</option>';
  
  const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense];
  allCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    dom.filterCategory.appendChild(opt);
  });
}

// Setup Lucide icons renderer
function initThemeAndIcons() {
  lucide.createIcons();
}

// --- CORE UTILITY FUNCTIONS ---
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatMonthYearString(yyyyMm) {
  const [year, month] = yyyyMm.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
}

function formatCurrency(value) {
  const config = CURRENCY_CONFIGS[state.currency] || CURRENCY_CONFIGS.INR;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: state.currency
  }).format(value);
}

function getCurrencySymbol() {
  const config = CURRENCY_CONFIGS[state.currency] || CURRENCY_CONFIGS.INR;
  return config.symbol;
}

function updateUIPrefixes() {
  const symbol = getCurrencySymbol();
  document.querySelectorAll('.input-prefix, .currency-label').forEach(el => {
    el.textContent = symbol;
  });
}

function isSeedTransaction(transaction) {
  return typeof transaction?.id === 'string' && transaction.id.startsWith('seed-');
}

function formatShortDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Using UTC values or splitting to prevent timezone offsets
  const [year, month, day] = dateString.split('-');
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- STATE PERSISTENCE ENGINE ---
function saveTransactionsToLocalStorage() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  populateMonthFilterOptions(); // rebuild select filters in case dates change
  renderDashboard();
  renderTransactionsLedger();
}

// --- EVENT LISTENERS REGISTRATION ---
function setupEventListeners() {
  // Mobile drawer controls
  dom.mobileMenuBtn.addEventListener('click', () => dom.sidebar.classList.add('active'));
  dom.closeSidebarBtn.addEventListener('click', () => dom.sidebar.classList.remove('active'));
  
  // Navigation tabs toggle
  dom.navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
      
      // Close mobile sidebar
      dom.sidebar.classList.remove('active');
    });
  });
  
  // Global Month Filter
  dom.headerMonthFilter.addEventListener('change', (e) => {
    state.filters.month = e.target.value;
    state.isAlertBannerDismissed = false; // Reset dismiss state on month change
    renderDashboard();
    renderTransactionsLedger();
  });
  
  // Dialog Openers
  dom.btnOpenAddModal.addEventListener('click', () => openTransactionModal(null));
  if (dom.btnEmptyStateAdd) {
    dom.btnEmptyStateAdd.addEventListener('click', () => openTransactionModal(null));
  }
  
  // Modal Cancel hooks
  dom.btnCancelModal.addEventListener('click', closeTransactionModal);
  dom.btnCancelForm.addEventListener('click', closeTransactionModal);
  dom.transactionModal.addEventListener('click', (e) => {
    if (e.target === dom.transactionModal) closeTransactionModal();
  });
  
  // Transaction type toggle radios (Expense / Income)
  dom.typeExpense.addEventListener('change', () => updateFormCategories('expense'));
  dom.typeIncome.addEventListener('change', () => updateFormCategories('income'));
  
  // Submit Transaction Form
  dom.transactionForm.addEventListener('submit', handleTransactionSubmit);
  
  // Dashboard Action buttons
  dom.btnCloseAlertBanner.addEventListener('click', () => {
    dom.budgetAlertBanner.classList.add('alert-hidden');
    state.isAlertBannerDismissed = true;
  });
  
  dom.btnViewAllTransactions.addEventListener('click', () => {
    switchTab('transactions');
  });
  
  // Transactions Filtering toolbar
  dom.searchTxInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value.trim();
    state.pagination.currentPage = 1;
    renderTransactionsLedger();
  });
  
  dom.filterType.addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    state.pagination.currentPage = 1;
    renderTransactionsLedger();
  });
  
  dom.filterCategory.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    state.pagination.currentPage = 1;
    renderTransactionsLedger();
  });
  
  dom.filterSort.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    renderTransactionsLedger();
  });
  
  dom.btnClearFilters.addEventListener('click', () => {
    dom.searchTxInput.value = '';
    dom.filterType.value = 'all';
    dom.filterCategory.value = 'all';
    dom.filterSort.value = 'date-desc';
    
    state.filters.search = '';
    state.filters.type = 'all';
    state.filters.category = 'all';
    state.filters.sort = 'date-desc';
    state.pagination.currentPage = 1;
    
    renderTransactionsLedger();
    showToast('Filters cleared', 'info');
  });
  
  // Pagination controls
  dom.btnPrevPage.addEventListener('click', () => {
    if (state.pagination.currentPage > 1) {
      state.pagination.currentPage--;
      renderTransactionsLedger();
    }
  });
  
  dom.btnNextPage.addEventListener('click', () => {
    const totalFiltered = getFilteredTransactions().length;
    const maxPage = Math.ceil(totalFiltered / state.pagination.pageSize);
    if (state.pagination.currentPage < maxPage) {
      state.pagination.currentPage++;
      renderTransactionsLedger();
    }
  });
  
  // Settings Tab Operations
  dom.budgetSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newLimit = parseFloat(dom.inputBudgetLimit.value);
    const newThreshold = parseInt(dom.inputAlertThreshold.value);
    const newCurrency = dom.inputCurrency.value;
    
    if (isNaN(newLimit) || newLimit < 0) {
      showToast('Please enter a valid budget limit', 'error');
      return;
    }
    
    state.budgetLimit = newLimit;
    state.alertThreshold = newThreshold;
    state.currency = newCurrency;
    state.isAlertBannerDismissed = false; // allow alerts to reappear
    
    localStorage.setItem(STORAGE_KEYS.BUDGET_LIMIT, newLimit);
    localStorage.setItem(STORAGE_KEYS.ALERT_THRESHOLD, newThreshold);
    localStorage.setItem(STORAGE_KEYS.CURRENCY, newCurrency);
    
    updateUIPrefixes();
    renderDashboard();
    renderTransactionsLedger();
    showToast('Settings and currency updated successfully', 'success');
  });
  
  // CSV Export Actions
  dom.btnExportCSV.addEventListener('click', triggerCSVExport);
  dom.btnExportCSV2.addEventListener('click', triggerCSVExport);
  
  // CSV Import Actions
  dom.btnTriggerImport.addEventListener('click', () => dom.csvFileInput.click());
  dom.btnTriggerImport2.addEventListener('click', () => dom.csvFileInput.click());
  dom.csvFileInput.addEventListener('change', handleCSVFileImport);
  
  // Delete / Reset Data
  dom.btnResetData.addEventListener('click', triggerFactoryResetConfirm);
  dom.btnCancelConfirm.addEventListener('click', () => dom.confirmModal.classList.remove('active'));
}

// Navigation Tab Switcher
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Adjust active flags in Nav
  dom.navButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Render views
  dom.tabContents.forEach(content => {
    if (content.id === `tab${capitalizeFirst(tabId)}` || (tabId === 'budget-settings' && content.id === 'tabBudgetSettings')) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
  
  // Adjust Headers
  if (tabId === 'dashboard') {
    dom.pageTitle.textContent = 'Dashboard';
    dom.pageSubtitle.textContent = "Welcome back! Here's your financial snapshot.";
  } else if (tabId === 'transactions') {
    dom.pageTitle.textContent = 'Transactions Ledger';
    dom.pageSubtitle.textContent = 'Track and audit your records in real-time.';
  } else if (tabId === 'budget-settings') {
    dom.pageTitle.textContent = 'Budget Settings';
    dom.pageSubtitle.textContent = 'Configure thresholds and manage local archives.';
  }
  
  // Redraw charts/elements on view shift to guarantee sizing alignment
  if (tabId === 'dashboard') {
    renderDashboard();
  }
}

// Capitalize first letter of nav tab IDs
function capitalizeFirst(str) {
  if (str.includes('-')) {
    return str.split('-').map(capitalizeFirst).join('');
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- DYNAMIC SECTIONS RENDERING ---

// Return transactions filtered by dashboard global month selector
function getMonthFilteredTransactions() {
  if (state.filters.month === 'all') {
    return state.transactions;
  }
  return state.transactions.filter(tx => tx.date && tx.date.startsWith(state.filters.month));
}

// RENDER: Dashboard Tab
function renderDashboard() {
  const monthTxs = getMonthFilteredTransactions();
  
  // Calculate Summary metrics
  let totalIncome = 0;
  let totalExpenses = 0;
  
  monthTxs.forEach(tx => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpenses += tx.amount;
    }
  });
  
  // Calculate Balance (cumulative over all time)
  let cumulativeBalance = 0;
  state.transactions.forEach(tx => {
    if (tx.type === 'income') {
      cumulativeBalance += tx.amount;
    } else if (tx.type === 'expense') {
      cumulativeBalance -= tx.amount;
    }
  });
  
  // Calculate Savings Rate for selected month
  let savingsRate = 0;
  if (totalIncome > 0) {
    savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
  }
  // Savings rate constraint between 0 and 100
  const visualSavingsRate = Math.max(0, Math.min(100, savingsRate));
  
  // Populate metric DOM fields
  dom.valNetBalance.textContent = formatCurrency(cumulativeBalance);
  dom.valTotalIncome.textContent = formatCurrency(totalIncome);
  dom.valTotalExpenses.textContent = formatCurrency(totalExpenses);
  dom.valSavingsRate.textContent = totalIncome > 0 ? `${savingsRate}%` : '0%';
  dom.savingsRateProgress.style.width = `${visualSavingsRate}%`;
  
  // Apply visual styling class to cumulative balance
  if (cumulativeBalance >= 0) {
    dom.valNetBalance.className = 'metric-value';
  } else {
    dom.valNetBalance.className = 'metric-value text-rose';
  }
  
  // Monthly Budget Target calculations
  dom.budgetSpentVal.textContent = formatCurrency(totalExpenses);
  dom.budgetLimitVal.textContent = formatCurrency(state.budgetLimit);
  
  if (state.budgetLimit > 0) {
    const budgetPct = (totalExpenses / state.budgetLimit) * 100;
    const progressWidth = Math.min(100, budgetPct);
    dom.budgetProgressBar.style.width = `${progressWidth}%`;
    
    // Update alert status styles
    if (budgetPct >= 100) {
      dom.budgetProgressBar.className = 'budget-progress-bar danger';
      dom.budgetStatusText.innerHTML = `<span class="text-rose font-weight-bold">Over Budget!</span> Exceeded target limit by ${formatCurrency(totalExpenses - state.budgetLimit)}`;
    } else if (budgetPct >= state.alertThreshold) {
      dom.budgetProgressBar.className = 'budget-progress-bar';
      dom.budgetStatusText.innerHTML = `<span class="text-yellow">Warning:</span> Nearing limit. Spent ${progressWidth.toFixed(0)}% of monthly target budget.`;
    } else {
      dom.budgetProgressBar.className = 'budget-progress-bar';
      const remaining = state.budgetLimit - totalExpenses;
      dom.budgetStatusText.textContent = `${formatCurrency(remaining)} remaining of your monthly budget.`;
    }
    
    // Manage Global Alert banner notification
    if (budgetPct >= state.alertThreshold && !state.isAlertBannerDismissed) {
      dom.budgetAlertBanner.classList.remove('alert-hidden');
      const selectedMonthName = state.filters.month !== 'all' 
        ? formatMonthYearString(state.filters.month) 
        : 'All Time';
      
      if (budgetPct >= 100) {
        dom.alertBannerTitle.textContent = `CRITICAL: Monthly Budget Exceeded (${selectedMonthName})`;
        dom.alertBannerText.textContent = `Your total expenses (${formatCurrency(totalExpenses)}) have surpassed your target monthly limit of ${formatCurrency(state.budgetLimit)}.`;
        dom.budgetAlertBanner.style.background = 'rgba(244, 63, 94, 0.1)';
        dom.budgetAlertBanner.style.borderColor = 'rgba(244, 63, 94, 0.3)';
        dom.budgetAlertBanner.style.color = 'var(--rose-500)';
        dom.btnCloseAlertBanner.style.color = 'var(--rose-500)';
      } else {
        dom.alertBannerTitle.textContent = `WARNING: Budget Threshold Reached (${selectedMonthName})`;
        dom.alertBannerText.textContent = `You have spent ${budgetPct.toFixed(0)}% of your monthly budget of ${formatCurrency(state.budgetLimit)}.`;
        dom.budgetAlertBanner.style.background = 'rgba(245, 158, 11, 0.1)';
        dom.budgetAlertBanner.style.borderColor = 'rgba(245, 158, 11, 0.25)';
        dom.budgetAlertBanner.style.color = 'var(--yellow-500)';
        dom.btnCloseAlertBanner.style.color = 'var(--yellow-500)';
      }
    } else {
      dom.budgetAlertBanner.classList.add('alert-hidden');
    }
  } else {
    // Budget tracker disabled
    dom.budgetProgressBar.style.width = `0%`;
    dom.budgetStatusText.textContent = 'Configure a monthly limit inside Settings Tab to activate tracking.';
    dom.budgetAlertBanner.classList.add('alert-hidden');
  }
  
  // Render recent preview transactions table
  renderRecentTransactionsList(monthTxs);
  
  // Initialize or update charts
  renderCharts();
}

// RENDER: Recent Preview Table (Dashboard)
function renderRecentTransactionsList(filteredTxs) {
  // Sort descending by date, taking top 5
  const sorted = [...filteredTxs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 5);
  
  dom.recentTransactionsTable.innerHTML = '';
  
  if (recent.length === 0) {
    dom.recentTransactionsTable.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">
          No transactions registered for this period.
        </td>
      </tr>
    `;
    return;
  }
  
  recent.forEach(tx => {
    const row = document.createElement('tr');
    
    const badgeClass = tx.type === 'income' ? 'badge-income-general' : 'badge-expense-general';
    const amountPrefix = tx.type === 'income' ? '+' : '-';
    const amountClass = tx.type === 'income' ? 'text-emerald' : 'text-rose';
    
    row.innerHTML = `
      <td style="white-space: nowrap;">${formatShortDate(tx.date)}</td>
      <td class="font-weight-medium">${escapeHtml(tx.description)}</td>
      <td><span class="badge ${badgeClass}">${tx.category}</span></td>
      <td style="text-transform: capitalize;">${tx.type}</td>
      <td class="text-right font-weight-bold ${amountClass}">${amountPrefix}${formatCurrency(tx.amount)}</td>
    `;
    
    dom.recentTransactionsTable.appendChild(row);
  });
}

// RENDER: Transaction Ledger View (All Filters)
function getFilteredTransactions() {
  let list = [...state.transactions];
  
  // 1. Text Search Filter
  if (state.filters.search) {
    const query = state.filters.search.toLowerCase();
    list = list.filter(tx => 
      tx.description.toLowerCase().includes(query) || 
      (tx.notes && tx.notes.toLowerCase().includes(query)) ||
      tx.category.toLowerCase().includes(query)
    );
  }
  
  // 2. Type Filter
  if (state.filters.type !== 'all') {
    list = list.filter(tx => tx.type === state.filters.type);
  }
  
  // 3. Category Filter
  if (state.filters.category !== 'all') {
    list = list.filter(tx => tx.category === state.filters.category);
  }
  
  // 4. Month Filter
  if (state.filters.month !== 'all') {
    list = list.filter(tx => tx.date && tx.date.startsWith(state.filters.month));
  }
  
  // 5. Sorting Engine
  list.sort((a, b) => {
    switch (state.filters.sort) {
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'date-desc':
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });
  
  return list;
}

function renderTransactionsLedger() {
  const filtered = getFilteredTransactions();
  const pag = state.pagination;
  
  // Calculate total pages
  const totalItems = filtered.length;
  const maxPage = Math.max(1, Math.ceil(totalItems / pag.pageSize));
  
  // Bounds check current page
  if (pag.currentPage > maxPage) {
    pag.currentPage = maxPage;
  }
  
  const startIdx = (pag.currentPage - 1) * pag.pageSize;
  const endIdx = Math.min(startIdx + pag.pageSize, totalItems);
  const pageItems = filtered.slice(startIdx, endIdx);
  
  // Clear table body
  dom.fullTransactionsTable.innerHTML = '';
  
  if (totalItems === 0) {
    dom.tableEmptyState.style.display = 'flex';
    dom.paginationControls.style.display = 'none';
    return;
  } else {
    dom.tableEmptyState.style.display = 'none';
    dom.paginationControls.style.display = 'flex';
  }
  
  pageItems.forEach(tx => {
    const row = document.createElement('tr');
    
    const badgeClass = tx.type === 'income' ? 'badge-income-general' : 'badge-expense-general';
    const amountPrefix = tx.type === 'income' ? '+' : '-';
    const amountClass = tx.type === 'income' ? 'text-emerald' : 'text-rose';
    
    row.innerHTML = `
      <td>${formatShortDate(tx.date)}</td>
      <td>
        <div class="tx-description-cell">
          <strong class="text-primary font-weight-medium">${escapeHtml(tx.description)}</strong>
          ${tx.notes ? `<span class="tx-notes-subtext" title="${escapeHtml(tx.notes)}">${escapeHtml(tx.notes)}</span>` : ''}
        </div>
      </td>
      <td><span class="badge ${badgeClass}">${tx.category}</span></td>
      <td style="text-transform: capitalize;">${tx.type}</td>
      <td class="text-right font-weight-bold ${amountClass}">${amountPrefix}${formatCurrency(tx.amount)}</td>
      <td class="text-center">
        <div class="action-btn-group">
          <button class="btn-action edit-btn" data-id="${tx.id}" title="Edit transaction" aria-label="Edit transaction">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="btn-action delete-btn" data-id="${tx.id}" title="Delete transaction" aria-label="Delete transaction">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    
    // Register actions listeners
    row.querySelector('.edit-btn').addEventListener('click', () => openTransactionModal(tx.id));
    row.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteTransaction(tx.id));
    
    dom.fullTransactionsTable.appendChild(row);
  });
  
  // Render Pagination details
  dom.paginationInfo.textContent = `Showing ${totalItems === 0 ? 0 : startIdx + 1}-${endIdx} of ${totalItems} transactions`;
  
  // Prev/Next buttons disabled state
  dom.btnPrevPage.disabled = pag.currentPage === 1;
  dom.btnNextPage.disabled = pag.currentPage === maxPage;
  
  // Build Page buttons numbers
  dom.pageNumbersContainer.innerHTML = '';
  
  // Simple pagination logic (Max 5 pages visible around active page)
  let startPage = Math.max(1, pag.currentPage - 2);
  let endPage = Math.min(maxPage, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${i === pag.currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      pag.currentPage = i;
      renderTransactionsLedger();
    });
    dom.pageNumbersContainer.appendChild(pageBtn);
  }
  
  // Re-run icons loader
  lucide.createIcons();
}

// --- CHARTS CREATION & SYNC (CHART.JS) ---
function renderCharts() {
  const monthTxs = getMonthFilteredTransactions();
  
  // Donut Config: Expense breakdown
  renderCategoryBreakdownChart(monthTxs);
  
  // Bar Config: Monthly trend
  renderMonthlyTrendChart();
}

function renderCategoryBreakdownChart(monthTxs) {
  // Aggregate expenses by category
  const expenseTxs = monthTxs.filter(tx => tx.type === 'expense');
  const totals = {};
  
  expenseTxs.forEach(tx => {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });
  
  const categories = Object.keys(totals);
  const data = Object.values(totals);
  
  // Destroy existing chart if initialized
  if (state.charts.category) {
    state.charts.category.destroy();
  }
  
  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  if (categories.length === 0) {
    // Clear canvas or show message
    ctx.clearRect(0, 0, 300, 300);
    // Draw empty placeholder text directly on canvas
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No expense data available for this period.', ctx.canvas.width / 2, ctx.canvas.height / 2);
    state.charts.category = null;
    return;
  }
  
  // Compile colors
  const backgroundColors = categories.map(cat => CATEGORY_COLORS[cat] || 'rgba(156, 163, 175, 0.8)');
  const borderColors = categories.map(cat => CATEGORY_BORDER_COLORS[cat] || 'rgb(156, 163, 175)');
  
  state.charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#d1d5db',
            font: {
              family: 'Plus Jakarta Sans',
              size: 11
            },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#ffffff',
          bodyColor: '#f3f4f6',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((value / total) * 100).toFixed(1);
              return ` ${label}: ${formatCurrency(value)} (${percent}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

function renderMonthlyTrendChart() {
  // Aggregate Income and Expense by Month over the last 6 active months
  const monthlyData = {};
  
  // Read all records to establish a timeline
  state.transactions.forEach(tx => {
    if (!tx.date) return;
    const month = tx.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      monthlyData[month].income += tx.amount;
    } else {
      monthlyData[month].expense += tx.amount;
    }
  });
  
  // Extract and sort months
  const sortedMonths = Object.keys(monthlyData).sort();
  
  // Slice to last 6 months to avoid cramped UI
  const displayMonths = sortedMonths.slice(-6);
  
  const labels = displayMonths.map(m => formatMonthYearString(m));
  const incomeData = displayMonths.map(m => monthlyData[m].income);
  const expenseData = displayMonths.map(m => monthlyData[m].expense);
  
  // Destroy existing chart if initialized
  if (state.charts.trend) {
    state.charts.trend.destroy();
  }
  
  const ctx = document.getElementById('trendChart').getContext('2d');
  
  if (displayMonths.length === 0) {
    ctx.clearRect(0, 0, 400, 300);
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No history data available yet.', ctx.canvas.width / 2, ctx.canvas.height / 2);
    state.charts.trend = null;
    return;
  }
  
  state.charts.trend = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.75)', // translucent emerald
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1.5,
          borderRadius: 4,
          maxBarThickness: 28
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: 'rgba(244, 63, 94, 0.75)', // translucent rose
          borderColor: 'rgb(244, 63, 94)',
          borderWidth: 1.5,
          borderRadius: 4,
          maxBarThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#d1d5db',
            font: {
              family: 'Plus Jakarta Sans',
              size: 11
            },
            boxWidth: 12
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#ffffff',
          bodyColor: '#f3f4f6',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              return ` ${label}: ${formatCurrency(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: 'Plus Jakarta Sans',
              size: 10
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: 'Plus Jakarta Sans',
              size: 10
            },
            callback: function(value) {
              return getCurrencySymbol() + value;
            }
          }
        }
      }
    }
  });
}

// --- TRANSACTION MODAL CRUD OPERATIONS ---
function openTransactionModal(editId = null) {
  // Reset Form
  dom.transactionForm.reset();
  
  if (editId) {
    // EDIT MODE
    const tx = state.transactions.find(t => t.id === editId);
    if (!tx) return;
    
    dom.txId.value = tx.id;
    dom.modalTitleText.textContent = 'Edit Transaction';
    
    // Set type radios
    if (tx.type === 'income') {
      dom.typeIncome.checked = true;
      updateFormCategories('income');
    } else {
      dom.typeExpense.checked = true;
      updateFormCategories('expense');
    }
    
    dom.txAmount.value = tx.amount;
    dom.txDate.value = tx.date;
    dom.txCategory.value = tx.category;
    dom.txDescription.value = tx.description;
    dom.txNotes.value = tx.notes || '';
    
    dom.btnSubmitForm.textContent = 'Update Transaction';
  } else {
    // ADD NEW MODE
    dom.txId.value = '';
    dom.modalTitleText.textContent = 'Add Transaction';
    
    // Default to Expense
    dom.typeExpense.checked = true;
    updateFormCategories('expense');
    
    dom.txDate.value = getTodayDateString();
    dom.btnSubmitForm.textContent = 'Save Transaction';
  }
  
  // Show Modal Overlay
  dom.transactionModal.classList.add('active');
}

function closeTransactionModal() {
  dom.transactionModal.classList.remove('active');
}

// Manage dynamic form categories based on Type radio selects
function updateFormCategories(type) {
  dom.txCategory.innerHTML = '';
  
  const options = CATEGORIES[type] || [];
  options.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    dom.txCategory.appendChild(opt);
  });
}

// Handle Form Submission (Both Add & Edit save targets)
function handleTransactionSubmit(e) {
  e.preventDefault();
  
  const id = dom.txId.value;
  const description = dom.txDescription.value.trim();
  const amount = parseFloat(dom.txAmount.value);
  const date = dom.txDate.value;
  const category = dom.txCategory.value;
  const type = dom.typeExpense.checked ? 'expense' : 'income';
  const notes = dom.txNotes.value.trim();
  
  // Validations
  if (!description || isNaN(amount) || amount <= 0 || !date || !category) {
    showToast('Please fill out all required fields with valid values', 'error');
    return;
  }
  
  if (id) {
    // Perform update on existing transaction
    const index = state.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      state.transactions[index] = { id, description, amount, date, category, type, notes };
      showToast('Transaction updated successfully', 'success');
    }
  } else {
    // Add new transaction
    const newTx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      description,
      amount,
      date,
      category,
      type,
      notes
    };
    state.transactions.push(newTx);
    showToast('Transaction added successfully', 'success');
  }
  
  // Save, Close & Refresh
  saveTransactionsToLocalStorage();
  closeTransactionModal();
}

// Confirmation workflow for deletes
let transactionIdToDelete = null;

function confirmDeleteTransaction(id) {
  transactionIdToDelete = id;
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  
  dom.confirmModalText.innerHTML = `Are you sure you want to delete <strong>"${escapeHtml(tx.description)}"</strong> (${formatCurrency(tx.amount)})? This action cannot be undone.`;
  dom.btnApproveConfirm.textContent = 'Delete Record';
  
  // Temporarily bind confirmation triggers
  dom.btnApproveConfirm.onclick = executeDeleteTransaction;
  
  dom.confirmModal.classList.add('active');
}

function executeDeleteTransaction() {
  if (transactionIdToDelete) {
    state.transactions = state.transactions.filter(t => t.id !== transactionIdToDelete);
    saveTransactionsToLocalStorage();
    showToast('Transaction deleted', 'info');
    
    transactionIdToDelete = null;
    dom.confirmModal.classList.remove('active');
  }
}

// --- DATA MANAGEMENT OPERATIONS (CSV INTEGRATION) ---

// Export standard formatted CSV backup archive
function triggerCSVExport() {
  if (state.transactions.length === 0) {
    showToast('No transaction data to export', 'warning');
    return;
  }
  
  // Header row
  let csvContent = 'Date,Description,Category,Type,Amount,Notes\r\n';
  
  // Append values escaping comma details
  state.transactions.forEach(tx => {
    const row = [
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.category}"`,
      tx.type,
      tx.amount,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ].join(',');
    
    csvContent += row + '\r\n';
  });
  
  // Create Blob & Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const timestamp = new Date().toISOString().slice(0,10);
  link.setAttribute('download', `aurabudget_backup_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('CSV Backup downloaded successfully', 'success');
}

// Parse imported CSV text and sync with local storage
function handleCSVFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    parseAndMergeCSV(text);
  };
  reader.readAsText(file);
  
  // Clear file input hook so same file can be reloaded
  dom.csvFileInput.value = '';
}

function parseAndMergeCSV(text) {
  try {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) {
      showToast('Invalid CSV format: File empty', 'error');
      return;
    }
    
    // Validate Header column matching
    const header = lines[0].toLowerCase().trim();
    if (!header.includes('date') || !header.includes('amount') || !header.includes('type')) {
      showToast('Invalid CSV format: Missing required columns (Date, Amount, Type)', 'error');
      return;
    }
    
    const parsedTransactions = [];
    let errorCount = 0;
    
    // Parse individual text rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // skip blank rows
      
      // Parse CSV columns dealing with quotes
      const columns = parseCSVRow(line);
      if (columns.length < 5) {
        errorCount++;
        continue;
      }
      
      const date = columns[0];
      const description = columns[1].replace(/^"(.*)"$/, '$1'); // clean quotes
      const category = columns[2].replace(/^"(.*)"$/, '$1');
      const type = columns[3].toLowerCase();
      const amount = parseFloat(columns[4]);
      const notes = columns[5] ? columns[5].replace(/^"(.*)"$/, '$1') : '';
      
      // Validate cell entries
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const isDateVal = dateRegex.test(date);
      const isAmountVal = !isNaN(amount) && amount > 0;
      const isTypeVal = type === 'income' || type === 'expense';
      
      // Category fallback validation
      let finalCat = category;
      if (isTypeVal && !CATEGORIES[type].includes(category)) {
        finalCat = CATEGORIES[type][0]; // fallback to first standard category
      }
      
      if (isDateVal && isAmountVal && isTypeVal) {
        parsedTransactions.push({
          id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) + '-' + i,
          description: description || (type === 'income' ? 'Imported Income' : 'Imported Expense'),
          amount,
          date,
          category: finalCat,
          type,
          notes: notes || ''
        });
      } else {
        errorCount++;
      }
    }
    
    if (parsedTransactions.length === 0) {
      showToast('No valid transactions parsed from CSV file', 'error');
      return;
    }
    
    // Merge or overwrite check. We will prepend/merge imported data to active transactions
    state.transactions = [...parsedTransactions, ...state.transactions];
    saveTransactionsToLocalStorage();
    
    let notice = `Successfully imported ${parsedTransactions.length} records.`;
    if (errorCount > 0) {
      notice += ` Ignored ${errorCount} invalid rows.`;
    }
    showToast(notice, errorCount > 0 ? 'warning' : 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to parse file. Make sure file contains valid encoding.', 'error');
  }
}

// Robust CSV Line parser helper
function parseCSVRow(text) {
  let p = '', r = [];
  let q = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      q = !q;
    } else if (c === ',' && !q) {
      r.push(p);
      p = '';
    } else {
      p += c;
    }
  }
  r.push(p);
  return r;
}

// Reset operations trigger
function triggerFactoryResetConfirm() {
  dom.confirmModalText.innerHTML = `<span class="text-rose font-weight-bold">CRITICAL WARNING:</span> You are about to clear all transaction and configuration archives. All local storage settings will be deleted. This action cannot be undone.`;
  dom.btnApproveConfirm.textContent = 'Clear All Data';
  
  dom.btnApproveConfirm.onclick = executeFactoryReset;
  dom.confirmModal.classList.add('active');
}

function executeFactoryReset() {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.BUDGET_LIMIT);
  localStorage.removeItem(STORAGE_KEYS.ALERT_THRESHOLD);
  localStorage.removeItem(STORAGE_KEYS.CURRENCY);
  
  // Reinitialize blank
  state.transactions = [];
  state.budgetLimit = 1200;
  state.alertThreshold = 85;
  state.currency = 'INR';
  state.isAlertBannerDismissed = false;
  
  dom.inputBudgetLimit.value = 1200;
  dom.inputAlertThreshold.value = 85;
  dom.inputCurrency.value = 'INR';
  
  updateUIPrefixes();
  saveTransactionsToLocalStorage();
  dom.confirmModal.classList.remove('active');
  showToast('Application reset to factory settings', 'success');
}

// --- UX NOTIFICATION ALERTS ENGINE ---
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Set alert icons matching types
  let iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-octagon';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'info') iconName = 'info';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  
  dom.toastContainer.appendChild(toast);
  lucide.createIcons(); // build SVG icon inside toast
  
  // Timed removal fadeout
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 4000);
}

// Helper to escape special HTML entities
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
