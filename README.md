# MeshPay — Zero-Connectivity P2P Mesh Payment & Cross-Border Remittance Vault

**MeshPay** is a high-reliability financial web application designed for emerging markets and high-latency environments. Built with an offline-first architecture, MeshPay enables peer-to-peer (P2P) transfers without active internet connection via simulated Bluetooth Low Energy (BLE) Mesh and Store-and-Forward queues, alongside real-time USD to NGN cross-border FX remittance.

---

## Key Highlights & Architectural Features

### 1. Dual-End Instant Recipient Balance Synchronization
- **Cross-Account Auto-Crediting**: When a sender transfers funds to another MeshPay account (e.g., via virtual NGB/USD account number, user tag `$fatima_b`, or phone number), the system instantly credits the recipient's secure storage vault.
- **Multi-Profile Switching**: Switch seamlessly between demo profiles (Adewale Lawson, Fatima Bello, Chinedu Okonkwo) to observe live balance updates, transaction histories, and credit alert notifications on both sender and recipient ends.

### 2. Differentiated Sent & Received Ledger History
- **Distinct Visual Cues**: Clear color-coded badges, directional icons (`ArrowDownLeft` green credit vs. `ArrowUpRight` rose/slate debit), and explicit "RECEIVED" / "SENT" labels across Recent Activities, Full Transaction History, and Notification Center.
- **Audit-Grade Digital Receipts**: Itemized receipts highlighting debited/credited balances, sender and recipient details, bank code resolutions, cryptographic signatures, and PDF download generation.

### 3. Store-and-Forward Offline Payment Engine
- **Zero-Connectivity Payments**: Authorize P2P transfers even when completely offline. Transactions are cryptographically signed (`HMAC-SHA256`) and stored in a local Store & Forward queue.
- **Silent Synchronization**: Automatically detects network restoration to sync queued offline payments with the settlement core, firing instant background notifications.

### 4. Cross-Border FX Remittance (USD ↔ NGN)
- **Live FX Converter**: Real-time NGN/USD rates with 10-minute auto-refresh polling, interactive FX history chart, fee calculator, and instant currency conversion.
- **Multi-Currency Virtual Accounts**: Dual NGN & USD virtual account provisioning (NIBSS 10-digit format).

### 5. Multi-Layer Vault Security & Anti-Tamper System
- **Biometric & PIN Lock**: Hardware-backed WebAuthn biometric simulation and 4-digit PIN verification before high-value disbursements.
- **Anti-Tamper Integrity Check**: SHA-256 local storage hash verification to guard against local state tampering.
- **Notifications & Alert Center**: Top-nav notification bell with live unread badge counters tracking transaction alerts, security events, and offline sync updates.

---

## Demo Accounts & Test Guide

You can test cross-account transfers by logging in with any of the following pre-configured profiles or creating a custom account:

| Account Holder | Phone Number | Tag | Virtual NGN Account | Initial Balances |
| :--- | :--- | :--- | :--- | :--- |
| **Adewale Lawson** | `08012345678` | `$adewale_l` | `9000000001` | ₦150,000 / $1,250.00 |
| **Fatima Bello** | `08098765432` | `$fatima_b` | `9000000002` | ₦380,000 / $850.00 |
| **Chinedu Okonkwo**| `07011223344` | `$chinedu_o` | `9000000003` | ₦95,000 / $300.00 |

*Note: Default Security PIN for all test accounts is `1234`.*

---

## Application Structure

```text
src/
├── components/
│   ├── BiometricModal.tsx         # Hardware biometric authentication dialog
│   ├── Navbar.tsx                 # Top navigation bar & notification trigger
│   ├── NotificationModal.tsx      # Notifications & security alert drawer
│   ├── OfflineReceiveQrModal.tsx  # Dynamic QR code generation for receiving offline P2P
│   ├── OfflineSendQrModal.tsx     # Offline QR scanner & BLE payload validator
│   ├── QuickSendModal.tsx         # Express 1-tap transfer modal
│   ├── SecurityModal.tsx          # 4-Digit Security PIN confirmation modal
│   ├── SyncModal.tsx              # Store & Forward offline sync manager
│   └── TransactionReceiptModal.tsx# Detailed digital transaction receipt with PDF exporter
├── data/
│   └── mockData.ts                # Default demo accounts, initial transactions & NIBSS bank codes
├── lib/
│   ├── currencies.ts              # Global currency list & conversion helpers
│   ├── liveFxRates.ts             # Live NGN/USD FX auto-refresh engine
│   ├── pdfGenerator.ts            # Canvas-to-PDF receipt renderer
│   ├── secureVault.ts            # Local encrypted vault storage & SHA-256 tamper inspector
│   ├── storage.ts                 # Multi-user profile, transaction, and notification manager
│   └── storeAndForward.ts         # Offline P2P queue & silent network synchronization
├── pages/
│   ├── DashboardPage.tsx          # Account summary, quick stats, and recent activities
│   ├── LoginPage.tsx              # Biometric & phone login with fast switch menu
│   ├── ProfilePage.tsx            # Security settings, PIN management & data reset
│   ├── RemittancePage.tsx         # USD/NGN FX converter & historical rate chart
│   ├── SendAndPayPage.tsx         # Bank transfers, P2P mesh payments & bill settlement
│   └── TransactionsPage.tsx       # Searchable & filterable full ledger history
├── App.tsx                        # Main application container & global state router
├── index.css                      # Global Tailwind CSS imports
├── main.tsx                       # React application root entry point
└── types.ts                       # Shared TypeScript interfaces & models
```

---

## Tech Stack & Dependencies

- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion (`motion/react`)
- **Graphics & PDF**: Canvas API HTML5 exporter
- **Data Integrity**: SHA-256 local signature hashing

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Local Setup

1. **Clone or Download Repository**
   ```bash
   git clone https://github.com/your-repo/meshpay.git
   cd meshpay
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   *The application will boot on `http://localhost:3000`.*

4. **Production Build & Verification**
   ```bash
   npm run lint
   npm run build
   npm run start
   ```

---

## License

This project is licensed under the MIT License — free for educational, commercial, and personal usage.
