import React, { useState, useMemo } from "react";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Truck,
  UserRound,
  Settings,
  DollarSign,
  ChevronRight,
  Building2,
  CreditCard,
  BarChart3,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  Filter,
} from "lucide-react";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import { Input } from "../../components/common";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  tags: string[];
  readTime: string;
  featured?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

// ─── Categories ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Learn the basics of the system",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: "Overview and analytics",
  },
  {
    id: "invoices",
    name: "Invoicing",
    icon: <FileText className="w-5 h-5" />,
    description: "Create and manage invoices",
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: <Package className="w-5 h-5" />,
    description: "Manage stock and products",
  },
  {
    id: "customers",
    name: "Customers",
    icon: <Users className="w-5 h-5" />,
    description: "Customer management",
  },
  {
    id: "suppliers",
    name: "Suppliers",
    icon: <Truck className="w-5 h-5" />,
    description: "Supplier management",
  },
  {
    id: "expenses",
    name: "Expenses",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Track and manage expenses",
  },
  {
    id: "team",
    name: "Team & Users",
    icon: <UserRound className="w-5 h-5" />,
    description: "User and role management",
  },
  {
    id: "entities",
    name: "Organisations",
    icon: <Building2 className="w-5 h-5" />,
    description: "Multi-entity management",
  },
  {
    id: "settings",
    name: "Settings",
    icon: <Settings className="w-5 h-5" />,
    description: "System configuration",
  },
];

