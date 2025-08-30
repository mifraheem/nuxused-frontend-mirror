import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, FileText, DollarSign, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock API base URL - replace with actual API URL
  const API_BASE = '{{api}}';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock data based on provided API responses
      const subscriptionData = {
        id: "069b63cb-a829-4f5c-b55c-72ff15fe4a90",
        status: "active",
        plan_name: "Monthly",
        pricing_type: "fixed",
        amount: "500.00",
        currency: "PKR",
        start_date: "2025-08-26",
        current_period_start: "2025-08-26",
        current_period_end: "2025-08-29",
        trial_end: null,
        cancel_at_period_end: false,
        proration: true,
        days_left: -1
      };

      const walletData = {
        id: "77429c30-ec1f-4b73-9348-ce7ae8dbc0cb",
        balance: "500.00",
        note: "Your wallet balance can fully cover the next invoice."
      };

      const invoicesData = [
        {
          id: "87cb157f-a6c5-40e0-9da3-86e44b96d8c7",
          period_start: "2025-08-26",
          period_end: "2025-09-26",
          amount_due: "0.00",
          amount_paid: "500.00",
          amount_remaining: "0.00",
          currency: "PKR",
          status: "open",
          due_date: "2025-08-26",
          notes: ""
        }
      ];

      const paymentsData = [
        {
          id: "1df39a05-cb6d-4eef-9c58-24da0028cddf",
          amount: "500.00",
          currency: "PKR",
          method: "bank_transfer",
          received_at: "2025-08-26T20:06:44.947006+05:00",
          reference: null,
          notes: "",
          applied_target: "charge:87cb157f-a6c5-40e0-9da3-86e44b96d8c7"
        }
      ];

      setSubscription(subscriptionData);
      setWallet(walletData);
      setInvoices(invoicesData);
      setPayments(paymentsData);
      
      /* Uncomment to use actual API calls:
      const [subRes, walletRes, invoicesRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE}/api/billing/subscription/`),
        fetch(`${API_BASE}/api/billing/wallet/`),
        fetch(`${API_BASE}/api/billing/invoices/?page=1&page_size=10`),
        fetch(`${API_BASE}/api/billing/payments/?page=1&page_size=10`)
      ]);

      const subData = await subRes.json();
      const walletData = await walletRes.json();
      const invoicesData = await invoicesRes.json();
      const paymentsData = await paymentsRes.json();

      setSubscription(subData.data);
      setWallet(walletData.data);
      setInvoices(invoicesData.results);
      setPayments(paymentsData.results);
      */
      
    } catch (err) {
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'open':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            onClick={fetchData}
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
          <h1 className="text-3xl font-bold  mb-2">Subscription Management</h1>
          <p className="text-gray-200">Manage your subscription, view billing history, and track payments</p>
        </div>

        {/* Current Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
                Current Subscription
              </h2>
              <div className="flex items-center">
                {getStatusIcon(subscription?.status)}
                <span className="ml-2 text-sm font-medium capitalize text-gray-700">
                  {subscription?.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="text-lg font-semibold text-gray-800">{subscription?.plan_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {subscription?.currency} {subscription?.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Billing Period</p>
                  <p className="text-sm text-gray-800">
                    {formatDate(subscription?.current_period_start)} - {formatDate(subscription?.current_period_end)}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="text-sm text-gray-800">{formatDate(subscription?.start_date)}</p>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Wallet className="w-6 h-6 mr-2 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Wallet Balance</h2>
            </div>
            
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-green-600 mb-2">
                PKR {wallet?.balance}
              </p>
              <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                {wallet?.note}
              </p>
            </div>
            
            {/* <button className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
              Add Funds
            </button> */}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="w-6 h-6 mr-2 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">Recent Invoices</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount Due</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount Paid</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-800">
                          {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-800 font-medium">
                        {invoice.currency} {invoice.amount_due}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-600 font-medium">
                        {invoice.currency} {invoice.amount_paid}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {getStatusIcon(invoice.status)}
                        <span className="ml-2 text-sm capitalize">{invoice.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(invoice.due_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <DollarSign className="w-6 h-6 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
          </div>
          
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="font-medium text-gray-800">
                        Payment Received - {payment.currency} {payment.amount}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Method:</span> {payment.method.replace('_', ' ').toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Received:</span> {formatDateTime(payment.received_at)}
                      </div>
                      <div>
                        <span className="font-medium">Applied to:</span> {payment.applied_target}
                      </div>
                    </div>
                    
                    {payment.reference && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Reference:</span> {payment.reference}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;