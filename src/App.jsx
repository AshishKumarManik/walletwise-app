import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusCircle, LayoutDashboard, User, Trash2, Smartphone, Mail, Camera, Loader2, Map, Sun, Moon, Briefcase, Sheet, Cloud, CloudOff, RefreshCw, CalendarDays, Edit, MapPin } from 'lucide-react';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';

const COLORS = ['#7C1828', '#9B2236', '#B83B4E', '#C48B8B', '#D1BFA5', '#E3D8C3'];
const CATEGORIES = ['Food', 'Travel', 'Fuel', 'Grocery', 'Recharge', 'Other'];
const PAYMENT_MODES = ['UPI', 'Card', 'Cash'];
const API_URL = 'http://localhost:5000/api/expenses';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [year, month, day] = dateStr.split('-');
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [syncStatus, setSyncStatus] = useState('syncing'); 
  const isFirstLoad = useRef(true);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('expenseProfile');
    return saved ? JSON.parse(saved) : { type: 'Student', monthlyIncome: '' };
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses');
    if (saved) return JSON.parse(saved);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return [
      { id: 1, amount: 2500, category: 'Travel', mode: 'UPI', date: lastMonth.toISOString().split('T')[0], time: '10:00', description: 'Train tickets' },
      { id: 2, amount: 1200, category: 'Food', mode: 'Cash', date: lastMonth.toISOString().split('T')[0], time: '14:30', description: 'Lunch' }
    ];
  });

  const [newExpense, setNewExpense] = useState({
    amount: '', category: 'Food', mode: 'UPI', date: '', time: '', description: ''
  });

  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('trips');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "120-Day Solo Rail Trip (28 States)", budget: 150000, startDate: "2027-01-01", isAuditTrip: false, expenses: [], isActive: false }
    ];
  });

  const [newTrip, setNewTrip] = useState({ name: '', budget: '', startDate: '', isAuditTrip: false });
  const [editingTripId, setEditingTripId] = useState(null);

  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        setSyncStatus('syncing');
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          if (data.profile) setProfile(data.profile);
          if (data.expenses) setExpenses(data.expenses);
          if (data.trips) setTrips(data.trips);
          setSyncStatus('synced');
        } else {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        setSyncStatus('error');
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        const savedTrips = localStorage.getItem('trips');
        if (savedTrips) setTrips(JSON.parse(savedTrips));
      }
    };
    fetchCloudData();
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('expenseProfile', JSON.stringify(profile));
    localStorage.setItem('trips', JSON.stringify(trips));

    const syncToCloud = async () => {
      setSyncStatus('syncing');
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, expenses, trips })
        });
        if (response.ok) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (error) {
        setSyncStatus('error');
      }
    };

    const syncTimeout = setTimeout(syncToCloud, 1000);
    return () => clearTimeout(syncTimeout);
  }, [expenses, profile, trips]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  useEffect(() => {
    if (activeTab === 'add') {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now - offset)).toISOString().slice(0, -1);
      
      setNewExpense(prev => ({
        ...prev,
        date: localISOTime.split('T')[0],
        time: localISOTime.split('T')[1].substring(0, 5)
      }));
    }
  }, [activeTab]);

  const activeTrip = trips.find(t => t.isActive);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.amount) return;
    
    const expenseData = { ...newExpense, id: Date.now(), amount: parseFloat(newExpense.amount) };

    if (activeTrip) {
      setTrips(trips.map(t => 
        t.id === activeTrip.id ? { ...t, expenses: [expenseData, ...t.expenses] } : t
      ));
    } else {
      setExpenses([expenseData, ...expenses]);
    }
    
    setNewExpense({ amount: '', category: 'Food', mode: 'UPI', date: '', time: '', description: '' });
    setActiveTab('dashboard');
  };

  const deleteExpense = (id) => {
    if (activeTrip) {
      setTrips(trips.map(t => 
        t.id === activeTrip.id ? { ...t, expenses: t.expenses.filter(e => e.id !== id) } : t
      ));
    } else {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const handleAddTrip = (e) => {
    e.preventDefault();
    if (!newTrip.name || !newTrip.startDate) return;
    
    if (editingTripId) {
      setTrips(trips.map(t => 
        t.id === editingTripId 
          ? { ...t, name: newTrip.name, budget: parseFloat(newTrip.budget) || 0, startDate: newTrip.startDate, isAuditTrip: newTrip.isAuditTrip } 
          : t
      ));
      setEditingTripId(null);
    } else {
      const newTripData = {
        id: Date.now(),
        name: newTrip.name,
        budget: parseFloat(newTrip.budget) || 0,
        startDate: newTrip.startDate,
        isAuditTrip: newTrip.isAuditTrip,
        expenses: [],
        isActive: false
      };
      setTrips([...trips, newTripData]);
    }
    setNewTrip({ name: '', budget: '', startDate: '', isAuditTrip: false });
  };

  const handleEditTrip = (trip) => {
    setEditingTripId(trip.id);
    setNewTrip({ name: trip.name, budget: trip.budget, startDate: trip.startDate, isAuditTrip: trip.isAuditTrip || false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTripId(null);
    setNewTrip({ name: '', budget: '', startDate: '', isAuditTrip: false });
  };

  const toggleTripActive = (tripId) => {
    setTrips(trips.map(t => {
      if (t.id === tripId) {
        return { ...t, isActive: !t.isActive };
      }
      return { ...t, isActive: false };
    }));
  };

  const deleteTrip = (tripId) => {
    if (window.confirm("Are you sure you want to delete this trip? All tracked expenses inside it will be lost.")) {
      setTrips(trips.filter(t => t.id !== tripId));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      const amounts = text.match(/\d+\.\d{2}/g);
      if (amounts && amounts.length > 0) {
        const maxAmount = Math.max(...amounts.map(Number));
        setNewExpense(prev => ({ ...prev, amount: maxAmount }));
      } else {
        alert("Couldn't automatically detect an amount. Please enter it manually.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to scan receipt.");
    }
    setIsScanning(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          const city = data.address.city || data.address.state_district || data.address.town || data.address.county || "Unknown City";
          const state = data.address.state || "";
          const locationTag = `[${city}, ${state}]`;
          
          setNewExpense(prev => ({ 
            ...prev, 
            description: prev.description ? `${prev.description} ${locationTag}` : locationTag 
          }));
        } catch (error) {
          console.error("Error fetching location:", error);
          alert("Failed to get location details.");
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Please allow location access in your browser settings to use this feature.");
        setIsLocating(false);
      }
    );
  };

  const displayExpenses = activeTrip ? activeTrip.expenses : expenses;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = displayExpenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const previousMonthExpenses = displayExpenses.filter(e => {
    const d = new Date(e.date);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const totalCurrentMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPreviousMonth = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const pieData = CATEGORIES.map(cat => ({
    name: cat,
    value: currentMonthExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(d => d.value > 0);

  const barData = [
    { name: 'Last Month', amount: totalPreviousMonth },
    { name: 'This Month', amount: totalCurrentMonth }
  ];

  const handleShare = (method) => {
    const report = `Expense Report - This Month\nTotal Spent: ₹${totalCurrentMonth}\nIncome: ₹${profile.monthlyIncome || 0}\n\nTop Categories:\n` + 
      pieData.map(d => `${d.name}: ₹${d.value}`).join('\n');
    
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
    } else if (method === 'email') {
      window.open(`mailto:?subject=Monthly Expense Report&body=${encodeURIComponent(report)}`, '_blank');
    }
  };

  const exportToExcel = () => {
    if (currentMonthExpenses.length === 0) return alert("No expenses to export!");
    const data = currentMonthExpenses.map(exp => ({
      Date: formatDate(exp.date), 
      Time: exp.time, 
      Category: exp.category, 
      Mode: exp.mode, 
      Amount: exp.amount, 
      Note: exp.description || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, `Monthly_Expense_Report.xlsx`);
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text pb-20 font-sans transition-colors duration-300">
      
      <header className="bg-theme-card text-theme-text p-4 shadow-lg border-b border-theme-border sticky top-0 z-10 flex justify-between items-center transition-colors duration-300">
        <div className="flex items-center gap-2">
          {syncStatus === 'synced' && <Cloud size={18} className="text-green-500" />}
          {syncStatus === 'syncing' && <RefreshCw size={18} className="text-theme-accent animate-spin" />}
          {syncStatus === 'error' && <CloudOff size={18} className="text-red-500" title="Offline - Saving Locally" />}
        </div>
        <h1 className="text-xl font-bold tracking-wide">
          {activeTrip ? 'Travel Tracker' : 'WalletWise'}
        </h1>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-8 h-8 flex items-center justify-center text-theme-accent hover:opacity-80 transition-opacity">
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-fade-in">
            {activeTrip && (
              <div className="bg-theme-accent/20 border border-theme-accent rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-theme-accent text-xs font-bold uppercase tracking-wider">Currently Tracking: {activeTrip.name}</p>
                  {activeTrip.isAuditTrip && (
                    <span className="flex items-center gap-1 bg-theme-accent/30 text-theme-accent text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider">
                      <Briefcase size={10} /> AUDIT
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-theme-muted mt-1 flex items-center justify-center gap-1">
                  <CalendarDays size={12} /> Starts: {formatDate(activeTrip.startDate)}
                </p>
              </div>
            )}
            
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-colors">
              <div className="absolute right-0 top-0 w-24 h-24 bg-theme-accent/20 rounded-full blur-2xl"></div>
              <h2 className="text-theme-muted text-xs uppercase tracking-wider font-semibold">
                {activeTrip ? 'Trip Spend' : "This Month's Spend"}
              </h2>
              <p className="text-4xl font-extrabold text-theme-accent mt-1">₹{totalCurrentMonth}</p>
              <div className={`text-sm mt-3 font-semibold flex items-center gap-1 ${totalCurrentMonth > totalPreviousMonth ? 'text-red-500' : 'text-green-600'}`}>
                <span>{totalCurrentMonth > totalPreviousMonth ? '▲' : '▼'}</span> 
                <span>₹{Math.abs(totalCurrentMonth - totalPreviousMonth)} vs last month</span>
              </div>
            </div>

<div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors">
              <h3 className="font-bold text-sm text-theme-muted uppercase tracking-wider mb-4">Where your money goes</h3>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} stroke="var(--card-color)" strokeWidth={2} label={({name}) => name}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card-color)', borderColor: 'var(--border-color)', color: 'var(--text-main)', borderRadius: '12px' }} formatter={(value) => `₹${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-theme-muted py-12 text-sm italic">No expenses logged yet</p>
              )}
            </div>

            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors">
              <h3 className="font-bold text-sm text-theme-muted uppercase tracking-wider mb-4">Month over Month</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} fontSize={12} />
                    <YAxis stroke="var(--text-muted)" tickLine={false} fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card-color)', borderColor: 'var(--border-color)', color: 'var(--text-main)', borderRadius: '12px' }} formatter={(value) => `₹${value}`} />
                    <Bar dataKey="amount" fill="var(--accent-color)" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 1 ? 'var(--text-main)' : 'var(--accent-color)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors">
              <h3 className="font-bold text-sm text-theme-muted uppercase tracking-wider mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {currentMonthExpenses.length > 0 ? (
                  currentMonthExpenses.slice(0, 5).map(expense => (
                    <div key={expense.id} className="flex justify-between items-center border-b border-theme-border pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-theme-text">{expense.category}</p>
                        <p className="text-xs text-theme-muted">{formatDate(expense.date)} • {expense.mode}</p>                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-theme-accent">₹{expense.amount}</p>
                        <button onClick={() => deleteExpense(expense.id)} className="text-theme-muted hover:text-red-500 p-1 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-theme-muted py-4 text-sm italic">You haven't logged any transactions yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg animate-fade-in transition-colors">
            <div className="flex justify-between items-center border-b border-theme-border pb-3 mb-5">
              <h2 className="text-xl font-bold text-theme-text tracking-wide">Log Expense</h2>
              
              <label className="cursor-pointer bg-theme-bg border border-theme-border hover:opacity-80 p-2 rounded-lg transition-all flex items-center gap-2">
                {isScanning ? <Loader2 className="animate-spin text-theme-accent" size={18} /> : <Camera size={18} className="text-theme-accent" />}
                <span className="text-xs font-semibold text-theme-text">{isScanning ? 'Scanning...' : 'Scan Receipt'}</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Amount (₹)</label>
                <input type="number" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" placeholder="0.00" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Purpose / Category</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Mode of Payment</label>
                <div className="flex gap-2">
                  {PAYMENT_MODES.map(mode => (
                    <button type="button" key={mode} onClick={() => setNewExpense({...newExpense, mode})} className={`flex-1 py-2.5 rounded-xl border font-bold transition-all ${newExpense.mode === mode ? 'bg-theme-accent text-theme-bg border-theme-accent shadow-lg' : 'bg-theme-bg text-theme-muted border-theme-border hover:opacity-80'}`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Date</label>
                  <input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Time</label>
                  <input type="time" required value={newExpense.time} onChange={e => setNewExpense({...newExpense, time: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold">Note (Optional)</label>
                  <button type="button" onClick={handleGetLocation} disabled={isLocating} className="text-[10px] flex items-center gap-1 text-theme-accent hover:opacity-80 transition-opacity font-bold">
                    {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                    {isLocating ? 'Locating...' : 'Tag Location'}
                  </button>
                </div>
                <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" placeholder="What was this for?" />
              </div>

              <button type="submit" className="w-full bg-theme-accent hover:opacity-90 text-theme-bg p-3.5 rounded-xl font-bold transition-all mt-6 shadow-lg shadow-theme-accent/20">
                Save Expense
              </button>
            </form>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors">
              <h2 className="text-xl font-bold mb-4 text-theme-text tracking-wide border-b border-theme-border pb-3">Manage Trips</h2>
              
              <form onSubmit={handleAddTrip} className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Trip Name</label>
                  <input type="text" required value={newTrip.name} onChange={e => setNewTrip({...newTrip, name: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" placeholder="e.g., Goa Trip" />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Total Budget (₹)</label>
                    <input type="number" required value={newTrip.budget} onChange={e => setNewTrip({...newTrip, budget: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" placeholder="0" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Start Date</label>
                    <input type="date" required value={newTrip.startDate} onChange={e => setNewTrip({...newTrip, startDate: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" />
                  </div>
                </div>

                <label className="flex items-center gap-3 mt-4 text-theme-text text-sm font-bold cursor-pointer p-2 rounded-xl hover:bg-theme-bg transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newTrip.isAuditTrip}
                    onChange={e => setNewTrip({...newTrip, isAuditTrip: e.target.checked})}
                    className="w-5 h-5 accent-theme-accent rounded cursor-pointer"
                  />
                  Flag as Audit / Business Trip
                </label>

                <div className="flex gap-3 mt-2">
                  <button type="submit" className="flex-1 bg-theme-accent hover:opacity-90 text-theme-bg p-3 rounded-xl font-bold transition-all shadow-lg">
                    {editingTripId ? 'Update Trip' : 'Create Trip'}
                  </button>
                  {editingTripId && (
                    <button type="button" onClick={handleCancelEdit} className="flex-1 bg-theme-bg border border-theme-border hover:opacity-80 text-theme-text p-3 rounded-xl font-bold transition-all shadow-lg">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-theme-muted uppercase tracking-wider mb-3">Your Trips</h3>
                {trips.length > 0 ? trips.map(trip => {
                  const tripTotal = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={trip.id} className={`border rounded-xl p-4 transition-colors ${trip.isActive ? 'bg-theme-accent/10 border-theme-accent' : 'bg-theme-bg border-theme-border'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-theme-text">{trip.name}</p>
                            {trip.isAuditTrip && (
                              <span className="flex items-center gap-1 bg-theme-accent/20 text-theme-accent text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider">
                                <Briefcase size={10} /> AUDIT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-theme-muted mt-1">
                            Budget: ₹{trip.budget} <span className="mx-1">•</span> Starts: {formatDate(trip.startDate)}
                          </p>
                        </div>
                        <button onClick={() => toggleTripActive(trip.id)} className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${trip.isActive ? 'bg-theme-accent text-theme-bg shadow-lg shadow-theme-accent/20' : 'bg-theme-card border border-theme-border text-theme-text hover:opacity-80'}`}>
                          {trip.isActive ? 'Active' : 'Turn On'}
                        </button>
                      </div>
                      
                      <div className="w-full bg-theme-card rounded-full h-1.5 mt-3">
                        <div className="bg-theme-accent h-1.5 rounded-full" style={{ width: `${Math.min((tripTotal / (trip.budget || 1)) * 100, 100)}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-theme-border border-dashed">
                        <div className="text-[10px] text-theme-muted">Spent: ₹{tripTotal}</div>
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleEditTrip(trip)} className="flex items-center gap-1 text-blue-500 hover:opacity-80 transition-opacity text-[10px] font-bold">
                            <Edit size={12} /> Edit
                          </button>
                          <button onClick={() => deleteTrip(trip.id)} className="flex items-center gap-1 text-red-500 hover:opacity-80 transition-opacity text-[10px] font-bold">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-theme-muted py-4 text-sm italic">No trips added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors">
              <h2 className="text-xl font-bold mb-4 text-theme-text tracking-wide border-b border-theme-border pb-3">Your Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Status</label>
                  <select value={profile.type} onChange={e => setProfile({...profile, type: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors">
                    <option value="Student">Student</option>
                    <option value="Salaried">Salaried Employee</option>
                    <option value="Self-Employed">Self-Employed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-theme-muted font-semibold mb-1">Monthly Income / Budget (₹)</label>
                  <input type="number" value={profile.monthlyIncome} onChange={e => setProfile({...profile, monthlyIncome: e.target.value})} className="w-full bg-theme-bg border border-theme-border text-theme-text p-3 rounded-xl focus:ring-2 focus:ring-theme-accent outline-none transition-colors" placeholder="e.g. 50000" />
                </div>
              </div>
            </div>

            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors">
              <h3 className="font-bold text-sm text-theme-muted uppercase tracking-wider mb-2">Share Report</h3>
              <p className="text-xs text-theme-muted mb-5">Send your current month's expense summary to someone instantly.</p>
              
              <div className="flex gap-3">
                <button onClick={() => handleShare('whatsapp')} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-xl font-bold transition-colors shadow-lg">
                  <Smartphone size={18} /> WhatsApp
                </button>
                <button onClick={() => handleShare('email')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition-colors shadow-lg">
                  <Mail size={18} /> Email
                </button>
              </div>
            </div>

            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors">
              <h3 className="font-bold text-sm text-theme-muted uppercase tracking-wider mb-2">Export Data</h3>
              <p className="text-xs text-theme-muted mb-5">Download your current month's expenses as a file.</p>
              
              <div className="flex gap-3">
                <button onClick={exportToExcel} className="w-full flex items-center justify-center gap-2 bg-[#107C41] hover:bg-green-700 text-white p-3.5 rounded-xl font-bold transition-colors shadow-lg">
                  <Sheet size={18} /> Excel
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      <nav className="fixed bottom-0 w-full bg-theme-card border-t border-theme-border flex justify-around p-3 pb-safe z-10 shadow-2xl transition-colors duration-300">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 transition-all ${activeTab === 'dashboard' ? 'text-theme-accent scale-105' : 'text-theme-muted hover:text-theme-text'}`}>
          <LayoutDashboard size={22} className={activeTab === 'dashboard' ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Dashboard</span>
        </button>
        <button onClick={() => setActiveTab('add')} className={`flex flex-col items-center p-2 transition-all ${activeTab === 'add' ? 'text-theme-accent scale-105' : 'text-theme-muted hover:text-theme-text'}`}>
          <PlusCircle size={24} className={activeTab === 'add' ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Add</span>
        </button>
        <button onClick={() => setActiveTab('trips')} className={`flex flex-col items-center p-2 transition-all ${activeTab === 'trips' ? 'text-theme-accent scale-105' : 'text-theme-muted hover:text-theme-text'}`}>
          <Map size={22} className={activeTab === 'trips' ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Trips</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 transition-all ${activeTab === 'profile' ? 'text-theme-accent scale-105' : 'text-theme-muted hover:text-theme-text'}`}>
          <User size={22} className={activeTab === 'profile' ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Profile</span>
        </button>
      </nav>
    </div>
  );
}