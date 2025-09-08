import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Wallet,
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import Cookies from "js-cookie";

const API_BASE = import.meta.env.VITE_SERVER_URL ;

/* ----------------------------- HTTP LAYER ----------------------------- */
const makeHeaders = () => {
  const token =
    Cookies.get("access_token") || localStorage.getItem("access_token");
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

// Minimal fetch wrapper that understands your CustomResponse + paginated lists
async function http(url) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: makeHeaders(),
    credentials: "include",
  });

  // Handle non-2xx early
  if (!res.ok) {
    // Try to read error body for message
    let msg = `Request failed (${res.status})`;
    try {
      const e = await res.json();
      msg = e?.message || msg;
    } catch (_) {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  // Parse JSON
  const json = await res.json().catch(() => ({}));

  // Many of your endpoints return { data: ... } or { results: [...] }
  // Normalize here so the UI code stays small.
  if (json?.data !== undefined) return json.data;
  if (json?.results !== undefined) return json.results;
  return json;
}

/* ------------------------------- UI ---------------------------------- */
const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    try {
      setError(null);
      setLoading(true);

      // Adjust paths if your router is different (e.g. `/api/business/...`)
      const [sub, wlt, invs, pays] = await Promise.all([
        http("api/billing/subscription/"),
        http("api/billing/wallet/"),
        http("api/billing/invoices/"),
        http("api/billing/payments/"),
      ]);

      setSubscription(sub || null);
      setWallet(wlt || null);
      setInvoices(Array.isArray(invs) ? invs : invs?.results || []);
      setPayments(Array.isArray(pays) ? pays : pays?.results || []);
    } catch (e) {
      // Helpful message for 401s
      if (e?.status === 401) {
        setError("You are not authorized. Please login again.");
      } else {
        setError(e?.message || "Failed to load subscription data");
      }
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "open":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const safeDate = (v) => (v ? new Date(v) : null);

  const formatDate = (dateString) => {
    const d = safeDate(dateString);
    if (!d) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    const d = safeDate(dateString);
    if (!d) return "—";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAll}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 bg-blue-900 text-white py-3 px-4 sm:px-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-gray-200">
            Manage your subscription, view billing history, and track payments
          </p>
        </div>

        {/* Current Subscription + Wallet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Subscription */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
                Current Subscription
              </h2>
              <div className="flex items-center">
                {getStatusIcon(subscription?.status)}
                <span className="ml-2 text-sm font-medium capitalize text-gray-700">
                  {subscription?.status || "—"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="text-lg font-semibold text-gray-800">
                  {subscription?.plan_name || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {(subscription?.currency || "PKR") +
                      " " +
                      (subscription?.amount ?? "—")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Billing Period</p>
                  <p className="text-sm text-gray-800">
                    {formatDate(subscription?.current_period_start)} —{" "}
                    {formatDate(subscription?.current_period_end)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="text-sm text-gray-800">
                  {formatDate(subscription?.start_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Wallet className="w-6 h-6 mr-2 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Wallet Balance
              </h2>
            </div>

            <div className="text-center py-4">
              <p className="text-3xl font-bold text-green-600 mb-2">
                {(wallet?.currency || "PKR") + " " + (wallet?.balance ?? "0.00")}
              </p>
              {wallet?.note && (
                <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                  {wallet.note}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="w-6 h-6 mr-2 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Invoices
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Period
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Amount Due
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Amount Paid
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {(invoices || []).map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-800">
                          {formatDate(invoice.period_start)} —{" "}
                          {formatDate(invoice.period_end)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-800 font-medium">
                        {(invoice.currency || "PKR") +
                          " " +
                          (invoice.amount_due ?? "0.00")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-600 font-medium">
                        {(invoice.currency || "PKR") +
                          " " +
                          (invoice.amount_paid ?? "0.00")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {getStatusIcon(invoice.status)}
                        <span className="ml-2 text-sm capitalize">
                          {invoice.status || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(invoice.due_date)}
                    </td>
                  </tr>
                ))}
                {(!invoices || invoices.length === 0) && (
                  <tr>
                    <td className="py-6 px-4 text-gray-500" colSpan={5}>
                      No invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <DollarSign className="w-6 h-6 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Payment History
            </h2>
          </div>

          <div className="space-y-4">
            {(payments || []).map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="font-medium text-gray-800">
                        Payment Received — {(payment.currency || "PKR") +
                          " " +
                          (payment.amount ?? "0.00")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Method:</span>{" "}
                        {(payment.method || "")
                          .replace("_", " ")
                          .toUpperCase() || "—"}
                      </div>
                      <div>
                        <span className="font-medium">Received:</span>{" "}
                        {formatDateTime(payment.received_at)}
                      </div>
                      <div>
                        <span className="font-medium">Applied to:</span>{" "}
                        {payment.applied_target || "—"}
                      </div>
                    </div>

                    {payment.reference && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Reference:</span>{" "}
                        {payment.reference}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!payments || payments.length === 0) && (
              <div className="text-sm text-gray-500">No payments yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
