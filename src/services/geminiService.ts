import { GoogleGenAI, Type } from "@google/genai";
import { Sale, Expense, Task, SavingsEntry, Client } from "../types";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface AIInsightsData {
  summary: {
    totalSalesToday: number;
    totalExpensesToday: number;
    profitToday: number;
    topService: string;
    topClient: string;
    pendingTasksCount: number;
    savingsProgress: number;
  };
  recommendations: {
    title: string;
    description: string;
    type: 'expense' | 'client' | 'service' | 'general';
  }[];
  highlights: {
    bestPerformingDay: string;
    bestClient: string;
    highestRevenueService: string;
  };
  analysis: string;
}

export async function generateBusinessSummary(): Promise<AIInsightsData> {
  // Fetch data from Firebase
  const [salesSnap, expensesSnap, tasksSnap, savingsSnap, clientsSnap] = await Promise.all([
    getDocs(collection(db, 'sales')),
    getDocs(collection(db, 'expenses')),
    getDocs(collection(db, 'tasks')),
    getDocs(collection(db, 'savings')),
    getDocs(collection(db, 'clients'))
  ]);

  const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
  const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
  const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
  const savings = savingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingsEntry[];
  const clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];

  const today = new Date().toISOString().split('T')[0];
  
  const salesToday = sales.filter(s => s.date === today);
  const expensesToday = expenses.filter(e => e.date === today);
  
  const totalSalesToday = salesToday.reduce((sum, s) => sum + s.amount, 0);
  const totalExpensesToday = expensesToday.reduce((sum, e) => sum + e.amount, 0);
  
  const pendingTasks = tasks.filter(t => !t.completed);
  
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();
  const currentSavings = savings.find(s => s.month === `${currentMonth} ${currentYear}`);
  const savingsProgress = currentSavings ? (currentSavings.savedAmount / currentSavings.targetAmount) * 100 : 0;

  const prompt = `
    Analyze the following business data for LisTrack dashboard and provide strategic insights.
    
    Data Summary:
    - Total Sales: ${sales.length} records
    - Total Expenses: ${expenses.length} records
    - Total Tasks: ${tasks.length} records (${pendingTasks.length} pending)
    - Total Clients: ${clients.length} records
    
    Recent Sales (last 10): ${JSON.stringify(sales.slice(-10))}
    Recent Expenses (last 10): ${JSON.stringify(expenses.slice(-10))}
    Clients: ${JSON.stringify(clients.map(c => ({ name: c.name, status: c.status, service: c.service })))}
    
    Today's Stats:
    - Sales: $${totalSalesToday}
    - Expenses: $${totalExpensesToday}
    
    Provide:
    1. A summary of today's performance.
    2. 3-5 actionable recommendations focusing on reducing expenses, contacting inactive clients, and focusing on profitable services.
    3. Highlights including the best performing day (based on history), the best client (most revenue), and the highest revenue service.
    4. A brief overall business analysis.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.OBJECT,
            properties: {
              totalSalesToday: { type: Type.NUMBER },
              totalExpensesToday: { type: Type.NUMBER },
              profitToday: { type: Type.NUMBER },
              topService: { type: Type.STRING },
              topClient: { type: Type.STRING },
              pendingTasksCount: { type: Type.NUMBER },
              savingsProgress: { type: Type.NUMBER },
            },
            required: ["totalSalesToday", "totalExpensesToday", "profitToday", "topService", "topClient", "pendingTasksCount", "savingsProgress"],
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["expense", "client", "service", "general"] },
              },
              required: ["title", "description", "type"],
            },
          },
          highlights: {
            type: Type.OBJECT,
            properties: {
              bestPerformingDay: { type: Type.STRING },
              bestClient: { type: Type.STRING },
              highestRevenueService: { type: Type.STRING },
            },
            required: ["bestPerformingDay", "bestClient", "highestRevenueService"],
          },
          analysis: { type: Type.STRING },
        },
        required: ["summary", "recommendations", "highlights", "analysis"],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}
