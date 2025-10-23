# Nikee's Zara - Restaurant Ordering System

This is a comprehensive, modern restaurant management application built with Next.js, TypeScript, and Tailwind CSS. It provides a seamless, real-time ordering and management experience for customers, captains, kitchen staff, and POS operators, all running locally within the browser.

## Core Modules

The application is divided into four main user-facing modules:

1.  **Customer View (`/customer`)**: A dynamic, mobile-friendly menu where customers can browse items, place orders for their table, add more items, and request payment.
2.  **Captain View (`/captain`)**: A dashboard for service staff to monitor active orders, confirm new orders, and manage tables.
3.  **KDS (Kitchen Display System) (`/kds`)**: A real-time display for the kitchen staff, showing all active items that need to be prepared. Staff can update the status of each item as it moves through the cooking process.
4.  **POS (Point of Sale) (`/pos`)**: The central hub for managing the entire restaurant floor. It includes a table grid view, menu management, table management, settings, and sales analytics.

---

## Key Features

- **Real-Time State Sync**: Utilizes `zustand` and the browser's `localStorage` to create a real-time experience. Changes made in one module (e.g., a customer placing an order) are instantly reflected in all other open tabs or windows without needing a page refresh.
- **Dynamic Ordering**: Customers can place orders, and captains or POS operators can create or add to orders on behalf of customers.
- **KOT & Bill Management**:
    - Automated KOT (Kitchen Order Ticket) generation and printing workflow.
    - Duplicate KOT printing for any specific KOT.
    - Bill generation with support for duplicate bill printing.
- **Flexible Discount System**: Apply discounts to any order, either as a fixed amount (₹) or a percentage (%).
- **Payment Request Flow**: Customers can request payment via "Card" or "Cash/QR", which sends a real-time notification to the Captain and POS views.
- **Table Management**: POS operators can add, edit, and delete tables. QR codes for each table can be generated to link customers directly to their table's ordering page.
- **Menu Management**: A full-featured interface for POS operators to add, edit, and delete menu items and categories, and toggle their availability.
- **Sales Analytics**: A dashboard showing total revenue, total orders, and average order value, with filtering by date range.

---

## Process Flow & Logic

The application's logic is built around the lifecycle of an `Order`.

### 1. Order Creation
- **Customer**: Scans a QR code which opens `/customer?table=<number>`. They add items to their cart and place the order. The order status starts as `'New'`.
- **Captain/POS**: Can open a new order for a vacant table, add items, and confirm it.

### 2. Order Confirmation & KOT Printing
- A `'New'` order appears in the **Captain View** and **POS View**.
- A captain or POS operator must first "Confirm" the order.
- In the **POS View**, once an order is confirmed, the "Print KOT" button becomes active for any new items.
- Clicking "Print KOT" marks the `kotStatus` of those items as `'Printed'` and assigns them a unique KOT ID. The overall order status becomes `'Confirmed'`.

### 3. Kitchen & Item Progression
- Items with `kotStatus: 'Printed'` appear on the **KDS View**.
- The kitchen staff progresses each item through the stages:
    1.  **Pending**: Default state for a printed item.
    2.  **Preparing**: Kitchen starts working on the item.
    3.  **Ready**: Item is cooked and ready to be served.
- When an item is marked `'Ready'` on the KDS, it appears in the "Ready to Serve" section on the `OrderCard` in the Captain and POS views.
- A captain marks the item as `'Served'`.

### 4. Billing
- The "Generate Bill" button in the **POS View** is enabled ONLY when **all** items in an order are in the `'Served'` state.
- If a customer adds new items after others have been served, the "Generate Bill" button is disabled until the new items are also served.
- Applying a discount (percentage or amount) can be done from the order details sheet in the POS view at any time before payment.
- Generating a bill sets the order status to `'Billed'`.
- Duplicate bills can be printed for any order that has a status of `'Billed'`.

### 5. Payment
- Once an order is `'Billed'`, the "Proceed to Pay" button appears for the customer.
- The customer can choose a payment method:
    - **UPI**: Attempts to open a UPI app on the customer's device.
    - **Card** or **Cash/QR**: Sets a `paymentMethod` on the order object.
- This `paymentMethod` triggers a real-time notification on the corresponding `OrderCard` in the Captain and POS views (e.g., "Card Payment Requested").
- A captain acknowledges the request, clears the notification, and assists the customer.
- Once payment is received, the captain or POS operator marks the order as `'Paid'`, which removes it from the active displays.

---

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn

### Installation
1.  Clone the repository to your local machine.
2.  Open a terminal in the project's root directory.
3.  Install the required dependencies:
    ```bash
    npm install
    ```

### Running the Development Server
To run the application in development mode, use the following command:

```bash
npm run dev
```
This will start the Next.js development server, typically on port `9002`.

- Open [http://localhost:9002](http://localhost:9002) to see the main launch page.
- Open multiple tabs for different modules (e.g., one for `/pos` and one for `/customer?table=1`) to see the real-time synchronization in action.

---

## Deployment to Firebase (Spark Plan)

You can deploy this Next.js application to Firebase using the **Firebase App Hosting** service, which is available on the free Spark plan.

### Prerequisites
- You must have a Firebase account.
- You must have the Firebase CLI installed on your machine. If not, install it globally:
  ```bash
  npm install -g firebase-tools
  ```

### Step 1: Login to Firebase
In your terminal, log in to your Firebase account:
```bash
firebase login
```

### Step 2: Initialize Firebase
1.  In the root directory of your project, run the following command:
    ```bash
    firebase init
    ```
2.  You will be prompted with several questions. Follow these steps:
    -   "Which Firebase features do you want to set up for this directory?"
        -   Use the arrow keys to navigate to **App Hosting: Deploy Next.js web apps to a new backend**.
        -   Press `Space` to select it, then press `Enter`.
    -   "Please select an option:"
        -   If you have an existing Firebase project, select `Use an existing project`.
        -   If you need to create a new one, select `Create a new project`. Follow the prompts to set a unique project ID and display name.
    -   "What do you want to use as your public directory?"
        -   Press `Enter` to accept the default (`.next`). This is automatically detected.
    -   The CLI will then create a Firebase backend for App Hosting.

### Step 3: Deploy
After initialization is complete, you can deploy your application at any time by running:
```bash
firebase deploy
```

The CLI will build your Next.js application and deploy it. Once finished, it will provide you with a URL where your live application can be accessed (e.g., `https://your-app-name--nikee-s-zara.web.app`).

---

## Project Structure

- **`src/app`**: Contains the main pages for each module (e.g., `src/app/pos`, `src/app/customer`).
- **`src/components`**: Shared React components used across the application.
    - **`src/components/ui`**: UI components from `shadcn/ui`.
- **`src/lib`**: Core logic, type definitions, and state management.
    - **`types.ts`**: Contains all TypeScript type definitions for the application (Order, MenuItem, etc.).
    - **`*-store.ts`**: Zustand store files (`orders-store.ts`, `menu-store.ts`, etc.) for managing global state.
    - **`data.ts`**: Initial seed data for the menu.
- **`public`**: Static assets.
- **`tailwind.config.ts`**: Configuration for Tailwind CSS.
- **`next.config.js`**: Configuration for Next.js.