// ─── Articles ──────────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  // ─── Getting Started ──────────────────────────────────────────────────────
  {
    id: "welcome",
    title: "Welcome to the System",
    description: "An overview of the key features and how to get started",
    category: "getting-started",
    icon: <BookOpen className="w-5 h-5" />,
    readTime: "5 min",
    featured: true,
    tags: ["welcome", "overview", "introduction"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">
          Welcome to Your Business Management System
        </h2>
        <p className="text-text-light">
          This comprehensive system is designed to help you manage your business
          operations efficiently. From invoicing to inventory management,
          customer relationships to expense tracking, everything you need is in
          one place.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-primary-10 p-4 rounded-lg">
            <h3 className="font-semibold text-primary">Quick Start Guide</h3>
            <ol className="list-decimal list-inside text-sm text-text-light space-y-1 mt-2">
              <li>Set up your organisation profile</li>
              <li>Add team members and assign roles</li>
              <li>Create your first customer</li>
              <li>Generate your first invoice</li>
              <li>Track your expenses</li>
            </ol>
          </div>
          <div className="bg-emerald-10 p-4 rounded-lg">
            <h3 className="font-semibold text-emerald-600">Key Features</h3>
            <ul className="list-disc list-inside text-sm text-text-light space-y-1 mt-2">
              <li>Invoice creation and management</li>
              <li>Inventory tracking</li>
              <li>Customer and supplier management</li>
              <li>Expense tracking</li>
              <li>Team collaboration</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "navigating-the-system",
    title: "Navigating the System",
    description: "Learn how to navigate through different modules",
    category: "getting-started",
    icon: <BookOpen className="w-5 h-5" />,
    readTime: "3 min",
    tags: ["navigation", "sidebar", "layout"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">System Navigation</h2>
        <p className="text-text-light">
          The system is organized into modules accessible from the sidebar:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-primary font-medium">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </div>
            <p className="text-sm text-text-light mt-1">
              Overview of key metrics and recent activity
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-primary font-medium">
              <FileText className="w-4 h-4" />
              Invoicing
            </div>
            <p className="text-sm text-text-light mt-1">
              Create, send, and manage invoices
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Package className="w-4 h-4" />
              Inventory
            </div>
            <p className="text-sm text-text-light mt-1">
              Track stock levels and manage products
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-primary font-medium">
              <DollarSign className="w-4 h-4" />
              Expenses
            </div>
            <p className="text-sm text-text-light mt-1">
              Track and manage business expenses
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "organisation-entities",
    title: "Understanding Organisations (Entities)",
    description: "Learn about multi-entity management",
    category: "getting-started",
    icon: <Building2 className="w-5 h-5" />,
    readTime: "4 min",
    tags: ["entities", "organisations", "multi-entity"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">
          Organisation Management
        </h2>
        <p className="text-text-light">
          The system supports multiple organisations (entities) under one
          account. This is useful for:
        </p>
        <ul className="list-disc list-inside text-text-light space-y-1">
          <li>Managing multiple business branches</li>
          <li>Separating different business units</li>
          <li>Multi-company operations</li>
          <li>Franchise management</li>
        </ul>
        <div className="bg-amber-10 p-4 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            How to Switch Organisations
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Click on the organisation name in the sidebar dropdown to switch
            between different entities. All data is isolated per organisation.
          </p>
        </div>
      </div>
    ),
  },

  // ─── Dashboard ────────────────────────────────────────────────────────────
  {
    id: "dashboard-overview",
    title: "Dashboard Overview",
    description: "Understanding your business metrics at a glance",
    category: "dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    readTime: "3 min",
    tags: ["dashboard", "metrics", "analytics"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Dashboard Overview</h2>
        <p className="text-text-light">
          The dashboard provides a high-level view of your business performance
          with key metrics and recent activity.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Key Metrics</h4>
            <ul className="text-sm text-text-light space-y-1 mt-2">
              <li>• Total Revenue</li>
              <li>• Outstanding Invoices</li>
              <li>• Low Stock Alerts</li>
              <li>• Monthly Trends</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Charts & Reports</h4>
            <ul className="text-sm text-text-light space-y-1 mt-2">
              <li>• Weekly Sales</li>
              <li>• Category Breakdown</li>
              <li>• Invoice Status</li>
              <li>• Expense Trends</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Invoicing ────────────────────────────────────────────────────────────
  {
    id: "create-invoice",
    title: "Creating an Invoice",
    description: "Step-by-step guide to creating professional invoices",
    category: "invoices",
    icon: <FileText className="w-5 h-5" />,
    readTime: "5 min",
    featured: true,
    tags: ["invoice", "create", "billing"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Creating an Invoice</h2>
        <ol className="list-decimal list-inside text-text-light space-y-2">
          <li>
            Navigate to <strong>Invoicing</strong> from the sidebar
          </li>
          <li>
            Click the <strong>+ New Invoice</strong> button
          </li>
          <li>Select or create a customer</li>
          <li>Add line items with description, quantity, and price</li>
          <li>Set discounts, VAT, and other charges (if applicable)</li>
          <li>Choose invoice status: Draft, Quoted, or Invoiced</li>
          <li>
            Click <strong>Save</strong> or <strong>Save & Send</strong>
          </li>
        </ol>
        <div className="bg-primary-10 p-4 rounded-lg">
          <h4 className="font-semibold text-primary">💡 Pro Tip</h4>
          <p className="text-sm text-text-light">
            Use the "Save & Send" option to email the invoice directly to your
            customer as a PDF.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "invoice-payments",
    title: "Managing Invoice Payments",
    description: "How to record and track payments",
    category: "invoices",
    icon: <CreditCard className="w-5 h-5" />,
    readTime: "4 min",
    tags: ["payments", "invoice", "receiving"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Recording Payments</h2>
        <ol className="list-decimal list-inside text-text-light space-y-2">
          <li>Open the invoice you want to record payment for</li>
          <li>
            Click the <strong>+ Add Payment</strong> button
          </li>
          <li>Enter the payment amount (partial or full)</li>
          <li>
            Select payment method: Cash, Bank, Mobile Money, or Credit Card
          </li>
          <li>Add reference number if applicable</li>
          <li>
            Click <strong>Save Payment</strong>
          </li>
        </ol>
        <p className="text-text-light">
          Payments will automatically update the invoice status and remaining
          balance.
        </p>
      </div>
    ),
  },
  {
    id: "invoice-status",
    title: "Understanding Invoice Statuses",
    description: "What each invoice status means",
    category: "invoices",
    icon: <AlertCircle className="w-5 h-5" />,
    readTime: "3 min",
    tags: ["status", "invoice", "workflow"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">
          Invoice Statuses Explained
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                Draft
              </span>
              <span className="text-sm text-text-light">
                Work in progress, not yet finalized
              </span>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                Quoted
              </span>
              <span className="text-sm text-text-light">
                Sent as a quote, awaiting acceptance
              </span>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary-10 text-primary rounded-full text-xs">
                Invoiced
              </span>
              <span className="text-sm text-text-light">
                Finalized and sent to customer
              </span>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                Partially
              </span>
              <span className="text-sm text-text-light">
                Partial payment received
              </span>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                Paid
              </span>
              <span className="text-sm text-text-light">Fully paid</span>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                Cancelled
              </span>
              <span className="text-sm text-text-light">Cancelled by user</span>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs">
                Overdue
              </span>
              <span className="text-sm text-text-light">
                Payment past due date
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Inventory ─────────────────────────────────────────────────────────────
  {
    id: "inventory-management",
    title: "Managing Inventory",
    description: "Track and manage your products efficiently",
    category: "inventory",
    icon: <Package className="w-5 h-5" />,
    readTime: "5 min",
    tags: ["inventory", "stock", "products"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">
          Inventory Management
        </h2>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Adding Products
            </h4>
            <p className="text-sm text-text-light mt-1">
              Click the <strong>Add Item</strong> button to create new products.
              Include details like name, part number, type, unit, cost, price,
              and reorder threshold.
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Stock Alerts
            </h4>
            <p className="text-sm text-text-light mt-1">
              Products with low stock (quantity ≤ reorder threshold) are
              highlighted in amber. Out-of-stock items are shown in red.
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              Stock Adjustments
            </h4>
            <p className="text-sm text-text-light mt-1">
              Use the <strong>+</strong> and <strong>-</strong> buttons on each
              product to quickly adjust stock levels. For bulk adjustments, use
              the edit feature.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "inventory-categories",
    title: "Product Categories & Types",
    description: "Organize your inventory with categories",
    category: "inventory",
    icon: <Filter className="w-5 h-5" />,
    readTime: "3 min",
    tags: ["categories", "types", "organization"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Organizing Products</h2>
        <p className="text-text-light">
          Products can be categorized by type for better organization and
          filtering:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border rounded-lg p-3">
            <span className="inline-block px-2 py-0.5 bg-primary-10 text-primary rounded-full text-xs">
              Hose
            </span>
            <p className="text-sm text-text-light mt-1">
              Hydraulic hoses and tubing
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
              Fitting
            </span>
            <p className="text-sm text-text-light mt-1">
              Connectors and adapters
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
              Ferrule
            </span>
            <p className="text-sm text-text-light mt-1">Crimping ferrules</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
              Adapter
            </span>
            <p className="text-sm text-text-light mt-1">Conversion adapters</p>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Customers ────────────────────────────────────────────────────────────
  {
    id: "customer-management",
    title: "Managing Customers",
    description: "Build and maintain your customer database",
    category: "customers",
    icon: <Users className="w-5 h-5" />,
    readTime: "4 min",
    tags: ["customers", "crm", "contacts"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Customer Management</h2>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Adding Customers</h4>
            <p className="text-sm text-text-light mt-1">
              Click <strong>Add Customer</strong> to create a new customer
              profile. Required fields include name, email, and phone number.
              You can also add address and tax ID information.
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Customer Insights</h4>
            <p className="text-sm text-text-light mt-1">
              Each customer profile shows their invoice history, total spent,
              outstanding balance, and recent transactions.
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Customer Status</h4>
            <p className="text-sm text-text-light mt-1">
              Customers can be marked as{" "}
              <span className="text-emerald-600">Active</span> or
              <span className="text-red-600"> Inactive</span>. Inactive
              customers won't appear in invoice creation dropdowns.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Suppliers ────────────────────────────────────────────────────────────
  {
    id: "supplier-management",
    title: "Managing Suppliers",
    description: "Keep track of your business suppliers",
    category: "suppliers",
    icon: <Truck className="w-5 h-5" />,
    readTime: "3 min",
    tags: ["suppliers", "vendors", "purchasing"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Supplier Management</h2>
        <p className="text-text-light">
          Maintain a comprehensive list of your suppliers to streamline
          purchasing and expense tracking.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Key Supplier Information</h4>
            <ul className="text-sm text-text-light space-y-1 mt-2">
              <li>• Company name and contact details</li>
              <li>• Tax ID and registration number</li>
              <li>• Address and location</li>
              <li>• Supplier status (Active/Inactive)</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Supplier Integration</h4>
            <p className="text-sm text-text-light mt-1">
              Suppliers are linked to expense tracking and inventory management
              for complete visibility of your business operations.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Expenses ─────────────────────────────────────────────────────────────
  {
    id: "expense-tracking",
    title: "Tracking Expenses",
    description: "Monitor your business spending",
    category: "expenses",
    icon: <DollarSign className="w-5 h-5" />,
    readTime: "5 min",
    featured: true,
    tags: ["expenses", "spending", "tracking"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Expense Tracking</h2>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Adding Expenses
            </h4>
            <p className="text-sm text-text-light mt-1">
              Click <strong>Add Expense</strong> to record a new expense.
              Include title, category, amount, date, and payment method.
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Expense Approval Workflow
            </h4>
            <p className="text-sm text-text-light mt-1">
              Expenses start as <span className="text-amber-600">Pending</span>.
              They can be marked as
              <span className="text-emerald-600"> Paid</span> once approved.
              Only pending expenses can be edited or deleted.
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Expense Analytics
            </h4>
            <p className="text-sm text-text-light mt-1">
              View spending trends by category and over time. The dashboard
              shows total expenses, paid vs pending amounts, and category
              breakdowns.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Team & Users ─────────────────────────────────────────────────────────
  {
    id: "user-management",
    title: "Managing Team Members",
    description: "Add and manage user accounts",
    category: "team",
    icon: <UserRound className="w-5 h-5" />,
    readTime: "4 min",
    tags: ["users", "team", "roles"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Team Management</h2>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Adding Users</h4>
            <p className="text-sm text-text-light mt-1">
              Navigate to <strong>Team</strong> and click{" "}
              <strong>Add User</strong>. Enter their details and assign a role.
            </p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">User Roles</h4>
            <ul className="text-sm text-text-light space-y-2 mt-2">
              <li>
                <span className="text-primary font-medium">Admin</span> - Manage
                all modules
              </li>
              <li>
                <span className="text-primary font-medium">Sales</span> - Create
                invoices and manage customers
              </li>
              <li>
                <span className="text-primary font-medium">
                  Inventory Manager
                </span>{" "}
                - Manage stock and products
              </li>
              <li>
                <span className="text-primary font-medium">Viewer</span> -
                Read-only access
              </li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">User Permissions</h4>
            <p className="text-sm text-text-light mt-1">
              Each role has specific permissions. Users can be activated or
              deactivated as needed.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Organisations ────────────────────────────────────────────────────────
  {
    id: "entity-management",
    title: "Managing Organisations",
    description: "Configure and manage business entities",
    category: "entities",
    icon: <Building2 className="w-5 h-5" />,
    readTime: "4 min",
    tags: ["entities", "organisations", "branches"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">
          Organisation Management
        </h2>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Creating Organisations</h4>
            <p className="text-sm text-text-light mt-1">
              Admins can create new organisations from the{" "}
              <strong>Organisations</strong> section. Each organisation has its
              own:
            </p>
            <ul className="text-sm text-text-light list-disc list-inside mt-1">
              <li>Name and contact details</li>
              <li>Address and location</li>
              <li>Tax and registration numbers</li>
              <li>Currency and settings</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">
              Assigning Users to Organisations
            </h4>
            <p className="text-sm text-text-light mt-1">
              Users can be assigned to one or multiple organisations. Each user
              has a primary organisation for default operations.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // ─── Settings ─────────────────────────────────────────────────────────────
  {
    id: "system-settings",
    title: "System Settings",
    description: "Configure your system preferences",
    category: "settings",
    icon: <Settings className="w-5 h-5" />,
    readTime: "3 min",
    tags: ["settings", "configuration", "preferences"],
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">
          System Configuration
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">General Settings</h4>
            <ul className="text-sm text-text-light space-y-1 mt-2">
              <li>• Organisation profile</li>
              <li>• Currency and tax settings</li>
              <li>• Invoice numbering and formatting</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-medium text-text">Security</h4>
            <ul className="text-sm text-text-light space-y-1 mt-2">
              <li>• User authentication</li>
              <li>• Password policies</li>
              <li>• Session management</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

const KnowledgeBase: React.FC = () => {
  usePageTitle("Knowledge Base");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  //eslint-disable-next-line

  // ── Filtered Articles ─────────────────────────────────────────────────────
  const filteredArticles = useMemo(() => {
    let articles = ARTICLES;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }

    // Filter by category
    if (selectedCategory) {
      articles = articles.filter((a) => a.category === selectedCategory);
    }

    return articles;
  }, [searchQuery, selectedCategory]);

  // ── Featured Articles ─────────────────────────────────────────────────────
  const featuredArticles = useMemo(() => {
    return ARTICLES.filter((a) => a.featured);
  }, []);

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    // On mobile, scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSelectedArticle(null);
  };

  // ── Copy Link ─────────────────────────────────────────────────────────────
  //   const [copied, setCopied] = useState(false);
  //   const handleCopyLink = useCallback((articleId: string) => {
  //     const url = `${window.location.origin}/knowledge-base/${articleId}`;
  //     navigator.clipboard.writeText(url);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 2000);
  //   }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Knowledge Base</h2>
          <p className="text-text-light text-sm">
            Learn how to use the system effectively
          </p>
        </div>
        <div className="flex min-w-[200px]">
            <Input
          label="Search articles"
          type="search"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(value: string) => setSearchQuery(value)}
        />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedArticle ? (
          // ─── Article Detail View ──────────────────────────────────────────
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 py-6">
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-text-light hover:text-primary transition-colors mb-4"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to articles
              </button>

              {/* Article header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-text-light mb-2">
                  <span className="px-2 py-0.5 bg-primary-10 text-primary rounded-full text-xs">
                    {selectedArticle.category}
                  </span>
                  <span>•</span>
                  <span>{selectedArticle.readTime} read</span>
                </div>
                <h1 className="text-2xl font-bold text-text">
                  {selectedArticle.title}
                </h1>
                <p className="text-text-light mt-1">
                  {selectedArticle.description}
                </p>
              </div>

              {/* Article content */}
              <div className="bg-card border border-border rounded-lg p-6">
                {selectedArticle.content}
              </div>

              {/* Tags */}
              {selectedArticle.tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-text mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 bg-background border border-border rounded-full text-xs text-text-light"
                        onClick={() => {
                          setSearchQuery(tag);
                          handleBack();
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ─── Categories & Articles List View ────────────────────────────
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 py-6">
              {/* Featured Articles */}
              {!searchQuery && !selectedCategory && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-text mb-3">
                    Featured Articles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredArticles.map((article) => (
                      <div
                        key={article.id}
                        className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleArticleSelect(article)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary-10 rounded-lg text-primary">
                            {article.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-text truncate">
                              {article.title}
                            </h3>
                            <p className="text-sm text-text-light line-clamp-2 mt-1">
                              {article.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-text-light">
                                {article.readTime}
                              </span>
                              <span className="text-xs text-text-light">•</span>
                              <span className="text-xs px-2 py-0.5 bg-primary-10 text-primary rounded-full">
                                {article.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories & Articles */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-0">
                    <h3 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">
                      Categories
                    </h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          !selectedCategory
                            ? "bg-primary-10 text-primary font-medium"
                            : "text-text hover:bg-background"
                        }`}
                      >
                        All Topics
                      </button>
                      {CATEGORIES.map((category) => {
                        const articleCount = ARTICLES.filter(
                          (a) => a.category === category.id,
                        ).length;
                        if (articleCount === 0) return null;
                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                              selectedCategory === category.id
                                ? "bg-primary-10 text-primary font-medium"
                                : "text-text hover:bg-background"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {category.icon}
                              <span>{category.name}</span>
                            </span>
                            <span className="text-xs text-text-light">
                              {articleCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Articles List */}
                <div className="lg:col-span-3">
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-text-light mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-semibold text-text">
                        No articles found
                      </h3>
                      <p className="text-text-light mt-1">
                        Try adjusting your search or filter criteria
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory(null);
                        }}
                        className="mt-3 text-primary hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredArticles.map((article) => (
                        <div
                          key={article.id}
                          className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleArticleSelect(article)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary-10 rounded-lg text-primary flex-shrink-0">
                              {article.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-text">
                                  {article.title}
                                </h3>
                                <span className="text-xs text-text-light flex-shrink-0">
                                  {article.readTime}
                                </span>
                              </div>
                              <p className="text-sm text-text-light mt-1">
                                {article.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-xs px-2 py-0.5 bg-primary-10 text-primary rounded-full">
                                  {article.category}
                                </span>
                                {article.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 bg-background border border-border rounded-full text-text-light"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {article.tags.length > 2 && (
                                  <span className="text-xs text-text-light">
                                    +{article.tags.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-light flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
